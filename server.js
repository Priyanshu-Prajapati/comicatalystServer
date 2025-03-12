const WebSocket = require("wss");

const wss = new WebSocket.Server({ port: process.env.PORT });

wss.on("connection", (ws) => {
  console.log("New client connected");

  ws.on("message", (message) => {
    console.log(`Received: ${message}`);

    const data = JSON.parse(message);

    // Broadcast the message to all clients
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

console.log(
  "WebSocket server is running on wss://comicatalystserver-production.up.railway.app"
);
