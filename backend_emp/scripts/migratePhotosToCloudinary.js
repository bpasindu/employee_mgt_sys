const supabase = require('../db');
const { uploadProfilePhoto } = require('../services/cloudinaryService');

async function migrateRemaining() {
  console.log('--- Migrating Remaining Users to Cloudinary ---');

  const { data: users, error } = await supabase
    .from('users')
    .select('id, name, email, photo_url');

  if (error) {
    console.error('Failed to fetch users:', error);
    return;
  }

  const base64Users = (users || []).filter(u => u.photo_url && u.photo_url.startsWith('data:'));
  console.log(`Found ${base64Users.length} users remaining with Base64 photos.`);

  for (const user of base64Users) {
    console.log(`\nProcessing user [${user.id}] ${user.name} (${Math.round(user.photo_url.length / 1024)} KB)...`);
    try {
      const uploadRes = await uploadProfilePhoto(user.id, user.photo_url);
      console.log(`  Uploaded to Cloudinary: ${uploadRes.url} (${Math.round(uploadRes.bytes / 1024)} KB)`);

      const { error: updateErr } = await supabase
        .from('users')
        .update({ photo_url: uploadRes.url })
        .eq('id', user.id);

      if (updateErr) {
        console.error(`  DB update failed:`, updateErr);
      } else {
        console.log(`  DB updated successfully for user ${user.id}!`);
      }
    } catch (err) {
      console.error(`  Upload failed for user ${user.id}:`, err);
    }
  }

  console.log('\n--- Migration Finished! ---');
}

migrateRemaining();
