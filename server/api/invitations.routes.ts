import { Router } from 'express';
import { getPool, sql } from '../db.ts';
import fallbackStore from '../fallbackStore.ts';
import crypto from 'crypto'; 
import { sendInvitationEmail } from '../utils/emailService.ts'; // Import the service

const router = Router();

/**
 * GET /api/invitations
 */
router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT * FROM Invitations ORDER BY createdAt DESC');
    res.json(result.recordset);
  } catch (err: any) {
    const data = await fallbackStore.getAll('Invitations');
    res.json(data);
  }
});

/**
 * GET /api/invitations/validate/:token
 */
router.get('/validate/:token', async (req, res) => {
  const { token } = req.params;
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('token', sql.NVarChar, token)
      .query(`
        SELECT * FROM Invitations 
        WHERE token = @token 
        AND status = 'PENDING' 
        AND expiryDate > GETDATE()
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Invalid, expired, or already used token' });
    }
    res.json(result.recordset[0]);
  } catch (err: any) {
    const invitations = await fallbackStore.getAll('Invitations');
    const found = invitations.find((i: any) => 
      i.token === token && 
      i.status === 'PENDING' && 
      new Date(i.expiryDate) > new Date()
    );
    if (!found) return res.status(404).json({ error: 'Invalid or expired token' });
    res.json(found);
  }
});

/**
 * POST /api/invitations
 * Now triggers the real email dispatch
 */
router.post('/', async (req, res) => {
  const { name, email, role } = req.body;
  const token = crypto.randomBytes(32).toString('hex');
  
  const expiryDate = new Date();
  expiryDate.setHours(expiryDate.getHours() + 48);

  const invitation = {
    token,
    name,
    email,
    role: role || 'STAFF',
    status: 'PENDING',
    expiryDate: expiryDate.toISOString(),
    createdAt: new Date().toISOString()
  };

  try {
    const pool = await getPool();
    const request = pool.request();
    request.input('token', sql.NVarChar, invitation.token);
    request.input('name', sql.NVarChar, invitation.name);
    request.input('email', sql.NVarChar, invitation.email);
    request.input('role', sql.NVarChar, invitation.role);
    request.input('status', sql.NVarChar, invitation.status);
    request.input('expiryDate', sql.DateTime, invitation.expiryDate);
    request.input('createdAt', sql.DateTime, invitation.createdAt);

    const result = await request.query(`
      INSERT INTO Invitations (token, name, email, role, status, expiryDate, createdAt)
      OUTPUT inserted.*
      VALUES (@token, @name, @email, @role, @status, @expiryDate, @createdAt)
    `);

    const savedInvite = result.recordset[0];

    // --- 2025 EMAIL DISPATCH ---
    // We send the email but don't block the API response if it takes a moment
    sendInvitationEmail(savedInvite.email, savedInvite.name, savedInvite.token)
      .catch(e => console.error("Async Email Error:", e));

    res.status(201).json(savedInvite);
  } catch (err: any) {
    const rec = await fallbackStore.insert('Invitations', invitation);
    
    // Trigger email even for fallback store (for local testing)
    sendInvitationEmail(invitation.email, invitation.name, invitation.token)
      .catch(e => console.error("Fallback Email Error:", e));

    res.status(201).json(rec);
  }
});

/**
 * DELETE /api/invitations/:token
 */
router.delete('/:token', async (req, res) => {
  const { token } = req.params;
  try {
    const pool = await getPool();
    await pool.request()
      .input('token', sql.NVarChar, token)
      .query('DELETE FROM Invitations WHERE token = @token');
    res.json({ success: true });
  } catch (err: any) {
    console.log(`Revoking local token: ${token}`);
    res.json({ success: true });
  }
});

export default router;
