const express = require('express');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', true); // Enable to work with nginx proxy

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'", "https:", "data:", "blob:"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "blob:", "data:", "https://cdn.jsdelivr.net", "https://unpkg.com", "https://tessdata.projectnaptha.com", "https://cdnjs.cloudflare.com"],
      workerSrc: ["'self'", "blob:", "data:"],
      connectSrc: ["'self'", "https://cdn.jsdelivr.net", "https://unpkg.com", "https://tessdata.projectnaptha.com", "http://localhost:11434", "wss://stevenhol.land", "wss://ws.stevenhol.land:8888", "ws://ws.stevenhol.land:8888", "https://ws.stevenhol.land:8888", "http://ws.stevenhol.land:8888", "ws://localhost:3001", "ws://localhost:3020"],
      imgSrc: ["'self'", "data:", "blob:"]
    }
  }
}));

app.use(cors({
  origin: function(origin, callback) {
    callback(null, true);
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Dragon Flight 3D game - public access (MUST be before static middleware)
app.get('/dragon-flight/', (req, res) => {
  console.log('Dragon Flight route accessed');
  res.sendFile(path.join(__dirname, 'public', 'dragon-flight', 'index.html'));
});

// God Game HTTP Proxy (manual implementation)
app.all('/god-game-ws/*', async (req, res) => {
  console.log('God Game proxy hit:', req.method, req.url);
  const targetUrl = req.url.replace('/god-game-ws', '');
  console.log('Forwarding to:', `http://127.0.0.1:3002${targetUrl}`);
  
  try {
    const response = await axios({
      method: req.method,
      url: `http://127.0.0.1:3002${targetUrl}`,
      headers: {
        ...req.headers,
        host: 'god-game-server:3001' // Override host header
      },
      data: req.body,
      timeout: 30000, // 30 second timeout
      validateStatus: () => true // Don't throw on HTTP errors
    });
    
    // Copy response headers (excluding problematic ones)
    Object.keys(response.headers).forEach(header => {
      // Don't send both Content-Length and Transfer-Encoding
      if (header.toLowerCase() !== 'transfer-encoding' && 
          header.toLowerCase() !== 'connection') {
        res.setHeader(header, response.headers[header]);
      }
    });
    
    res.status(response.status).send(response.data);
  } catch (error) {
    console.error('Proxy error:', error.message);
    res.status(500).send('God Game server unavailable');
  }
});

// Territory Game API Proxy with WebSocket upgrade support
app.all('/territory-api/*', async (req, res) => {
  console.log('Territory API proxy hit:', req.method, req.url);
  const targetUrl = req.url.replace('/territory-api', '/api');
  console.log('Forwarding to:', `http://territory-backend:4003${targetUrl}`);
  console.log('Auth header:', req.headers.authorization);
  
  try {
    // Clean up headers - remove problematic ones
    const forwardHeaders = { ...req.headers };
    delete forwardHeaders.host;
    delete forwardHeaders['content-length'];
    
    const response = await axios({
      method: req.method,
      url: `http://territory-backend:4003${targetUrl}`,
      headers: forwardHeaders,
      data: req.body,
      timeout: 30000, // 30 second timeout
      validateStatus: () => true // Don't throw on HTTP errors
    });
    
    // Copy response headers (excluding problematic ones)
    Object.keys(response.headers).forEach(header => {
      // Don't send both Content-Length and Transfer-Encoding
      if (header.toLowerCase() !== 'transfer-encoding' && 
          header.toLowerCase() !== 'connection') {
        res.setHeader(header, response.headers[header]);
      }
    });
    
    res.status(response.status).send(response.data);
  } catch (error) {
    console.error('Territory API proxy error:', error.message);
    console.error('Full error:', error.response?.data || error);
    if (error.code === 'ECONNREFUSED') {
      res.status(502).json({ error: 'Backend server is not responding' });
    } else if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(502).json({ error: error.message || 'Territory Game server unavailable' });
    }
  }
});

// Territory WebSocket proxy
app.all('/territory-ws*', (req, res) => {
  console.log('Territory WebSocket proxy hit:', req.method, req.url);
  // Set WebSocket upgrade headers
  res.setHeader('Upgrade', 'websocket');
  res.setHeader('Connection', 'Upgrade');
  res.setHeader('Sec-WebSocket-Accept', req.headers['sec-websocket-key']);
  res.setHeader('Sec-WebSocket-Protocol', req.headers['sec-websocket-protocol']);
  
  // Redirect to territory backend WebSocket endpoint
  const wsUrl = `ws://territory-backend:4003`;
  res.setHeader('Location', wsUrl);
  res.status(101).end();
});

// Territory Game frontend route
app.get('/territory/', (req, res) => {
  console.log('Territory game route accessed');
  res.sendFile(path.join(__dirname, 'public', 'territory', 'index.html'));
});

// Serve static files except index.html
app.use(express.static('public', { index: false }));

// Public landing page - no auth required
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'landing.html'));
});

// God game - no auth required
app.get('/god-game', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'god-game', 'index.html'));
});

app.get('/god-game/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'god-game', 'index.html'));
});

// Cat-in-hat game - no auth required
app.get('/cat-in-hat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cat-in-hat', 'index.html'));
});

app.get('/cat-in-hat/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cat-in-hat', 'index.html'));
});

// Simple app dashboard - no authentication required
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint for Docker/Kubernetes
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Simple App Server running on port ${PORT}`);
  console.log(`📱 Dashboard available at http://localhost:${PORT}/admin`);
  console.log(`🌐 Main site available at http://localhost:${PORT}/`);
  console.log(`❤️ Health check at http://localhost:${PORT}/health`);
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});