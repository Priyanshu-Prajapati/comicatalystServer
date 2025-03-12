const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config(); // Load environment variables from .env file

const app = express();
const port = process.env.PORT;

// Enable CORS
// app.use(cors());
app.use(cors({
    origin: 'comicatalystserver-production.up.railway.app', // Change this to match your frontend URL
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

// Endpoint to get the Hugging Face API Key
app.get('/get-huggingface-api-key', (req, res) => {
    const apiKey = process.env.HF_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'API key not found' });
    }

    res.json({ api_key: apiKey });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on https://comicatalystserver-production.up.railway.app:${port}`);
});


