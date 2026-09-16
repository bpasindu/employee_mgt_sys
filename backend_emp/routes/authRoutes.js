const express = require('express');
const router = express.Router();
const pool = require('../db');
const { getIsDbConnected, memoryStore } = require('../initDb');

// Helper to generate initials from name
function getInitials(name) {
  if (!name) return 'EP';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    if (getIsDbConnected()) {
      const [rows] = await pool.query(
        'SELECT id, name, title, department, email, password, initials, status, role FROM users WHERE LOWER(email) = ?',
        [cleanEmail]
      );

      if (rows.length === 0) {
        return res.status(401).json({ error: 'Invalid email address or password' });
      }

      const user = rows[0];
      if (user.password !== password) {
        return res.status(401).json({ error: 'Invalid email address or password' });
      }

      delete user.password;
      return res.json({ message: 'Login successful', user });
    } else {
      // Check in-memory store
      let foundUser = memoryStore.admins.find(a => a.email.toLowerCase() === cleanEmail);
      if (!foundUser) {
        foundUser = memoryStore.allEmployees.find(e => e.email.toLowerCase() === cleanEmail);
      }
      if (!foundUser && memoryStore.user.email.toLowerCase() === cleanEmail) {
        foundUser = memoryStore.user;
      }

      if (!foundUser || foundUser.password !== password) {
        return res.status(401).json({ error: 'Invalid email address or password' });
      }

      const user = { ...foundUser };
      delete user.password;
      return res.json({ message: 'Login successful', user });
    }
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// POST /api/auth/register-employee - Register new employee
router.post('/register-employee', async (req, res) => {
  const { name, email, password, position, department } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const initials = getInitials(name);
  const dept = department || 'IT';
  const pos = position || 'Software Engineer';

  try {
    if (getIsDbConnected()) {
      // Check if email exists
      const [existing] = await pool.query('SELECT id FROM users WHERE LOWER(email) = ?', [cleanEmail]);
      if (existing.length > 0) {
        return res.status(400).json({ error: 'An account with this email already exists' });
      }

      const [result] = await pool.query(
        `INSERT INTO users (name, title, department, email, password, initials, status, role)
         VALUES (?, ?, ?, ?, ?, ?, 'Working', 'Employee')`,
        [name, pos, dept, cleanEmail, password, initials]
      );

      const newUserId = result.insertId;

      // Seed leave balance for new employee
      await pool.query(
        'INSERT INTO leave_balances (user_id, total_days, used_days) VALUES (?, 24, 0)',
        [newUserId]
      );

      const newUser = {
        id: newUserId,
        name,
        title: pos,
        department: dept,
        email: cleanEmail,
        initials,
        status: 'Working',
        role: 'Employee'
      };

      return res.json({ message: 'Employee registered successfully', user: newUser });
    } else {
      // Check in-memory store
      const exists = memoryStore.allEmployees.some(e => e.email.toLowerCase() === cleanEmail);
      if (exists) {
        return res.status(400).json({ error: 'An account with this email already exists' });
      }

      const newUser = {
        id: Date.now(),
        name,
        title: pos,
        position: pos,
        department: dept,
        email: cleanEmail,
        password,
        initials,
        status: 'Working',
        updated_ago: 'Just now',
        role: 'Employee',
        today_work: 'Newly registered employee'
      };

      memoryStore.allEmployees.unshift(newUser);

      const userToReturn = { ...newUser };
      delete userToReturn.password;

      return res.json({ message: 'Employee registered successfully', user: userToReturn });
    }
  } catch (err) {
    console.error('Error registering employee:', err);
    res.status(500).json({ error: 'Failed to register employee' });
  }
});

// POST /api/auth/reset-password - Reset password
router.post('/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Email and new password are required' });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    if (getIsDbConnected()) {
      const [existing] = await pool.query('SELECT id FROM users WHERE LOWER(email) = ?', [cleanEmail]);
      if (existing.length === 0) {
        return res.status(404).json({ error: 'No account found with this email address' });
      }

      await pool.query('UPDATE users SET password = ? WHERE LOWER(email) = ?', [newPassword, cleanEmail]);
      return res.json({ message: 'Password reset successfully. You can now sign in with your new password.' });
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
      return res.json({ message: 'Password reset successfully. You can now sign in with your new password.' });
    }
  } catch (err) {
    console.error('Error resetting password:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

module.exports = router;
