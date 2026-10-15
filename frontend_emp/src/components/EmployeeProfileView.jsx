import React, { useState, useEffect } from 'react';
import API from '../api';
import ProfileHero from './profile/ProfileHero';
import StatCard from './profile/StatCard';
import { PersonalInfoCard, EmploymentInfoCard, ContactInfoCard } from './profile/InfoCard';
import BirthdayReminderCard from './profile/BirthdayReminderCard';
import UpcomingBirthdayCard from './profile/UpcomingBirthdayCard';
import QuickActions from './profile/QuickActions';
import RecentActivity from './profile/RecentActivity';
import DocumentsTab from './profile/DocumentsTab';
import PhotoUploader from './profile/PhotoUploader';
import EditProfileModal from './EditProfileModal';
import { Layers, User, Briefcase, Phone, FileText, AlertCircle, RefreshCw, Trash2, X } from 'lucide-react';

export default function EmployeeProfileView({ onBack, user, onSelectEmployee, onProfileUpdated: onParentProfileUpdated, onEmployeeDeleted }) {
  const [profile, setProfile] = useState(user || null);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState([]);
  const [loading, setLoading] = useState(!user && !profile);
  const [error, setError] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [syncingZoho, setSyncingZoho] = useState(false);
  const [zohoSyncMsg, setZohoSyncMsg] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteZoho, setDeleteZoho] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const handleSyncZoho = async () => {
    setSyncingZoho(true);
    setZohoSyncMsg(null);
    try {
      const targetId = user?.id || profile?.id;
      const res = await API.post('/api/zoho/employee/sync', { user_id: targetId });
      if (res.data?.success && res.data?.updated_profile) {
        setProfile(res.data.updated_profile);
        if (onParentProfileUpdated) onParentProfileUpdated(res.data.updated_profile);
        setZohoSyncMsg({ type: 'success', text: 'Profile details successfully updated from Zoho Books!' });
      } else {
        setZohoSyncMsg({ type: 'info', text: res.data?.message || 'Sync complete.' });
      }
    } catch (err) {
      console.error('Zoho sync error:', err);
      setZohoSyncMsg({ type: 'error', text: err.response?.data?.error || err.message || 'Failed to sync with Zoho Books' });
    } finally {
      setSyncingZoho(false);
      setTimeout(() => setZohoSyncMsg(null), 5000);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchUpcomingBirthdays();
  }, [user?.id]);

  const fetchProfile = async () => {
    if (!profile) setLoading(true);
    setError(null);
    try {
      const targetId = user?.id || profile?.id;
      const endpoint = targetId ? `/profile/me?user_id=${targetId}` : '/profile/me';
      const res = await API.get(endpoint);
      if (res.data) {
        setProfile(res.data);
        if (res.data.email) {
          fetchZohoDetails(res.data.email);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch profile from API, using active session user:', err);
      if (!profile && !user) {
        const errMsg = err.response?.data?.error || err.message || 'Failed to load profile details';
        setError(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Automatically fetch employee details from Zoho Books by email
  const fetchZohoDetails = async (email) => {
    if (!email) return;
    try {
      const zohoRes = await API.get(`/zoho/employee?email=${encodeURIComponent(email)}`);
      if (zohoRes.data?.success && zohoRes.data?.employee) {
        const z = zohoRes.data.employee;
        setProfile(prev => ({
          ...prev,
          dob: z.dob ? (typeof z.dob === 'string' ? z.dob.split('T')[0] : z.dob) : prev?.dob,
          date_joined: z.date_joined ? (typeof z.date_joined === 'string' ? z.date_joined.split('T')[0] : z.date_joined) : prev?.date_joined,
          designation: z.designation || prev?.designation,
          card_designation: z.card_designation || prev?.card_designation,
          emp_code: z.emp_code || prev?.emp_code,
          phone: z.phone || prev?.phone,
          address: z.address || prev?.address,
          zoho_synced: true,
          zoho_employee: z
        }));
      }
    } catch (zErr) {
      console.warn('Auto Zoho fetch error for profile:', zErr.message);
    }
  };

  const fetchUpcomingBirthdays = async () => {
    try {
      const res = await API.get('/profile/upcoming-birthdays');
      if (Array.isArray(res.data)) {
        setUpcomingBirthdays(res.data);
      }
    } catch (err) {
      console.warn('Upcoming birthdays fetch warning:', err.message);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-slate-200 rounded-xl animate-pulse" />
        </div>
        <div className="bg-[#07162c] rounded-2xl p-6 h-48 animate-pulse border border-slate-800" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-2xl p-5 h-28 border border-slate-200/80 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto py-12">
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/80 shadow-xs max-w-md mx-auto">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">Failed to Load Profile</h3>
          <p className="text-xs text-slate-500 mb-6">{error}</p>
          <button
            onClick={fetchProfile}
            className="bg-[#022851] hover:bg-[#03376e] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  const activeUser = (() => {
    try {
      const saved = localStorage.getItem('emp_mgt_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })();

  const isOwner = Boolean(
    activeUser && (
      (activeUser.id && profile?.id && String(activeUser.id) === String(profile.id)) ||
      (activeUser.email && profile?.email && activeUser.email.toLowerCase() === profile.email.toLowerCase()) ||
      (!user && profile)
    )
  );

  const isAdmin = activeUser?.role === 'Admin';
  const canDeleteEmployee = Boolean(isAdmin && profile?.id && String(activeUser?.id) !== String(profile?.id));

  const handleOpenEditModal = isOwner ? () => setIsEditModalOpen(true) : null;
  const handleOpenPhotoModal = isOwner ? () => setIsPhotoModalOpen(true) : null;

  const handleConfirmDelete = async () => {
    if (!profile?.id) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await API.delete(`/admin/employee/${profile.id}?delete_zoho=${deleteZoho}`);
      setIsDeleteModalOpen(false);
      if (onEmployeeDeleted) {
        onEmployeeDeleted(profile.id);
      } else if (onBack) {
        onBack();
      }
    } catch (err) {
      console.error('Delete employee error:', err);
      const msg = err.response?.data?.error || err.message || 'Failed to delete employee';
      setDeleteError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Hero Banner */}
      <ProfileHero
        profile={profile}
        onBack={onBack}
        onOpenEditModal={handleOpenEditModal}
        onOpenPhotoModal={handleOpenPhotoModal}
        onSyncZoho={handleSyncZoho}
        syncingZoho={syncingZoho}
        onDeleteEmployee={canDeleteEmployee ? () => setIsDeleteModalOpen(true) : null}
        zohoSynced={Boolean(profile?.zoho_synced)}
      />

      {/* Zoho Books Sync Status Alert */}
      {zohoSyncMsg && (
        <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between border shadow-2xs ${
          zohoSyncMsg.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : zohoSyncMsg.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <div className="flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 shrink-0 ${zohoSyncMsg.type === 'success' ? 'text-emerald-600' : 'text-blue-600'}`} />
            <span>{zohoSyncMsg.text}</span>
          </div>
          <button onClick={() => setZohoSyncMsg(null)} className="p-1 hover:opacity-75 cursor-pointer">
            <AlertCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="border-b border-slate-200/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', label: 'Overview', icon: Layers },
          { id: 'personal', label: 'Personal Details', icon: User },
          { id: 'employment', label: 'Employment Details', icon: Briefcase },
          { id: 'contact', label: 'Contact Details', icon: Phone },
          { id: 'documents', label: 'Documents', icon: FileText }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'border-[#022851] text-[#022851]'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT 1: OVERVIEW */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Upcoming Birthday Alert (if any active today/tomorrow) */}
          <UpcomingBirthdayCard
            birthdayEmployees={upcomingBirthdays}
            onSelectEmployee={profile?.role === 'Admin' || (user?.role === 'Admin') ? onSelectEmployee : null}
          />

          {/* Current Profile Birthday Reminder Card */}
          <BirthdayReminderCard
            profile={profile}
            onSelectEmployee={profile?.role === 'Admin' || (user?.role === 'Admin') ? onSelectEmployee : null}
          />

          {/* 4 Stat Cards */}
          <StatCard profile={profile} />

          {/* Overview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Personal Info & Activity Log */}
            <div className="lg:col-span-8 space-y-6">
              <PersonalInfoCard
                profile={profile}
                onOpenEditModal={handleOpenEditModal}
              />
              <RecentActivity userId={profile?.id} />
            </div>

            {/* Right Column: Quick Actions */}
            <div className="lg:col-span-4 space-y-6">
              <QuickActions
                profile={profile}
                onOpenEditModal={handleOpenEditModal}
                onOpenDocumentsTab={() => setActiveSubTab('documents')}
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: PERSONAL DETAILS */}
      {activeSubTab === 'personal' && (
        <PersonalInfoCard
          profile={profile}
          onOpenEditModal={handleOpenEditModal}
        />
      )}

      {/* TAB CONTENT 3: EMPLOYMENT DETAILS */}
      {activeSubTab === 'employment' && (
        <EmploymentInfoCard
          profile={profile}
          onOpenEditModal={handleOpenEditModal}
        />
      )}

      {/* TAB CONTENT 4: CONTACT DETAILS */}
      {activeSubTab === 'contact' && (
        <ContactInfoCard
          profile={profile}
          onOpenEditModal={handleOpenEditModal}
        />
      )}

      {/* TAB CONTENT 5: DOCUMENTS */}
      {activeSubTab === 'documents' && (
        <DocumentsTab userId={profile?.id} profile={profile} />
      )}

      {/* Modals */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        profile={profile}
        onProfileUpdated={(updated) => {
          setProfile(updated);
          if (onParentProfileUpdated) onParentProfileUpdated(updated);
        }}
      />

      <PhotoUploader
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        profile={profile}
        onPhotoUpdated={(newUrl) => setProfile(prev => ({ ...prev, photo_url: newUrl }))}
      />

      {/* Delete Employee Confirmation Modal */}
      {isDeleteModalOpen && profile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Delete Employee</h3>
                  <p className="text-[11px] text-slate-500">Permanent account removal</p>
                </div>
              </div>
              <button
                onClick={() => !isDeleting && setIsDeleteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to permanently delete employee <strong className="text-slate-900">{profile.name}</strong>?
              </p>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Employee:</span>
                  <span className="font-bold text-slate-800">{profile.name}</span>
                </div>
                {profile.email && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Email:</span>
                    <span className="font-semibold text-slate-800">{profile.email}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Department:</span>
                  <span className="font-semibold text-slate-800">{profile.department || 'General'}</span>
                </div>
              </div>

              <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-[11px] text-rose-800 leading-relaxed font-medium">
                ⚠️ This will permanently remove their user credentials, daily work log submissions, leave applications, quotas, and records from the PWH System.
              </div>

              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={deleteZoho}
                  onChange={(e) => setDeleteZoho(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <span>Also delete record from Zoho Books (`cm_employee`)</span>
              </label>

              {deleteError && (
                <div className="p-3 rounded-xl text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                  {deleteError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 mt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Delete Employee</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
