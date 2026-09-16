const pool = require('./db');

// In-memory fallback store if MySQL connection is unavailable
const memoryStore = {
  // 2 Admins
  admins: [
    {
      id: 100,
      name: 'Nadeesha Silva',
      title: 'System Administrator',
      email: 'admin1@pwholdings.lk',
      password: '123',
      initials: 'NS',
      role: 'Admin'
    },
    {
      id: 101,
      name: 'System Admin 2',
      title: 'IT Administrator',
      email: 'admin2@pwholdings.lk',
      password: '123',
      initials: 'SA',
      role: 'Admin'
    }
  ],

  // Employee profile for Kasun
  user: {
    id: 1,
    name: 'Kasun Perera',
    title: 'Software Engineer',
    department: 'IT',
    email: 'kasun.p@company.com',
    password: '123',
    initials: 'KP',
    status: 'Working',
    role: 'Employee'
  },

  // 20 Employees database
  allEmployees: [
    { id: 1, name: 'Kasun Perera', email: 'kasun.p@company.com', password: '123', initials: 'KP', department: 'IT', position: 'Software Engineer', today_work: 'Working on the customer dashboard UI', status: 'Working', updated_ago: '10 min ago', role: 'Employee' },
    { id: 2, name: 'Nimal Fernando', email: 'nimal.f@company.com', password: '123', initials: 'NF', department: 'Finance', position: 'Accountant', today_work: 'Preparing the monthly financial report', status: 'Working', updated_ago: '25 min ago', role: 'Employee' },
    { id: 3, name: 'Piumi Wickramasinghe', email: 'piumi.w@company.com', password: '123', initials: 'PW', department: 'Operations', position: 'Process Executive', today_work: 'Auditing warehouse inventory records', status: 'Working', updated_ago: '28 min ago', role: 'Employee' },
    { id: 4, name: 'Akila Dissanayake', email: 'akila.d@company.com', password: '123', initials: 'AD', department: 'IT', position: 'DevOps Engineer', today_work: 'Monitoring deployment pipelines', status: 'Working', updated_ago: '6 min ago', role: 'Employee' },
    { id: 5, name: 'Sahan Gunawardena', email: 'sahan.g@company.com', password: '123', initials: 'SG', department: 'IT', position: 'Frontend Developer', today_work: 'Optimizing React component rendering', status: 'Working', updated_ago: '12 min ago', role: 'Employee' },
    { id: 6, name: 'Chamari Jayasinghe', email: 'chamari.j@company.com', password: '123', initials: 'CJ', department: 'HR', position: 'HR Executive', today_work: 'Conducting onboarding interviews', status: 'Working', updated_ago: '30 min ago', role: 'Employee' },
    { id: 7, name: 'Nuwan Pradeep', email: 'nuwan.p@company.com', password: '123', initials: 'NP', department: 'Operations', position: 'Logistics Lead', today_work: 'Coordinating daily shipment dispatches', status: 'Working', updated_ago: '15 min ago', role: 'Employee' },
    { id: 8, name: 'Mahela Fonseka', email: 'mahela.f@company.com', password: '123', initials: 'MF', department: 'Finance', position: 'Senior Analyst', today_work: 'Analyzing Q3 budget variance', status: 'Working', updated_ago: '40 min ago', role: 'Employee' },
    { id: 9, name: 'Sanduni De Silva', email: 'sanduni.s@company.com', password: '123', initials: 'SD', department: 'Marketing', position: 'Content Manager', today_work: 'Drafting press release for new feature launch', status: 'Working', updated_ago: '5 min ago', role: 'Employee' },
    { id: 10, name: 'Dhanushka Wickrama', email: 'dhanushka.w@company.com', password: '123', initials: 'DW', department: 'IT', position: 'QA Lead', today_work: 'Executing regression test suite', status: 'Working', updated_ago: '20 min ago', role: 'Employee' },
    { id: 11, name: 'Eranga Peiris', email: 'eranga.p@company.com', password: '123', initials: 'EP', department: 'Marketing', position: 'SEO Specialist', today_work: 'Keyword research and site auditing', status: 'Working', updated_ago: '18 min ago', role: 'Employee' },
    { id: 12, name: 'Kusal Mendis', email: 'kusal.m@company.com', password: '123', initials: 'KM', department: 'Finance', position: 'Payroll Officer', today_work: 'Processing monthly salary adjustments', status: 'Working', updated_ago: '35 min ago', role: 'Employee' },
    { id: 13, name: 'Bhanuka Rajapaksa', email: 'bhanuka.r@company.com', password: '123', initials: 'BR', department: 'Operations', position: 'Supply Chain Spec.', today_work: 'Reviewing vendor procurement contracts', status: 'Working', updated_ago: '22 min ago', role: 'Employee' },
    { id: 14, name: 'Wanindu Hasaranga', email: 'wanindu.h@company.com', password: '123', initials: 'WH', department: 'IT', position: 'Database Admin', today_work: 'Database index tuning and backup check', status: 'Working', updated_ago: '8 min ago', role: 'Employee' },

    // 3 On Leave Employees
    { id: 15, name: 'Kavindu Perera', email: 'kavindu.p@company.com', password: '123', initials: 'KP', department: 'Operations', position: 'Operations Executive', status: 'On Leave', leave_type: 'Annual Leave', duration: 'Full Day', reason: 'Personal', role: 'Employee' },
    { id: 16, name: 'Dilshan Fernando', email: 'dilshan.f@company.com', password: '123', initials: 'DF', department: 'Finance', position: 'Accounts Assistant', status: 'On Leave', leave_type: 'Casual Leave', duration: 'Full Day', reason: 'Personal matter', role: 'Employee' },
    { id: 17, name: 'Shehan Silva', email: 'shehan.s@company.com', password: '123', initials: 'SS', department: 'Marketing', position: 'Brand Executive', status: 'On Leave', leave_type: 'Medical Leave', duration: 'Full Day', reason: 'Medical appointment', role: 'Employee' },

    // 2 Half-Day Employees
    { id: 18, name: 'Amal Perera', email: 'amal.p@company.com', password: '123', initials: 'AP', department: 'Finance', position: 'Finance Exec.', status: 'Half Day', half_day_type: 'Morning Half Day', time_slot: '8:30 AM – 12:30 PM', reason: 'Personal appointment', role: 'Employee' },
    { id: 19, name: 'Tharushi Silva', email: 'tharushi.s@company.com', password: '123', initials: 'TS', department: 'HR', position: 'HR Assistant', status: 'Half Day', half_day_type: 'Afternoon Half Day', time_slot: '1:00 PM – 5:00 PM', reason: 'University work', role: 'Employee' },

    // 1 Study Leave Employee
    { id: 20, name: 'Ravindu Perera', email: 'ravindu.p@company.com', password: '123', initials: 'RP', department: 'IT Department', position: 'Associate Developer', status: 'Study Leave', time_slot: '9:00 AM – 4:00 PM', reason: 'University examination', role: 'Employee' }
  ],

  // Pending Leave Requests for Admin review
  pendingLeaveRequests: [
    { id: 101, employee_name: 'Kasun Perera', leave_type: 'Annual Leave', from_date: '2026-09-18', to_date: '2026-09-19', duration: '2 Days', reason: 'Family function', applied_date: '2026-09-12', status: 'Pending' },
    { id: 102, employee_name: 'Sachini Wijesinghe', leave_type: 'Casual Leave', from_date: '2026-09-21', to_date: '2026-09-21', duration: '1 Day', reason: 'Personal appointment', applied_date: '2026-09-11', status: 'Pending' },
    { id: 103, employee_name: 'Minoli Ranasinghe', leave_type: 'Medical Leave', from_date: '2026-09-16', to_date: '2026-09-16', duration: '1 Day', reason: 'Medical consultation', applied_date: '2026-09-10', status: 'Pending' },
    { id: 104, employee_name: 'Dinuka Senanayake', leave_type: 'Annual Leave', from_date: '2026-09-25', to_date: '2026-09-27', duration: '3 Days', reason: 'Family travel', applied_date: '2026-09-09', status: 'Pending' }
  ],

  workEntries: [
    {
      id: 1,
      user_id: 1,
      entry_date: new Date().toISOString().split('T')[0],
      work_description: 'Working on the customer dashboard UI',
      created_at: new Date().toISOString()
    }
  ],
  leaveBalance: {
    user_id: 1,
    total_days: 24,
    used_days: 10,
    available_days: 14
  },
  leaveRequests: [
    {
      id: 1,
      user_id: 1,
      leave_type: 'Annual Leave',
      start_date: '2026-09-18',
      end_date: '2026-09-19',
      days_count: 2,
      status: 'Approved',
      reason: 'Family event',
      created_at: '2026-09-10'
    }
  ]
};

