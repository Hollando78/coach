const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const si = require('systeminformation');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const crypto = require('crypto');
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

// Rate limiting completely disabled to fix trust proxy issues
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 1000,
//   standardHeaders: true,
//   legacyHeaders: false,
//   skip: (request, response) => {
//     return request.path === '/health' || request.path.startsWith('/dragon-flight/');
//   }
// });

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: false // Disable trust proxy for login limiter
});

// app.use(limiter); // Completely disabled
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
        host: 'localhost:3001' // Override host header
      },
      data: req.body,
      timeout: 30000, // 30 second timeout
      validateStatus: () => true // Don't throw on HTTP errors
    });
    
    // Copy response headers
    Object.keys(response.headers).forEach(header => {
      res.setHeader(header, response.headers[header]);
    });
    
    res.status(response.status).send(response.data);
  } catch (error) {
    console.error('Proxy error:', error.message);
    res.status(500).send('God Game server unavailable');
  }
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

app.use(session({
  secret: process.env.SESSION_SECRET || 'change-this-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24
  }
}));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|webm|pdf|zip|glb|gltf|obj|fbx|dae/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

const dbDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Database connection pool management
class DatabaseManager {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.pool = [];
    this.maxConnections = 10;
    this.currentConnections = 0;
  }

  getConnection() {
    return new Promise((resolve, reject) => {
      if (this.pool.length > 0) {
        resolve(this.pool.pop());
      } else if (this.currentConnections < this.maxConnections) {
        const db = new sqlite3.Database(this.dbPath, (err) => {
          if (err) {
            reject(err);
          } else {
            this.currentConnections++;
            resolve(db);
          }
        });
      } else {
        // Wait for a connection to become available
        setTimeout(() => {
          this.getConnection().then(resolve).catch(reject);
        }, 100);
      }
    });
  }

  releaseConnection(db) {
    if (this.pool.length < 5) { // Keep up to 5 connections in pool
      this.pool.push(db);
    } else {
      db.close((err) => {
        if (!err) this.currentConnections--;
      });
    }
  }

  async query(sql, params = []) {
    const db = await this.getConnection();
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, result) => {
        this.releaseConnection(db);
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  async run(sql, params = []) {
    const db = await this.getConnection();
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        db.close(); // Always close for write operations
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  async all(sql, params = []) {
    const db = await this.getConnection();
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, results) => {
        this.releaseConnection(db);
        if (err) reject(err);
        else resolve(results);
      });
    });
  }
}

const dbManager = new DatabaseManager(path.join(dbDir, 'dashboard.db'));

// Initialize database with a temporary connection for setup
const db = new sqlite3.Database(path.join(dbDir, 'dashboard.db'));

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS previews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    filename TEXT NOT NULL,
    filepath TEXT NOT NULL,
    mimetype TEXT,
    size INTEGER,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    permissions TEXT DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS turing_arguments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic TEXT NOT NULL,
    perspective TEXT NOT NULL,
    argument TEXT NOT NULL,
    author TEXT DEFAULT 'Anonymous',
    votes INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  // Add role and permissions columns to existing users table if they don't exist
  db.run(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'`, (err) => {
    if (!err) console.log('Added role column to users table');
  });
  
  db.run(`ALTER TABLE users ADD COLUMN permissions TEXT DEFAULT '[]'`, (err) => {
    if (!err) console.log('Added permissions column to users table');
  });
  
  // Update first user (admin) to have admin role
  db.run(`UPDATE users SET role = 'admin' WHERE id = 1`, (err) => {
    if (!err) console.log('Set first user as admin');
  });
});

async function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    try {
      // Load user data including role
      const user = await dbManager.query('SELECT id, username, role, permissions FROM users WHERE id = ?', [req.session.userId]);
      
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      
      req.user = user;
      try {
        req.user.permissions = JSON.parse(user.permissions || '[]');
      } catch (parseErr) {
        console.error('Error parsing permissions:', parseErr);
        req.user.permissions = [];
      }
      return next();
    } catch (err) {
      console.error('Database error in isAuthenticated:', err);
      return res.status(500).json({ error: 'Database error' });
    }
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
}

function isAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ error: 'Admin access required' });
}

function hasPermission(permission) {
  return (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.permissions.includes(permission))) {
      return next();
    }
    res.status(403).json({ error: `Permission '${permission}' required` });
  };
}

