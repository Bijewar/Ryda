import { Server as HttpServer } from 'node:http';
import { env } from '@/lib/env';
import { logger } from '@/lib/observability/logger';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import { Server as SocketIOServer } from 'socket.io';
import { verifyWsToken } from './auth';
import { DriverEvents, SystemEvents } from './events';
import { ADMIN_ROOM, BHOPAL_ONLINE_ROOM, driverRoom, passengerRoom, rideRoom } from './rooms';

/**
 * Socket.IO server setup.
 *
 * Runs inside the standalone `workers/socket-server.ts` process (port 3001).
 * Uses the Redis adapter so multiple WS instances can broadcast events
 * consistently — required for horizontal scaling.
 *
 * Auth flow:
 *   1. Client fetches JWT from `/api/auth/ws-token`
 *   2. Connects with `io('/?XTransformPort=3001', { auth: { token } })`
 *   3. Server verifies the JWT in the `connection` middleware
 *   4. On success, server joins the socket to its `passenger:<id>` / `driver:<id>` room
 *   5. Outbound events (from API routes / workers) call `emitToRide(rideId, event, payload)`
 */

let io: SocketIOServer | null = null;

export function getIO(): SocketIOServer | null {
  return io;
}

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  const server = new SocketIOServer(httpServer, {
    path: '/',
    cors: {
      origin: env.SOCKET_IO_ORIGINS.split(',').map((s) => s.trim()),
      credentials: true,
    },
    transports: ['websocket'],
  });

  // Redis adapter for horizontal scaling.
  try {
    const pubClient = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 3 });
    const subClient = pubClient.duplicate();
    server.adapter(createAdapter(pubClient, subClient));
    logger.info('Socket.IO Redis adapter attached');
  } catch (err) {
    logger.warn({ err }, 'Redis adapter attach failed — running in single-instance mode');
  }

  // Auth middleware.
  server.use(async (socket, next) => {
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
    (socket.data as { user: unknown }).user = payload;
    if (payload.accountType === 'DRIVER' && payload.driverId) {
      void socket.join(driverRoom(payload.driverId));
    } else if (payload.accountType === 'PASSENGER') {
      void socket.join(passengerRoom(payload.sub));
    } else if (payload.accountType === 'ADMIN') {
      void socket.join(ADMIN_ROOM);
    }
    next();
  });

  server.on('connection', (socket) => {
    const user = (socket.data as { user: { sub: string; accountType: string } }).user;
    logger.info(
      { socketId: socket.id, userId: user.sub, accountType: user.accountType },
      'WS connected',
    );
    socket.emit(SystemEvents.Connected, {
      socketId: socket.id,
      timestamp: new Date().toISOString(),
    });

    socket.on('ride:subscribe', (rideId: string) => {
      void socket.join(rideRoom(rideId));
    });
    socket.on('ride:unsubscribe', (rideId: string) => {
      void socket.leave(rideRoom(rideId));
    });
    socket.on('driver:go_online', () => {
      void socket.join(BHOPAL_ONLINE_ROOM);
    });
    socket.on('driver:go_offline', () => {
      void socket.leave(BHOPAL_ONLINE_ROOM);
    });

    socket.on('disconnect', (reason) => {
      logger.info({ socketId: socket.id, reason }, 'WS disconnected');
    });
  });

  io = server;
  return server;
}

// ── Outbound event helpers (called from API routes / workers) ─────────────

export function emitToRide(rideId: string, event: string, payload: unknown): void {
  io?.to(rideRoom(rideId)).emit(event, payload);
}

export function emitToDriver(driverId: string, event: string, payload: unknown): void {
  io?.to(driverRoom(driverId)).emit(event, payload);
}

export function emitToPassenger(userId: string, event: string, payload: unknown): void {
  io?.to(passengerRoom(userId)).emit(event, payload);
}

export function emitToAdmin(event: string, payload: unknown): void {
  io?.to(ADMIN_ROOM).emit(event, payload);
}

export function broadcastDriverLocation(payload: unknown): void {
  io?.to(BHOPAL_ONLINE_ROOM).emit(DriverEvents.Location, payload);
}

export function broadcastRideEvent(event: string, payload: unknown): void {
  // Typed helper used by ride-service.ts.
  io?.emit(event, payload);
}
