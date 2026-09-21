const express = require('express');
const router = express.Router();
const pool = require('../db');
const { getIsDbConnected, memoryStore } = require('../initDb');

// Helper to format date strings YYYY-MM-DD
function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

// GET /api/dashboard/summary?user_id=X
router.get('/dashboard/summary', async (req, res) => {
  const userId = parseInt(req.query.user_id);
  if (!userId) return res.status(400).json({ error: 'user_id is required' });

  try {
    const todayStr = getTodayStr();

    if (getIsDbConnected()) {
      const [users] = await pool.query(
        'SELECT id, name, email, initials, status, department FROM users WHERE id = ?',
        [userId]
      );
      if (users.length === 0) return res.status(404).json({ error: 'User not found' });
      const user = users[0];

      const [entries] = await pool.query(
        'SELECT work_description FROM daily_work_entries WHERE user_id = ? AND entry_date = ? ORDER BY created_at DESC LIMIT 1',
        [userId, todayStr]
      );
      const todayEntry = entries[0] ? entries[0].work_description : '';

      const [balances] = await pool.query('SELECT * FROM leave_balances WHERE user_id = ?', [userId]);
      const balance = balances[0] || { total_days: 24, used_days: 0 };
      const available_days = balance.total_days - balance.used_days;

      const [leaves] = await pool.query(
        `SELECT id, leave_type, 
                DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date, 
                DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date, 
                days_count, status, reason 
         FROM leave_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 5`,
        [userId]
      );

      return res.json({
        user: { id: user.id, name: user.name, title: user.title, email: user.email, initials: user.initials, status: user.status },
        todayWork: todayEntry,
        leaveBalance: { total_days: balance.total_days, used_days: balance.used_days, available_days },
        recentLeaveRequests: leaves
      });
    } else {
      const todayEntryObj = memoryStore.workEntries.find(e => e.entry_date === todayStr);
      const available_days = memoryStore.leaveBalance.total_days - memoryStore.leaveBalance.used_days;
      return res.json({
        user: memoryStore.user,
        todayWork: todayEntryObj ? todayEntryObj.work_description : '',
        leaveBalance: { ...memoryStore.leaveBalance, available_days },
        recentLeaveRequests: memoryStore.leaveRequests
      });
    }
  } catch (err) {
    console.error('Error fetching dashboard summary:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// POST /api/work-entry - Save or update today's work description
router.post('/work-entry', async (req, res) => {
  const { user_id, work_description } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id is required' });
  if (typeof work_description !== 'string') return res.status(400).json({ error: 'work_description is required' });

  const todayStr = getTodayStr();

  try {
    if (getIsDbConnected()) {
      const [existing] = await pool.query(
        'SELECT id FROM daily_work_entries WHERE user_id = ? AND entry_date = ?',
        [user_id, todayStr]
      );

      if (existing.length > 0) {
        await pool.query(
          'UPDATE daily_work_entries SET work_description = ? WHERE id = ?',
          [work_description, existing[0].id]
        );
      } else {
        await pool.query(
          'INSERT INTO daily_work_entries (user_id, entry_date, work_description) VALUES (?, ?, ?)',
          [user_id, todayStr, work_description]
        );
      }
    } else {
      const existing = memoryStore.workEntries.find(e => e.entry_date === todayStr && e.user_id === user_id);
      if (existing) {
        existing.work_description = work_description;
      } else {
        memoryStore.workEntries.unshift({ id: Date.now(), user_id, entry_date: todayStr, work_description, created_at: new Date().toISOString() });
      }
    }

    res.json({ message: 'Work entry updated successfully', work_description });
  } catch (err) {
    console.error('Error saving work entry:', err);
    res.status(500).json({ error: 'Failed to save work entry' });
  }
});

// GET /api/work-entry/history?user_id=X
router.get('/work-entry/history', async (req, res) => {
  const userId = parseInt(req.query.user_id);
  if (!userId) return res.status(400).json({ error: 'user_id is required' });

  try {
    if (getIsDbConnected()) {
      const [rows] = await pool.query(
        'SELECT * FROM daily_work_entries WHERE user_id = ? ORDER BY entry_date DESC',
        [userId]
      );
      res.json(rows);
    } else {
      res.json(memoryStore.workEntries.filter(e => e.user_id === userId));
    }
  } catch (err) {
    console.error('Error fetching work history:', err);
    res.status(500).json({ error: 'Failed to fetch work history' });
  }
});

// POST /api/leave/apply
router.post('/leave/apply', async (req, res) => {
  const { user_id, leave_type, start_date, end_date, days_count, reason } = req.body;

  if (!user_id || !leave_type || !start_date || !end_date) {
    return res.status(400).json({ error: 'user_id, leave_type, start_date, and end_date are required' });
  }

  const days = Number(days_count) || 1;

  try {
    if (getIsDbConnected()) {
      // Check if employee already has an approved Study Leave during requested duration
      const [overlappingStudyLeave] = await pool.query(
        `SELECT * FROM leave_requests 
         WHERE user_id = ? 
           AND status = 'Approved' 
           AND leave_type = 'Study Leave'
           AND start_date <= ? 
           AND end_date >= ?`,
        [user_id, end_date, start_date]
      );

      if (overlappingStudyLeave.length > 0) {
        const approved = overlappingStudyLeave[0];
        const sDate = new Date(approved.start_date).toISOString().split('T')[0];
        const eDate = new Date(approved.end_date).toISOString().split('T')[0];
        return res.status(400).json({ 
          error: `You already have an approved Study Leave from ${sDate} to ${eDate}. Additional leave requests cannot be submitted for this duration.` 
        });
      }

      await pool.query(
        `INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, days_count, status, reason)
         VALUES (?, ?, ?, ?, ?, 'Pending', ?)`,
        [user_id, leave_type, start_date, end_date, days, reason || '']
      );
    } else {
      const overlapping = memoryStore.leaveRequests.find(r => 
        r.user_id === Number(user_id) &&
        r.status === 'Approved' &&
        r.leave_type === 'Study Leave' &&
        r.start_date <= end_date &&
        r.end_date >= start_date
      );

      if (overlapping) {
        return res.status(400).json({ 
          error: `You already have an approved Study Leave from ${overlapping.start_date} to ${overlapping.end_date}. Additional leave requests cannot be submitted for this duration.` 
        });
      }

      memoryStore.leaveRequests.unshift({
        id: Date.now(), user_id, leave_type, start_date, end_date,
        days_count: days, status: 'Pending', reason: reason || '',
        created_at: new Date().toISOString()
      });
    }
    res.json({ message: 'Leave request submitted successfully' });
  } catch (err) {
    console.error('Error submitting leave request:', err);
    res.status(500).json({ error: 'Failed to submit leave request' });
  }
});

// GET /api/leave/history?user_id=X
router.get('/leave/history', async (req, res) => {
  const userId = parseInt(req.query.user_id);
  if (!userId) return res.status(400).json({ error: 'user_id is required' });

  try {
    if (getIsDbConnected()) {
      const [leaves] = await pool.query(
        `SELECT id, user_id, leave_type, 
                DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date, 
                DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date, 
                days_count, status, reason, created_at 
         FROM leave_requests WHERE user_id = ? ORDER BY created_at DESC`,
        [userId]
      );
      res.json(leaves);
    } else {
      res.json(memoryStore.leaveRequests.filter(l => l.user_id === userId));
    }
  } catch (err) {
    console.error('Error fetching leave history:', err);
    res.status(500).json({ error: 'Failed to fetch leave history' });
  }
});

// PATCH /api/user/status
router.patch('/user/status', async (req, res) => {
  const { user_id, status } = req.body;
  if (!user_id || !status) return res.status(400).json({ error: 'user_id and status are required' });

  try {
    if (getIsDbConnected()) {
      await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, user_id]);
    } else {
      memoryStore.user.status = status;
    }
    res.json({ message: 'Status updated successfully', status });
  } catch (err) {
    console.error('Error updating status:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

module.exports = router;
