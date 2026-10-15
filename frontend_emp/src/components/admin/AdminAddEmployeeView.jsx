import React, { useState } from 'react';
import API from '../../api';
import { 
  UserPlus, 
  Calendar, 
  Mail, 
  Briefcase, 
  IdCard, 
  User, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  RotateCcw,
  Phone,
  MapPin,
  Upload,
  FileText,
  Shield,
  GraduationCap,
  Award,
  X
} from 'lucide-react';

const DOCUMENT_SLOTS = [
  {
    key: 'nic',
    title: 'Copy of NIC',
    subtitle: 'National Identity Card (Front & Back)',
    icon: Shield,
    helpText: 'You can upload a file that is 10MB or lesser'
  },
  {
    key: 'ol_certificate',
    title: 'Educational Certificates (O/L)',
    subtitle: 'G.C.E. Ordinary Level results sheet / certificate',
    icon: GraduationCap,
    helpText: 'You can upload a file that is 10MB or lesser'
  },
  {
    key: 'al_certificate',
    title: 'Educational Certificates (A/L)',
    subtitle: 'G.C.E. Advanced Level results sheet / certificate',
    icon: Award,
    helpText: 'You can upload a file that is 10MB or lesser'
  },
  {
    key: 'other_certificate',
    title: 'Other Qualification Certificates',
    subtitle: 'Degrees, Diplomas, HND, Professional Certifications',
    icon: FileText,
    helpText: 'You can upload a file that is 10MB or lesser'
  }
];

