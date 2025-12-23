
import { Router } from 'express';
import { getPool, sql } from '../db.ts';
import fallbackStore from '../fallbackStore.ts';

const router = Router();

// GET all physical staff members
router.get('/', async (req, res) => {
  try {
    const data = await fallbackStore.getAll('Staff');
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: 'Staff directory retrieval failure' });
  }
});

// POST new staff member registration
router.post('/', async (req, res) => {
  const { name, role, status } = req.body;
  const id = `staff_${Date.now()}`;
  
  const record = {
    id,
    name: name || 'Unnamed Personnel',
    role: role || 'Unassigned',
    status: status || 'active',
    attendance: []
  };

  try {
    const rec = await fallbackStore.insert('Staff', record);
    res.status(201).json(rec);
  } catch (err: any) {
    res.status(500).json({ error: 'Staff registration failure' });
  }
});

// POST mark attendance for a staff member
router.post('/:id/attendance', async (req, res) => {
  const { id } = req.params;
  const { date } = req.body;
  const timestamp = date || new Date().toISOString().split('T')[0];

  try {
    const staff = await fallbackStore.getById('Staff', id);
    if (!staff) return res.status(404).json({ error: 'Subject node not found' });
    
    const attendance = Array.isArray(staff.attendance) ? staff.attendance : [];
    if (!attendance.includes(timestamp)) {
        attendance.push(timestamp);
    }
    
    const updated = await fallbackStore.update('Staff', id, { attendance });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Attendance logging failure' });
  }
});

// PATCH update staff status or details
router.post('/:id/update', async (req, res) => {
    const { id } = req.params;
    try {
        const updated = await fallbackStore.update('Staff', id, req.body);
        res.json(updated);
    } catch (err: any) {
        res.status(500).json({ error: 'Profile syncharonization failure' });
    }
});

export default router;
