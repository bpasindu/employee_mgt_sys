import React, { useState, useEffect } from 'react';
import { 
  FileText, Upload, Download, Trash2, AlertCircle, CheckCircle2, 
  File, HardDrive, ExternalLink, Eye, X, Shield, GraduationCap, 
  Award, RefreshCw, Loader2, Check, ArrowUpRight
} from 'lucide-react';
import API from '../../api';

// Defined Zoho Books Custom Module document slots
const ZOHO_DOCUMENT_SLOTS = [
  {
    id: 'nic',
    field: 'cf_attachment',
    title: 'Copy of NIC',
    subtitle: 'National Identity Card copy (Front & Back)',
    icon: Shield,
    accentColor: 'indigo',
    helpText: 'Official identity document required for company records.'
  },
  {
    id: 'ol_certificate',
    field: 'cf_attachment_2',
    title: 'Educational Certificates (O/L)',
    subtitle: 'G.C.E. Ordinary Level results sheet / certificate',
    icon: GraduationCap,
    accentColor: 'blue',
    helpText: 'Secondary educational qualification certificate.'
  },
  {
    id: 'al_certificate',
    field: 'cf_attachment_3',
    title: 'Educational Certificates (A/L)',
    subtitle: 'G.C.E. Advanced Level results sheet / certificate',
    icon: Award,
    accentColor: 'sky',
    helpText: 'Higher secondary educational qualification certificate.'
  },
  {
    id: 'other_certificate',
    field: 'cf_attachment_4',
    title: 'Other Qualification Certificates',
    subtitle: 'Degrees, Diplomas, HND, Professional Certifications',
    icon: FileText,
    accentColor: 'emerald',
    helpText: 'Higher education, vocational, or technical credentials.'
  }
];

