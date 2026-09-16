import React, { useState } from 'react';
import API from '../api';
import { 
  Users, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  UserPlus, 
  KeyRound 
} from 'lucide-react';

export default function LoginPage({ onLoginSuccess }) {
  // Mode: 'signin' | 'register' | 'forgot'
  const [mode, setMode] = useState('signin');

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Registration fields
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('IT');
  const [position, setPosition] = useState('Software Engineer');

  // Forgot password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status indicators
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Autofill helper for Demo Accounts
  const handleQuickDemoFill = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setErrorMsg('');
  };

  // Sign In Handler
  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email address and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await API.post('/auth/login', { email, password });
      if (res.data && res.data.user) {
        setSuccessMsg('Login successful! Navigating to your dashboard...');
        setTimeout(() => {
          onLoginSuccess(res.data.user);
        }, 600);
      }
    } catch (err) {
      console.error('Login error:', err);
      const msg = err.response?.data?.error || 'Failed to sign in. Please check your credentials.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  // Employee Registration Handler
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await API.post('/auth/register-employee', {
        name,
        email,
        password,
        department,
        position
      });
      if (res.data && res.data.user) {
        setSuccessMsg('Employee registered successfully! Signing in...');
        setTimeout(() => {
          onLoginSuccess(res.data.user);
        }, 800);
      }
    } catch (err) {
      console.error('Registration error:', err);
      const msg = err.response?.data?.error || 'Failed to register employee account.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  // Reset Password Handler
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email || !newPassword) {
      setErrorMsg('Please enter your email and new password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirm password do not match.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await API.post('/auth/reset-password', { email, newPassword });
      setSuccessMsg(res.data?.message || 'Password reset successfully! You can now sign in.');
      setPassword(newPassword);
      setTimeout(() => {
        setMode('signin');
        setSuccessMsg('');
      }, 1500);
    } catch (err) {
      console.error('Password reset error:', err);
      const msg = err.response?.data?.error || 'Failed to reset password.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row select-none font-sans bg-white overflow-x-hidden">
      
      {/* Left Hero Banner - Full height split column (42% width on lg screens) */}
      <div className="lg:w-[42%] bg-[#022851] text-white p-8 sm:p-12 lg:p-16 flex flex-col justify-between min-h-[380px] lg:min-h-screen relative overflow-hidden shrink-0">
        {/* Top Logo */}
        <div className="flex items-center gap-3 z-10">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-white font-bold text-xl leading-tight tracking-tight">P W Holdings</h1>
            <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">Employee Management</p>
          </div>
        </div>

        {/* Middle Headline */}
        <div className="my-10 lg:my-0 z-10">
          <div className="bg-blue-900/60 border border-blue-400/30 text-white text-xs font-semibold px-3.5 py-1.5 rounded-xl inline-flex items-center gap-1.5 mb-6 backdrop-blur-xs w-fit">
            {/* <Sparkles className="w-3.5 h-3.5 text-blue-300" /> */}
            <span>People operations, made clear</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight max-w-lg">
            Make every workday visible, organized, and effortless.
          </h2>
        </div>

        {/* Bottom Ambient Footer */}
        <div className="text-xs text-blue-200/70 font-medium z-10">
          © 2026 P W Holdings
        </div>

        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Right Form Container - Full height flex container */}
      <div className="flex-1 bg-white p-8 sm:p-12 lg:p-16 flex flex-col justify-center min-h-screen max-w-2xl mx-auto w-full">
        
        {/* Feedback Toast Alerts */}
        {errorMsg && (
          <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold px-4 py-3 rounded-xl flex items-center gap-2 animate-in fade-in duration-200">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-4 py-3 rounded-xl flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* MODE 1: SIGN IN FORM */}
        {mode === 'signin' && (
          <div>
            <p className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1">
              Employee Management System
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
              Welcome
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-8">
              Sign in with your account to explore your workspace.
            </p>


            {/* Sign In Form */}
            <form onSubmit={handleSignIn} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@pwholdings.lk"
                    className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full border border-slate-200 rounded-xl pl-10 pr-10 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-600 absolute right-3.5 top-1/2 -translate-y-1/2 p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span>Remember me</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-[#022851] hover:bg-[#06386d] active:scale-[0.99] text-white font-bold text-sm py-3.5 px-4 rounded-xl w-full flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50 mt-3"
              >
                <span>{loading ? 'Signing in...' : 'Sign in'}</span>
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            {/* Toggle to Registration */}
            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                New employee?{' '}
                <button
                  onClick={() => {
                    setMode('register');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="text-blue-600 hover:text-blue-800 font-bold transition-colors cursor-pointer"
                >
                  Register your account
                </button>
              </p>
            </div>
          </div>
        )}

        {/* MODE 2: EMPLOYEE REGISTRATION FORM */}
        {mode === 'register' && (
          <div>
            <p className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1">
              New Employee Registration
            </p>
            <h2 className="text-3xl font-extrabold text-slate-900 leading-tight">
              Create employee account
            </h2>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              Fill in your employee details to get instant access to your workspace.
            </p>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Kasun Perera"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Work Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@pwholdings.lk"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium cursor-pointer"
                  >
                    <option value="IT">IT</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>
                {/* <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Position</label>
                  <input
                    type="text"
                    required
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="e.g. Software Engineer"
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div> */}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-[#022851] hover:bg-[#06386d] active:scale-[0.99] text-white font-bold text-sm py-3 px-4 rounded-xl w-full flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50 mt-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>{loading ? 'Creating account...' : 'Register Employee Account'}</span>
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500 font-medium">
                Already have an account?{' '}
                <button
                  onClick={() => {
                    setMode('signin');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="text-blue-600 hover:text-blue-800 font-bold transition-colors cursor-pointer"
                >
                  Sign in here
                </button>
              </p>
            </div>
          </div>
        )}

        {/* MODE 3: RESET PASSWORD FORM */}
        {mode === 'forgot' && (
          <div>
            <p className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1">
              Password Recovery
            </p>
            <h2 className="text-3xl font-extrabold text-slate-900 leading-tight">
              Reset your password
            </h2>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              Enter your registered email and choose a new password.
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Registered Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-[#022851] hover:bg-[#06386d] active:scale-[0.99] text-white font-bold text-sm py-3 px-4 rounded-xl w-full flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50 mt-2"
              >
                <KeyRound className="w-4 h-4" />
                <span>{loading ? 'Resetting...' : 'Reset Password'}</span>
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <button
                onClick={() => {
                  setMode('signin');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold transition-colors cursor-pointer"
              >
                ← Back to Sign in
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
