const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
require('dotenv').config();

// Create HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/html'});
  fs.createReadStream('index.html').pipe(res);
});

// Create WebSocket server
const wss = new WebSocket.Server({server});

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('Client connected.');
  
  // Handle incoming messages
  ws.on('message', (message) => {
    console.log(`Received tag ID: ${message}`);
    
    
    // Broadcast tag ID to all connected clients
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
  
  // Handle disconnections
  ws.on('close', () => {
    console.log('Client disconnected.');
  });
});

// Start server
const PORT = process.env.PORT
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}.`);
  });
  