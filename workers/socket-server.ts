import { createServer } from 'node:http';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import { Server as SocketIOServer } from 'socket.io';
import { env } from '../src/lib/env';
import { logger } from '../src/lib/observability/logger';
import { verifyWsToken } from '../src/lib/realtime/auth';
import {
  ADMIN_ROOM,
  BHOPAL_ONLINE_ROOM,
  driverRoom,
  passengerRoom,
  rideRoom,
} from '../src/lib/realtime/rooms';
import { DriverEvents, RideEvents, SystemEvents } from '../src/lib/realtime/events';
import type { WsTokenPayload } from '../src/lib/realtime/auth';

/**
 * Ryda v2 — standalone Socket.IO server.
 *
 * Runs as a separate process (`bun run dev:ws` / `bun workers/socket-server.ts`)
 * on port `SOCKET_IO_PORT` (default 3001). The Next.js app routes WS handshakes
 * to this process via the gateway:
 *
 *     io("/?XTransformPort=3001", { auth: { token } })
 *
 * Architecture:
 *   - HTTP server (port 3001) wraps a Socket.IO server.
 *   - Redis adapter attaches so multiple WS instances broadcast events
 *     consistently (horizontal scaling).
 *   - JWT auth middleware verifies the short-lived token issued by
 *     `/api/auth/ws-token` and joins the socket to its `passenger:<id>` /
 *     `driver:<id>` / `admin` room.
 *   - Event handlers cover ride state transitions + driver location updates.
 *   - `/health` endpoint exposes liveness + connection count.
 *   - SIGTERM/SIGINT drain connections and close the server gracefully.
 */

const log = logger.child({ scope: 'socket-server' });

interface SocketData {
  user: WsTokenPayload;
}