app.post('/api/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const user = await dbManager.query('SELECT * FROM users WHERE username = ?', [username]);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    req.session.userId = user.id;
    res.json({ 
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        role: user.role || 'user'
      }
    });
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Could not log out' });
    }
    res.json({ message: 'Logout successful' });
  });
});

app.get('/api/check-auth', (req, res) => {
  res.json({ authenticated: !!req.session.userId });
});

// God Game authentication endpoints
app.post('/api/auth/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const user = await dbManager.query('SELECT * FROM users WHERE username = ?', [email]);

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create cryptographically secure token for god-game
    const token = crypto.randomBytes(32).toString('hex');
    req.session.userId = user.id;
    req.session.username = user.username;
    
    res.status(200).json({ 
      token: token,
      user: {
        userId: user.id.toString(),
        email: user.username,
        username: user.username
      }
    });
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const { email, password, username } = req.body;

  if (!email || !password || !username) {
    return res.status(400).json({ error: 'Email, password, and username required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await dbManager.run(
      'INSERT INTO users (username, password_hash, role, permissions, created_at) VALUES (?, ?, ?, ?, ?)',
      [email, hashedPassword, 'user', JSON.stringify(['god_game']), new Date().toISOString()]
    );

    const token = crypto.randomBytes(32).toString('hex');
    req.session.userId = result.lastID;
    req.session.username = email;
    
    res.status(201).json({ 
      token: token,
      user: {
        userId: result.lastID.toString(),
        email: email,
        username: username
      }
    });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'User already exists' });
    }
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Could not log out' });
    }
    res.json({ message: 'Logout successful' });
  });
});

app.get('/api/auth/me', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  try {
    const user = await dbManager.query('SELECT * FROM users WHERE id = ?', [req.session.userId]);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    res.status(200).json({
      userId: user.id.toString(),
      email: user.username,
      username: user.username
    });
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Database error' });
  }
});

// Health check endpoint for Docker/Kubernetes
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.post('/api/upload', isAuthenticated, upload.single('preview'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const { title, description } = req.body;
  
  try {
    const result = await dbManager.run(
      'INSERT INTO previews (title, description, filename, filepath, mimetype, size) VALUES (?, ?, ?, ?, ?, ?)',
      [title || 'Untitled', description || '', req.file.filename, req.file.path, req.file.mimetype, req.file.size]
    );
    
    res.json({
      id: result.lastID,
      message: 'File uploaded successfully',
      filename: req.file.filename
    });
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/previews', isAuthenticated, async (req, res) => {
  try {
    const rows = await dbManager.all('SELECT * FROM previews ORDER BY uploaded_at DESC');
    res.json(rows);
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Database error' });
  }
});

app.delete('/api/previews/:id', isAuthenticated, async (req, res) => {
  const { id } = req.params;
  
  try {
    const row = await dbManager.query('SELECT filepath FROM previews WHERE id = ?', [id]);
    
    if (!row) {
      return res.status(404).json({ error: 'Preview not found' });
    }
    
    fs.unlink(row.filepath, async (unlinkErr) => {
      if (unlinkErr) console.error('Error deleting file:', unlinkErr);
      
      try {
        await dbManager.run('DELETE FROM previews WHERE id = ?', [id]);
        res.json({ message: 'Preview deleted successfully' });
      } catch (deleteErr) {
        console.error('Database error:', deleteErr);
        return res.status(500).json({ error: 'Database error' });
      }
    });
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Database error' });
  }
});

// LLM Proxy endpoint
app.post('/api/llm', isAuthenticated, async (req, res) => {
  try {
    const { model, prompt, stream } = req.body;
    
    // Forward request to local Ollama server
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || 'llama3.2:1b',
        prompt: prompt,
        stream: stream || false
      })
    });
    
    if (!response.ok) {
      throw new Error(`Ollama server responded with status ${response.status}`);
    }
    
    const data = await response.json();
    res.json({ response: data.response });
    
  } catch (error) {
    console.error('LLM proxy error:', error);
    res.status(500).json({ error: 'LLM analysis failed', details: error.message });
  }
});


