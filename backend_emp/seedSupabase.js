const { createClient } = require('../frontend_emp/node_modules/@supabase/supabase-js');

const supabaseUrl = 'https://mbblahvstusfzlbzztrp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1iYmxhaHZzdHVzZnpsYnp6dHJwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDE0NzQwOCwiZXhwIjoyMTA1NzIzNDA4fQ.jAFcONpAoiHHtvxDlSusBXCfL_DZIbCo6e-oYMWeU8w';

const supabase = createClient(supabaseUrl, supabaseKey);

const initialUsers = [
  {
    name: 'Hashan Admin',
    email: 'hashan@pwholdings.lk',
    department: 'Management',
    password: '123',
    initials: 'HA',
    status: 'Working',
    role: 'Admin'
  },
  {
    name: 'Nishani Admin',
    email: 'nishani@pwholdings.lk',
    department: 'HR',
    password: '123',
    initials: 'NA',
    status: 'Working',
    role: 'Admin'
  },
  {
    name: 'Channa Admin',
    email: 'channa@pwholdings.lk',
    department: 'Operations',
    password: '123',
    initials: 'CA',
    status: 'Working',
    role: 'Admin'
  },
  {
    name: 'Pasindu Buddhima',
    email: 'pasindu.buddhima@pwholdings.lk',
    department: 'IT',
    password: '123',
    initials: 'PB',
    status: 'Working',
    role: 'Admin'
  }
];

async function seed() {
  console.log('Seeding initial admin accounts into Supabase...');

  for (const u of initialUsers) {
    const { data: existing } = await supabase.from('users').select('id').ilike('email', u.email);
    if (existing && existing.length > 0) {
      console.log(`User ${u.email} already exists (ID: ${existing[0].id}).`);
      continue;
    }

    const { data, error } = await supabase.from('users').insert([u]).select();
    if (error) {
      console.error(`Error adding user ${u.email}:`, error.message);
    } else if (data && data.length > 0) {
      const newUser = data[0];
      console.log(`✅ Created user: ${newUser.email} (ID: ${newUser.id})`);

      await supabase.from('leave_balances').insert([{
        user_id: newUser.id,
        total_days: 24.00,
        used_days: 0.00
      }]);
      console.log(`✅ Initialized leave balance for user ID ${newUser.id}`);
    }
  }

  console.log('✨ Seeding complete!');
}

seed();
