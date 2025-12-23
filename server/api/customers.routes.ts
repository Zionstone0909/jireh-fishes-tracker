
import { Router } from 'express';
import { getPool, sql } from '../db.ts';
import fallbackStore from '../fallbackStore.ts';

const router = Router();

// GET all customers (summary list)
router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT * FROM Customers ORDER BY name ASC');
    res.json(result.recordset);
  } catch (err: any) {
    const data = await fallbackStore.getAll('Customers');
    res.json(data);
  }
});

// GET specific customer with transactions (ledger)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await getPool();
    const customerResult = await pool.request()
      .input('id', sql.NVarChar, id)
      .query('SELECT * FROM Customers WHERE id = @id');
    
    if (customerResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const transactionsResult = await pool.request()
      .input('customerId', sql.NVarChar, id)
      .query('SELECT * FROM Transactions WHERE customerId = @customerId ORDER BY date DESC');

    const customer = customerResult.recordset[0];
    customer.transactions = transactionsResult.recordset;
    
    res.json(customer);
  } catch (err: any) {
    const customer = await fallbackStore.getById('Customers', id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    
    // In fallback, we might need to filter transactions from a separate store
    const allTransactions = await fallbackStore.getAll('Transactions') || [];
    customer.transactions = allTransactions.filter((t: any) => t.customerId === id);
    
    res.json(customer);
  }
});

router.post('/', async (req, res) => {
  const { name, email, phone, address, createdBy, createdByName } = req.body;
  const id = `customer_${Date.now()}`;
  
  const defaultCustomer = {
    id,
    name: name || 'Unknown Customer',
    email: email || '',
    phone: phone || '',
    address: address || '',
    totalSpent: 0,
    balance: 0,
    status: 'Active',
    lastVisit: new Date().toISOString(),
    createdBy: createdBy || '',
    createdByName: createdByName || 'System'
  };

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.NVarChar, defaultCustomer.id)
      .input('name', sql.NVarChar, defaultCustomer.name)
      .input('email', sql.NVarChar, defaultCustomer.email)
      .input('phone', sql.NVarChar, defaultCustomer.phone)
      .input('address', sql.NVarChar, defaultCustomer.address)
      .input('totalSpent', sql.Decimal(18, 2), defaultCustomer.totalSpent)
      .input('balance', sql.Decimal(18, 2), defaultCustomer.balance)
      .input('status', sql.NVarChar, defaultCustomer.status)
      .input('lastVisit', sql.DateTime, defaultCustomer.lastVisit)
      .input('createdBy', sql.NVarChar, defaultCustomer.createdBy)
      .input('createdByName', sql.NVarChar, defaultCustomer.createdByName)
      .query(`
        INSERT INTO Customers (id, name, email, phone, address, totalSpent, balance, status, lastVisit, createdBy, createdByName)
        OUTPUT INSERTED.*
        VALUES (@id, @name, @email, @phone, @address, @totalSpent, @balance, @status, @lastVisit, @createdBy, @createdByName)
      `);
    
    res.status(201).json(result.recordset[0]);
  } catch (err: any) {
    const rec = await fallbackStore.insert('Customers', defaultCustomer);
    res.status(201).json(rec);
  }
});

export default router;
