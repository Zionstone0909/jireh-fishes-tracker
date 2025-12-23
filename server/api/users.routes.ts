
import { Router } from 'express';
import { getPool, sql } from '../db.ts';
import fallbackStore from '../fallbackStore.ts';

const router = Router();

// GET all users in the system
router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT id, name, email, role, isActive, createdAt FROM Users ORDER BY name ASC');
    res.json(result.recordset);
  } catch (err: any) {
    const data = await fallbackStore.getAll('Users');
    res.json(data);
  }
});

// GET specific user details
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.NVarChar, id)
      .query('SELECT id, name, email, role, isActive, createdAt FROM Users WHERE id = @id');
    
    if (result.recordset.length === 0) return res.status(404).json({ error: 'Node not found' });
    res.json(result.recordset[0]);
  } catch (err: any) {
    const user = await fallbackStore.getById('Users', id);
    if (!user) return res.status(404).json({ error: 'Node not found' });
    res.json(user);
  }
});

// POST register a new user
router.post('/', async (req, res) => {
  const { name, email, role, password } = req.body;
  const id = `u_${Date.now()}`;
  
  const newUser = {
    id,
    name: name || 'Anonymous Personnel',
    email: email,
    role: role || 'STAFF',
    isActive: true,
    createdAt: new Date().toISOString()
  };

  try {
    const pool = await getPool();
    const request = pool.request();
    request.input('id', sql.NVarChar, newUser.id);
    request.input('name', sql.NVarChar, newUser.name);
    request.input('email', sql.NVarChar, newUser.email);
    request.input('role', sql.NVarChar, newUser.role);
    request.input('isActive', sql.Bit, newUser.isActive);
    request.input('createdAt', sql.DateTime, newUser.createdAt);

    const result = await request.query(`
      INSERT INTO Users (id, name, email, role, isActive, createdAt)
      OUTPUT inserted.*
      VALUES (@id, @name, @email, @role, @isActive, @createdAt)
    `);
    res.status(201).json(result.recordset[0]);
  } catch (err: any) {
    const rec = await fallbackStore.insert('Users', newUser);
    res.status(201).json(rec);
  }
});

// POST update user profile
router.post('/:id/profile', async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.NVarChar, id)
      .input('name', sql.NVarChar, name)
      .query('UPDATE Users SET name = @name OUTPUT inserted.* WHERE id = @id');
    res.json(result.recordset[0]);
  } catch (err: any) {
    const updated = await fallbackStore.update('Users', id, { name });
    res.json(updated);
  }
});

// POST toggle user active status
router.post('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.NVarChar, id)
      .input('isActive', sql.Bit, isActive)
      .query('UPDATE Users SET isActive = @isActive OUTPUT inserted.* WHERE id = @id');
    res.json(result.recordset[0]);
  } catch (err: any) {
    const updated = await fallbackStore.update('Users', id, { isActive });
    res.json(updated);
  }
});

export default router;
