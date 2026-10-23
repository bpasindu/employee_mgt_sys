const cron = require('node-cron');
const supabase = require('../db');

const TIMEZONE = process.env.TIMEZONE || 'Asia/Colombo';

function getNowColombo() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(new Date());

  const map = {};
  parts.forEach(p => { map[p.type] = p.value; });
  return `${map.year}-${map.month}-${map.day}`;
}

async function autoResetExpiredEmergencyStatuses() {
  try {
    const todayStr = getNowColombo();
    // Find all users who currently have status in ('Power Cut', 'Weather Condition', 'On Leave')
    const { data: nonWorkingUsers, error: userErr } = await supabase
      .from('users')
      .select('id, name, status')
      .in('status', ['Power Cut', 'Weather Condition', 'On Leave']);

    if (userErr || !nonWorkingUsers || nonWorkingUsers.length === 0) return;

    const userIds = nonWorkingUsers.map(u => u.id);
    const { data: activeLeaves, error: leaveErr } = await supabase
      .from('leave_requests')
      .select('user_id, leave_type, start_date, end_date')
      .in('user_id', userIds)
      .eq('status', 'Approved')
      .lte('start_date', todayStr)
      .gte('end_date', todayStr);

    if (leaveErr) {
      console.warn('Auto-reset leave check warning:', leaveErr.message);
      return;
    }

    const activeUserIds = new Set((activeLeaves || []).map(l => l.user_id));
    const staleUserIds = nonWorkingUsers
      .filter(u => !activeUserIds.has(u.id))
      .map(u => u.id);

    if (staleUserIds.length > 0) {
      await supabase
        .from('users')
        .update({ status: 'Working' })
        .in('id', staleUserIds);
      console.log(`[Midnight Status Reset] Reset status to 'Working' for user IDs: ${staleUserIds.join(', ')} (active date: ${todayStr})`);
    }
  } catch (err) {
    console.error('Auto-reset expired emergency status error:', err);
  }
}

function initMidnightResetCron() {
  console.log(`⏰ Initializing Midnight Status Reset Cron (Daily at 00:00 / 12:00 AM ${TIMEZONE})...`);
  
  // Run once immediately on startup to clean up any past stale statuses
  autoResetExpiredEmergencyStatuses();

  try {
    // Schedule every day at 00:00 (12:00 AM) in Colombo timezone
    cron.schedule('0 0 * * *', async () => {
      console.log(`🔔 [Midnight Cron Trigger] Running 12:00 AM status reset for ${TIMEZONE}...`);
      await autoResetExpiredEmergencyStatuses();
    }, {
      timezone: TIMEZONE
    });
    console.log(`✅ Midnight Status Reset Cron active for timezone: ${TIMEZONE} at 00:00`);
  } catch (err) {
    console.warn('⚠️ node-cron schedule setup failed for midnight reset:', err.message);
  }
}

module.exports = {
  autoResetExpiredEmergencyStatuses,
  initMidnightResetCron
};
