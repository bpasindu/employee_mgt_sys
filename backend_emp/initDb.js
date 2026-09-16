const pool = require('./db');

// In-memory fallback store if MySQL connection is unavailable
const memoryStore = {
  // System Admins
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

  // Employee profile placeholder (populated upon sign in / registration)
  user: {
    id: 1,
    name: '',
    title: '',
    department: 'IT',
    email: '',
    password: '',
    initials: '',
    status: 'Working',
    role: 'Employee'
  },

  // Registered Employees database
  allEmployees: [],

  // Pending Leave Requests for Admin review
  pendingLeaveRequests: [],

  // Daily work log entries
  workEntries: [],

  // Clean initial leave balance
  leaveBalance: {
    user_id: 1,
    total_days: 24,
    used_days: 0,
    available_days: 24
  },

  // Leave requests list
  leaveRequests: []
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

    // Create daily_work_entries table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS daily_work_entries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        entry_date DATE NOT NULL,
        work_description TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create leave_balances table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS leave_balances (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        total_days INT NOT NULL DEFAULT 24,
        used_days INT NOT NULL DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create leave_requests table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS leave_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        leave_type VARCHAR(50) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        days_count INT NOT NULL,
        status VARCHAR(50) DEFAULT 'Pending',
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Seed Admin 1
    const [admin1] = await connection.query('SELECT * FROM users WHERE email = ?', ['admin1@pwholdings.lk']);
    if (admin1.length === 0) {
      await connection.query(`
        INSERT INTO users (name, title, department, email, password, initials, status, role)
        VALUES ('Nadeesha Silva', 'System Administrator', 'IT', 'admin1@pwholdings.lk', '123', 'NS', 'Working', 'Admin')
      `);
      console.log('Seeded System Admin 1: admin1@pwholdings.lk');
    }

    // Seed Admin 2
    const [admin2] = await connection.query('SELECT * FROM users WHERE email = ?', ['admin2@pwholdings.lk']);
    if (admin2.length === 0) {
      await connection.query(`
        INSERT INTO users (name, title, department, email, password, initials, status, role)
        VALUES ('System Admin 2', 'IT Administrator', 'IT', 'admin2@pwholdings.lk', '123', 'SA', 'Working', 'Admin')
      `);
      console.log('Seeded System Admin 2: admin2@pwholdings.lk');
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
