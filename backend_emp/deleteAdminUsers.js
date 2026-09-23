const { createClient } = require('../frontend_emp/node_modules/@supabase/supabase-js');

const supabaseUrl = 'https://mbblahvstusfzlbzztrp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1iYmxhaHZzdHVzZnpsYnp6dHJwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDE0NzQwOCwiZXhwIjoyMTA1NzIzNDA4fQ.jAFcONpAoiHHtvxDlSusBXCfL_DZIbCo6e-oYMWeU8w';

const supabase = createClient(supabaseUrl, supabaseKey);

const emailsToRemove = [
  'hashan@pwholdings.lk',
  'nishani@pwholdings.lk',
  'channa@pwholdings.lk',
  'pasindu.buddhima@pwholdings.lk'
];

async function removeUsers() {
  console.log('Finding and removing pre-seeded admin accounts from Supabase...');

  for (const email of emailsToRemove) {
    const { data: users, error: findErr } = await supabase
      .from('users')
      .select('id, name, email')
      .ilike('email', email);

    if (findErr) {
      console.error(`Error querying user ${email}:`, findErr.message);
      continue;
    }

    if (!users || users.length === 0) {
      console.log(`ℹ️ User with email ${email} not found in database.`);
      continue;
    }

    for (const u of users) {
      console.log(`Found user ${u.name} (${u.email}, ID: ${u.id}). Cleaning related records...`);

      // Delete child records
      await supabase.from('leave_requests').delete().eq('user_id', u.id);
      await supabase.from('work_entries').delete().eq('user_id', u.id);
      await supabase.from('leave_balances').delete().eq('user_id', u.id);

      // Delete user
      const { error: delErr } = await supabase.from('users').delete().eq('id', u.id);
      if (delErr) {
        console.error(`❌ Failed to delete user ${u.email}:`, delErr.message);
      } else {
        console.log(`✅ Successfully deleted user ${u.email} (ID: ${u.id})`);
      }
    }
  }

  console.log('✨ Cleanup finished!');
}

removeUsers();
