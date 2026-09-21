const express = require('express');
const router = express.Router();
const pool = require('../db');
const { getIsDbConnected } = require('../initDb');

// Helper to format date strings YYYY-MM-DD
function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

// Helper: format an employee row for admin views (no position field)
function formatEmp(emp) {
  return {
    id: emp.id,
    name: emp.name,
    initials: emp.initials || emp.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
    department: emp.department || 'General',
    status: emp.status || 'Working',
    today_work: emp.today_work || '',
    updated_ago: 'Today'
  };
}

// GET /api/admin/summary
router.get('/summary', async (req, res) => {
  try {
    const todayStr = getTodayStr();

    if (!getIsDbConnected()) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    // Sync employee statuses automatically based on today's active approved leaves
    await pool.query(`
      UPDATE users u
      SET status = 'On Leave'
      WHERE u.id IN (
        SELECT DISTINCT user_id FROM leave_requests 
        WHERE status = 'Approved' AND ? BETWEEN start_date AND end_date
      )
    `, [todayStr]);

    await pool.query(`
      UPDATE users u
      SET status = 'Working'
      WHERE u.status = 'On Leave' AND u.id NOT IN (
        SELECT DISTINCT user_id FROM leave_requests 
        WHERE status = 'Approved' AND ? BETWEEN start_date AND end_date
      )
    `, [todayStr, todayStr]);

    // Fetch all users (employees + admins) with today's work description and active approved leave info via LEFT JOIN
    const [rows] = await pool.query(`
      SELECT u.id, u.name, u.initials, u.department, u.status,
             COALESCE(dw.work_description, '') AS today_work,
             lr.leave_type, lr.days_count, lr.reason, lr.start_date, lr.end_date
      FROM users u
      LEFT JOIN daily_work_entries dw
        ON dw.user_id = u.id AND dw.entry_date = ?
      LEFT JOIN leave_requests lr
        ON lr.user_id = u.id AND lr.status = 'Approved' AND ? BETWEEN lr.start_date AND lr.end_date
      ORDER BY u.name ASC
    `, [todayStr, todayStr]);

    // Fetch pending leave requests with employee names
    const [pending] = await pool.query(`
      SELECT lr.id, u.name AS employee_name, lr.leave_type,
             lr.start_date AS from_date, lr.end_date AS to_date,
             lr.days_count, lr.reason, lr.status,
             DATE(lr.created_at) AS applied_date
      FROM leave_requests lr
      JOIN users u ON u.id = lr.user_id
      WHERE lr.status = 'Pending'
      ORDER BY lr.created_at DESC
    `);

    const pendingReqs = pending.map(r => ({
      ...r,
      from_date: r.from_date ? new Date(r.from_date).toISOString().split('T')[0] : '',
      to_date: r.to_date ? new Date(r.to_date).toISOString().split('T')[0] : '',
      applied_date: r.applied_date ? new Date(r.applied_date).toISOString().split('T')[0] : '',
      duration: `${r.days_count} ${r.days_count === 1 ? 'Day' : 'Days'}`
    }));

    // Format employee with leave info
    const formatEmpWithLeave = (e) => ({
      ...formatEmp(e),
      leave_type: e.leave_type || 'Leave',
      from_date: e.start_date ? new Date(e.start_date).toISOString().split('T')[0] : '',
      to_date: e.end_date ? new Date(e.end_date).toISOString().split('T')[0] : '',
      duration: e.days_count ? `${e.days_count} ${e.days_count === 1 ? 'Day' : 'Days'}` : 'Full Day',
      reason: e.reason || 'Personal'
    });

    // Stats
    const total_employees  = rows.length;
    const working_today    = rows.filter(e => e.status === 'Working').length;
    const on_leave_today   = rows.filter(e => e.status === 'On Leave').length;
    const half_day         = rows.filter(e => e.leave_type === 'Half Day' || e.status === 'Half Day').length;
    const study_leave      = rows.filter(e => e.leave_type === 'Study Leave' || e.status === 'Study Leave').length;
    const pending_requests = pendingReqs.length;

    // Partition into status groups
    const workingWorkforce    = rows.filter(e => e.status === 'Working').map(formatEmp);
    const todaysLeave         = rows.filter(e => e.status === 'On Leave').map(formatEmpWithLeave);
    const halfDayEmployees    = rows.filter(e => e.leave_type === 'Half Day' || e.status === 'Half Day').map(formatEmpWithLeave);
    const studyLeaveEmployees = rows.filter(e => e.leave_type === 'Study Leave' || e.status === 'Study Leave').map(formatEmpWithLeave);

    res.json({
      stats: { total_employees, working_today, on_leave_today, half_day, study_leave, pending_requests },
      workingWorkforce,
      todaysLeave,
      halfDayEmployees,
      studyLeaveEmployees,
      pendingLeaveRequests: pendingReqs
    });
  } catch (err) {
    console.error('Error fetching admin summary:', err);
    res.status(500).json({ error: 'Failed to fetch admin summary' });
  }
});

