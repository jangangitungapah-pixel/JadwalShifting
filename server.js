import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3005;

// Keep process alive explicitly
setInterval(() => {}, 1000 * 60 * 60);

// Setup database
const dbDir = join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(join(dbDir, 'shiftsync.db'));

// Create table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS app_data (
    id TEXT PRIMARY KEY,
    payload TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Allow large JSON payloads just in case

// API Endpoints
app.get('/api/data', (req, res) => {
  try {
    const row = db.prepare('SELECT payload FROM app_data WHERE id = ?').get('main');
    if (row) {
      res.json(JSON.parse(row.payload));
    } else {
      res.json(null);
    }
  } catch (error) {
    console.error('Failed to get data:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

app.post('/api/data', (req, res) => {
  try {
    const data = req.body;
    const stmt = db.prepare(`
      INSERT INTO app_data (id, payload, updated_at) 
      VALUES ('main', ?, CURRENT_TIMESTAMP) 
      ON CONFLICT(id) DO UPDATE SET 
        payload = excluded.payload,
        updated_at = excluded.updated_at
    `);
    
    stmt.run(JSON.stringify(data));
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to save data:', error);
    res.status(500).json({ error: 'Failed to save data' });
  }
});

// For individual path updates (simulating Firebase path updates)
// We merge the incoming path data into the main payload
app.post('/api/data/path', (req, res) => {
  try {
    const { path, data } = req.body;
    
    // Begin transaction
    const transaction = db.transaction(() => {
      let row = db.prepare('SELECT payload FROM app_data WHERE id = ?').get('main');
      let payload = row ? JSON.parse(row.payload) : {};
      
      // Merge path
      const parts = path.split('/');
      let current = payload;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) current[parts[i]] = {};
        current = current[parts[i]];
      }
      
      if (data === null) {
        delete current[parts[parts.length - 1]];
      } else {
        current[parts[parts.length - 1]] = data;
      }
      
      const stmt = db.prepare(`
        INSERT INTO app_data (id, payload, updated_at) 
        VALUES ('main', ?, CURRENT_TIMESTAMP) 
        ON CONFLICT(id) DO UPDATE SET 
          payload = excluded.payload,
          updated_at = excluded.updated_at
      `);
      stmt.run(JSON.stringify(payload));
    });
    
    transaction();
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to update path:', error);
    res.status(500).json({ error: 'Failed to update path' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ ShiftSync Local SQLite Server running on http://localhost:${PORT}`);
});