app.get('/api/status', isAuthenticated, async (req, res) => {
  try {
    const [cpu, mem, disk, network, osInfo] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.fsSize(),
      si.networkStats(),
      si.osInfo()
    ]);
    
    res.json({
      cpu: {
        usage: cpu.currentLoad.toFixed(2),
        cores: cpu.cpus.length
      },
      memory: {
        total: (mem.total / 1024 / 1024 / 1024).toFixed(2),
        used: (mem.used / 1024 / 1024 / 1024).toFixed(2),
        free: (mem.free / 1024 / 1024 / 1024).toFixed(2),
        percentage: ((mem.used / mem.total) * 100).toFixed(2)
      },
      disk: disk.map(d => ({
        fs: d.fs,
        size: (d.size / 1024 / 1024 / 1024).toFixed(2),
        used: (d.used / 1024 / 1024 / 1024).toFixed(2),
        available: (d.available / 1024 / 1024 / 1024).toFixed(2),
        use: d.use.toFixed(2)
      })),
      network: network[0] ? {
        rx: (network[0].rx_bytes / 1024 / 1024).toFixed(2),
        tx: (network[0].tx_bytes / 1024 / 1024).toFixed(2)
      } : null,
      os: {
        platform: osInfo.platform,
        distro: osInfo.distro,
        release: osInfo.release,
        uptime: process.uptime()
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get system status' });
  }
});

app.get('/uploads/:filename', isAuthenticated, (req, res) => {
  const { filename } = req.params;
  const filepath = path.join(__dirname, 'uploads', filename);
  
  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  res.sendFile(filepath);
});

app.post('/api/setup', async (req, res) => {
  const { username, password } = req.body;
  
  db.get('SELECT COUNT(*) as count FROM users', async (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (row.count > 0) {
      return res.status(403).json({ error: 'Setup already completed' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)',
      [username, hashedPassword],
      function(insertErr) {
        if (insertErr) {
          return res.status(500).json({ error: 'Failed to create user' });
        }
        res.json({ message: 'User created successfully' });
      }
    );
  });
});

app.post('/api/users', isAuthenticated, isAdmin, async (req, res) => {
  const { username, password, role = 'user', permissions = [] } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }
  
  if (!['admin', 'user'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Must be "admin" or "user"' });
  }
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      'INSERT INTO users (username, password_hash, role, permissions) VALUES (?, ?, ?, ?)',
      [username, hashedPassword, role, JSON.stringify(permissions)],
      function(err) {
        if (err) {
          if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(409).json({ error: 'Username already exists' });
          }
          return res.status(500).json({ error: 'Failed to create user' });
        }
        res.json({ 
          id: this.lastID,
          message: 'User created successfully',
          username: username,
          role: role,
          permissions: permissions
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Failed to hash password' });
  }
});

app.get('/api/users', isAuthenticated, (req, res) => {
  db.all('SELECT id, username, role, permissions, created_at FROM users ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    // Parse permissions JSON for each user
    const users = rows.map(row => ({
      ...row,
      permissions: JSON.parse(row.permissions || '[]')
    }));
    res.json(users);
  });
});

app.delete('/api/users/:id', isAuthenticated, (req, res) => {
  const { id } = req.params;
  const currentUserId = req.session.userId;
  
  if (parseInt(id) === currentUserId) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }
  
  db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete user' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  });
});

// Update user role and permissions (admin only)
app.put('/api/users/:id/role', isAuthenticated, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { role, permissions = [] } = req.body;
  
  if (!role || !['admin', 'user'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Must be "admin" or "user"' });
  }
  
  // Prevent removing last admin
  if (role !== 'admin') {
    db.get('SELECT COUNT(*) as count FROM users WHERE role = "admin" AND id != ?', [id], (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (result.count === 0) {
        return res.status(400).json({ error: 'Cannot remove the last admin' });
      }
      
      updateUserRole();
    });
  } else {
    updateUserRole();
  }
  
  function updateUserRole() {
    db.run(
      'UPDATE users SET role = ?, permissions = ? WHERE id = ?',
      [role, JSON.stringify(permissions), id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to update user role' });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ 
          message: 'User role updated successfully',
          role: role,
          permissions: permissions
        });
      }
    );
  }
});

// Grant specific permission to a user (admin only)
app.post('/api/users/:id/permissions', isAuthenticated, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { permission } = req.body;
  
  if (!permission) {
    return res.status(400).json({ error: 'Permission is required' });
  }
  
  db.get('SELECT permissions FROM users WHERE id = ?', [id], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const permissions = JSON.parse(user.permissions || '[]');
    if (!permissions.includes(permission)) {
      permissions.push(permission);
    }
    
    db.run(
      'UPDATE users SET permissions = ? WHERE id = ?',
      [JSON.stringify(permissions), id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to grant permission' });
        }
        
        res.json({ 
          message: 'Permission granted successfully',
          permissions: permissions
        });
      }
    );
  });
});

