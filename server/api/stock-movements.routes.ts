
import { Router } from 'express';
import { getPool, sql } from '../db.ts';
import fallbackStore from '../fallbackStore.ts';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT * FROM StockMovements ORDER BY date DESC');
    res.json(result.recordset);
  } catch (err: any) {
    const data = await fallbackStore.getAll('StockMovements');
    res.json(data);
  }
});

router.post('/', async (req, res) => {
  const body = req.body;
  const id = `mov_${Date.now()}`;
  const record = { id, ...body };

  try {
    const pool = await getPool();
    const request = pool.request();
    request.input('id', sql.NVarChar, record.id);
    request.input('productId', sql.NVarChar, record.productId);
    request.input('productName', sql.NVarChar, record.productName);
    request.input('type', sql.NVarChar, record.type);
    request.input('quantity', sql.Int, record.quantity);
    request.input('date', sql.DateTime, record.date);
    request.input('reason', sql.NVarChar, record.reason);
    request.input('userId', sql.NVarChar, record.userId);
    request.input('userName', sql.NVarChar, record.userName);

    const result = await request.query(`
      INSERT INTO StockMovements (id, productId, productName, type, quantity, date, reason, userId, userName)
      OUTPUT inserted.*
      VALUES (@id, @productId, @productName, @type, @quantity, @date, @reason, @userId, @userName)
    `);
    res.status(201).json(result.recordset[0]);
  } catch (err: any) {
    const rec = await fallbackStore.insert('StockMovements', record);
    res.status(201).json(rec);
  }
});

export default router;
