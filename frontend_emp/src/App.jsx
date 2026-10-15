import React, { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import API from './api';

// Authentication Landing Page
import LoginPage from './components/LoginPage';

// Employee Dashboard Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import GreetingBanner from './components/GreetingBanner';
import DailyWorkCard from './components/DailyWorkCard';
import LeaveBalanceCard from './components/LeaveBalanceCard';
import TeamDutyStatusCard from './components/TeamDutyStatusCard';
import RecentLeaveRequestsCard from './components/RecentLeaveRequestsCard';
import ApplyLeaveModal from './components/ApplyLeaveModal';
import WorkHistoryView from './components/WorkHistoryView';
import LeaveHistoryView from './components/LeaveHistoryView';
import VisitFormView from './components/VisitFormView';
import EmployeeProfileView from './components/EmployeeProfileView';

// Admin Dashboard Components
import AdminSidebar from './components/admin/AdminSidebar';
import AdminHeader from './components/admin/AdminHeader';
import StatCardsGrid from './components/admin/StatCardsGrid';
import TodaysWorkforceTable from './components/admin/TodaysWorkforceTable';
import TodaysLeaveCards from './components/admin/TodaysLeaveCards';
import HalfDayAndStudyLeave from './components/admin/HalfDayAndStudyLeave';
import PendingLeaveRequestsTable from './components/admin/PendingLeaveRequestsTable';
import AllLeavesTable from './components/admin/AllLeavesTable';
import AdminAllEmployeesView from './components/admin/AdminAllEmployeesView';
import AdminAddEmployeeView from './components/admin/AdminAddEmployeeView';
import AdminWorkActivityView from './components/admin/AdminWorkActivityView';
import AdminClientAnalyticsView from './components/admin/AdminClientAnalyticsView';
import LeaveCalendarView from './components/admin/LeaveCalendarView';

export default function App() {
  // Navigation View: 'login' | 'admin' | 'employee'
  const [currentView, setCurrentView] = useState('login');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Logged in User State — restored from localStorage on mount
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('emp_mgt_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  // Employee Dashboard State
  const [user, setUser] = useState({
    name: '',
    title: '',
    initials: '',
    status: 'Working'
  });
  const [todayWork, setTodayWork] = useState('');
  const [leaveBalance, setLeaveBalance] = useState({
    total_days: 21,
    used_days: 0,
    available_days: 21,
    casual: { total_days: 7, used_days: 0, available_days: 7 },
    annual: { total_days: 14, used_days: 0, available_days: 14 }
  });
  const [recentLeaveRequests, setRecentLeaveRequests] = useState([]);
  const [isApplyLeaveOpen, setIsApplyLeaveOpen] = useState(false);
  const [cancelTargetModal, setCancelTargetModal] = useState(null);
  const [isCancellingLeave, setIsCancellingLeave] = useState(false);

  // Admin Dashboard State
  const [adminUser, setAdminUser] = useState({
    name: 'Administrator',
    title: 'System Administrator',
    initials: 'AD',
    role: 'Admin'
  });
  const [adminStats, setAdminStats] = useState({
    total_employees: 0,
    working_today: 0,
    on_leave_today: 0,
    half_day: 0,
    study_leave: 0,
    pending_requests: 0,
    upcoming_leaves: 0
  });
  const [workingWorkforce, setWorkingWorkforce] = useState([]);
  const [todaysLeave, setTodaysLeave] = useState([]);
  const [halfDayEmployees, setHalfDayEmployees] = useState([]);
  const [studyLeaveEmployees, setStudyLeaveEmployees] = useState([]);
  const [specialLeaveEmployees, setSpecialLeaveEmployees] = useState([]);
  const [pendingLeaveRequests, setPendingLeaveRequests] = useState([]);
  const [upcomingLeaves, setUpcomingLeaves] = useState([]);
  const [allLeaves, setAllLeaves] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);

  // On mount: if a saved session exists, restore the correct view
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'Admin') {
        setAdminUser(currentUser);
        setCurrentView('admin');
        setActiveTab('admin-dashboard');
      } else {
        setUser(prev => ({ ...prev, ...currentUser }));
        setCurrentView('employee');
        setActiveTab('dashboard');
        fetchEmployeeSummary(currentUser.id);
      }
    }
  }, []);

  useEffect(() => {
    if (currentView === 'admin') {
      fetchAdminSummary();
    } else if (currentView === 'employee' && currentUser?.id) {
      if (activeTab === 'dashboard') {
        fetchEmployeeSummary(currentUser.id);
      }
    }
  }, [currentView, activeTab]);

  const fetchAdminSummary = async () => {
    try {
      const res = await API.get('/admin/summary');
      if (res.data) {
        if (res.data.adminUser && (!currentUser || currentUser.role !== 'Admin')) setAdminUser(res.data.adminUser);
        if (res.data.stats) setAdminStats(res.data.stats);
        if (res.data.workingWorkforce) setWorkingWorkforce(res.data.workingWorkforce);
        if (res.data.todaysLeave) setTodaysLeave(res.data.todaysLeave);
        if (res.data.halfDayEmployees) setHalfDayEmployees(res.data.halfDayEmployees);
        if (res.data.studyLeaveEmployees) setStudyLeaveEmployees(res.data.studyLeaveEmployees);
        if (res.data.specialLeaveEmployees) setSpecialLeaveEmployees(res.data.specialLeaveEmployees);
        if (res.data.pendingLeaveRequests) setPendingLeaveRequests(res.data.pendingLeaveRequests);
        if (res.data.upcomingLeaves) setUpcomingLeaves(res.data.upcomingLeaves);
        if (res.data.allLeaves) setAllLeaves(res.data.allLeaves);
        if (res.data.allEmployees) setAllEmployees(res.data.allEmployees);
      }
    } catch (err) {
      console.error('Failed to load admin summary:', err);
    }
  };

  const fetchEmployeeSummary = async (userId) => {
    const uid = userId || currentUser?.id;
    if (!uid) return;
    try {
      const res = await API.get(`/dashboard/summary?user_id=${uid}`);
      if (res.data) {
        if (res.data.user) {
          setUser(prev => {
            const merged = { ...prev };
            Object.keys(res.data.user).forEach(k => {
              if (res.data.user[k] !== undefined && res.data.user[k] !== null && res.data.user[k] !== '') {
                merged[k] = res.data.user[k];
              }
            });
            return merged;
          });
        }
        if (res.data.todayWork !== undefined) setTodayWork(res.data.todayWork);
        if (res.data.leaveBalance) setLeaveBalance(res.data.leaveBalance);
        if (res.data.recentLeaveRequests) setRecentLeaveRequests(res.data.recentLeaveRequests);
        if (res.data.workingWorkforce) setWorkingWorkforce(res.data.workingWorkforce);
        if (res.data.todaysLeave) setTodaysLeave(res.data.todaysLeave);
      }
    } catch (err) {
      console.error('Failed to load employee summary:', err);
    }
  };

  // Auth Handlers
  const handleLoginSuccess = (loggedInUser) => {
    setCurrentUser(loggedInUser);
    localStorage.setItem('emp_mgt_user', JSON.stringify(loggedInUser));
    if (loggedInUser.role === 'Admin') {
      setAdminUser(loggedInUser);
      setCurrentView('admin');
      setActiveTab('admin-dashboard');
    } else {
      setUser(loggedInUser);
      setCurrentView('employee');
      setActiveTab('dashboard');
      fetchEmployeeSummary(loggedInUser.id);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('emp_mgt_user');
    setCurrentView('login');
  };

  // Admin Actions (Optimistic UI: updates within <1 second)
  const handleApproveLeave = async (id) => {
    const prevPending = pendingLeaveRequests;
    // Optimistic removal: instantly disappears from table and updates badge
    setPendingLeaveRequests(prev => prev.filter(r => r.id !== id));
    setAdminStats(prev => prev ? { ...prev, pending_requests: Math.max(0, (prev.pending_requests || 1) - 1) } : prev);

    try {
      await API.post('/admin/leave/approve', { id, admin_email: currentUser?.email });
      // Non-blocking background sync
      fetchAdminSummary().catch(console.error);
    } catch (err) {
      console.error('Failed to approve leave:', err);
      // Rollback on failure
      setPendingLeaveRequests(prevPending);
      setAdminStats(prev => prev ? { ...prev, pending_requests: prevPending.length } : prev);
      const msg = err.response?.data?.error || err.message || 'Failed to approve leave request';
      alert(`⚠️ Approval Restricted:\n${msg}`);
    }
  };

  const handleRejectLeave = async (id) => {
    const prevPending = pendingLeaveRequests;
    setPendingLeaveRequests(prev => prev.filter(r => r.id !== id));
    setAdminStats(prev => prev ? { ...prev, pending_requests: Math.max(0, (prev.pending_requests || 1) - 1) } : prev);

    try {
      await API.post('/admin/leave/reject', { id });
      fetchAdminSummary().catch(console.error);
    } catch (err) {
      console.error('Failed to reject leave:', err);
      setPendingLeaveRequests(prevPending);
      setAdminStats(prev => prev ? { ...prev, pending_requests: prevPending.length } : prev);
    }
  };

  const handleAdminCancelLeave = async (id) => {
    const prevLeaves = allLeaves;
    // Optimistic UI update
    setAllLeaves(prev => prev.map(l => l.id === id ? { ...l, status: 'Cancelled by Admin' } : l));

    try {
      await API.post('/admin/leave/cancel', { id });
      fetchAdminSummary().catch(console.error);
    } catch (err) {
      console.error('Failed to cancel leave by admin:', err);
      setAllLeaves(prevLeaves);
      const msg = err.response?.data?.error || err.message || 'Failed to cancel leave request';
      alert(`⚠️ Cancel Failed:\n${msg}`);
      throw err;
    }
  };

  // Employee Actions
  const handleSaveWork = async (newDescription, clients = []) => {
    if (!currentUser?.id) return;
    try {
      const res = await API.post('/work-entry', { user_id: currentUser.id, work_description: newDescription, clients });
      setTodayWork(res.data?.work_description || newDescription);
    } catch (err) {
      console.error('Failed to save work entry:', err);
    }
  };

  const handleSubmitLeave = async (leaveData) => {
    if (!currentUser?.id) return;
    try {
      await API.post('/leave/apply', { ...leaveData, user_id: currentUser.id });
      await fetchEmployeeSummary(currentUser.id);
    } catch (err) {
      console.error('Failed to submit leave:', err);
      throw err;
    }
  };

  const handleCancelLeave = (leave) => {
    if (!leave?.id || !currentUser?.id) return;
    setCancelTargetModal(leave);
  };

  const handleConfirmCancelLeave = async () => {
    if (!cancelTargetModal?.id || !currentUser?.id) return;
    setIsCancellingLeave(true);
    try {
      await API.post('/leave/cancel', { id: cancelTargetModal.id, user_id: currentUser.id });
      setCancelTargetModal(null);
      await fetchEmployeeSummary(currentUser.id);
    } catch (err) {
      console.error('Failed to cancel leave:', err);
      const msg = err.response?.data?.error || err.message || 'Failed to cancel leave request';
      alert(`⚠️ Could not cancel leave:\n${msg}`);
    } finally {
      setIsCancellingLeave(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!currentUser?.id) return;
    try {
      setUser(prev => ({ ...prev, status: newStatus }));
      await API.patch('/user/status', { user_id: currentUser.id, status: newStatus });
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const toggleViewMode = () => {
    const nextMode = currentView === 'admin' ? 'employee' : 'admin';
    setCurrentView(nextMode);
    setActiveTab(nextMode === 'admin' ? 'admin-dashboard' : 'dashboard');
    setIsMobileOpen(false);
  };

  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Helper for selecting an employee to view profile (Restricted to Admin or Owner)
  const handleSelectEmployee = (emp) => {
    const isAdmin = user?.role === 'Admin';
    const isOwner = emp && user && String(emp.id) === String(user.id);
    if (isAdmin || isOwner) {
      setSelectedEmployee(emp);
      setActiveTab('profile');
    }
  };

  const adminTitles = {
    'admin-dashboard': 'Dashboard',
    'all-employees': 'All Employees',
    'add-employee': 'Add New Employee',
    'work-activity': 'Work Activity',
    'client-analytics': 'Client Analytics',
    'admin-leave-requests': 'Leave Requests',
    'leave-calendar': 'Leave Calendar',
    'settings': 'System Settings',
    'profile': 'Employee Profile'
  };

  const employeeTitles = {
    'dashboard': 'Dashboard',
    'work-history': "Today's Work Log",
    'profile': 'Employee Profile',
    'leave-history': 'My Leave History',
    'visit-form': 'Visiting Form'
  };

  // VIEW 1: LANDING LOGIN PAGE (First Page User Sees)
  if (currentView === 'login') {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // VIEW 2: ADMIN DASHBOARD
  if (currentView === 'admin') {
    return (
      <div className="flex min-h-screen bg-[#f4f6fa] text-slate-800 font-sans antialiased">
        <AdminSidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            if (tab === 'profile' && !selectedEmployee) {
              setSelectedEmployee(null);
            }
            setActiveTab(tab);
          }}
          adminUser={adminUser}
          onLogout={handleLogout}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <AdminHeader
            title={adminTitles[activeTab] || 'Dashboard'}
            adminUser={adminUser}
            currentViewMode={currentView}
            onToggleViewMode={toggleViewMode}
            onOpenMyProfile={() => {
              setSelectedEmployee(null);
              setActiveTab('profile');
            }}
            onMenuClick={() => setIsMobileOpen(true)}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {activeTab === 'admin-dashboard' && (
              <div>
                <GreetingBanner user={currentUser || adminUser} />

                <div className="mb-6">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight tracking-tight">
                    Workforce overview
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                    A live snapshot of your team for {new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())}.
                  </p>
                </div>

                <StatCardsGrid 
                  stats={adminStats} 
                  workingWorkforce={workingWorkforce}
                  todaysLeave={todaysLeave}
                  halfDayEmployees={halfDayEmployees}
                  studyLeaveEmployees={studyLeaveEmployees}
                  specialLeaveEmployees={specialLeaveEmployees}
                  pendingLeaveRequests={pendingLeaveRequests}
                  upcomingLeaves={upcomingLeaves}
                  allEmployees={allEmployees}
                  onNavigateTab={setActiveTab}
                />
                <TodaysWorkforceTable workforce={workingWorkforce} />
                <TodaysLeaveCards leaves={todaysLeave} />
                <HalfDayAndStudyLeave
                  halfDayList={halfDayEmployees}
                  studyLeaveList={studyLeaveEmployees}
                />
                <PendingLeaveRequestsTable
                  requests={pendingLeaveRequests}
                  currentUser={currentUser}
                  onApprove={handleApproveLeave}
                  onReject={handleRejectLeave}
                  onViewAll={() => setActiveTab('admin-leave-requests')}
                />
              </div>
            )}

            {activeTab === 'all-employees' && <AdminAllEmployeesView employees={allEmployees} onSelectEmployee={handleSelectEmployee} />}

            {activeTab === 'add-employee' && <AdminAddEmployeeView />}

            {activeTab === 'admin-leave-requests' && (
              <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Leave Requests Management</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Review, approve, or reject employee leave applications, and inspect complete leave history.</p>
                  </div>
                </div>
                <PendingLeaveRequestsTable
                  requests={pendingLeaveRequests}
                  currentUser={currentUser}
                  onApprove={handleApproveLeave}
                  onReject={handleRejectLeave}
                />
                <AllLeavesTable leaves={allLeaves} onCancelLeave={handleAdminCancelLeave} />
              </div>
            )}

            {activeTab === 'work-activity' && <AdminWorkActivityView onSelectEmployee={handleSelectEmployee} />}

            {activeTab === 'client-analytics' && <AdminClientAnalyticsView />}

            {activeTab === 'leave-calendar' && <LeaveCalendarView />}

            {activeTab === 'profile' && (
              <EmployeeProfileView 
                onBack={() => {
                  setSelectedEmployee(null);
                  setActiveTab('admin-dashboard');
                }} 
                user={selectedEmployee || currentUser || adminUser}
                onSelectEmployee={handleSelectEmployee}
              />
            )}

            {activeTab === 'settings' && (
              <div className="bg-white rounded-2xl p-6 sm:p-12 text-center border border-slate-200 shadow-xs max-w-4xl mx-auto">
                <h3 className="text-lg font-bold text-slate-800 capitalize">{adminTitles[activeTab]}</h3>
                <p className="text-xs text-slate-500 mt-1">This section is active and configured for system administration.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    );
  }

  // VIEW 3: EMPLOYEE DASHBOARD
  return (
    <div className="flex min-h-screen bg-[#f4f6fa] text-slate-800 font-sans antialiased">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'profile') {
            setSelectedEmployee(null);
          }
          setActiveTab(tab);
        }}
        onOpenApplyLeave={() => setIsApplyLeaveOpen(true)}
        user={user}
        onLogout={handleLogout}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={employeeTitles[activeTab] || 'Dashboard'}
          user={user}
          onToggleViewMode={currentUser?.role === 'Admin' ? toggleViewMode : undefined}
          onMenuClick={() => setIsMobileOpen(true)}
          onNavigateTab={(tab) => {
            if (tab === 'profile') {
              setSelectedEmployee(null);
            }
            setActiveTab(tab);
          }}
          onLogout={handleLogout}
          onSelectEmployee={handleSelectEmployee}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (() => {
            const todayDateStr = new Date().toISOString().split('T')[0];
            const activeEmergencyLeave = recentLeaveRequests?.find(r => 
              (r.leave_type === 'Weather Condition' || r.leave_type === 'Power Cut') &&
              (r.status === 'Approved' || r.status === 'Pending') &&
              r.start_date && r.start_date.split('T')[0] <= todayDateStr &&
              r.end_date && r.end_date.split('T')[0] >= todayDateStr
            );

            return (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-8 space-y-6">
                  <GreetingBanner user={user} onUpdateStatus={handleUpdateStatus} />

                  {/* Active Emergency Leave Quick-Resume Banner */}
                  {activeEmergencyLeave && (
                    <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs transition-all ${
                      activeEmergencyLeave.leave_type === 'Weather Condition'
                        ? 'bg-gradient-to-r from-sky-50 to-blue-50/70 border-sky-200 text-sky-950'
                        : 'bg-gradient-to-r from-amber-50 to-yellow-50/70 border-amber-200 text-amber-950'
                    }`}>
                      <div className="flex items-center gap-3.5">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border text-2xl shadow-2xs ${
                          activeEmergencyLeave.leave_type === 'Weather Condition'
                            ? 'bg-sky-100 border-sky-300'
                            : 'bg-amber-100 border-amber-300'
                        }`}>
                          {activeEmergencyLeave.leave_type === 'Weather Condition' ? '🌧️' : '⚡'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/80 border border-slate-200/60 text-slate-700">
                              {activeEmergencyLeave.leave_type} ({activeEmergencyLeave.status})
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm font-bold text-slate-900 mt-1">
                            {activeEmergencyLeave.leave_type === 'Weather Condition'
                              ? 'Weather cleared? You can stop this leave anytime and resume working continuously.'
                              : 'Power restored? You can stop this leave anytime and resume working continuously.'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCancelLeave(activeEmergencyLeave)}
                        className="bg-white hover:bg-slate-50 active:scale-95 text-slate-900 font-extrabold text-xs px-4 py-2.5 rounded-xl border border-slate-300 shadow-xs hover:shadow transition-all shrink-0 cursor-pointer flex items-center justify-center gap-2"
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                        <span>Resume Work & Cancel Leave</span>
                      </button>
                    </div>
                  )}

                  <DailyWorkCard initialWork={todayWork} onSaveWork={handleSaveWork} />
                  <TeamDutyStatusCard 
                    workingWorkforce={workingWorkforce}
                    todaysLeave={todaysLeave}
                  />
                </div>
                <div className="lg:col-span-4 space-y-6">
                  <LeaveBalanceCard 
                    leaveBalance={leaveBalance} 
                    onOpenApplyLeave={() => setIsApplyLeaveOpen(true)} 
                  />
                  <RecentLeaveRequestsCard 
                    requests={recentLeaveRequests} 
                    onCancelLeave={handleCancelLeave} 
                  />
                </div>
              </div>
            );
          })()}

          {activeTab === 'work-history' && <WorkHistoryView userId={currentUser?.id} />}

          {activeTab === 'profile' && (
            <EmployeeProfileView 
              onBack={() => {
                setSelectedEmployee(null);
                setActiveTab('dashboard');
              }} 
              user={selectedEmployee || currentUser || user}
              onSelectEmployee={handleSelectEmployee}
              onProfileUpdated={(updated) => {
                if (updated && (String(updated.id) === String(currentUser?.id) || updated.email === currentUser?.email)) {
                  setUser(prev => ({ ...prev, ...updated }));
                  setCurrentUser(prev => ({ ...prev, ...updated }));
                  try {
                    const saved = localStorage.getItem('emp_mgt_user');
                    if (saved) {
                      const parsed = JSON.parse(saved);
                      localStorage.setItem('emp_mgt_user', JSON.stringify({ ...parsed, ...updated }));
                    }
                  } catch (e) {}
                }
              }}
            />
          )}

          {activeTab === 'leave-history' && (
            <LeaveHistoryView 
              userId={currentUser?.id} 
              onOpenApplyLeave={() => setIsApplyLeaveOpen(true)} 
              onLeaveCancelled={() => fetchEmployeeSummary(currentUser?.id)}
            />
          )}

          {activeTab === 'visit-form' && <VisitFormView />}
        </main>
      </div>

      <ApplyLeaveModal
        isOpen={isApplyLeaveOpen}
        onClose={() => setIsApplyLeaveOpen(false)}
        onSubmitLeave={handleSubmitLeave}
        user={user}
        leaveBalance={leaveBalance}
      />

      {/* Cancel Leave Confirmation Modal (Employee Dashboard) */}
      {cancelTargetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Cancel Leave Request</h3>
              </div>
              <button
                onClick={() => setCancelTargetModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to cancel this leave application?
              </p>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Leave Type:</span>
                  <span className="font-bold text-slate-800">{cancelTargetModal.leave_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Date / Period:</span>
                  <span className="font-semibold text-slate-800">
                    {cancelTargetModal.start_date === cancelTargetModal.end_date 
                      ? cancelTargetModal.start_date 
                      : `${cancelTargetModal.start_date} → ${cancelTargetModal.end_date}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Days / Duration:</span>
                  <span className="font-semibold text-slate-800">{cancelTargetModal.days_count} day(s)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Status:</span>
                  <span className={`font-bold ${cancelTargetModal.status === 'Approved' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {cancelTargetModal.status}
                  </span>
                </div>
              </div>

              {(() => {
                const isEmergencyQuotaExempt = cancelTargetModal.leave_type === 'Power Cut' || cancelTargetModal.leave_type === 'Weather Condition';
                if (isEmergencyQuotaExempt) {
                  return (
                    <div className="bg-sky-50 border border-sky-200 text-sky-900 text-xs p-3.5 rounded-xl font-medium leading-relaxed flex items-start gap-2.5">
                      <span className="text-lg shrink-0">{cancelTargetModal.leave_type === 'Weather Condition' ? '🌧️' : '⚡'}</span>
                      <div>
                        <strong className="text-sky-950 block">{cancelTargetModal.leave_type} (Quota-Exempt Emergency)</strong>
                        Cancelling this leave will immediately restore your active status to <strong className="text-emerald-700">Working</strong>. No leave quota deduction or refund is affected.
                      </div>
                    </div>
                  );
                }
                if (cancelTargetModal.status === 'Approved') {
                  return (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl font-medium leading-relaxed flex items-start gap-2.5">
                      <span className="text-lg shrink-0">💡</span>
                      <div>
                        <strong className="text-emerald-950">Leave Quota Refund:</strong> Since this leave was approved, <strong>{cancelTargetModal.days_count} day(s)</strong> will be automatically credited back to your available leave balance immediately upon cancellation.
                      </div>
                    </div>
                  );
                }
                return (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3.5 rounded-xl font-medium leading-relaxed">
                    ℹ️ This pending leave request will be marked as Cancelled and removed from admin review.
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 mt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCancelTargetModal(null)}
                disabled={isCancellingLeave}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Keep Leave
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelLeave}
                disabled={isCancellingLeave}
                className="bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isCancellingLeave 
                  ? 'Processing...' 
                  : (cancelTargetModal.leave_type === 'Power Cut' || cancelTargetModal.leave_type === 'Weather Condition'
                      ? 'Resume Work & Cancel Leave'
                      : 'Yes, Cancel Leave')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