// GET /api/admin/employees?department=All
router.get('/employees', async (req, res) => {
  try {
    if (!getIsDbConnected()) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const { department } = req.query;
    let query = `
      SELECT u.id, u.name, u.department, u.email, u.initials, u.status, u.role,
             COALESCE(dw.work_description, '') AS today_work
      FROM users u
      LEFT JOIN daily_work_entries dw
        ON dw.user_id = u.id AND dw.entry_date = ?
      WHERE 1=1
    `;
    const params = [getTodayStr()];

    if (department && department !== 'All departments') {
      query += ' AND LOWER(u.department) = ?';
      params.push(department.toLowerCase());
    }

    query += ' ORDER BY u.name ASC';

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching employees list:', err);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// GET /api/admin/work-activity
router.get('/work-activity', async (req, res) => {
  try {
    if (!getIsDbConnected()) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const [rows] = await pool.query(`
      SELECT dw.id, dw.user_id, u.name AS employee_name, u.department, u.initials,
             dw.entry_date, dw.work_description, dw.updated_at
      FROM daily_work_entries dw
      JOIN users u ON u.id = dw.user_id
      ORDER BY dw.entry_date DESC, dw.updated_at DESC
    `);

    const formatted = rows.map(r => ({
      ...r,
      entry_date: r.entry_date ? new Date(r.entry_date).toISOString().split('T')[0] : ''
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Error fetching work activity:', err);
    res.status(500).json({ error: 'Failed to fetch work activity' });
  }
});

// POST /api/admin/leave/approve
router.post('/leave/approve', async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Request ID is required' });

  try {
    if (!getIsDbConnected()) return res.status(503).json({ error: 'Database not connected' });

    const [rows] = await pool.query('SELECT * FROM leave_requests WHERE id = ?', [id]);
    if (rows.length > 0) {
      const lReq = rows[0];

      // Mark leave as approved
      await pool.query('UPDATE leave_requests SET status = "Approved" WHERE id = ?', [id]);

      // Set employee status to On Leave
      await pool.query('UPDATE users SET status = "On Leave" WHERE id = ?', [lReq.user_id]);

      // Upsert leave balance (deduct days)
      await pool.query(`
        INSERT INTO leave_balances (user_id, total_days, used_days)
        VALUES (?, 24, ?)
        ON DUPLICATE KEY UPDATE used_days = used_days + ?
      `, [lReq.user_id, lReq.days_count, lReq.days_count]);
    }

    res.json({ message: 'Leave request approved successfully', id });
  } catch (err) {
    console.error('Error approving leave request:', err);
    res.status(500).json({ error: 'Failed to approve leave request' });
  }
});

// POST /api/admin/leave/reject
router.post('/leave/reject', async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Request ID is required' });

  try {
    if (!getIsDbConnected()) return res.status(503).json({ error: 'Database not connected' });

    const [rows] = await pool.query('SELECT * FROM leave_requests WHERE id = ?', [id]);
    if (rows.length > 0) {
      const lReq = rows[0];

      // Mark leave as rejected
      await pool.query('UPDATE leave_requests SET status = "Rejected" WHERE id = ?', [id]);

      // Revert employee status back to Working
      await pool.query('UPDATE users SET status = "Working" WHERE id = ? AND status = "On Leave"', [lReq.user_id]);
    }

    res.json({ message: 'Leave request rejected', id });
  } catch (err) {
    console.error('Error rejecting leave request:', err);
    res.status(500).json({ error: 'Failed to reject leave request' });
  }
});

module.exports = router;
