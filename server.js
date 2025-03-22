const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const dotenv = require('dotenv');
const cors = require('cors');
const axios = require('axios');

dotenv.config(); // Load environment variables from .env file

// Create an Express application
const app = express();
app.use(bodyParser.json());

app.use(cors({
    origin: 'https://creative-quokka-866477.netlify.app', // Change this to match your frontend URL
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

// API endpoint to handle chat requests
app.post('/api/chat', async (req, res) => {
  const { prompt } = req.body;
  const apiKey = process.env.OR_API_KEY;

  if (!prompt) {
    return res.status(400).json({ error: 'Please enter a prompt.' });
  }

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'deepseek/deepseek-chat:free',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const markdowntext = response.data.choices?.[0]?.message?.content || 'No response received';
    res.json({ response: markdowntext });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});

// Create an HTTP server that integrates with Express
const server = http.createServer(app);

// Set up WebSocket server to listen on the same HTTP server
const wss = new WebSocket.Server({ server });

// WebSocket connection handling
wss.on("connection", (ws) => {
  console.log("A new WebSocket connection established");

  // When a message is received from the client
  ws.on("message", (message) => {
    console.log(`Received message: ${message}`);
    const data = JSON.parse(message);

    //     // Broadcast the message to all clients
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  });

  // When WebSocket connection is closed
  ws.on("close", () => {
    console.log("WebSocket connection closed");
  });
});

// Express route for your app
app.get("/", (req, res) => {
  res.send("Hello, World! WebSocket and Express Server Running");
});

app.get('/get-huggingface-api-key', (req, res) => {
    const apiKey = process.env.HF_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'API key not found' });
    }

    res.json({ api_key: apiKey });
});

// Use dynamic port for Railway or fallback to 3000
const port = process.env.PORT || 3000;

// Start the HTTP server (which also serves WebSocket)
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
