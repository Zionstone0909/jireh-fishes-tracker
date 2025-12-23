
import { Router } from 'express';
import { getPool, sql } from '../db.ts';
import fallbackStore from '../fallbackStore.ts';
import crypto from 'crypto'; 
import { sendInvitationEmail } from '../utils/emailService.ts';

const router = Router();

/**
 * GET /api/invitations
 * Retrieves all invitations from the registry.
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

    await request.query(`
      INSERT INTO Invitations (token, name, email, role, status, expiryDate, createdAt)
      VALUES (@token, @name, @email, @role, @status, @expiryDate, @createdAt)
    `);

    sendInvitationEmail(email, name, token).catch(e => console.error("Email Error:", e));
    res.status(201).json(invitation);
  } catch (err: any) {
    const rec = await fallbackStore.insert('Invitations', invitation);
    sendInvitationEmail(email, name, token).catch(e => console.error("Email Fallback Error:", e));
    res.status(201).json(rec);
  }
});

/**
 * POST /api/invitations/accept
 */
router.post('/accept', async (req, res) => {
  const { token, name, password } = req.body;
  
  try {
    const pool = await getPool();
    
    const inviteResult = await pool.request()
        .input('token', sql.NVarChar, token)
        .query("SELECT * FROM Invitations WHERE token = @token AND status = 'PENDING'");
        
    if (inviteResult.recordset.length === 0) throw new Error("Link invalid or expired.");
    const invite = inviteResult.recordset[0];

    const userId = `u_${Date.now()}`;
    await pool.request()
        .input('id', sql.NVarChar, userId)
        .input('name', sql.NVarChar, name)
        .input('email', sql.NVarChar, invite.email)
        .input('role', sql.NVarChar, invite.role)
        .input('isActive', sql.Bit, 1)
        .query("INSERT INTO Users (id, name, email, role, isActive, createdAt) VALUES (@id, @name, @email, @role, @isActive, GETDATE())");

    await pool.request()
        .input('token', sql.NVarChar, token)
        .query("UPDATE Invitations SET status = 'ACCEPTED' WHERE token = @token");

    res.json({ success: true, user: { id: userId, name, email: invite.email, role: invite.role } });
  } catch (err: any) {
    const invitations = await fallbackStore.getAll('Invitations');
    const invite = invitations.find((i: any) => i.token === token && i.status === 'PENDING');
    
    if (!invite) return res.status(400).json({ error: 'Access token invalid.' });
    
    const userId = `u_${Date.now()}`;
    const newUser = { id: userId, name, email: invite.email, role: invite.role, isActive: true, createdAt: new Date().toISOString() };
    
    await fallbackStore.insert('Users', newUser);
    await fallbackStore.update('Invitations', token, { status: 'ACCEPTED' });
    
    res.json({ success: true, user: newUser });
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
    await fallbackStore.delete('Invitations', token);
    res.json({ success: true });
  }
});

export default router;
