
import { Router } from 'express';
import { getPool, sql } from '../db.ts';
import fallbackStore from '../fallbackStore.ts';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT * FROM Suppliers ORDER BY name ASC');
    res.json(result.recordset);
  } catch (err: any) {
    const data = await fallbackStore.getAll('Suppliers');
    res.json(data);
  }
});

router.post('/', async (req, res) => {
  const body = req.body;
  const id = `sup_${Date.now()}`;
  const record = { id, ...body, status: body.status || 'Active' };

  try {
    const pool = await getPool();
    const request = pool.request();
    request.input('id', sql.NVarChar, record.id);
    request.input('name', sql.NVarChar, record.name);
    request.input('contactPerson', sql.NVarChar, record.contactPerson);
    request.input('email', sql.NVarChar, record.email);
    request.input('phone', sql.NVarChar, record.phone);
    request.input('address', sql.NVarChar, record.address);
    request.input('status', sql.NVarChar, record.status);
    
    const result = await request.query(`
      INSERT INTO Suppliers (id, name, contactPerson, email, phone, address, status)
      OUTPUT inserted.*
      VALUES (@id, @name, @contactPerson, @email, @phone, @address, @status)
    `);
    res.status(201).json(result.recordset[0]);
  } catch (err: any) {
    const rec = await fallbackStore.insert('Suppliers', record);
    res.status(201).json(rec);
  }
});

export default router;
