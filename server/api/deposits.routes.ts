
import { Router } from 'express';
import { getPool, sql } from '../db.ts';
import fallbackStore from '../fallbackStore.ts';

const router = Router();

// GET all deposits
router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT * FROM Expenses WHERE type = \'DEPOSIT\' ORDER BY date DESC');
    res.json(result.recordset);
  } catch (err: any) {
    console.error('DB Fetch failed, using fallback:', err.message);
    // Fix: Replaced non-existent 'find' method with 'getAll' followed by a filter operation.
    const allExpenses = await fallbackStore.getAll('Expenses');
    const records = allExpenses.filter((e: any) => e.type === 'DEPOSIT');
    res.json(records);
  }
});

// POST new deposit
router.post('/', async (req, res) => {
  const { date, description, amount, paymentMethod, reference, status, category, type } = req.body;
  const id = `dep_${Date.now()}`;
  const recordedByName = 'Admin'; // Mocked

  const defaultDeposit = {
    id,
    type: type || 'DEPOSIT',
    date: date || new Date().toISOString(),
    category: category || 'Income',
    description: description || 'No description',
    amount: amount || 0,
    paymentMethod: paymentMethod || 'Bank Transfer',
    reference: reference || '',
    status: status || 'Paid',
    recordedByName
  };

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.NVarChar, defaultDeposit.id)
      .input('type', sql.NVarChar, defaultDeposit.type)
      .input('date', sql.DateTime, defaultDeposit.date)
      .input('category', sql.NVarChar, defaultDeposit.category)
      .input('description', sql.NVarChar, defaultDeposit.description)
      .input('amount', sql.Decimal(18, 2), defaultDeposit.amount)
      .input('paymentMethod', sql.NVarChar, defaultDeposit.paymentMethod)
      .input('reference', sql.NVarChar, defaultDeposit.reference)
      .input('status', sql.NVarChar, defaultDeposit.status)
      .input('recordedByName', sql.NVarChar, defaultDeposit.recordedByName)
      .query(`
        INSERT INTO Expenses (id, type, date, category, description, amount, paymentMethod, reference, status, recordedByName)
        OUTPUT INSERTED.*
        VALUES (@id, @type, @date, @category, @description, @amount, @paymentMethod, @reference, @status, @recordedByName)
      `);
    
    res.status(201).json(result.recordset[0]);
  } catch (err: any) {
    console.error('DB Insert failed, using fallback:', err.message);
    const rec = await fallbackStore.insert('Expenses', defaultDeposit);
    res.status(201).json(rec);
  }
});

export default router;