export default function AdminAddEmployeeView() {
  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    date_joined: '',
    designation: '',
    card_designation: '',
    email: '',
    phone: '',
    address: ''
  });

  const [documents, setDocuments] = useState({
    nic: null,
    ol_certificate: null,
    al_certificate: null,
    other_certificate: null
  });

  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (slotKey, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setStatusMessage({
        type: 'error',
        text: `File "${file.name}" exceeds the 10 MB limit allowed by Zoho Books.`
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setDocuments(prev => ({
        ...prev,
        [slotKey]: {
          file,
          document_name: file.name,
          document_data: reader.result,
          file_type: file.type || 'application/pdf',
          file_size: file.size
        }
      }));
      setStatusMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = (slotKey) => {
    setDocuments(prev => ({
      ...prev,
      [slotKey]: null
    }));
  };

  const handleReset = () => {
    setFormData({
      name: '',
      dob: '',
      date_joined: '',
      designation: '',
      card_designation: '',
      email: '',
      phone: '',
      address: ''
    });
    setDocuments({
      nic: null,
      ol_certificate: null,
      al_certificate: null,
      other_certificate: null
    });
    setStatusMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      setStatusMessage({ type: 'error', text: 'Name and Email are required fields.' });
      return;
    }

    setSubmitting(true);
    setStatusMessage(null);

    try {
      const payload = {
        ...formData,
        documents: {
          ...(documents.nic ? {
            nic: {
              document_name: documents.nic.document_name,
              document_data: documents.nic.document_data,
              file_type: documents.nic.file_type
            }
          } : {}),
          ...(documents.ol_certificate ? {
            ol_certificate: {
              document_name: documents.ol_certificate.document_name,
              document_data: documents.ol_certificate.document_data,
              file_type: documents.ol_certificate.file_type
            }
          } : {}),
          ...(documents.al_certificate ? {
            al_certificate: {
              document_name: documents.al_certificate.document_name,
              document_data: documents.al_certificate.document_data,
              file_type: documents.al_certificate.file_type
            }
          } : {}),
          ...(documents.other_certificate ? {
            other_certificate: {
              document_name: documents.other_certificate.document_name,
              document_data: documents.other_certificate.document_data,
              file_type: documents.other_certificate.file_type
            }
          } : {})
        }
      };

      const res = await API.post('/zoho/employee', payload);
      if (res.data?.success || res.data?.message?.includes('success')) {
        setStatusMessage({
          type: 'success',
          text: res.data.message || '✅ Employee entry created successfully in Zoho Books (cm_employee)!'
        });
        handleReset();
      } else {
        setStatusMessage({
          type: 'error',
          text: res.data?.message || res.data?.error || 'Failed to submit entry to Zoho Books.'
        });
      }
    } catch (err) {
      console.error('Failed to submit to Zoho Books:', err);
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Network error occurred.';
      setStatusMessage({ type: 'error', text: `❌ ${msg}` });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 select-none">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-600" />
              <span>Zoho Books Custom Module</span>
            </span>
            <span className="text-xs text-slate-300 font-medium">•</span>
            <span className="text-xs font-bold text-slate-500">`cm_employee` Sync</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Add New Employee Entry</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Fill out the form below to submit a new employee record directly to Zoho Books (EMP CODE is auto-assigned by Zoho).
          </p>
        </div>
      </div>

      {/* Alert Status Banner */}
      {statusMessage && (
        <div className={`p-4 rounded-2xl border flex items-start gap-3 transition-all ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
            : 'bg-rose-50 text-rose-900 border-rose-200'
        }`}>
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-xs sm:text-sm font-semibold">
            {statusMessage.text}
          </div>
        </div>
      )}

      {/* Main Form Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-blue-600" />
              <span>Zoho Books Employee Record Fields</span>
            </h3>
            <span className="text-[11px] font-bold text-slate-400">
              Module: <code className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono text-[11px]">cm_employee</code>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* NAME */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-500" />
                <span>NAME <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Hashan Chathuranga"
                className="w-full bg-slate-50/70 border border-slate-200 text-xs font-semibold text-slate-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
              />
            </div>

            {/* DOB */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                <span>DATE OF BIRTH (DOB)</span>
              </label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                className="w-full bg-slate-50/70 border border-slate-200 text-xs font-semibold text-slate-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>

            {/* DATE OF JOINED */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                <span>DATE OF JOINED</span>
              </label>
              <input
                type="date"
                name="date_joined"
                value={formData.date_joined}
                onChange={handleChange}
                className="w-full bg-slate-50/70 border border-slate-200 text-xs font-semibold text-slate-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>

            {/* DESIGNATION */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                <span>DESIGNATION</span>
              </label>
              <select
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                className="w-full bg-slate-50/70 border border-slate-200 text-xs font-semibold text-slate-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
              >
                <option value="">-- Select Designation --</option>
                <option value="Systems Consultant">Systems Consultant</option>
                <option value="Associate Systems Consultant">Associate Systems Consultant</option>
                <option value="Associate Software Engineer ">Associate Software Engineer</option>
              </select>
            </div>

            {/* CARD DESIGNATION */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <IdCard className="w-3.5 h-3.5 text-blue-500" />
                <span>CARD DESIGNATION</span>
              </label>
              <select
                name="card_designation"
                value={formData.card_designation}
                onChange={handleChange}
                className="w-full bg-slate-50/70 border border-slate-200 text-xs font-semibold text-slate-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
              >
                <option value="">-- Select Card Designation --</option>
                <option value="Systems Consultant">Systems Consultant</option>
                <option value="Application Consultant">Application Consultant</option>
              </select>
            </div>

            {/* EMAIL */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-500" />
                <span>EMAIL ADDRESS <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. hashan@pwholdings.lk"
                className="w-full bg-slate-50/70 border border-slate-200 text-xs font-semibold text-slate-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
              />
            </div>

            {/* PHONE */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-blue-500" />
                <span>PHONE</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g. +94 77 123 4567 or 0771234567"
                className="w-full bg-slate-50/70 border border-slate-200 text-xs font-semibold text-slate-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
              />
            </div>

            {/* ADDRESS */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-500" />
                <span>ADDRESS</span>
              </label>
              <textarea
                name="address"
                rows={3}
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter residential / permanent address..."
                className="w-full bg-slate-50/70 border border-slate-200 text-xs font-semibold text-slate-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-400 resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Official Document Uploads Section */}
          <div className="pt-6 border-t border-slate-100">
            <div className="mb-4">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Employee Document Attachments</span>
              </h4>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Upload official employee verification and qualification documents to be saved directly in Zoho Books.
              </p>
            </div>

            <div className="space-y-3.5">
              {DOCUMENT_SLOTS.map((slot) => {
                const IconComponent = slot.icon;
                const fileObj = documents[slot.key];

                return (
                  <div
                    key={slot.key}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                        <IconComponent className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">{slot.title}</div>
                        <div className="text-[11px] text-slate-400 font-medium">{slot.subtitle}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {slot.helpText}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                      {fileObj ? (
                        <div className="flex items-center gap-2 bg-white border border-emerald-200 rounded-xl px-3 py-1.5 shadow-2xs">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div className="text-left min-w-0 max-w-[200px]">
                            <div className="text-xs font-bold text-slate-800 truncate" title={fileObj.document_name}>
                              {fileObj.document_name}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {(fileObj.file_size / (1024 * 1024)).toFixed(2)} MB
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(slot.key)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors cursor-pointer ml-1"
                            title="Remove file"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <label className="border border-slate-300 hover:border-blue-500 bg-white hover:bg-blue-50/50 text-slate-700 hover:text-blue-700 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs">
                          <Upload className="w-3.5 h-3.5 text-slate-500" />
                          <span>Upload File</span>
                          <input
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                            className="hidden"
                            onChange={(e) => handleFileChange(slot.key, e)}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleReset}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-xs font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Form</span>
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="bg-[#022851] hover:bg-[#03376e] active:scale-[0.98] text-white text-xs font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting to Zoho Books...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit to Zoho Books</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

