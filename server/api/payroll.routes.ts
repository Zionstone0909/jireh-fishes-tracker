
import { Router } from 'express';
import { getPool, sql } from '../db.ts';
import fallbackStore from '../fallbackStore.ts';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT * FROM Payroll ORDER BY paymentDate DESC');
    res.json(result.recordset);
  } catch (err: any) {
    const data = await fallbackStore.getAll('Payroll');
    res.json(data);
  }
});

router.post('/', async (req, res) => {
  const body = req.body;
  const id = `pay_${Date.now()}`;
  const record = { id, ...body };

  try {
    const pool = await getPool();
    const request = pool.request();
    request.input('id', sql.NVarChar, record.id);
    request.input('staffId', sql.NVarChar, record.staffId);
    request.input('staffName', sql.NVarChar, record.staffName);
    request.input('department', sql.NVarChar, record.department);
    request.input('amount', sql.Decimal(18, 2), record.amount);
    request.input('paymentDate', sql.Date, record.paymentDate);
    request.input('periodStart', sql.Date, record.periodStart);
    request.input('periodEnd', sql.Date, record.periodEnd);
    request.input('processedByName', sql.NVarChar, record.processedByName);

    const result = await request.query(`
      INSERT INTO Payroll (id, staffId, staffName, department, amount, paymentDate, periodStart, periodEnd, processedByName)
      OUTPUT inserted.*
      VALUES (@id, @staffId, @staffName, @department, @amount, @paymentDate, @periodStart, @periodEnd, @processedByName)
    `);
    res.status(201).json(result.recordset[0]);
  } catch (err: any) {
    const rec = await fallbackStore.insert('Payroll', record);
    res.status(201).json(rec);
  }
});

export default router;
