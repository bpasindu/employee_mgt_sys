const express = require('express');
const router = express.Router();
const pool = require('../db');
const { getIsDbConnected, memoryStore } = require('../initDb');

// GET /api/admin/summary
router.get('/summary', async (req, res) => {
  try {
    const allEmps = memoryStore.allEmployees;
    const pendingReqs = memoryStore.pendingLeaveRequests.filter(r => r.status === 'Pending');

    // Stats calculations
    const total_employees = allEmps.length;
    const working_today = allEmps.filter(e => e.status === 'Working').length;
    const on_leave_today = allEmps.filter(e => e.status === 'On Leave').length;
    const half_day = allEmps.filter(e => e.status === 'Half Day').length;
    const study_leave = allEmps.filter(e => e.status === 'Study Leave').length;
    const pending_requests = pendingReqs.length;

    // Filter lists for admin cards
    const workingWorkforce = allEmps.filter(e => e.status === 'Working');
    const todaysLeave = allEmps.filter(e => e.status === 'On Leave');
    const halfDayEmployees = allEmps.filter(e => e.status === 'Half Day');
    const studyLeaveEmployees = allEmps.filter(e => e.status === 'Study Leave');

    res.json({
      adminUser: memoryStore.adminUser,
      stats: {
        total_employees,
        working_today,
        on_leave_today,
        half_day,
        study_leave,
        pending_requests
      },
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

// POST /api/admin/leave/approve - Approve leave request
router.post('/leave/approve', async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Request ID is required' });

  try {
    const reqItem = memoryStore.pendingLeaveRequests.find(r => r.id === Number(id));
    if (reqItem) {
      reqItem.status = 'Approved';
    }

    res.json({ message: 'Leave request approved successfully', id });
  } catch (err) {
    console.error('Error approving leave request:', err);
    res.status(500).json({ error: 'Failed to approve leave request' });
  }
});

// POST /api/admin/leave/reject - Reject leave request
router.post('/leave/reject', async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Request ID is required' });

  try {
    const reqItem = memoryStore.pendingLeaveRequests.find(r => r.id === Number(id));
    if (reqItem) {
      reqItem.status = 'Rejected';
    }

    res.json({ message: 'Leave request rejected', id });
  } catch (err) {
    console.error('Error rejecting leave request:', err);
    res.status(500).json({ error: 'Failed to reject leave request' });
  }
});

// GET /api/admin/employees - Fetch all 20 employees
router.get('/employees', async (req, res) => {
  try {
    const { department } = req.query;
    let list = memoryStore.allEmployees;
    if (department && department !== 'All departments') {
      list = list.filter(e => e.department.toLowerCase() === department.toLowerCase());
    }
    res.json(list);
  } catch (err) {
    console.error('Error fetching employees list:', err);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

module.exports = router;
