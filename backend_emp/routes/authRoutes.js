const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const pool = require('../db');
const { initDatabase, getIsDbConnected, memoryStore } = require('../initDb');

// In-memory OTP store: { [email]: { otp, expiresAt, type } }
const otpStore = {};

// Helper to generate initials from name
function getInitials(name) {
  if (!name) return 'EP';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

// Send Email via Nodemailer
async function sendVerificationEmail(toEmail, otpCode, purpose) {
  let transporter;

  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    const isGmail = (process.env.EMAIL_USER || '').includes('@gmail.com') || (process.env.EMAIL_HOST || '').includes('gmail');
    if (isGmail) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    } else {
      transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: Number(process.env.EMAIL_PORT) === 465,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    }
  } else {
    // Fallback: create Ethereal test account if SMTP env vars are not set
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  }

  const isRegister = purpose === 'register';
  const subject = isRegister 
    ? 'Verify Your Email - P W Holdings Employee Portal'
    : 'Password Reset OTP Code - P W Holdings';

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b; max-width: 520px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <h2 style="color: #022851; margin-top: 0; font-size: 22px;">P W Holdings</h2>
      <p style="font-size: 14px; color: #475569; margin-bottom: 20px;">
        Your 6-digit verification code for ${isRegister ? 'account registration' : 'password reset'} is:
      </p>
      <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 18px; text-align: center; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #022851; font-family: monospace;">${otpCode}</span>
      </div>
      <p style="font-size: 12px; color: #64748b; margin-top: 20px;">
        This code is valid for 10 minutes. If you did not request this code, please ignore this email.
      </p>
    </div>
  `;

  const info = await transporter.sendMail({
    from: `"P W Holdings System" <${process.env.EMAIL_USER || 'no-reply@pwholdings.lk'}>`,
    to: toEmail,
    subject: subject,
    html: htmlContent
  });

  console.log(`[EMAIL DISPATCH] Sent OTP ${otpCode} to ${toEmail}. MessageID: ${info.messageId}`);
  if (nodemailer.getTestMessageUrl(info)) {
    console.log(`[EMAIL PREVIEW URL] ${nodemailer.getTestMessageUrl(info)}`);
  }
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    if (!getIsDbConnected()) await initDatabase();

    // Attempt database lookup first
    let user = null;
    try {
      const [rows] = await pool.query(
        'SELECT id, name, department, email, password, initials, status, role FROM users WHERE LOWER(email) = ?',
        [cleanEmail]
      );
      if (rows.length > 0) {
        user = rows[0];
      }
    } catch (dbErr) {
      console.error('MySQL query error during login:', dbErr.message);
      // Fallback check memoryStore if DB query fails
      let foundUser = (memoryStore.admins || []).find(a => a.email.toLowerCase() === cleanEmail);
      if (!foundUser) {
        foundUser = (memoryStore.allEmployees || []).find(e => e.email.toLowerCase() === cleanEmail);
      }
      if (!foundUser && memoryStore.user?.email?.toLowerCase() === cleanEmail) {
        foundUser = memoryStore.user;
      }
      if (foundUser) user = { ...foundUser };
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid email address or password' });
    }

    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid email address or password' });
    }

    const ADMIN_EMAILS = [
      'hashan@pwholdings.lk',
      'nishani@pwholdings.lk',
      'channa@pwholdings.lk',
      'pasindu.buddhima@pwholdings.lk'
    ];

    if (ADMIN_EMAILS.includes(cleanEmail)) {
      user.role = 'Admin';
      if (getIsDbConnected()) {
        try {
          await pool.query("UPDATE users SET role = 'Admin' WHERE LOWER(email) = ?", [cleanEmail]);
        } catch (e) {
          console.error('Failed to update DB role for admin:', e.message);
        }
      }
    }

    delete user.password;
    return res.json({ message: 'Login successful', user });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ error: 'Authentication failed', message: err.message });
  }

});

// POST /api/auth/send-otp - Generate & send real OTP via email
router.post('/send-otp', async (req, res) => {
  const { email, type } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email address is required' });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    if (!getIsDbConnected()) await initDatabase();
    if (type === 'register') {
      if (getIsDbConnected()) {
        const [existing] = await pool.query('SELECT id FROM users WHERE LOWER(email) = ?', [cleanEmail]);
        if (existing.length > 0) {
          return res.status(400).json({ error: 'An account with this email already exists' });
        }
      } else {
        const exists = memoryStore.allEmployees.some(e => e.email.toLowerCase() === cleanEmail);
        if (exists) {
          return res.status(400).json({ error: 'An account with this email already exists' });
        }
      }
    } else if (type === 'reset-password') {
      if (getIsDbConnected()) {
        const [existing] = await pool.query('SELECT id FROM users WHERE LOWER(email) = ?', [cleanEmail]);
        if (existing.length === 0) {
          return res.status(404).json({ error: 'No account found with this email address' });
        }
      } else {
        let found = memoryStore.admins.find(a => a.email.toLowerCase() === cleanEmail);
        if (!found) {
          found = memoryStore.allEmployees.find(e => e.email.toLowerCase() === cleanEmail);
        }
        if (!found && memoryStore.user.email.toLowerCase() === cleanEmail) {
          found = memoryStore.user;
        }
        if (!found) {
          return res.status(404).json({ error: 'No account found with this email address' });
        }
      }
    }

    // Generate 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore[cleanEmail] = { otp, expiresAt, type };

    // Attempt email dispatch via Nodemailer
    let emailSent = false;
    try {
      await sendVerificationEmail(cleanEmail, otp, type);
      emailSent = true;
    } catch (mailErr) {
      console.warn('Nodemailer SMTP Notice:', mailErr.message);
    }

    return res.json({
      message: `Verification code sent to ${cleanEmail}`,
      otp: otp
    });
  } catch (err) {
    console.error('Error sending OTP email:', err);
    res.status(500).json({ error: 'Failed to generate OTP verification code' });
  }
});

// POST /api/auth/verify-otp-register - Verify OTP and complete registration
router.post('/verify-otp-register', async (req, res) => {
  const { name, email, password, department, otp } = req.body;

  if (!name || !email || !password || !otp) {
    return res.status(400).json({ error: 'Name, email, password, and OTP code are required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const record = otpStore[cleanEmail];

  if (!record || record.type !== 'register') {
    return res.status(400).json({ error: 'No pending OTP verification found for this email. Please request a new OTP.' });
  }

  if (Date.now() > record.expiresAt) {
    delete otpStore[cleanEmail];
    return res.status(400).json({ error: 'OTP verification code has expired. Please request a new code.' });
  }

  if (record.otp !== otp.toString().trim()) {
    return res.status(400).json({ error: 'Invalid verification OTP code. Please check and try again.' });
  }

  delete otpStore[cleanEmail];
  const initials = getInitials(name);
  const dept = department || 'IT';

  const ADMIN_EMAILS = [
    'hashan@pwholdings.lk',
    'nishani@pwholdings.lk',
    'channa@pwholdings.lk',
    'pasindu.buddhima@pwholdings.lk'
  ];
  const assignedRole = ADMIN_EMAILS.includes(cleanEmail) ? 'Admin' : 'Employee';

  try {
    if (!getIsDbConnected()) await initDatabase();
    if (getIsDbConnected()) {
      const [existing] = await pool.query('SELECT id FROM users WHERE LOWER(email) = ?', [cleanEmail]);
      if (existing.length > 0) {
        return res.status(400).json({ error: 'An account with this email already exists' });
      }

      const [result] = await pool.query(
        `INSERT INTO users (name, department, email, password, initials, status, role)
         VALUES (?, ?, ?, ?, ?, 'Working', ?)`,
        [name, dept, cleanEmail, password, initials, assignedRole]
      );

      const newUserId = result.insertId;

      await pool.query(
        'INSERT INTO leave_balances (user_id, total_days, used_days) VALUES (?, 24, 0)',
        [newUserId]
      );

      const newUser = {
        id: newUserId,
        name,
        department: dept,
        email: cleanEmail,
        initials,
        status: 'Working',
        role: assignedRole
      };

      return res.json({ message: 'Email verified! Account created successfully', user: newUser });
    } else {
      const newUser = {
        id: Date.now(),
        name,
        department: dept,
        email: cleanEmail,
        password,
        initials,
        status: 'Working',
        updated_ago: 'Just now',
        role: assignedRole,
        today_work: ''
      };

      memoryStore.allEmployees.unshift(newUser);

      const userToReturn = { ...newUser };
      delete userToReturn.password;

      return res.json({ message: 'Email verified! Account created successfully', user: userToReturn });
    }
  } catch (err) {
    console.error('Error completing registration:', err);
    res.status(500).json({ error: 'Failed to complete registration' });
  }
});

// POST /api/auth/verify-otp-reset-password - Verify OTP and update password
router.post('/verify-otp-reset-password', async (req, res) => {
  const { email, newPassword, otp } = req.body;

  if (!email || !newPassword || !otp) {
    return res.status(400).json({ error: 'Email, new password, and OTP code are required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const record = otpStore[cleanEmail];

  if (!record || record.type !== 'reset-password') {
    return res.status(400).json({ error: 'No pending OTP verification found for this email. Please request a new OTP.' });
  }

  if (Date.now() > record.expiresAt) {
    delete otpStore[cleanEmail];
    return res.status(400).json({ error: 'OTP verification code has expired. Please request a new code.' });
  }

  if (record.otp !== otp.toString().trim()) {
    return res.status(400).json({ error: 'Invalid verification OTP code. Please check and try again.' });
  }

  delete otpStore[cleanEmail];

  try {
    if (!getIsDbConnected()) await initDatabase();
    if (getIsDbConnected()) {
      const [existing] = await pool.query('SELECT id FROM users WHERE LOWER(email) = ?', [cleanEmail]);
      if (existing.length === 0) {
        return res.status(404).json({ error: 'No account found with this email address' });
      }

      await pool.query('UPDATE users SET password = ? WHERE LOWER(email) = ?', [newPassword, cleanEmail]);
      return res.json({ message: 'Email verified! Password updated successfully. You can now sign in.' });
    } else {
      let found = memoryStore.admins.find(a => a.email.toLowerCase() === cleanEmail);
      if (!found) {
        found = memoryStore.allEmployees.find(e => e.email.toLowerCase() === cleanEmail);
      }
      if (!found && memoryStore.user.email.toLowerCase() === cleanEmail) {
        found = memoryStore.user;
      }

      if (!found) {
        return res.status(404).json({ error: 'No account found with this email address' });
      }

      found.password = newPassword;
      return res.json({ message: 'Email verified! Password updated successfully. You can now sign in.' });
    }
  } catch (err) {
    console.error('Error resetting password:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

module.exports = router;