export default function DocumentsTab({ userId, profile, isSelfOrAdmin = true }) {
  const [documents, setDocuments] = useState([]);
  const [zohoEmployee, setZohoEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [zohoLoading, setZohoLoading] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState(null); // slot id currently uploading
  const [generalUploading, setGeneralUploading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [previewDoc, setPreviewDoc] = useState(null);

  const userEmail = profile?.email || '';

  useEffect(() => {
    fetchDocuments();
    fetchZohoEmployee();
  }, [userId, profile?.email]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const url = userId ? `/profile/documents?user_id=${userId}` : '/profile/documents';
      const res = await API.get(url);
      if (Array.isArray(res.data)) {
        setDocuments(res.data);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchZohoEmployee = async () => {
    if (!userEmail && !userId) return;
    setZohoLoading(true);
    try {
      const url = userEmail 
        ? `/api/zoho/employee?email=${encodeURIComponent(userEmail)}`
        : `/api/zoho/employee?user_id=${userId}`;
      const res = await API.get(url);
      if (res.data?.success && res.data?.employee) {
        setZohoEmployee(res.data.employee);
      }
    } catch (err) {
      console.warn('Zoho employee fetch warning:', err.message);
    } finally {
      setZohoLoading(false);
    }
  };

  // Helper to find document mapped to a specific slot
  const getSlotDocument = (slotId) => {
    // 1. Check if Zoho Books custom module record has this document
    const zohoDoc = zohoEmployee?.documents?.[slotId];
    if (zohoDoc && zohoDoc.document_id) {
      return {
        isZoho: true,
        document_id: zohoDoc.document_id,
        document_name: zohoDoc.file_name,
        file_url: `/api/zoho/document/${zohoDoc.document_id}?filename=${encodeURIComponent(zohoDoc.file_name)}`,
        doc_type: slotId,
        source: 'Zoho Books'
      };
    }

    // 2. Check in local documents list by prefix [SLOT_ID]
    const tag = `[${slotId.toUpperCase()}]`;
    const localMatch = documents.find(d => 
      d.document_name?.toUpperCase().startsWith(tag) ||
      d.document_name?.toLowerCase().includes(slotId.replace('_', ' '))
    );

    if (localMatch) {
      return {
        ...localMatch,
        isZoho: false,
        source: 'PWH Local'
      };
    }

    return null;
  };

  // Upload handler for dedicated Zoho Books document slot
  const handleSlotUpload = async (slotId, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccessMsg('');

    // Allowed file types: PDF, JPG, PNG, WEBP
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file format. Please upload PDF, JPG, or PNG.');
      return;
    }

    // Max 10 MB per Zoho Books limit
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File size exceeds the 10 MB limit required by Zoho Books.');
      return;
    }

    setUploadingSlot(slotId);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        try {
          const base64Data = reader.result;
          const res = await API.post('/api/zoho/employee/document/upload', {
            email: userEmail,
            user_id: userId,
            doc_type: slotId,
            document_name: file.name,
            document_data: base64Data,
            file_type: file.type
          });

          setSuccessMsg(`${file.name} successfully uploaded and synced with Zoho Books!`);
          setTimeout(() => setSuccessMsg(''), 5000);

          // Refresh both local documents and Zoho status
          await Promise.all([fetchDocuments(), fetchZohoEmployee()]);
        } catch (uploadErr) {
          console.error('Slot upload error:', uploadErr);
          const msg = uploadErr.response?.data?.error || uploadErr.message || 'Failed to upload document';
          setError(msg);
        } finally {
          setUploadingSlot(null);
        }
      };
    } catch (readErr) {
      console.error('File read error:', readErr);
      setError('Failed to process the selected file.');
      setUploadingSlot(null);
    } finally {
      e.target.value = '';
    }
  };

  // Upload handler for general / additional documents
  const handleGeneralUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccessMsg('');

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file format. Allowed: PDF, JPG, PNG, WEBP.');
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File size exceeds the 10 MB limit.');
      return;
    }

    setGeneralUploading(true);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        try {
          const base64Data = reader.result;
          await API.post('/profile/documents/upload', {
            document_data: base64Data,
            document_name: file.name,
            file_type: file.type,
            user_id: userId
          });

          setSuccessMsg('General document uploaded successfully!');
          setTimeout(() => setSuccessMsg(''), 4000);
          fetchDocuments();
        } catch (err) {
          console.error('General upload error:', err);
          setError(err.response?.data?.error || err.message || 'Failed to upload document');
        } finally {
          setGeneralUploading(false);
        }
      };
    } catch (err) {
      console.error('File read error:', err);
      setError('Failed to read selected file.');
      setGeneralUploading(false);
    } finally {
      e.target.value = '';
    }
  };

  const handleDeleteSlotDocument = async (slotId, existingDoc) => {
    if (!confirm('Are you sure you want to remove this document?')) return;
    try {
      // 1. Delete from Zoho Books if mapped
      try {
        await API.delete(`/api/zoho/employee/document/${slotId}?email=${encodeURIComponent(userEmail)}&user_id=${userId}`);
      } catch (e) {
        console.warn('Zoho delete warning:', e.message);
      }

      // 2. Delete local document record if it exists
      if (existingDoc && existingDoc.id && !existingDoc.isZoho) {
        await API.delete(`/profile/documents/${existingDoc.id}`);
      }

      setSuccessMsg('Document removed successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
      await Promise.all([fetchDocuments(), fetchZohoEmployee()]);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to remove document');
    }
  };

  const handleDeleteGeneralDocument = async (docId) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await API.delete(`/profile/documents/${docId}`);
      setSuccessMsg('Document deleted');
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchDocuments();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to delete document');
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Filter general documents (those that are not one of the 4 slots)
  const generalDocs = documents.filter(d => {
    const name = (d.document_name || '').toUpperCase();
    return !name.startsWith('[NIC]') && 
           !name.startsWith('[OL_CERTIFICATE]') && 
           !name.startsWith('[AL_CERTIFICATE]') && 
           !name.startsWith('[OTHER_CERTIFICATE]');
  });

  return (
    <div className="space-y-6">
      {/* Alert Messages */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold flex items-center gap-2.5 shadow-2xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-700 p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2.5 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span className="flex-1">{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-400 hover:text-emerald-700 p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* SECTION 1: ZOHO BOOKS OFFICIAL EMPLOYEE DOCUMENTS */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/80">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#022851]" />
                <span>Zoho Books Official Employee Documents</span>
              </h3>
              <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-extrabold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                Live Zoho Sync
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Official verification documents directly synchronized with the Zoho Books Employee Custom Module (Max 10 MB per file, PDF or Images).
            </p>
          </div>

          <button
            onClick={() => { fetchDocuments(); fetchZohoEmployee(); }}
            disabled={zohoLoading || loading}
            className="text-xs font-bold text-slate-600 hover:text-[#022851] bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
            title="Refresh Zoho Books status"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${zohoLoading ? 'animate-spin text-blue-600' : ''}`} />
            <span>Refresh Sync</span>
          </button>
        </div>

        {/* 4 Dedicated Zoho Books Upload Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ZOHO_DOCUMENT_SLOTS.map((slot) => {
            const Icon = slot.icon;
            const slotDoc = getSlotDocument(slot.id);
            const isUploading = uploadingSlot === slot.id;

            return (
              <div
                key={slot.id}
                className={`rounded-2xl border transition-all p-5 flex flex-col justify-between ${
                  slotDoc 
                    ? 'bg-slate-50/70 border-emerald-200/90 shadow-2xs' 
                    : 'bg-white border-slate-200/90 hover:border-blue-200'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 border ${
                        slotDoc 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-blue-50 text-blue-700 border-blue-100'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 leading-tight">
                          {slot.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          Zoho Field: {slot.field}
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    {slotDoc ? (
                      <span className="bg-emerald-100/90 text-emerald-800 border border-emerald-300 text-[10px] font-extrabold px-2 py-0.5 rounded-md inline-flex items-center gap-1 shrink-0">
                        <Check className="w-3 h-3 text-emerald-700" />
                        <span>Zoho Synced</span>
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0">
                        Pending Upload
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                    {slot.subtitle}
                  </p>
                </div>

                {/* Card Body: Uploaded State OR Upload Dropzone */}
                {slotDoc ? (
                  <div className="mt-3 pt-3 border-t border-slate-200/70">
                    <div className="flex items-center justify-between gap-2 bg-white p-3 rounded-xl border border-slate-200/80 mb-3">
                      <div className="flex items-center gap-2.5 min-w-0 pr-1">
                        <File className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span 
                          className="text-xs font-bold text-slate-800 truncate block cursor-pointer hover:text-blue-600"
                          title={slotDoc.document_name}
                          onClick={() => setPreviewDoc(slotDoc)}
                        >
                          {slotDoc.document_name.replace(/^\[[A-Z_]+\]\s*/, '')}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Preview */}
                        <button
                          type="button"
                          onClick={() => setPreviewDoc(slotDoc)}
                          className="p-1.5 text-slate-600 hover:text-[#022851] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Preview Document"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Download */}
                        <a
                          href={slotDoc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={slotDoc.document_name}
                          className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Download Document"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>

                        {/* Delete */}
                        {isSelfOrAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDeleteSlotDocument(slot.id, slotDoc)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Remove Document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Replace / Re-upload Option */}
                    {isSelfOrAdmin && (
                      <label className="text-[11px] font-bold text-blue-700 hover:text-blue-800 flex items-center justify-end gap-1 cursor-pointer transition-colors">
                        <Upload className="w-3 h-3" />
                        <span>{isUploading ? 'Uploading New File...' : 'Replace Document'}</span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.webp"
                          disabled={isUploading}
                          onChange={(e) => handleSlotUpload(slot.id, e)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                ) : (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    {isSelfOrAdmin ? (
                      <label className={`w-full border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/60 hover:bg-blue-50/40 rounded-xl p-3.5 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        {isUploading ? (
                          <div className="flex items-center gap-2 py-1">
                            <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                            <span className="text-xs font-bold text-blue-700">Uploading to Zoho Books...</span>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-5 h-5 text-slate-400 mb-1" />
                            <span className="text-xs font-bold text-[#022851]">Upload Document</span>
                            <span className="text-[10px] text-slate-400 mt-0.5">PDF, JPG, PNG up to 10 MB</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.webp"
                          disabled={isUploading}
                          onChange={(e) => handleSlotUpload(slot.id, e)}
                          className="hidden"
                        />
                      </label>
                    ) : (
                      <div className="text-center py-3 text-xs text-slate-400">
                        No document uploaded
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: ADDITIONAL / GENERAL DOCUMENTS */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/80">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-[#022851]" />
              <span>Additional Employment Documents</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Other supplementary files, certifications, or internal employment records.
            </p>
          </div>

          {isSelfOrAdmin && (
            <label className={`bg-[#022851] hover:bg-[#03376e] text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer ${generalUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <Upload className="w-4 h-4" />
              <span>{generalUploading ? 'Uploading...' : 'Upload Additional File'}</span>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={handleGeneralUpload}
                disabled={generalUploading}
                className="hidden"
              />
            </label>
          )}
        </div>

        {generalDocs.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-slate-200 rounded-2xl bg-slate-50/40">
            <p className="text-xs font-semibold text-slate-500">No additional documents uploaded.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Any extra files you upload will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {generalDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between shadow-2xs hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-100/80 text-blue-700 flex items-center justify-center font-bold shrink-0 border border-blue-200">
                    <File className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span
                      onClick={() => setPreviewDoc(doc)}
                      className="text-xs font-bold text-slate-800 hover:text-blue-600 underline-offset-2 hover:underline truncate block cursor-pointer"
                      title={doc.document_name}
                    >
                      {doc.document_name}
                    </span>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                      {formatFileSize(doc.file_size)} • {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPreviewDoc(doc)}
                    className="p-2 text-[#022851] hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    title="Preview Document"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={doc.document_name}
                    className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                    title="Download Document"
                  >
                    <Download className="w-4 h-4" />
                  </a>

                  {isSelfOrAdmin && (
                    <button
                      onClick={() => handleDeleteGeneralDocument(doc.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 relative max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3 min-w-0 pr-4">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold border border-blue-100 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 truncate">{previewDoc.document_name}</h3>
                  <p className="text-[11px] text-slate-500 font-medium">{formatFileSize(previewDoc.file_size)} • Inline Document Viewer</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={previewDoc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={previewDoc.document_name}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body / Document Preview Container */}
            <div className="py-4 flex-1 overflow-y-auto min-h-[400px] flex items-center justify-center bg-slate-50/50 rounded-xl mt-4 border border-slate-100">
              {previewDoc.file_type?.includes('pdf') || previewDoc.file_url?.includes('application/pdf') || previewDoc.document_name?.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={previewDoc.file_url}
                  title={previewDoc.document_name}
                  className="w-full h-[65vh] rounded-xl border border-slate-200 shadow-inner bg-white"
                />
              ) : previewDoc.file_type?.includes('image') || previewDoc.document_name?.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif)$/) ? (
                <img
                  src={previewDoc.file_url}
                  alt={previewDoc.document_name}
                  className="max-h-[65vh] w-auto max-w-full rounded-xl object-contain shadow-md border border-slate-200"
                />
              ) : (
                <div className="text-center p-8">
                  <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-slate-700 mb-1">{previewDoc.document_name}</h4>
                  <p className="text-xs text-slate-500 mb-4">No direct inline preview for this file type.</p>
                  <a
                    href={previewDoc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl inline-flex items-center gap-2 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in New Tab</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