// Revoke specific permission from a user (admin only)
app.delete('/api/users/:id/permissions', isAuthenticated, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { permission } = req.body;
  
  if (!permission) {
    return res.status(400).json({ error: 'Permission is required' });
  }
  
  db.get('SELECT permissions FROM users WHERE id = ?', [id], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const permissions = JSON.parse(user.permissions || '[]');
    const index = permissions.indexOf(permission);
    if (index > -1) {
      permissions.splice(index, 1);
    }
    
    db.run(
      'UPDATE users SET permissions = ? WHERE id = ?',
      [JSON.stringify(permissions), id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to revoke permission' });
        }
        
        res.json({ 
          message: 'Permission revoked successfully',
          permissions: permissions
        });
      }
    );
  });
});

app.post('/api/change-password', isAuthenticated, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.session.userId;
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required' });
  }
  
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters long' });
  }
  
  db.get('SELECT password_hash FROM users WHERE id = ?', [userId], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    try {
      const validCurrentPassword = await bcrypt.compare(currentPassword, user.password_hash);
      if (!validCurrentPassword) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }
      
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      
      db.run(
        'UPDATE users SET password_hash = ? WHERE id = ?',
        [hashedNewPassword, userId],
        function(updateErr) {
          if (updateErr) {
            return res.status(500).json({ error: 'Failed to update password' });
          }
          res.json({ message: 'Password changed successfully' });
        }
      );
    } catch (error) {
      res.status(500).json({ error: 'Failed to process password change' });
    }
  });
});

