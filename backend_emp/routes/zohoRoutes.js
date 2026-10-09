const express = require('express');
const router = express.Router();
const zohoService = require('../services/zohoService');
const { authenticateToken } = require('../middleware/authMiddleware');
const supabase = require('../db');
const { profileService } = require('../services/backendService');

router.use(authenticateToken);

// GET /api/zoho/clients - Fetch Zoho Books clients list
router.get('/zoho/clients', async (req, res) => {
  try {
    const result = await zohoService.getZohoClients();
    res.json(result);
  } catch (err) {
    console.error('Fetch Zoho clients error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to fetch Zoho clients' });
  }
});

// GET /api/admin/client-analytics - Fetch client analytics report for admin
router.get('/admin/client-analytics', async (req, res) => {
  try {
    const result = await zohoService.getClientAnalytics();
    res.json(result);
  } catch (err) {
    console.error('Fetch client analytics error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to fetch client analytics' });
  }
});

// GET /api/zoho/employee - Retrieve Zoho Books employee record by email or user_id
router.get('/zoho/employee', async (req, res) => {
  try {
    let email = req.query.email;
    const userId = req.query.user_id || req.user?.id;

    if (!email && userId) {
      const { data: user } = await supabase.from('users').select('email').eq('id', userId).single();
      email = user?.email;
    }

    if (!email && req.user?.email) {
      email = req.user.email;
    }

    if (!email) {
      return res.status(400).json({ error: 'Email or User ID is required' });
    }

    const zohoEmp = await zohoService.getZohoEmployeeByEmail(email);
    if (!zohoEmp) {
      return res.json({ success: false, message: `No employee found in Zoho Books with email "${email}"` });
    }

    return res.json({ success: true, employee: zohoEmp });
  } catch (err) {
    console.error('Get Zoho employee error:', err.message);
    return res.status(500).json({ error: err.message || 'Failed to fetch employee from Zoho Books' });
  }
});

// POST /api/zoho/employee/sync - Sync employee details from Zoho Books into local profile
router.post('/zoho/employee/sync', async (req, res) => {
  try {
    const targetUserId = req.body.user_id || req.user?.id;
    if (!targetUserId) {
      return res.status(400).json({ error: 'User ID is required for sync' });
    }

    const result = await zohoService.syncZohoEmployeeToLocalProfile(targetUserId);
    return res.json(result);
  } catch (err) {
    console.error('Sync Zoho employee error:', err.message);
    return res.status(500).json({ error: err.message || 'Failed to sync with Zoho Books' });
  }
});

// POST /api/zoho/employee/update - Update Zoho Books employee details
router.post('/zoho/employee/update', async (req, res) => {
  try {
    let email = req.body.email;
    const userId = req.body.user_id || req.user?.id;

    if (!email && userId) {
      const { data: user } = await supabase.from('users').select('email').eq('id', userId).single();
      email = user?.email;
    }

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const result = await zohoService.updateZohoEmployeeRecord(email, req.body);
    return res.json(result);
  } catch (err) {
    console.error('Update Zoho employee error:', err.message);
    return res.status(500).json({ error: err.message || 'Failed to update Zoho Books employee' });
  }
});

