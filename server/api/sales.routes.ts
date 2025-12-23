
import { Router } from 'express';
import { getPool, sql } from '../db.ts';
import fallbackStore from '../fallbackStore.ts';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT * FROM Sales ORDER BY date DESC');
    res.json(result.recordset);
  } catch (err: any) {
    const data = await fallbackStore.getAll('Sales');
    res.json(data);
  }
});

router.post('/', async (req, res) => {
  const body = req.body;
  const id = `sale_${Date.now()}`;
  const record = { id, ...body };

  try {
    const pool = await getPool();
    const request = pool.request();
    request.input('id', sql.NVarChar, record.id);
    request.input('date', sql.DateTime, record.date);
    request.input('customerId', sql.NVarChar, record.customerId);
    request.input('customerName', sql.NVarChar, record.customerName);
    request.input('total', sql.Decimal(18, 2), record.total);
    request.input('amountPaid', sql.Decimal(18, 2), record.amountPaid);
    request.input('paymentMethod', sql.NVarChar, record.paymentMethod);
    request.input('initiatedBy', sql.NVarChar, record.initiatedBy);
    request.input('initiatedByName', sql.NVarChar, record.initiatedByName);

    const result = await request.query(`
      INSERT INTO Sales (id, date, customerId, customerName, total, amountPaid, paymentMethod, initiatedBy, initiatedByName)
      OUTPUT inserted.*
      VALUES (@id, @date, @customerId, @customerName, @total, @amountPaid, @paymentMethod, @initiatedBy, @initiatedByName)
    `);
    res.status(201).json(result.recordset[0]);
  } catch (err: any) {
    const rec = await fallbackStore.insert('Sales', record);
    res.status(201).json(rec);
  }
});

export default router;
