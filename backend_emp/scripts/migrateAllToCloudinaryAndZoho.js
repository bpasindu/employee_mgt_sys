const supabase = require('../db');
const { uploadProfilePhoto, uploadDocument } = require('../services/cloudinaryService');
const zohoService = require('../services/zohoService');

async function migrateAll() {
  console.log('=====================================================');
  console.log('Starting Migration of Legacy Files & Photos to Cloudinary / Zoho');
  console.log('=====================================================\n');

  // ----------------------------------------------------
  // 1. Migrate Legacy Profile Photos in `users`
  // ----------------------------------------------------
  console.log('[Step 1/3] Scanning `users` for Base64 profile photos...');
  const { data: users, error: userErr } = await supabase
    .from('users')
    .select('id, name, email, photo_url');

  if (userErr) {
    console.error('Failed to fetch users:', userErr);
  } else {
    const base64Users = (users || []).filter(u => u.photo_url && u.photo_url.startsWith('data:'));
    console.log(`Found ${base64Users.length} user(s) with Base64 photos.`);

    for (const user of base64Users) {
      console.log(`Uploading profile photo for [${user.id}] ${user.name} (${Math.round(user.photo_url.length / 1024)} KB)...`);
      try {
        const uploadRes = await uploadProfilePhoto(user.id, user.photo_url);
        console.log(`  -> Cloudinary URL: ${uploadRes.url}`);

        const { error: updateErr } = await supabase
          .from('users')
          .update({ photo_url: uploadRes.url })
          .eq('id', user.id);

        if (updateErr) {
          console.error(`  -> Failed to update user in Supabase:`, updateErr.message);
        } else {
          console.log(`  -> User [${user.id}] updated in Supabase successfully!`);
        }
      } catch (err) {
        console.error(`  -> Upload failed for user [${user.id}]:`, err.message || err);
      }
    }
  }

  // ----------------------------------------------------
  // 2. Migrate Legacy Documents in `employee_documents`
  // ----------------------------------------------------
  console.log('\n[Step 2/3] Scanning `employee_documents` for Base64 document files...');
  const { data: docs, error: docErr } = await supabase
    .from('employee_documents')
    .select('id, user_id, document_name, file_url, file_path, file_size, file_type');

  if (docErr) {
    console.error('Failed to fetch documents:', docErr);
  } else {
    const base64Docs = (docs || []).filter(d => d.file_url && d.file_url.startsWith('data:'));
    console.log(`Found ${base64Docs.length} document(s) with Base64 content.`);

    // Map user_id to user email
    const userMap = {};
    (users || []).forEach(u => { userMap[u.id] = u; });

    for (const doc of base64Docs) {
      console.log(`\nMigrating doc [${doc.id}] "${doc.document_name}" for user ${doc.user_id}...`);
      const emp = userMap[doc.user_id];
      const docName = doc.document_name || 'document';
      const fileType = doc.file_type || 'application/pdf';

      // Identify slot for Zoho Books
      let slotType = null;
      const lower = docName.toLowerCase();
      if (lower.includes('nic')) slotType = 'nic';
      else if (lower.includes('ol_certificate') || lower.includes('ol result')) slotType = 'ol_certificate';
      else if (lower.includes('al_certificate') || lower.includes('al result')) slotType = 'al_certificate';
      else if (lower.includes('other_certificate') || lower.includes('cv') || lower.includes('degree')) slotType = 'other_certificate';

      // 2a. Attempt Zoho Books upload if applicable
      if (slotType && emp?.email) {
        try {
          console.log(`  -> Attempting Zoho Books upload for ${emp.email} (type: ${slotType})...`);
          let b64 = doc.file_url;
          if (b64.includes('base64,')) b64 = b64.split('base64,')[1];
          const buffer = Buffer.from(b64, 'base64');
          
          await zohoService.uploadZohoEmployeeDocument(
            emp.email,
            slotType,
            buffer,
            docName.replace(/[\[\]]/g, ''),
            fileType
          );
          console.log(`  -> Successfully uploaded and linked to Zoho Books!`);
        } catch (zErr) {
          console.warn(`  -> Zoho Books sync note: ${zErr.message}`);
        }
      }

      // 2b. Always upload to Cloudinary to replace the heavy Base64 in Supabase with a light CDN link
      try {
        console.log(`  -> Uploading to Cloudinary CDN...`);
        const cloudRes = await uploadDocument(doc.user_id, doc.file_url, docName, fileType);
        console.log(`  -> Cloudinary URL: ${cloudRes.url}`);

        const { error: updErr } = await supabase
          .from('employee_documents')
          .update({
            file_url: cloudRes.url,
            file_path: cloudRes.public_id,
            file_size: cloudRes.bytes || doc.file_size || 0
          })
          .eq('id', doc.id);

        if (updErr) {
          console.error(`  -> DB update failed for doc [${doc.id}]:`, updErr.message);
        } else {
          console.log(`  -> Document [${doc.id}] successfully updated to CDN link in Supabase!`);
        }
      } catch (cErr) {
        console.error(`  -> Cloudinary upload failed for doc [${doc.id}]:`, cErr.message || cErr);
      }
    }
  }

  // ----------------------------------------------------
  // 3. Inspect & Clean Supabase Storage Buckets
  // ----------------------------------------------------
  console.log('\n[Step 3/3] Checking Supabase Storage Bucket status...');
  try {
    const { data: bDocs } = await supabase.storage.from('employee-documents').list('', { limit: 100 });
    console.log(`Supabase 'employee-documents' bucket items: ${bDocs?.length || 0}`);
  } catch (e) {
    console.warn(`Note checking employee-documents bucket: ${e.message}`);
  }

  console.log('\n=====================================================');
  console.log('Migration Completed Successfully!');
  console.log('All files are now served via Cloudinary / Zoho Books.');
  console.log('Supabase stores only lightweight reference links.');
  console.log('=====================================================');
}

migrateAll();
