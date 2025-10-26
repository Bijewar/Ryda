const { spawn } = require('child_process');
const path = require('path');

// Start WebSocket server
const wsServer = spawn('node', ['websocket-server.js'], {
  stdio: 'inherit',
  cwd: __dirname
});

wsServer.on('error', (error) => {
  console.error('Failed to start WebSocket server:', error);
  process.exit(1);
});

wsServer.on('close', (code) => {
  console.log(`WebSocket server exited with code ${code}`);
});

// Start Next.js server
const nextServer = spawn('npm', ['run', 'next:start'], {
  stdio: 'inherit',
  cwd: __dirname
});

nextServer.on('error', (error) => {
  console.error('Failed to start Next.js server:', error);
  process.exit(1);
});

nextServer.on('close', (code) => {
  console.log(`Next.js server exited with code ${code}`);
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  wsServer.kill('SIGTERM');
  nextServer.kill('SIGTERM');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  wsServer.kill('SIGINT');
  nextServer.kill('SIGINT');
  process.exit(0);
});

console.log('🚀 Starting production servers...');