// Turing Twister API endpoints
app.get('/api/turing-arguments', (req, res) => {
  const { topic, perspective } = req.query;
  
  let query = 'SELECT * FROM turing_arguments';
  let params = [];
  
  if (topic && perspective) {
    query += ' WHERE topic = ? AND perspective = ?';
    params = [topic, perspective];
  } else if (topic) {
    query += ' WHERE topic = ?';
    params = [topic];
  }
  
  query += ' ORDER BY votes DESC, created_at DESC';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error fetching arguments:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

app.post('/api/turing-arguments', (req, res) => {
  const { topic, perspective, argument, author } = req.body;
  
  if (!topic || !perspective || !argument) {
    return res.status(400).json({ error: 'Topic, perspective, and argument are required' });
  }
  
  const authorName = author && author.trim() ? author : 'Anonymous';
  
  db.run(
    'INSERT INTO turing_arguments (topic, perspective, argument, author) VALUES (?, ?, ?, ?)',
    [topic, perspective, argument, authorName],
    function(err) {
      if (err) {
        console.error('Error inserting argument:', err);
        return res.status(500).json({ error: 'Failed to save argument' });
      }
      
      // Return the new argument with its ID
      db.get(
        'SELECT * FROM turing_arguments WHERE id = ?',
        [this.lastID],
        (err, row) => {
          if (err) {
            console.error('Error fetching new argument:', err);
            return res.status(500).json({ error: 'Argument saved but failed to retrieve' });
          }
          res.status(201).json(row);
        }
      );
    }
  );
});

app.post('/api/turing-arguments/:id/vote', (req, res) => {
  const { id } = req.params;
  const { direction } = req.body; // 'up' or 'down'
  
  if (!direction || (direction !== 'up' && direction !== 'down')) {
    return res.status(400).json({ error: 'Vote direction must be "up" or "down"' });
  }
  
  const voteChange = direction === 'up' ? 1 : -1;
  
  db.run(
    'UPDATE turing_arguments SET votes = votes + ? WHERE id = ?',
    [voteChange, id],
    function(err) {
      if (err) {
        console.error('Error updating votes:', err);
        return res.status(500).json({ error: 'Failed to update vote' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Argument not found' });
      }
      
      // Return updated argument
      db.get(
        'SELECT * FROM turing_arguments WHERE id = ?',
        [id],
        (err, row) => {
          if (err) {
            console.error('Error fetching updated argument:', err);
            return res.status(500).json({ error: 'Vote updated but failed to retrieve argument' });
          }
          res.json(row);
        }
      );
    }
  );
});

app.get('/api/turing-leaderboard', (req, res) => {
  const query = `
    SELECT 
      author,
      COUNT(*) as argument_count,
      AVG(votes) as avg_votes,
      SUM(votes) as total_votes,
      MAX(created_at) as last_activity
    FROM turing_arguments 
    WHERE author != 'Anonymous'
    GROUP BY author 
    ORDER BY total_votes DESC, argument_count DESC
    LIMIT 10
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching leaderboard:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});


// Create HTTP server to handle WebSocket upgrades
const http = require('http');
const server = http.createServer(app);

// Handle WebSocket upgrades for god-game proxy
const WebSocket = require('ws');

server.on('upgrade', (request, socket, head) => {
  if (request.url && request.url.startsWith('/god-game-ws/')) {
    console.log('WebSocket upgrade for god-game:', request.url);
    
    // Remove /god-game-ws prefix for forwarding
    const targetPath = request.url.replace('/god-game-ws', '');
    const targetUrl = `ws://127.0.0.1:3002${targetPath}`;
    
    console.log('Forwarding WebSocket to:', targetUrl);
    
    // Create connection to target server
    const targetWs = new WebSocket(targetUrl, {
      headers: request.headers
    });
    
    targetWs.on('open', () => {
      console.log('Target WebSocket connection opened');
      
      // Upgrade the incoming connection
      socket.write('HTTP/1.1 101 Switching Protocols\r\n' +
                   'Upgrade: websocket\r\n' +
                   'Connection: Upgrade\r\n' +
                   'Sec-WebSocket-Accept: ' + 
                   require('crypto')
                     .createHash('sha1')
                     .update(request.headers['sec-websocket-key'] + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
                     .digest('base64') + '\r\n' +
                   '\r\n');
      
      // Pipe data between client and target
      socket.on('data', (data) => {
        if (targetWs.readyState === WebSocket.OPEN) {
          targetWs.send(data);
        }
      });
      
      targetWs.on('message', (data) => {
        socket.write(data);
      });
      
      socket.on('close', () => {
        targetWs.close();
      });
      
      targetWs.on('close', () => {
        socket.end();
      });
    });
    
    targetWs.on('error', (error) => {
      console.error('Target WebSocket error:', error);
      socket.write('HTTP/1.1 502 Bad Gateway\r\n\r\n');
      socket.end();
    });
    
  } else {
    socket.destroy();
  }
});

// Pocket Dogfight WebRTC Signaling Server integration

// Create WebSocket server that shares the same HTTP server
const wss = new WebSocket.Server({ 
  server,
  perMessageDeflate: false,
  path: '/pocket-dogfight-ws'
});

// Room management for Pocket Dogfight
const gameRooms = new Map();
const gameConnections = new Map();

// Clean up inactive rooms every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [roomCode, room] of gameRooms.entries()) {
    if (now - room.lastActivity > 5 * 60 * 1000) { // 5 minutes
      console.log(`[Pocket Dogfight] Cleaning up inactive room: ${roomCode}`);
      gameRooms.delete(roomCode);
    }
  }
}, 5 * 60 * 1000);

wss.on('connection', (ws, req) => {
  console.log('[Pocket Dogfight] New WebSocket connection');
  
  const connectionTimeout = setTimeout(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.close(1000, 'Connection timeout');
    }
  }, 30000);
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      handleGameMessage(ws, message);
      clearTimeout(connectionTimeout);
    } catch (error) {
      console.error('[Pocket Dogfight] Error parsing message:', error);
      sendGameError(ws, 'Invalid message format');
    }
  });
  
  ws.on('close', (code, reason) => {
    console.log(`[Pocket Dogfight] WebSocket closed: ${code} - ${reason}`);
    handleGameDisconnection(ws);
    clearTimeout(connectionTimeout);
  });
  
  ws.on('error', (error) => {
    console.error('[Pocket Dogfight] WebSocket error:', error);
  });
  
  sendGameMessage(ws, {
    type: 'connected',
    message: 'Connected to Pocket Dogfight signaling server'
  });
});

function handleGameMessage(ws, message) {
  console.log('[Pocket Dogfight] Received message:', message.type, message.roomCode || '');
  
  switch (message.type) {
    case 'create-room':
      handleCreateGameRoom(ws, message);
      break;
    case 'join-room':
      handleJoinGameRoom(ws, message);
      break;
    case 'leave-room':
      handleLeaveGameRoom(ws, message);
      break;
    case 'offer':
    case 'answer':
    case 'ice-candidate':
      handleGameWebRTCMessage(ws, message);
      break;
    default:
      sendGameError(ws, 'Unknown message type: ' + message.type);
  }
}

