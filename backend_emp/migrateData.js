const mysql = require('mysql2/promise');
const { createClient } = require('../frontend_emp/node_modules/@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = 'https://mbblahvstusfzlbyztrp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1iYmxhaHZzdHVzZnpsYnp6dHJwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDE0NzQwOCwiZXhwIjoyMTA1NzIzNDA4fQ.jAFcONpAoiHHtvxDlSusBXCfL_DZIbCo6e-oYMWeU8w';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('Connecting to MySQL...');
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const conn = await pool.getConnection();
    console.log('MySQL connected successfully.');

    // 1. Migrate Users
    console.log('Fetching users from MySQL...');
    const [users] = await conn.query('SELECT * FROM users');
    console.log(`Found ${users.length} users.`);

    for (const u of users) {
      const { data, error } = await supabase.from('users').upsert({
        id: u.id,
        name: u.name,
        department: u.department || 'IT',
        email: u.email,
        password: u.password,
        initials: u.initials,
        status: u.status || 'Working',
        role: u.role || 'Employee',
        created_at: u.created_at || new Date().toISOString()
      }, { onConflict: 'id' });
      if (error) console.error(`Error inserting user ${u.email}:`, error.message);
    }
    console.log('Users migration completed.');

    // 2. Migrate Leave Balances
    console.log('Fetching leave balances...');
    const [balances] = await conn.query('SELECT * FROM leave_balances');
    for (const b of balances) {
      const { error } = await supabase.from('leave_balances').upsert({
        id: b.id,
        user_id: b.user_id,
        total_days: b.total_days,
        used_days: b.used_days
      }, { onConflict: 'id' });
      if (error) console.error(`Error inserting leave balance for user ${b.user_id}:`, error.message);
    }
    console.log(`Migrated ${balances.length} leave balances.`);

    // 3. Migrate Daily Work Entries
    console.log('Fetching daily work entries...');
    const [entries] = await conn.query('SELECT * FROM daily_work_entries');
    for (const e of entries) {
      const { error } = await supabase.from('daily_work_entries').upsert({
        id: e.id,
        user_id: e.user_id,
        entry_date: e.entry_date ? new Date(e.entry_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        work_description: e.work_description,
        created_at: e.created_at || new Date().toISOString(),
        updated_at: e.updated_at || new Date().toISOString()
      }, { onConflict: 'id' });
      if (error) console.error(`Error inserting work entry ${e.id}:`, error.message);
    }
    console.log(`Migrated ${entries.length} work entries.`);

    // 4. Migrate Leave Requests
    console.log('Fetching leave requests...');
    const [requests] = await conn.query('SELECT * FROM leave_requests');
    for (const r of requests) {
      const { error } = await supabase.from('leave_requests').upsert({
        id: r.id,
        user_id: r.user_id,
        leave_type: r.leave_type,
        start_date: r.start_date ? new Date(r.start_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        end_date: r.end_date ? new Date(r.end_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        days_count: r.days_count,
        day_of_week: r.day_of_week,
        start_time: r.start_time,
        end_time: r.end_time,
        special_session: r.special_session,
        is_recurring: Boolean(r.is_recurring),
        status: r.status,
        reason: r.reason,
        created_at: r.created_at || new Date().toISOString()
      }, { onConflict: 'id' });
      if (error) console.error(`Error inserting leave request ${r.id}:`, error.message);
    }
    console.log(`Migrated ${requests.length} leave requests.`);

    conn.release();
    pool.end();
    console.log('🎉 ALL DATA MIGRATED TO SUPABASE SUCCESSFULLY!');
  } catch (err) {
    console.error('Migration failed:', err.message);
  }
}

runMigration();
