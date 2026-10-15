import React, { useState, useEffect } from 'react';
import API from '../api';
import logoImg from '../assets/logo.png';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Briefcase, 
  IdCard, 
  Upload, 
  FileText, 
  Shield, 
  GraduationCap, 
  Award, 
  X, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Sparkles,
  Building2,
  FileCheck2,
  LogIn,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

const DEPARTMENT_OPTIONS = ['IT', 'Finance'];

const DESIGNATION_OPTIONS = [
  'System Consultant',
  'Associate System Consultant',
  'Associate Software Engineer'
];

const CARD_DESIGNATION_OPTIONS = [
  'System Consultant',
  'Application Consultant'
];

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

export default function EmployeeRegistrationPage({ onNavigateLogin, onLoginSuccess }) {
  // Stepper: 1 = Details & Documents, 2 = Password Setup, 3 = Email OTP Verification, 4 = Completed
  const [currentStep, setCurrentStep] = useState(1);

  // Form Details
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    dob: '',
    date_joined: new Date().toISOString().split('T')[0],
    department: 'IT',
    designation: 'System Consultant',
    card_designation: 'System Consultant'
  });

  // Uploaded documents in base64
  const [documents, setDocuments] = useState({
    nic: null,
    ol_certificate: null,
    al_certificate: null,
    other_certificate: null
  });

  // Password fields
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP Verification state
  const [otpCode, setOtpCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Zoho saved metadata
  const [zohoResult, setZohoResult] = useState(null);
  const [createdUser, setCreatedUser] = useState(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [loadingStatusText, setLoadingStatusText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Resend cooldown timer effect
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(prev => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (slotKey, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg(`File "${file.name}" exceeds the 10 MB maximum limit.`);
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
      setErrorMsg('');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = (slotKey) => {
    setDocuments(prev => ({ ...prev, [slotKey]: null }));
  };

  // Step 1: Submit Details & Documents to Zoho Books
  const handleProceedToPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Validations
    if (!formData.name.trim()) {
      setErrorMsg('Please enter your full legal name.');
      return;
    }
    if (!formData.email.trim()) {
      setErrorMsg('Please enter your official work email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!formData.email.trim().toLowerCase().endsWith('@pwholdings.lk')) {
      setErrorMsg('Please enter your official P W Holdings work email address (ending with @pwholdings.lk).');
      return;
    }
    if (!formData.phone.trim()) {
      setErrorMsg('Please enter your contact phone number.');
      return;
    }
    if (!formData.address.trim()) {
      setErrorMsg('Please enter your residential address.');
      return;
    }

    setLoading(true);
    setLoadingStatusText('Verifying email availability...');

    try {
      // 1. Check if user already exists in PWH system
      const checkRes = await API.get(`/auth/check-email?email=${encodeURIComponent(formData.email.trim())}`);
      if (checkRes.data?.exists) {
        setErrorMsg('An employee account with this email already exists in PWH system. Please sign in instead.');
        setLoading(false);
        return;
      }

      // 2. Submit to Zoho Books custom module & upload documents
      setLoadingStatusText('Registering official profile & documents with Zoho Books...');

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        dob: formData.dob || '',
        date_joined: formData.date_joined || '',
        department: formData.department,
        designation: formData.designation,
        card_designation: formData.card_designation,
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
      if (res.data?.success || res.data?.data) {
        setZohoResult(res.data.data || { cf_emp_code: '' });
      }

      // Transition to Step 2: Password setup
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Step 1 Submission Error:', err);
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to submit employee details.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
      setLoadingStatusText('');
    }
  };

  // Step 2: Validate Password & Dispatch OTP to pwholdings.lk email
  const handleProceedToOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!password) {
      setErrorMsg('Please enter a password.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Password and confirm password do not match.');
      return;
    }

    setLoading(true);
    setLoadingStatusText('Sending 6-digit verification code to official email...');

    try {
      await API.post('/auth/send-otp', {
        email: formData.email.trim().toLowerCase(),
        type: 'register'
      });

      setOtpCode('');
      setResendCooldown(60);
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Send OTP Error:', err);
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to send verification code.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
      setLoadingStatusText('');
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || loading) return;
    setErrorMsg('');
    setLoading(true);
    setLoadingStatusText('Resending verification code...');

    try {
      await API.post('/auth/send-otp', {
        email: formData.email.trim().toLowerCase(),
        type: 'register'
      });
      setResendCooldown(60);
    } catch (err) {
      console.error('Resend OTP Error:', err);
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to resend verification code.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
      setLoadingStatusText('');
    }
  };

  // Step 3: Verify OTP & Activate Employee Account
  const handleVerifyOtpAndComplete = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!otpCode || otpCode.trim().length !== 6) {
      setErrorMsg('Please enter the 6-digit verification code sent to your official email.');
      return;
    }

    setLoading(true);
    setLoadingStatusText('Verifying code & activating your PWH employee account...');

    try {
      const empCode = zohoResult?.cf_emp_code || zohoResult?.record_name || '';

      const regPayload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: password,
        otp: otpCode.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        dob: formData.dob || null,
        date_joined: formData.date_joined || new Date().toISOString().split('T')[0],
        department: formData.department,
        designation: formData.designation,
        card_designation: formData.card_designation,
        emp_code: empCode || null,
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

      const res = await API.post('/auth/register-employee', regPayload);

      if (res.data?.success && res.data?.user) {
        setCreatedUser(res.data.user);
        setCurrentStep(4);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setErrorMsg(res.data?.message || 'Failed to complete registration.');
      }
    } catch (err) {
      console.error('Step 3 OTP & Registration Error:', err);
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to complete registration.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
      setLoadingStatusText('');
    }
  };

  return (
    <div className="min-h-screen bg-[#07162c] text-slate-800 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Top Header Navbar */}
      <header className="border-b border-slate-800/80 bg-[#07162c]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center p-1.5 shadow-md shrink-0">
              <img src={logoImg} alt="P W Holdings Logo" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.src = '/logo.png'; }} />
            </div>
            <div>
              <h1 className="text-white font-extrabold text-base sm:text-lg leading-tight tracking-tight">P W Holdings</h1>
              <p className="text-[10px] sm:text-xs font-semibold tracking-wider text-slate-400 uppercase">Employee Onboarding Portal</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onNavigateLogin}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 px-3 py-1.5 rounded-xl border border-slate-700/60 transition-all cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5 text-blue-400" />
            <span>Sign In</span>
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Progress Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-lg mx-auto relative">
            {/* Step 1 Node */}
            <div className="flex flex-col items-center relative z-10">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-md ${
                currentStep > 1 
                  ? 'bg-emerald-600 text-white' 
                  : currentStep === 1 
                    ? 'bg-blue-600 text-white ring-4 ring-blue-500/20' 
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                {currentStep > 1 ? <Check className="w-4 h-4 stroke-[3]" /> : '1'}
              </div>
              <span className={`text-[11px] font-bold mt-2 ${currentStep >= 1 ? 'text-white' : 'text-slate-500'}`}>
                Details
              </span>
            </div>

            {/* Connecting Line 1 -> 2 */}
            <div className="flex-1 h-0.5 mx-2 bg-slate-800 relative -top-3">
              <div 
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: currentStep > 1 ? '100%' : '0%' }}
              />
            </div>

            {/* Step 2 Node */}
            <div className="flex flex-col items-center relative z-10">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-md ${
                currentStep > 2 
                  ? 'bg-emerald-600 text-white' 
                  : currentStep === 2 
                    ? 'bg-blue-600 text-white ring-4 ring-blue-500/20' 
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                {currentStep > 2 ? <Check className="w-4 h-4 stroke-[3]" /> : '2'}
              </div>
              <span className={`text-[11px] font-bold mt-2 ${currentStep >= 2 ? 'text-white' : 'text-slate-500'}`}>
                Password
              </span>
            </div>

            {/* Connecting Line 2 -> 3 */}
            <div className="flex-1 h-0.5 mx-2 bg-slate-800 relative -top-3">
              <div 
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: currentStep > 2 ? '100%' : '0%' }}
              />
            </div>

            {/* Step 3 Node */}
            <div className="flex flex-col items-center relative z-10">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-md ${
                currentStep > 3 
                  ? 'bg-emerald-600 text-white' 
                  : currentStep === 3 
                    ? 'bg-blue-600 text-white ring-4 ring-blue-500/20' 
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                {currentStep > 3 ? <Check className="w-4 h-4 stroke-[3]" /> : '3'}
              </div>
              <span className={`text-[11px] font-bold mt-2 ${currentStep >= 3 ? 'text-white' : 'text-slate-500'}`}>
                Verify Email
              </span>
            </div>

            {/* Connecting Line 3 -> 4 */}
            <div className="flex-1 h-0.5 mx-2 bg-slate-800 relative -top-3">
              <div 
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: currentStep > 3 ? '100%' : '0%' }}
              />
            </div>

            {/* Step 4 Node */}
            <div className="flex flex-col items-center relative z-10">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-md ${
                currentStep === 4 
                  ? 'bg-emerald-600 text-white ring-4 ring-emerald-500/20' 
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className={`text-[11px] font-bold mt-2 ${currentStep === 4 ? 'text-white' : 'text-slate-500'}`}>
                Complete
              </span>
            </div>
          </div>
        </div>

        {/* Global Error Alert Banner */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-3 animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm font-semibold leading-relaxed">
              {errorMsg}
            </div>
          </div>
        )}

        {/* ================= STEP 1: EMPLOYEE DETAILS & DOCUMENTS ================= */}
        {currentStep === 1 && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-200">
            <div className="pb-6 border-b border-slate-100">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                  Step 1 of 3
                </span>
                <span className="text-xs text-slate-300">•</span>
                <span className="text-xs font-bold text-slate-500">Official HR Onboarding</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Employee Registration Form
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                Welcome to P W Holdings. Please provide your personal and employment details and upload required verification documents.
              </p>
            </div>

            <form onSubmit={handleProceedToPassword} className="mt-8 space-y-8">
              {/* SECTION: Personal Information */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <span>Personal Information</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                  {/* Full Name */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Full Legal Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="e.g. Kasun Chamara Perera"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Official Work Email <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="e.g. kasun@pwholdings.lk"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Contact Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        placeholder="e.g. +94 77 123 4567"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Residential Address */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Residential Address <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        required
                        rows="2"
                        placeholder="e.g. No. 45/2, Galle Road, Colombo 03, Sri Lanka"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                      />
                    </div>
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Date of Birth
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="date"
                        name="dob"
                        value={formData.dob}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Date Joined */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Commencement Date / Date Joined
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="date"
                        name="date_joined"
                        value={formData.date_joined}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION: Employment Details */}
              <div className="pt-6 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  <span>Employment Details</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                  {/* Department */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Department <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <select
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                      >
                        {DEPARTMENT_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Designation */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Designation <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <select
                        name="designation"
                        value={formData.designation}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                      >
                        {DESIGNATION_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Card Designation */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Card Designation <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <IdCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <select
                        name="card_designation"
                        value={formData.card_designation}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                      >
                        {CARD_DESIGNATION_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION: Document Attachments */}
              <div className="pt-6 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <FileCheck2 className="w-4 h-4 text-blue-600" />
                      <span>Verification Documents</span>
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Upload your identity and educational documents (PDF, JPG, PNG up to 10 MB each).
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 shrink-0">
                    Max 10 MB per file
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {DOCUMENT_SLOTS.map((slot) => {
                    const SlotIcon = slot.icon;
                    const attachedFile = documents[slot.key];

                    return (
                      <div 
                        key={slot.key}
                        className={`p-4 rounded-2xl border transition-all ${
                          attachedFile 
                            ? 'bg-blue-50/50 border-blue-200 ring-1 ring-blue-500/10' 
                            : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                              attachedFile ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200'
                            }`}>
                              <SlotIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-900">{slot.title}</h4>
                              <p className="text-[10px] text-slate-500 font-medium">{slot.subtitle}</p>
                            </div>
                          </div>

                          {attachedFile && (
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(slot.key)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-white transition-colors cursor-pointer"
                              title="Remove file"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {attachedFile ? (
                          <div className="bg-white p-2.5 rounded-xl border border-blue-200/80 flex items-center justify-between text-xs font-semibold text-slate-800">
                            <span className="truncate max-w-[200px]" title={attachedFile.document_name}>
                              {attachedFile.document_name}
                            </span>
                            <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-bold shrink-0">
                              {(attachedFile.file_size / (1024 * 1024)).toFixed(2)} MB
                            </span>
                          </div>
                        ) : (
                          <div>
                            <label className="flex items-center justify-center gap-2 bg-white hover:bg-slate-100/80 text-slate-700 font-bold text-xs py-2 px-3 rounded-xl border border-dashed border-slate-300 hover:border-slate-400 transition-all cursor-pointer shadow-2xs">
                              <Upload className="w-3.5 h-3.5 text-slate-500" />
                              <span>Select Document</span>
                              <input
                                type="file"
                                accept=".pdf,.png,.jpg,.jpeg"
                                onChange={(e) => handleFileChange(slot.key, e)}
                                className="hidden"
                              />
                            </label>
                            <p className="text-[10px] text-slate-400 font-medium text-center mt-1.5">
                              {slot.helpText}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={onNavigateLogin}
                  className="text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Already have an account? Sign in
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto bg-[#022851] hover:bg-[#06386d] active:scale-[0.99] text-white font-bold text-xs sm:text-sm py-3 px-8 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{loadingStatusText || 'Saving to Zoho Books...'}</span>
                    </>
                  ) : (
                    <>
                      <span>Next: Set Account Password</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ================= STEP 2: PASSWORD SETUP ================= */}
        {currentStep === 2 && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-200">
            <div className="pb-6 border-b border-slate-100">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                  Step 2 of 3
                </span>
                <span className="text-xs text-slate-300">•</span>
                <span className="text-xs font-bold text-slate-500">Security Credentials</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Create Your Portal Password
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                Set up a secure password to access your daily tasks, leave applications, and work logs.
              </p>
            </div>

            {/* Profile Confirmation Card */}
            <div className="mt-6 p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                  {formData.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">{formData.name}</h4>
                  <p className="text-[11px] text-slate-600 font-medium">
                    {formData.email} • {formData.department} ({formData.designation})
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Details Saved in Zoho Books</span>
              </div>
            </div>

            <form onSubmit={handleProceedToOtp} className="mt-8 space-y-6">
              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Create your portal password"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 font-medium mt-1">
                  Must be at least 6 characters long
                </p>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Re-enter your password"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password Match Indicator */}
              {password && confirmPassword && (
                <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                  password === confirmPassword 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                  {password === confirmPassword ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Passwords match! Ready for official email verification.</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span>Passwords do not match yet.</span>
                    </>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    setCurrentStep(1);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Details</span>
                </button>

                <button
                  type="submit"
                  disabled={loading || !password || password !== confirmPassword}
                  className="bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm py-3 px-8 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{loadingStatusText || 'Sending OTP...'}</span>
                    </>
                  ) : (
                    <>
                      <span>Next: Verify Email via OTP</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ================= STEP 3: EMAIL OTP VERIFICATION ================= */}
        {currentStep === 3 && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-200 max-w-xl mx-auto animate-in zoom-in-95 duration-200">
            <div className="pb-6 border-b border-slate-100 text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 border border-blue-100 ring-8 ring-blue-50/50">
                <ShieldCheck className="w-7 h-7 text-blue-600" />
              </div>
              <div className="flex items-center justify-center gap-2 mb-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                  Step 3 of 3
                </span>
                <span className="text-xs text-slate-300">•</span>
                <span className="text-xs font-bold text-slate-500">Official Email Verification</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Verify Your Official Email
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                A 6-digit verification code has been dispatched to your official company mailbox:
              </p>
              <div className="inline-flex items-center gap-2 mt-3 px-3.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-xs sm:text-sm font-bold">
                <Mail className="w-4 h-4 text-blue-600" />
                <span>{formData.email}</span>
              </div>
            </div>

            <form onSubmit={handleVerifyOtpAndComplete} className="mt-8 space-y-6">
              <div>
                <label className="block text-center text-xs font-bold text-slate-700 mb-2">
                  Enter 6-Digit Verification Code <span className="text-rose-500">*</span>
                </label>
                <div className="relative max-w-xs mx-auto">
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    required
                    autoFocus
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-4 text-center text-3xl font-mono font-bold tracking-[0.4em] text-slate-900 placeholder:tracking-[0.4em] placeholder:text-slate-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  />
                </div>
                <p className="text-center text-[11px] text-slate-400 font-medium mt-2">
                  Code expires in 10 minutes
                </p>
              </div>

              {/* Resend Code Section */}
              <div className="text-center">
                <button
                  type="button"
                  disabled={resendCooldown > 0 || loading}
                  onClick={handleResendOtp}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>
                    {resendCooldown > 0 
                      ? `Resend code in ${resendCooldown}s` 
                      : 'Resend Verification Code'}
                  </span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    setCurrentStep(2);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Password</span>
                </button>

                <button
                  type="submit"
                  disabled={loading || otpCode.trim().length !== 6}
                  className="bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm py-3 px-6 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{loadingStatusText || 'Verifying...'}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verify & Activate Account</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ================= STEP 4: REGISTRATION COMPLETED ================= */}
        {currentStep === 4 && (
          <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-2xl border border-slate-200 text-center animate-in zoom-in-95 duration-200 max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-5 ring-8 ring-emerald-50">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Registration Complete!
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-2 max-w-md mx-auto">
              Welcome to P W Holdings, <strong className="text-slate-800">{formData.name}</strong>. Your employee account is now verified and active in both Zoho Books and the PWH Portal.
            </p>

            <div className="mt-8 p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-400 font-medium">Work Email:</span>
                <span className="font-bold text-slate-800">{formData.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-400 font-medium">Department:</span>
                <span className="font-semibold text-slate-800">{formData.department}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-400 font-medium">Designation:</span>
                <span className="font-semibold text-slate-800">{formData.designation}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-400 font-medium">Card Designation:</span>
                <span className="font-semibold text-slate-800">{formData.card_designation}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-400 font-medium">Employee Code:</span>
                <span className="font-mono font-bold text-blue-700">
                  {createdUser?.emp_code || zohoResult?.cf_emp_code || 'Auto-assigned by Zoho'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400 font-medium">Leave Quota Allocated:</span>
                <span className="font-bold text-emerald-600">24 Days</span>
              </div>
            </div>

            <div className="mt-8">
              <button
                type="button"
                onClick={() => {
                  if (createdUser && onLoginSuccess) {
                    onLoginSuccess(createdUser);
                  } else {
                    onNavigateLogin();
                  }
                }}
                className="w-full bg-[#022851] hover:bg-[#06386d] active:scale-[0.99] text-white font-bold text-sm py-3.5 px-6 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Go to Employee Portal Login</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-5 text-center text-xs text-slate-500 font-medium">
        <p>© {new Date().getFullYear()} P W Holdings (Pvt) Ltd. All rights reserved.</p>
      </footer>
    </div>
  );
}