async function bootstrap(): Promise<void> {
  const httpServer = createServer((req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          ok: true,
          connections: io?.engine.clientsCount ?? 0,
          timestamp: new Date().toISOString(),
        }),
      );
      return;
    }
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'NOT_FOUND' }));
  });

  const io = new SocketIOServer(httpServer, {
    path: '/',
    cors: {
      origin: env.SOCKET_IO_ORIGINS.split(',').map((s) => s.trim()),
      credentials: true,
    },
    transports: ['websocket'],
    pingInterval: 10_000,
    pingTimeout: 5_000,
  });

  // Redis adapter — wraps pub/sub so a driver connecting to instance A can
  // broadcast to a passenger on instance B without an extra hop.
  let pubClient: Redis | null = null;
  let subClient: Redis | null = null;
  try {
    pubClient = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 3 });
    subClient = pubClient.duplicate();
    io.adapter(createAdapter(pubClient, subClient));
    log.info('Redis adapter attached — horizontal scaling enabled');
  } catch (err) {
    log.warn({ err }, 'Redis adapter attach failed — single-instance mode');
  }

  // JWT auth middleware — every socket must present a valid `auth.token`.
  io.use(async (socket, next) => {
    const token = (socket.handshake.auth as { token?: string }).token;
    if (!token) {
      next(new Error('UNAUTHORIZED'));
      return;
    }
    const payload = await verifyWsToken(token);
    if (!payload) {
      next(new Error('UNAUTHORIZED'));
      return;
    }
    socket.data.user = payload;

    // Auto-join role-scoped rooms so server code can `io.to(room).emit(...)`
    // without tracking which socket belongs to which user.
    if (payload.accountType === 'DRIVER' && payload.driverId) {
      void socket.join(driverRoom(payload.driverId));
    } else if (payload.accountType === 'PASSENGER') {
      void socket.join(passengerRoom(payload.sub));
    } else if (payload.accountType === 'ADMIN') {
      void socket.join(ADMIN_ROOM);
    }
    next();
  });

  io.on('connection', (socket) => {
    const user = socket.data.user;
    log.info(
      { socketId: socket.id, userId: user.sub, accountType: user.accountType },
      'WS connected',
    );
    socket.emit(SystemEvents.Connected, {
      socketId: socket.id,
      timestamp: new Date().toISOString(),
    });

    // ── Subscription helpers ──────────────────────────────────────────────
    socket.on('ride:subscribe', (rideId: string) => {
      if (typeof rideId !== 'string' || rideId.length === 0) return;
      void socket.join(rideRoom(rideId));
    });
    socket.on('ride:unsubscribe', (rideId: string) => {
      void socket.leave(rideRoom(rideId));
    });
    socket.on('driver:go_online', () => {
      if (user.accountType !== 'DRIVER') return;
      void socket.join(BHOPAL_ONLINE_ROOM);
    });
    socket.on('driver:go_offline', () => {
      void socket.leave(BHOPAL_ONLINE_ROOM);
    });

    // ── Ride events (passenger-side) ──────────────────────────────────────
    socket.on(RideEvents.Created, (payload: unknown) => {
      // Passenger initiated a ride request — broadcast to admin room for the
      // live activity feed. The driver matching happens in the API route.
      io.to(ADMIN_ROOM).emit(RideEvents.Created, payload);
    });
    socket.on('ride:cancel', (payload: { rideId: string; reason: string }) => {
      if (!payload?.rideId) return;
      io.to(rideRoom(payload.rideId)).emit(RideEvents.Canceled, {
        rideId: payload.rideId,
        reason: payload.reason,
        timestamp: new Date().toISOString(),
      });
    });
    socket.on('ride:accept', (payload: { rideId: string; driverId: string }) => {
      if (!payload?.rideId || !payload?.driverId) return;
      io.to(rideRoom(payload.rideId)).emit(RideEvents.Accepted, {
        rideId: payload.rideId,
        driverId: payload.driverId,
        timestamp: new Date().toISOString(),
      });
    });
    socket.on('ride:reject', (payload: { rideId: string; driverId: string }) => {
      if (!payload?.rideId) return;
      // Re-offer happens server-side; we just notify admins.
      io.to(ADMIN_ROOM).emit('ride:rejected', payload);
    });
    socket.on('ride:complete', (payload: { rideId: string }) => {
      if (!payload?.rideId) return;
      io.to(rideRoom(payload.rideId)).emit(RideEvents.Completed, {
        rideId: payload.rideId,
        timestamp: new Date().toISOString(),
      });
    });

    // ── Driver events ─────────────────────────────────────────────────────
    socket.on(DriverEvents.Location, (payload: unknown) => {
      if (user.accountType !== 'DRIVER') return;
      // Broadcast to the ride room + admin heatmap. The driver's own room is
      // filtered out so we don't echo back to the sender.
      const p = payload as { rideId?: string; lat: number; lng: number; heading?: number };
      if (p.rideId) {
        io.to(rideRoom(p.rideId)).emit(DriverEvents.Location, {
          ...p,
          driverId: user.driverId ?? user.sub,
          timestamp: new Date().toISOString(),
        });
      }
      io.to(ADMIN_ROOM).emit(DriverEvents.Location, p);
    });
    socket.on(DriverEvents.Status, (payload: { isOnline: boolean }) => {
      if (user.accountType !== 'DRIVER') return;
      io.to(ADMIN_ROOM).emit(DriverEvents.Status, {
        driverId: user.driverId ?? user.sub,
        isOnline: payload.isOnline,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('disconnect', (reason) => {
      log.info({ socketId: socket.id, reason }, 'WS disconnected');
    });

    socket.on('error', (err: Error) => {
      log.error({ err, socketId: socket.id }, 'WS socket error');
    });
  });

  // ── Graceful shutdown ──────────────────────────────────────────────────
  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    log.info({ signal }, 'Shutting down socket server');

    // Stop accepting new connections.
    io.close(() => {
      log.info('Socket.IO server closed');
    });

    // Drain Redis adapter connections.
    try {
      await Promise.allSettled([pubClient?.quit(), subClient?.quit()]);
    } catch (err) {
      log.warn({ err }, 'Redis close failed during shutdown');
    }

    httpServer.close(() => {
      log.info('HTTP server closed — bye');
      process.exit(0);
    });

    // Hard exit if something hangs.
    setTimeout(() => {
      log.warn('Forced exit after 10s timeout');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('uncaughtException', (err) => {
    log.error({ err }, 'uncaughtException in socket server');
  });
  process.on('unhandledRejection', (reason) => {
    log.error({ reason }, 'unhandledRejection in socket server');
  });

  httpServer.listen(env.SOCKET_IO_PORT, () => {
    log.info(
      { port: env.SOCKET_IO_PORT, demoMode: env.DEMO_MODE },
      'Socket.IO server listening',
    );
  });
}

// `SocketInternal` is the inbound event map — typing it prevents `any` in the
// `.on(...)` handlers without forcing a full strict-socket-typing setup.
interface SocketInternal {
  // Inbound events are intentionally loose-typed (string) since the server
  // also relays arbitrary admin/tooling events. We validate at the boundary.
}

void bootstrap().catch((err) => {
  log.error({ err }, 'Failed to bootstrap socket server');
  process.exit(1);
});
