import express from 'express';
import { Pool } from 'pg';
import cors from 'cors';

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(cors());
app.use(express.json());

app.get('/api/leaderboard', async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT name, score, wave, created_at FROM leaderboard ORDER BY score DESC LIMIT 10'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Leaderboard fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

app.post('/api/scores', async (req, res) => {
  const { name, score, wave } = req.body;

  if (typeof name !== 'string' || typeof score !== 'number' || typeof wave !== 'number') {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  const cleanName = name.trim().toUpperCase().slice(0, 16) || 'ANON';
  if (score < 0 || wave < 1) {
    return res.status(400).json({ error: 'Invalid score or wave' });
  }

  try {
    await pool.query(
      'INSERT INTO leaderboard (name, score, wave) VALUES ($1, $2, $3)',
      [cleanName, score, wave]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('Score submit error:', err);
    res.status(500).json({ error: 'Failed to submit score' });
  }
});

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
