
import express from 'express';
import cors from 'cors';

import expenseRoutes from './api/expenses.routes.ts';
import customerRoutes from './api/customers.routes.ts';
import depositRoutes from './api/deposits.routes.ts';
import supplierRoutes from './api/suppliers.routes.ts';
import productRoutes from './api/products.routes.ts';
import saleRoutes from './api/sales.routes.ts';
import payrollRoutes from './api/payroll.routes.ts';
import logRoutes from './api/logs.routes.ts';
import supplierTxRoutes from './api/supplierTransactions.routes.ts';
import stockMovementRoutes from './api/stock-movements.routes.ts';
import inventoryRoutes from './api/inventory.routes.ts';
import staffRoutes from './api/staff.routes.ts';
import userRoutes from './api/users.routes.ts';
import invitationRoutes from './api/invitations.routes.ts';

const app = express();

// --------------------------------------------------
// Middleware
// --------------------------------------------------
app.use(cors());
app.use(express.json() as any);

// --------------------------------------------------
// Health Check
// --------------------------------------------------
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'OK' });
});

// --------------------------------------------------
// API Routes
// --------------------------------------------------
app.use('/api/expenses', expenseRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/deposits', depositRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/supplier-transactions', supplierTxRoutes);
app.use('/api/stock-movements', stockMovementRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/users', userRoutes);
app.use('/api/invitations', invitationRoutes);

// --------------------------------------------------
// 404 Handler
// --------------------------------------------------
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

export default app;
