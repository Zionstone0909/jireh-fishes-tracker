
import { Router } from 'express';
import { getPool, sql } from '../db.ts';
import fallbackStore from '../fallbackStore.ts';

const router = Router();

// Removed explicit Request and Response types to allow for better type inference from Router and avoid conflicts with global types
router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT * FROM Expenses ORDER BY [date] DESC, createdAt DESC');
    res.json(result.recordset);
  } catch (err: any) {
    const data = await fallbackStore.getAll('Expenses');
    res.json(data);
  }
});

// Removed explicit Request and Response types to allow for better type inference from Router and avoid conflicts with global types
router.post('/', async (req, res) => {
  const body = req.body;
  const { description, amount, date, category, type, status, paymentMethod, reference, supplierId, recordedByName } = body;

  if (!description || !amount || !date || !category) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const id = `exp_${Date.now()}`;
  const record = {
    id,
    type: type || 'EXPENSE',
    category,
    description,
    reference: reference || null,
    amount: Number(amount),
    paymentMethod: paymentMethod || 'Cash',
    status: status || 'Paid',
    supplierId: supplierId || null,
    date,
    recordedByName: recordedByName || 'System'
  };

  try {
    const pool = await getPool();
    const request = pool.request();
    request.input('id', sql.NVarChar, record.id);
    request.input('type', sql.VarChar(20), record.type);
    request.input('category', sql.VarChar(50), record.category);
    request.input('description', sql.NVarChar(255), record.description);
    request.input('reference', sql.NVarChar(100), record.reference);
    request.input('amount', sql.Decimal(18, 2), record.amount);
    request.input('paymentMethod', sql.VarChar(50), record.paymentMethod);
    request.input('status', sql.VarChar(20), record.status);
    request.input('supplierId', sql.NVarChar(50), record.supplierId);
    request.input('date', sql.Date, record.date);
    request.input('recordedByName', sql.NVarChar(100), record.recordedByName);

    const result = await request.query(`
      INSERT INTO Expenses (id, type, category, description, reference, amount, paymentMethod, status, supplierId, [date], recordedByName, createdAt)
      OUTPUT inserted.*
      VALUES (@id, @type, @category, @description, @reference, @amount, @paymentMethod, @status, @supplierId, @date, @recordedByName, GETDATE())
    `);

    res.status(201).json(result.recordset[0]);
  } catch (err: any) {
    console.error('SQL Error:', err.message);
    const rec = await fallbackStore.insert('Expenses', record);
    res.status(201).json(rec);
  }
});

export default router;
