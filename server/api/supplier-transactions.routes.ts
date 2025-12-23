
import { Router } from 'express';
import { getPool, sql } from '../db.ts';
import fallbackStore from '../fallbackStore.ts';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT * FROM SupplierTransactions ORDER BY date DESC');
    res.json(result.recordset);
  } catch (err: any) {
    const data = await fallbackStore.getAll('SupplierTransactions');
    res.json(data);
  }
});

router.post('/', async (req, res) => {
  const body = req.body;
  const id = `stx_${Date.now()}`;
  const record = { id, ...body };

  try {
    const pool = await getPool();
    const request = pool.request();
    request.input('id', sql.NVarChar, record.id);
    request.input('supplierId', sql.NVarChar, record.supplierId);
    request.input('supplierName', sql.NVarChar, record.supplierName);
    request.input('amount', sql.Decimal(18, 2), record.amount);
    request.input('type', sql.NVarChar, record.type);
    request.input('description', sql.NVarChar, record.description);
    request.input('date', sql.DateTime, record.date);
    request.input('reference', sql.NVarChar, record.reference);
    request.input('initiatedByName', sql.NVarChar, record.initiatedByName);

    const result = await request.query(`
      INSERT INTO SupplierTransactions (id, supplierId, supplierName, amount, type, description, date, reference, initiatedByName)
      OUTPUT inserted.*
      VALUES (@id, @supplierId, @supplierName, @amount, @type, @description, @date, @reference, @initiatedByName)
    `);
    res.status(201).json(result.recordset[0]);
  } catch (err: any) {
    const rec = await fallbackStore.insert('SupplierTransactions', record);
    res.status(201).json(rec);
  }
});

export default router;
