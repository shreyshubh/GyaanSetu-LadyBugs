require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { initWebSocket } = require('./services/websocket');
require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  const server = http.createServer(app);

  // Attach WebSocket server
  initWebSocket(server);

  server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
}).catch(err => {
  console.error("Failed to connect to DB, server not started", err);
});
