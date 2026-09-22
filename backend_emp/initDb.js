const pool = require('./db');

// Minimal fallback store — no mock data
const memoryStore = {
  user: { id: null, name: '', title: '', department: 'IT', email: '', initials: '', status: 'Working', role: 'Employee' },
  workEntries: [],
  leaveBalance: { user_id: null, total_days: 24, used_days: 0, available_days: 24 },
  leaveRequests: [],
  allEmployees: [],
  pendingLeaveRequests: []
};

let isDbConnected = false;

async function initDatabase() {
  try {
    const connection = await pool.getConnection();
    isDbConnected = true;
    console.log('Connected to MySQL Database successfully.');

    // Create users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
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
        days_count DECIMAL(4,2) NOT NULL DEFAULT 1.0,
        day_of_week VARCHAR(20) DEFAULT NULL,
        start_time TIME DEFAULT NULL,
        end_time TIME DEFAULT NULL,
        is_recurring TINYINT(1) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'Pending',
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Ensure columns exist on existing tables
    const alterQueries = [
      "ALTER TABLE leave_requests ADD COLUMN day_of_week VARCHAR(20) DEFAULT NULL",
      "ALTER TABLE leave_requests ADD COLUMN start_time TIME DEFAULT NULL",
      "ALTER TABLE leave_requests ADD COLUMN end_time TIME DEFAULT NULL",
      "ALTER TABLE leave_requests ADD COLUMN is_recurring TINYINT(1) DEFAULT 0"
    ];
    for (const q of alterQueries) {
      try { await connection.query(q); } catch (e) { /* Column may already exist */ }
    }

    connection.release();
    console.log('All tables verified/created successfully.');
  } catch (err) {
    isDbConnected = false;
    console.warn('MySQL Connection Warning:', err.message);
    console.log('Using in-memory fallback store for API endpoints.');
  }
}

if (require.main === module) {
  initDatabase().then(() => process.exit(0));
}

module.exports = {
  initDatabase,
  getIsDbConnected: () => isDbConnected,
  memoryStore
};

