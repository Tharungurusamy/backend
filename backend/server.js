import express from 'express';
import cors from 'cors';
import { pool, initDb } from './db.js';

const PRIORITIES = ['Low', 'Medium', 'High'];
const STATUSES = ['Pending', 'In Progress', 'Completed'];

const app = express();

// CORS_ORIGIN is a comma-separated list, e.g. "http://localhost:5173,https://my-app.vercel.app"
const origins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map((o) => o.trim());
app.use(cors({ origin: origins }));
app.use(express.json());

// Returns an error message, or null if the task body is valid.
// `partial` = true lets PUT update only some fields.
function validateTask(body, partial = false) {
  if (!body || typeof body !== 'object') return 'Request body must be JSON.';
  const { title, description, priority, status } = body;

  if (!partial || title !== undefined) {
    if (typeof title !== 'string' || !title.trim()) return 'Title is required.';
    if (title.trim().length > 200) return 'Title must be 200 characters or fewer.';
  }
  if (description !== undefined && typeof description !== 'string') return 'Description must be text.';
  if (description && description.length > 2000) return 'Description must be 2000 characters or fewer.';
  if (priority !== undefined && !PRIORITIES.includes(priority)) return `Priority must be one of: ${PRIORITIES.join(', ')}.`;
  if (status !== undefined && !STATUSES.includes(status)) return `Status must be one of: ${STATUSES.join(', ')}.`;
  return null;
}

function parseId(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid task id.' });
    return null;
  }
  return id;
}

app.get('/', (req, res) => res.json({ message: 'Taskly API is running. Try GET /api/tasks' }));
app.get('/api/health', (req, res) => res.json({ ok: true }));

// GET /api/tasks?status=Pending&priority=High
app.get('/api/tasks', async (req, res) => {
  const { status, priority } = req.query;
  if (status && !STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status filter.' });
  if (priority && !PRIORITIES.includes(priority)) return res.status(400).json({ error: 'Invalid priority filter.' });

  const { rows } = await pool.query(
    `SELECT * FROM tasks
     WHERE ($1::text IS NULL OR status = $1)
       AND ($2::text IS NULL OR priority = $2)
     ORDER BY created_at DESC`,
    [status || null, priority || null]
  );
  res.json(rows);
});

app.get('/api/tasks/:id', async (req, res) => {
  const id = parseId(req, res);
  if (!id) return;
  const { rows } = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
  if (!rows[0]) return res.status(404).json({ error: 'Task not found.' });
  res.json(rows[0]);
});

app.post('/api/tasks', async (req, res) => {
  const error = validateTask(req.body);
  if (error) return res.status(400).json({ error });

  const { title, description = '', priority = 'Medium', status = 'Pending' } = req.body;
  const { rows } = await pool.query(
    'INSERT INTO tasks (title, description, priority, status) VALUES ($1, $2, $3, $4) RETURNING *',
    [title.trim(), description.trim(), priority, status]
  );
  res.status(201).json(rows[0]);
});

app.put('/api/tasks/:id', async (req, res) => {
  const id = parseId(req, res);
  if (!id) return;
  const error = validateTask(req.body, true);
  if (error) return res.status(400).json({ error });

  const { title, description, priority, status } = req.body;
  // COALESCE keeps the existing value for any field not sent.
  const { rows } = await pool.query(
    `UPDATE tasks SET
       title       = COALESCE($1, title),
       description = COALESCE($2, description),
       priority    = COALESCE($3, priority),
       status      = COALESCE($4, status),
       updated_at  = now()
     WHERE id = $5 RETURNING *`,
    [title?.trim() ?? null, description?.trim() ?? null, priority ?? null, status ?? null, id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Task not found.' });
  res.json(rows[0]);
});

app.delete('/api/tasks/:id', async (req, res) => {
  const id = parseId(req, res);
  if (!id) return;
  const { rowCount } = await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
  if (!rowCount) return res.status(404).json({ error: 'Task not found.' });
  res.status(204).end();
});

app.use((req, res) => res.status(404).json({ error: 'Route not found.' }));

// Express 5 forwards errors from async handlers here automatically.
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Malformed JSON.' });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

const PORT = process.env.PORT || 5000;
initDb()
  .then(() => app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`)))
  .catch((err) => {
    console.error('Could not connect to the database:', err.message);
    process.exit(1);
  });
