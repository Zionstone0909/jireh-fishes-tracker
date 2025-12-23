
import { Router } from 'express';
import { getPool, sql } from '../db.ts';
import fallbackStore from '../fallbackStore.ts';

const router = Router();

// GET summary analytics for inventory (Capital tied up, low stock counts, etc)
router.get('/summary', async (req, res) => {
  try {
    const products = await fallbackStore.getAll('Products');
    const totalItems = products.length;
    const lowStockItems = products.filter((p: any) => p.quantity <= (p.minStockLevel || 5)).length;
    const totalValueAtCost = products.reduce((acc: number, p: any) => acc + (p.quantity * (p.cost || 0)), 0);
    const totalValueAtRetail = products.reduce((acc: number, p: any) => acc + (p.quantity * p.price), 0);

    res.json({
      totalItems,
      lowStockItems,
      totalValueAtCost,
      totalValueAtRetail,
      projectedMargin: totalValueAtRetail - totalValueAtCost,
      lastAuditDate: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate inventory summary' });
  }
});

// GET detailed valuation report
router.get('/valuation', async (req, res) => {
    try {
        const products = await fallbackStore.getAll('Products');
        const report = products.map((p: any) => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            category: p.category,
            quantity: p.quantity,
            unitCost: p.cost || 0,
            unitPrice: p.price,
            totalCost: p.quantity * (p.cost || 0),
            totalRetailValue: p.quantity * p.price,
            potentialProfit: (p.quantity * p.price) - (p.quantity * (p.cost || 0))
        }));
        res.json(report);
    } catch (err: any) {
        res.status(500).json({ error: 'Valuation engine failure' });
    }
});

export default router;