let isDbConnected = false;

async function initDatabase() {
  try {
    const connection = await pool.getConnection();
    isDbConnected = true;
    console.log('Connected to MySQL Database successfully.');

    // Create users table with password & role
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        title VARCHAR(100) NOT NULL,
        department VARCHAR(100) DEFAULT 'IT',
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL DEFAULT '123',
        initials VARCHAR(10) NOT NULL,
        status VARCHAR(50) DEFAULT 'Working',
        role VARCHAR(50) DEFAULT 'Employee',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed Admin 1
    const [admin1] = await connection.query('SELECT * FROM users WHERE email = ?', ['admin1@pwholdings.lk']);
    if (admin1.length === 0) {
      await connection.query(`
        INSERT INTO users (name, title, department, email, password, initials, status, role)
        VALUES ('Nadeesha Silva', 'System Administrator', 'IT', 'admin1@pwholdings.lk', '123', 'NS', 'Working', 'Admin')
      `);
      console.log('Seeded Admin 1: admin1@pwholdings.lk');
    }

    // Seed Admin 2
    const [admin2] = await connection.query('SELECT * FROM users WHERE email = ?', ['admin2@pwholdings.lk']);
    if (admin2.length === 0) {
      await connection.query(`
        INSERT INTO users (name, title, department, email, password, initials, status, role)
        VALUES ('System Admin 2', 'IT Administrator', 'IT', 'admin2@pwholdings.lk', '123', 'SA', 'Working', 'Admin')
      `);
      console.log('Seeded Admin 2: admin2@pwholdings.lk');
    }

    // Seed Kasun Perera
    const [emp1] = await connection.query('SELECT * FROM users WHERE email = ?', ['kasun.p@company.com']);
    if (emp1.length === 0) {
      await connection.query(`
        INSERT INTO users (name, title, department, email, password, initials, status, role)
        VALUES ('Kasun Perera', 'Software Engineer', 'IT', 'kasun.p@company.com', '123', 'KP', 'Working', 'Employee')
      `);
      console.log('Seeded Employee: kasun.p@company.com');
    }

    connection.release();
  } catch (err) {
    isDbConnected = false;
    console.warn('MySQL Connection Warning:', err.message);
    console.log('Using in-memory fallback store for API endpoints.');
  }
}

module.exports = {
  initDatabase,
  getIsDbConnected: () => isDbConnected,
  memoryStore
};
