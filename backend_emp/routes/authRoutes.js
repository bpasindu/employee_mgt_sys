const express = require('express');
const router = express.Router();
const { authService } = require('../services/backendService');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json(result);
  } catch (err) {
    console.error('Auth login error:', err.message);
    res.status(401).json({ error: err.message || 'Invalid email address or password' });
  }
});

// POST /api/auth/send-otp
router.post('/send-otp', async (req, res) => {
  try {
    const { email, type } = req.body;
    const result = await authService.sendOtp(email, type);
    res.json(result);
  } catch (err) {
    console.error('Send OTP error:', err.message);
    res.status(400).json({ error: err.message || 'Failed to send OTP' });
  }
});

// POST /api/auth/verify-otp-register
router.post('/verify-otp-register', async (req, res) => {
  try {
    const result = await authService.verifyOtpRegister(req.body);
    res.json(result);
  } catch (err) {
    console.error('Verify OTP Register error:', err.message);
    res.status(400).json({ error: err.message || 'Failed to register account' });
  }
});

// POST /api/auth/verify-otp-reset-password
router.post('/verify-otp-reset-password', async (req, res) => {
  try {
    const result = await authService.verifyOtpResetPassword(req.body);
    res.json(result);
  } catch (err) {
    console.error('Verify OTP Reset error:', err.message);
    res.status(400).json({ error: err.message || 'Failed to reset password' });
  }
});

// GET /api/auth/check-email - Check if email is already registered in PWH system
router.get('/check-email', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'Email parameter is required' });
    }
    const result = await authService.checkEmail(email);
    res.json(result);
  } catch (err) {
    console.error('Check email error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to check email' });
  }
});

// POST /api/auth/register-employee - Register new employee and activate account with password
router.post('/register-employee', async (req, res) => {
  try {
    const result = await authService.registerEmployee(req.body);
    res.json(result);
  } catch (err) {
    console.error('Register employee error:', err.message);
    res.status(400).json({ error: err.message || 'Failed to register employee' });
  }
});

module.exports = router;
