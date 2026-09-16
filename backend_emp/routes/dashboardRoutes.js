const express = require('express');
const router = express.Router();
const pool = require('../db');
const { getIsDbConnected, memoryStore } = require('../initDb');

// Helper to format date strings YYYY-MM-DD
function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

// GET /api/dashboard/summary
router.get('/dashboard/summary', async (req, res) => {
  try {
    const todayStr = getTodayStr();

    if (getIsDbConnected()) {
      // Fetch from MySQL
      const [users] = await pool.query('SELECT * FROM users WHERE id = 1');
      const user = users[0] || memoryStore.user;

      const [entries] = await pool.query(
        'SELECT * FROM daily_work_entries WHERE user_id = 1 AND entry_date = ? ORDER BY created_at DESC LIMIT 1',
        [todayStr]
      );
      const todayEntry = entries[0] ? entries[0].work_description : '';

      const [balances] = await pool.query('SELECT * FROM leave_balances WHERE user_id = 1');
      const balance = balances[0] || { total_days: 24, used_days: 0 };
      const available_days = balance.total_days - balance.used_days;

      const [leaves] = await pool.query(
        'SELECT * FROM leave_requests WHERE user_id = 1 ORDER BY created_at DESC LIMIT 5'
      );

      return res.json({
        user: {
          id: user.id,
          name: user.name,
          title: user.title,
          email: user.email,
          initials: user.initials,
          status: user.status
        },
        todayWork: todayEntry,
        leaveBalance: {
          total_days: balance.total_days,
          used_days: balance.used_days,
          available_days: available_days
        },
        recentLeaveRequests: leaves.map(l => ({
          id: l.id,
          leave_type: l.leave_type,
          start_date: l.start_date ? new Date(l.start_date).toISOString().split('T')[0] : '',
          end_date: l.end_date ? new Date(l.end_date).toISOString().split('T')[0] : '',
          days_count: l.days_count,
          status: l.status,
          reason: l.reason
        }))
      });
    } else {
      // Return from memoryStore
      const todayEntryObj = memoryStore.workEntries.find(e => e.entry_date === todayStr);
      const available_days = memoryStore.leaveBalance.total_days - memoryStore.leaveBalance.used_days;

      return res.json({
        user: memoryStore.user,
        todayWork: todayEntryObj ? todayEntryObj.work_description : (memoryStore.workEntries[0]?.work_description || ''),
        leaveBalance: {
          ...memoryStore.leaveBalance,
          available_days
        },
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
  const { work_description } = req.body;
  if (typeof work_description !== 'string') {
    return res.status(400).json({ error: 'work_description is required' });
  }

  const todayStr = getTodayStr();

  try {
    if (getIsDbConnected()) {
      const [existing] = await pool.query(
        'SELECT id FROM daily_work_entries WHERE user_id = 1 AND entry_date = ?',
        [todayStr]
      );

      if (existing.length > 0) {
        await pool.query(
          'UPDATE daily_work_entries SET work_description = ? WHERE id = ?',
          [work_description, existing[0].id]
        );
      } else {
        await pool.query(
          'INSERT INTO daily_work_entries (user_id, entry_date, work_description) VALUES (1, ?, ?)',
          [todayStr, work_description]
        );
      }
    } else {
      const existing = memoryStore.workEntries.find(e => e.entry_date === todayStr);
      if (existing) {
        existing.work_description = work_description;
      } else {
        memoryStore.workEntries.unshift({
          id: Date.now(),
          user_id: 1,
          entry_date: todayStr,
          work_description,
          created_at: new Date().toISOString()
        });
      }
    }

    res.json({ message: 'Work entry updated successfully', work_description });
  } catch (err) {
    console.error('Error saving work entry:', err);
    res.status(500).json({ error: 'Failed to save work entry' });
  }
});

// GET /api/work-entry/history - Get all past work entries
router.get('/work-entry/history', async (req, res) => {
  try {
    if (getIsDbConnected()) {
      const [rows] = await pool.query(
        'SELECT * FROM daily_work_entries WHERE user_id = 1 ORDER BY entry_date DESC'
      );
      res.json(rows);
    } else {
      res.json(memoryStore.workEntries);
    }
  } catch (err) {
    console.error('Error fetching work history:', err);
    res.status(500).json({ error: 'Failed to fetch work history' });
  }
});

// POST /api/leave/apply - Apply for new leave
router.post('/leave/apply', async (req, res) => {
  const { leave_type, start_date, end_date, days_count, reason } = req.body;

  if (!leave_type || !start_date || !end_date) {
    return res.status(400).json({ error: 'leave_type, start_date, and end_date are required' });
  }

  const days = Number(days_count) || 1;

  try {
    if (getIsDbConnected()) {
      await pool.query(
        `INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, days_count, status, reason)
         VALUES (1, ?, ?, ?, ?, 'Pending', ?)`,
        [leave_type, start_date, end_date, days, reason || '']
      );
    } else {
      const newLeave = {
        id: Date.now(),
        user_id: 1,
        leave_type,
        start_date,
        end_date,
        days_count: days,
        status: 'Pending',
        reason: reason || '',
        created_at: new Date().toISOString()
      };
      memoryStore.leaveRequests.unshift(newLeave);

      // Also add to admin pending requests queue
      memoryStore.pendingLeaveRequests.unshift({
        id: newLeave.id,
        employee_name: memoryStore.user.name || 'Employee',
        leave_type,
        from_date: start_date,
        to_date: end_date,
        duration: `${days} ${days === 1 ? 'Day' : 'Days'}`,
        reason: reason || 'Personal',
        applied_date: new Date().toISOString().split('T')[0],
        status: 'Pending'
      });
    }

    res.json({ message: 'Leave request submitted successfully' });
  } catch (err) {
    console.error('Error submitting leave request:', err);
    res.status(500).json({ error: 'Failed to submit leave request' });
  }
});

// GET /api/leave/history - Fetch leave requests
router.get('/leave/history', async (req, res) => {
  try {
    if (getIsDbConnected()) {
      const [leaves] = await pool.query(
        'SELECT * FROM leave_requests WHERE user_id = 1 ORDER BY created_at DESC'
      );
      res.json(leaves);
    } else {
      res.json(memoryStore.leaveRequests);
    }
  } catch (err) {
    console.error('Error fetching leave history:', err);
    res.status(500).json({ error: 'Failed to fetch leave history' });
  }
});

// PATCH /api/user/status - Update working status
router.patch('/user/status', async (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'Status is required' });

  try {
    if (getIsDbConnected()) {
      await pool.query('UPDATE users SET status = ? WHERE id = 1', [status]);
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
