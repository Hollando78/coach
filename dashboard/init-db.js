const sqlite3 = require('sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

async function initializeDatabase() {
  const dataDir = path.join(__dirname, 'data');
  const dbPath = path.join(dataDir, 'dashboard.db');
  
  // Ensure data directory exists
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  const db = new sqlite3.Database(dbPath);

  console.log('Initializing database...');

  db.serialize(async () => {
    // Create tables if they don't exist
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

    // Check if admin user exists
    db.get('SELECT id FROM users WHERE username = ?', ['admin'], async (err, user) => {
      if (err) {
        console.error('Database error:', err);
        return;
      }

      if (!user) {
        console.log('Creating admin user...');
        const adminPassword = await bcrypt.hash('admin', 10);
        
        db.run(
          'INSERT INTO users (username, password_hash, role, permissions) VALUES (?, ?, ?, ?)',
          ['admin', adminPassword, 'admin', '[]'],
          function(insertErr) {
            if (insertErr) {
              console.error('Error creating admin user:', insertErr);
            } else {
              console.log('Admin user created with password: admin');
            }
          }
        );
      } else {
        console.log('Admin user already exists');
        
        // Reset admin password to 'admin' for demo purposes
        const adminPassword = await bcrypt.hash('admin', 10);
        db.run(
          'UPDATE users SET password_hash = ? WHERE username = ?',
          [adminPassword, 'admin'],
          function(updateErr) {
            if (updateErr) {
              console.error('Error updating admin password:', updateErr);
            } else {
              console.log('Admin password reset to: admin');
            }
          }
        );
      }

      // Close database
      setTimeout(() => {
        db.close((err) => {
          if (err) {
            console.error('Error closing database:', err);
          } else {
            console.log('Database initialization complete');
          }
        });
      }, 1000);
    });
  });
}

// Run if called directly
if (require.main === module) {
  initializeDatabase().catch(console.error);
}

module.exports = { initializeDatabase };