// POST /api/zoho/employee/document/upload - Upload official document directly to Zoho Books custom module & local system
router.post('/api/zoho/employee/document/upload', async (req, res) => {
  try {
    const { email: rawEmail, user_id, doc_type, document_name, document_data, file_type } = req.body;
    const targetUserId = user_id || req.user?.id;

    if (!doc_type) {
      return res.status(400).json({ error: 'doc_type is required (nic, ol_certificate, al_certificate, other_certificate)' });
    }
    if (!document_data || !document_name) {
      return res.status(400).json({ error: 'document_data and document_name are required' });
    }

    let email = rawEmail;
    if (!email && targetUserId) {
      const { data: u } = await supabase.from('users').select('email').eq('id', targetUserId).single();
      email = u?.email;
    }
    if (!email && req.user?.email) {
      email = req.user.email;
    }
    if (!email) {
      return res.status(400).json({ error: 'Employee email is required to sync document with Zoho Books' });
    }

    // Extract base64 buffer
    let base64String = document_data;
    if (document_data.includes('base64,')) {
      base64String = document_data.split('base64,')[1];
    }
    const buffer = Buffer.from(base64String, 'base64');

    // Server-side validation: max 10 MB limit as enforced by Zoho Books
    const maxSize = 10 * 1024 * 1024;
    if (buffer.length > maxSize) {
      return res.status(400).json({ error: 'Document file size exceeds the 10 MB Zoho Books limit' });
    }

    // 1. Upload to Zoho Books Custom Module cm_employee
    let zohoUploadResult = null;
    let zohoError = null;
    try {
      zohoUploadResult = await zohoService.uploadZohoEmployeeDocument(
        email,
        doc_type,
        buffer,
        document_name,
        file_type || 'application/pdf'
      );
    } catch (zErr) {
      console.error('Zoho Books document upload warning:', zErr.message);
      zohoError = zErr.message;
    }

    // 2. Also save to Supabase Storage & employee_documents table for local preview and redundancy
    const cleanName = document_name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const filePath = `${targetUserId || 'emp'}/${Date.now()}_${doc_type}_${cleanName}`;

    let localFileUrl = null;
    try {
      const { data: storageData, error: storageErr } = await supabase.storage
        .from('employee-documents')
        .upload(filePath, buffer, {
          contentType: file_type || 'application/pdf',
          upsert: true
        });

      if (!storageErr) {
        const { data: urlData } = supabase.storage
          .from('employee-documents')
          .getPublicUrl(filePath);
        localFileUrl = urlData?.publicUrl;
      }
    } catch (storEx) {
      console.warn('Local storage upload warning:', storEx.message);
    }

    if (!localFileUrl) {
      localFileUrl = document_data; // fallback base64
    }

    const docLabels = {
      nic: 'Copy of NIC',
      ol_certificate: 'Educational Certificates (O/L)',
      al_certificate: 'Educational Certificates (A/L)',
      other_certificate: 'Other Qualification Certificates'
    };

    const formattedDocName = `[${doc_type.toUpperCase()}] ${document_name}`;

    let localDocRecord = null;
    if (targetUserId) {
      try {
        localDocRecord = await profileService.addDocument(
          targetUserId,
          formattedDocName,
          localFileUrl,
          filePath,
          buffer.length,
          file_type || 'application/pdf'
        );
      } catch (addErr) {
        console.warn('Local document record error:', addErr.message);
      }
    }

    return res.json({
      success: true,
      message: zohoError 
        ? `Document saved locally, but Zoho Books sync failed: ${zohoError}`
        : 'Document successfully uploaded and saved to Zoho Books!',
      zoho_document: zohoUploadResult,
      local_document: localDocRecord,
      doc_type,
      label: docLabels[doc_type] || doc_type
    });
  } catch (err) {
    console.error('Zoho document upload error:', err);
    return res.status(500).json({ error: err.message || 'Failed to upload document' });
  }
});

// Also support route without /api prefix in case mounted directly at /api/zoho
router.post('/zoho/employee/document/upload', async (req, res) => {
  // Delegate to same handler logic
  return router.handle({ ...req, url: '/api/zoho/employee/document/upload' }, res);
});

// GET /api/zoho/document/:documentId - Download or stream document stored in Zoho Books
router.get('/zoho/document/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;
    const { buffer, contentType } = await zohoService.getZohoDocument(documentId);

    const filename = req.query.filename || `document_${documentId}.pdf`;
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    return res.send(buffer);
  } catch (err) {
    console.error('Download Zoho document error:', err.message);
    return res.status(500).json({ error: err.message || 'Failed to download document from Zoho Books' });
  }
});

// DELETE /api/zoho/employee/document/:docType - Remove document reference from Zoho Books
router.delete('/zoho/employee/document/:docType', async (req, res) => {
  try {
    const { docType } = req.params;
    let email = req.query.email || req.body?.email;
    const userId = req.query.user_id || req.body?.user_id || req.user?.id;

    if (!email && userId) {
      const { data: u } = await supabase.from('users').select('email').eq('id', userId).single();
      email = u?.email;
    }
    if (!email && req.user?.email) {
      email = req.user.email;
    }

    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    await zohoService.deleteZohoEmployeeDocument(email, docType);
    return res.json({ success: true, message: `Removed ${docType} from Zoho Books` });
  } catch (err) {
    console.error('Delete Zoho document error:', err.message);
    return res.status(500).json({ error: err.message || 'Failed to remove document from Zoho Books' });
  }
});

// POST /api/zoho/employee - Create employee record directly in Zoho Books Custom Module cm_employee
router.post('/zoho/employee', async (req, res) => {
  try {
    const { emp_code, name, dob, date_joined, designation, card_designation, email, phone, address } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and Email are required fields.' });
    }
    const result = await zohoService.createZohoEmployeeRecord({
      emp_code,
      name,
      dob,
      date_joined,
      designation,
      card_designation,
      email,
      phone,
      address
    });
    res.json(result);
  } catch (err) {
    console.error('Create Zoho employee route error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to submit employee entry to Zoho Books' });
  }
});

module.exports = router;
