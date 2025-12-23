import express, { Request, Response } from 'express';
import cors from 'cors';
import { sql, getPool } from '../db'; 

// Route Imports
import expenseRoutes from './expenses.routes';
import customersRoutes from './customers.routes';
import suppliersRoutes from './suppliers.routes';
import productsRoutes from './products.routes';
import salesRoutes from './sales.routes';
import staffRoutes from './staff.routes';
import logsRoutes from './logs.routes';

const app = express();

// --- Middleware ---
app.use(cors()); 
app.use(express.json());

/**
 * 2025 DATABASE CONNECTION HANDLER
 * Using 'any' cast to resolve the 'MockPool' property errors (TS2339).
 */
const connectToDb = async () => {
    // Cast to any to bypass MockPool vs ConnectionPool type conflicts
    const pool = await getPool() as any;
    
    // Check if connected; if not, initiate connection
    if (pool.connected === false || !pool.connected) {
        await pool.connect();
    }
    return pool;
};

// --- API Routes ---
app.use('/api/expenses', expenseRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/logs', logsRoutes);

// --- Deposits Handler ---
app.get('/api/deposits', async (req: Request, res: Response) => {
    const searchTerm = req.query.search as string || ''; 
    const searchParam = `%${searchTerm}%`;

    try {
        const pool = await connectToDb();
        const result = await pool.request()
            .input('search', sql.NVarChar, searchParam)
            .query(`
                SELECT * FROM Expenses 
                WHERE type='DEPOSIT'
                  AND (description LIKE @search OR reference LIKE @search)
                ORDER BY [date] DESC, createdAt DESC
            `);
        res.json(result.recordset);
    } catch (err: any) {
        console.error("Query Error:", err);
        res.status(500).json({ error: "Database query failed", details: err.message });
    }
});

// Catch-all for API 404s
app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `Route ${req.originalUrl} not found` });
});

export default app;
