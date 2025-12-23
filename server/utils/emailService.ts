import nodemailer from 'nodemailer';

// --- Configuration ---
// In 2025, it is best practice to use environment variables.
// If using Gmail, you MUST use an "App Password," not your regular password.
const transporter = nodemailer.createTransport({
  service: 'gmail', 
  auth: {
    user: process.env.EMAIL_USER, // e.g., jirehfishes@gmail.com
    pass: process.env.EMAIL_PASS  // e.g., 'abcd efgh ijkl mnop' (App Password)
  }
});

/**
 * Sends a stylized invitation email to a new staff member.
 */
export const sendInvitationEmail = async (
  toEmail: string, 
  staffName: string, 
  token: string
) => {
  // Construct the URL based on your frontend location
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const inviteLink = `${baseUrl}/join?token=${token}&email=${encodeURIComponent(toEmail)}`;

  const mailOptions = {
    from: `"Jireh Fishes System" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Action Required: Your Personnel Access Link',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #2563eb; margin: 0;">Jireh Fishes</h1>
          <p style="color: #64748b; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; font-size: 12px;">Personnel Registry</p>
        </div>
        
        <p style="color: #1e293b; font-size: 16px;">Hello <strong>${staffName}</strong>,</p>
        
        <p style="color: #475569; line-height: 1.6;">
          An administrative node has initiated your access to the <strong>Jireh Fishes Tracker</strong>. 
          To establish your credentials and access the dashboard, please click the button below:
        </p>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${inviteLink}" 
             style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Activate Access Node
          </a>
        </div>

        <p style="color: #94a3b8; font-size: 12px; text-align: center;">
          This link will expire in 48 hours. If you did not expect this invitation, please ignore this email.
        </p>
        
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        
        <p style="color: #94a3b8; font-size: 11px; text-align: center;">
          © 2025 Jireh Fishes Ledger Control System. All rights reserved.
        </p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Invitation dispatched to ${toEmail}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Email Dispatch Failed:', error);
    return false;
  }
};
