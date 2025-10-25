// websocket-server.js
// Run: node websocket-server.js
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 3001 });

// Store connected clients, drivers, and rides
const drivers = new Map(); // driverId -> { ws, id, data: { coords, status } }
const clients = new Map(); // clientId -> { ws, id }
const rides = new Map();   // rideId -> { clientId, driverId }
const activeRides = new Map(); // rideId -> { clientId, driverId, status }

console.log('🚖 WebSocket server running on ws://localhost:3001');

// -------------------------
// Utility functions
// -------------------------
function send(ws, msg) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

function sendToClient(clientId, msg) {
  if (clients.has(clientId)) {
    send(clients.get(clientId).ws, msg);
  }
}

function sendToDriver(driverId, msg) {
  if (drivers.has(driverId)) {
    send(drivers.get(driverId).ws, msg);
  }
}

// -------------------------
// Connection Handler
// -------------------------
wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const type = url.searchParams.get('type');
  const id = url.searchParams.get('id');

  console.log(`✅ New ${type} connected:`, id);

  if (type === 'driver') {
    drivers.set(id, { ws, id, data: { coords: null, status: 'available' } });
    console.log(`Driver ${id} connected. Total drivers: ${drivers.size}`);
  } else if (type === 'client') {
    clients.set(id, { ws, id });
    console.log(`Client ${id} connected. Total clients: ${clients.size}`);
  }

  // -------------------------
  // Message Handler
  // -------------------------
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log(`📩 Received from ${type} ${id}:`, message);

      switch (message.type) {
        case 'auth':
          console.log(`${type} ${id} authenticated`);
          break;

        case 'request_driver': {
          console.log('📢 Broadcasting ride request to drivers...');
          const rideRequest = {
            type: 'ride_request',
            rideId: message.rideId,
            pickupAddress: message.pickupAddress,
            destinationAddress: message.destinationAddress,
            estimatedFare: message.estimatedFare,
            pickup: message.pickup,
            clientId: message.clientId || id,
          };

          rides.set(message.rideId, {
            clientId: message.clientId || id,
            driverId: null,
          });

          let driversSent = 0;
          drivers.forEach((driver) => {
            if (
              driver.ws.readyState === WebSocket.OPEN &&
              driver.data.status === 'available'
            ) {
              driver.ws.send(JSON.stringify(rideRequest));
              driversSent++;
            }
          });
          console.log(`Ride request sent to ${driversSent} drivers`);
          break;
        }

        case 'ride_response': {
          console.log(
            `🚗 Driver ${id} ${message.accepted ? 'accepted' : 'rejected'} ride ${
              message.rideId
            }`
          );

          if (message.accepted) {
            if (drivers.has(id)) {
              drivers.get(id).data.status = 'busy';
            }

            if (rides.has(message.rideId)) {
              rides.get(message.rideId).driverId = id;
            }

            activeRides.set(message.rideId, {
              clientId: rides.get(message.rideId).clientId,
              driverId: id,
              status: 'ongoing',
            });

            const response = {
              type: 'driver_response',
              accepted: true,
              driverId: id,
              driverCoords: message.coords,
              rideId: message.rideId,
            };

            const rideInfo = rides.get(message.rideId);
            if (rideInfo && clients.has(rideInfo.clientId)) {
              sendToClient(rideInfo.clientId, response);
            }

            // Cancel request for other drivers
            const cancelMessage = {
              type: 'ride_canceled',
              rideId: message.rideId,
            };
            drivers.forEach((driver, driverId) => {
              if (driverId !== id && driver.ws.readyState === WebSocket.OPEN) {
                driver.ws.send(JSON.stringify(cancelMessage));
              }
            });
          }
          break;
        }

        case 'status_update':
          if (type === 'driver' && drivers.has(id)) {
            drivers.get(id).data.status = message.status;
            console.log(`🚦 Driver ${id} status updated: ${message.status}`);
          }
          break;

        case 'location_update':
          if (type === 'driver' && drivers.has(id)) {
            const driver = drivers.get(id);
            driver.data.coords = message.coords;
            console.log(`📍 Driver ${id} location updated:`, message.coords);

            activeRides.forEach((ride, rideId) => {
              if (ride.driverId === id) {
                sendToClient(ride.clientId, {
                  type: 'driver_location_update',
                  rideId,
                  coords: message.coords,
                  timestamp: Date.now(),
                });
              }
            });
          }
          break;

case 'ride_completed': {
  console.log(`✅ Driver ${id} completed ride ${message.rideId}`);
  
  // Update driver status
  if (drivers.has(id)) {
    drivers.get(id).data.status = 'available';
  }

  const rideInfoComp = rides.get(message.rideId);
  
  if (rideInfoComp && clients.has(rideInfoComp.clientId)) {
    // CRITICAL: Forward ALL completion data to client
    const completionMessage = {
      type: 'ride_completed',
      rideId: message.rideId,
      driverId: id,
      driverName: message.driverName,
      vehicleNumber: message.vehicleNumber,
      estimatedFare: message.estimatedFare || message.fare,
      fare: message.fare || message.estimatedFare,
      completedAt: message.completedAt,
      timestamp: Date.now()
    };
    
    console.log('📤 Sending completion to client:', completionMessage);
    sendToClient(rideInfoComp.clientId, completionMessage);
  } else {
    console.warn(`⚠️ Cannot send completion: Client ${rideInfoComp?.clientId} not found`);
  }

  // Store for reconnection
  if (rideInfoComp) {
    recentCompletedRides.set(message.rideId, {
      ...message,
      clientId: rideInfoComp.clientId,
      driverId: id,
      completedAt: Date.now(),
    });
    setTimeout(() => recentCompletedRides.delete(message.rideId), 5 * 60 * 1000);
  }

  // Cleanup
  rides.delete(message.rideId);
  activeRides.delete(message.rideId);
  break;
}
        case 'ping':
          send(ws, { type: 'pong', timestamp: Date.now() });
          break;

        default:
          console.log(`⚠️ Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('❌ Error processing message:', error);
    }
  });

  // -------------------------
  // Close & Error Handlers
  // -------------------------
  ws.on('close', () => {
    console.log(`🔌 ${type} ${id} disconnected`);
    if (type === 'driver') {
      drivers.delete(id);
      console.log(`Total drivers: ${drivers.size}`);
    } else if (type === 'client') {
      clients.delete(id);
      console.log(`Total clients: ${clients.size}`);
    }
  });

  ws.on('error', (error) => {
    console.error(`⚠️ WebSocket error for ${type} ${id}:`, error);
  });

  // Confirm connection
  send(ws, {
    type: 'connected',
    message: `Connected as ${type}`,
    id: id,
  });
});

// -------------------------
// Cleanup Dead Connections
// -------------------------
setInterval(() => {
  drivers.forEach((driver, id) => {
    if (driver.ws.readyState !== WebSocket.OPEN) {
      drivers.delete(id);
    }
  });

  clients.forEach((client, id) => {
    if (client.ws.readyState !== WebSocket.OPEN) {
      clients.delete(id);
    }
  });
}, 30000);

// -------------------------
// Status Logging
// -------------------------
setInterval(() => {
  console.log(
    `📊 Status: ${drivers.size} drivers, ${clients.size} clients connected, ${activeRides.size} active rides`
  );
}, 60000);

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('Server shutting down...');
  wss.close();
});

process.on('SIGINT', () => {
  console.log('Server shutting down...');
  wss.close();
  process.exit();
});