function handleCreateGameRoom(ws, message) {
  const { roomCode, peerId } = message;
  
  if (!roomCode || !peerId) {
    sendGameError(ws, 'Room code and peer ID are required');
    return;
  }
  
  if (gameRooms.has(roomCode)) {
    sendGameError(ws, 'Room already exists');
    return;
  }
  
  const room = {
    code: roomCode,
    host: peerId,
    peers: new Map(),
    created: Date.now(),
    lastActivity: Date.now()
  };
  
  room.peers.set(peerId, ws);
  gameRooms.set(roomCode, room);
  gameConnections.set(ws, { roomCode, peerId, isHost: true });
  
  sendGameMessage(ws, {
    type: 'room-created',
    roomCode: roomCode
  });
  
  console.log(`[Pocket Dogfight] Room created: ${roomCode} by ${peerId}`);
}

function handleJoinGameRoom(ws, message) {
  const { roomCode, peerId } = message;
  
  if (!roomCode || !peerId) {
    sendGameError(ws, 'Room code and peer ID are required');
    return;
  }
  
  const room = gameRooms.get(roomCode);
  if (!room) {
    sendGameError(ws, 'Room not found');
    return;
  }
  
  if (room.peers.size >= 4) {
    sendGameError(ws, 'Room is full');
    return;
  }
  
  room.peers.set(peerId, ws);
  room.lastActivity = Date.now();
  gameConnections.set(ws, { roomCode, peerId, isHost: false });
  
  sendGameMessage(ws, {
    type: 'room-joined',
    roomCode: roomCode
  });
  
  const hostWs = room.peers.get(room.host);
  if (hostWs && hostWs.readyState === WebSocket.OPEN) {
    sendGameMessage(hostWs, {
      type: 'peer-joined',
      peerId: peerId
    });
  }
  
  console.log(`[Pocket Dogfight] ${peerId} joined room: ${roomCode}`);
}

function handleLeaveGameRoom(ws, message) {
  const connection = gameConnections.get(ws);
  if (!connection) return;
  
  const { roomCode, peerId } = connection;
  const room = gameRooms.get(roomCode);
  
  if (room) {
    room.peers.delete(peerId);
    
    for (const [otherPeerId, otherWs] of room.peers) {
      if (otherWs.readyState === WebSocket.OPEN) {
        sendGameMessage(otherWs, {
          type: 'peer-left',
          peerId: peerId
        });
      }
    }
    
    if (peerId === room.host || room.peers.size === 0) {
      gameRooms.delete(roomCode);
      console.log(`[Pocket Dogfight] Room closed: ${roomCode}`);
    }
  }
  
  gameConnections.delete(ws);
  console.log(`[Pocket Dogfight] ${peerId} left room: ${roomCode}`);
}

function handleGameWebRTCMessage(ws, message) {
  const connection = gameConnections.get(ws);
  if (!connection) {
    sendGameError(ws, 'Not in a room');
    return;
  }
  
  const { roomCode } = connection;
  const { targetPeer } = message;
  const room = gameRooms.get(roomCode);
  
  if (!room) {
    sendGameError(ws, 'Room not found');
    return;
  }
  
  const targetWs = room.peers.get(targetPeer);
  if (!targetWs || targetWs.readyState !== WebSocket.OPEN) {
    sendGameError(ws, 'Target peer not found or disconnected');
    return;
  }
  
  const forwardMessage = {
    type: message.type,
    peerId: connection.peerId
  };
  
  if (message.offer) forwardMessage.offer = message.offer;
  if (message.answer) forwardMessage.answer = message.answer;
  if (message.candidate) forwardMessage.candidate = message.candidate;
  
  sendGameMessage(targetWs, forwardMessage);
  room.lastActivity = Date.now();
}

function handleGameDisconnection(ws) {
  const connection = gameConnections.get(ws);
  if (!connection) return;
  
  handleLeaveGameRoom(ws, { roomCode: connection.roomCode, peerId: connection.peerId });
}

function sendGameMessage(ws, message) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

function sendGameError(ws, error) {
  sendGameMessage(ws, {
    type: 'error',
    error: error
  });
}

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Pocket Dogfight signaling server available at ws://localhost:${PORT}/pocket-dogfight-ws`);
  console.log('Visit /setup.html to create your admin account');
});