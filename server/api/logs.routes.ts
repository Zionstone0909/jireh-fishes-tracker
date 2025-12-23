
import { Router } from 'express';
import { getPool, sql } from '../db.ts';
import fallbackStore from '../fallbackStore.ts';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT * FROM Logs ORDER BY timestamp DESC');
    res.json(result.recordset);
  } catch (err: any) {
    const data = await fallbackStore.getAll('Logs');
    res.json(data);
  }
});

router.post('/', async (req, res) => {
  const body = req.body;
  const id = `log_${Date.now()}`;
  const record = { id, ...body, timestamp: body.timestamp || new Date().toISOString() };

  try {
    const pool = await getPool();
    const request = pool.request();
    request.input('id', sql.NVarChar, record.id);
    request.input('action', sql.NVarChar, record.action);
    request.input('details', sql.NVarChar, record.details);
    request.input('timestamp', sql.DateTime, record.timestamp);
    request.input('userId', sql.NVarChar, record.userId);

    const result = await request.query(`
      INSERT INTO Logs (id, action, details, timestamp, userId)
      OUTPUT inserted.*
      VALUES (@id, @action, @details, @timestamp, @userId)
    `);
    res.status(201).json(result.recordset[0]);
  } catch (err: any) {
    const rec = await fallbackStore.insert('Logs', record);
    res.status(201).json(rec);
  }
});

export default router;
