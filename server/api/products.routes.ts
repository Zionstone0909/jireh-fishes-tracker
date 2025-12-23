
import { Router } from 'express';
import { getPool, sql } from '../db.ts';
import fallbackStore from '../fallbackStore.ts';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT * FROM Products ORDER BY name ASC');
    res.json(result.recordset);
  } catch (err: any) {
    const data = await fallbackStore.getAll('Products');
    res.json(data);
  }
});

router.post('/', async (req, res) => {
  const body = req.body;
  const id = `prod_${Date.now()}`;
  const record = { id, ...body };

  try {
    const pool = await getPool();
    const request = pool.request();
    request.input('id', sql.NVarChar, record.id);
    request.input('name', sql.NVarChar, record.name);
    request.input('sku', sql.NVarChar, record.sku);
    request.input('category', sql.NVarChar, record.category);
    request.input('price', sql.Decimal(18, 2), record.price);
    request.input('cost', sql.Decimal(18, 2), record.cost);
    request.input('quantity', sql.Int, record.quantity);
    request.input('minStockLevel', sql.Int, record.minStockLevel);

    const result = await request.query(`
      INSERT INTO Products (id, name, sku, category, price, cost, quantity, minStockLevel)
      OUTPUT inserted.*
      VALUES (@id, @name, @sku, @category, @price, @cost, @quantity, @minStockLevel)
    `);
    res.status(201).json(result.recordset[0]);
  } catch (err: any) {
    const rec = await fallbackStore.insert('Products', record);
    res.status(201).json(rec);
  }
});

// Changed from .patch to .post to align with frontend call
router.post('/:id/stock', async (req, res) => {
  const { id } = req.params;
  const { delta } = req.body;
  
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.NVarChar, id)
      .input('delta', sql.Int, delta)
      .query('UPDATE Products SET quantity = quantity + @delta OUTPUT inserted.* WHERE id = @id');
    res.json(result.recordset[0]);
  } catch (err: any) {
    const product = await fallbackStore.getById('Products', id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    const updated = await fallbackStore.update('Products', id, { quantity: product.quantity + delta });
    res.json(updated);
  }
});

export default router;
