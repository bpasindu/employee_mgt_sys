import React, { useState, useEffect } from 'react';
import API from './api';

// Authentication Landing Page
import LoginPage from './components/LoginPage';

// Employee Dashboard Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import GreetingBanner from './components/GreetingBanner';
import DailyWorkCard from './components/DailyWorkCard';
import LeaveBalanceCard from './components/LeaveBalanceCard';
import RecentLeaveRequestsCard from './components/RecentLeaveRequestsCard';
import ApplyLeaveModal from './components/ApplyLeaveModal';
import WorkHistoryView from './components/WorkHistoryView';
import LeaveHistoryView from './components/LeaveHistoryView';

// Admin Dashboard Components
import AdminSidebar from './components/admin/AdminSidebar';
import AdminHeader from './components/admin/AdminHeader';
import StatCardsGrid from './components/admin/StatCardsGrid';
import TodaysWorkforceTable from './components/admin/TodaysWorkforceTable';
import TodaysLeaveCards from './components/admin/TodaysLeaveCards';
import HalfDayAndStudyLeave from './components/admin/HalfDayAndStudyLeave';
import PendingLeaveRequestsTable from './components/admin/PendingLeaveRequestsTable';
import AdminAllEmployeesView from './components/admin/AdminAllEmployeesView';

export default function App() {
  // Navigation View: 'login' | 'admin' | 'employee'
  const [currentView, setCurrentView] = useState('login');
  const [activeTab, setActiveTab] = useState('dashboard');

  // Logged in User State
  const [currentUser, setCurrentUser] = useState(null);

  // Employee Dashboard State
  const [user, setUser] = useState({
    name: 'Kasun Perera',
    title: 'Software Engineer',
    initials: 'KP',
    status: 'Working'
  });
  const [todayWork, setTodayWork] = useState('Working on the customer dashboard UI');
  const [leaveBalance, setLeaveBalance] = useState({ total_days: 24, used_days: 10, available_days: 14 });
  const [recentLeaveRequests, setRecentLeaveRequests] = useState([]);
  const [isApplyLeaveOpen, setIsApplyLeaveOpen] = useState(false);

  // Admin Dashboard State
  const [adminUser, setAdminUser] = useState({
    name: 'Nadeesha Silva',
    title: 'System Administrator',
    initials: 'NS',
    role: 'Admin'
  });
  const [adminStats, setAdminStats] = useState({
    total_employees: 20,
    working_today: 14,
    on_leave_today: 3,
    half_day: 2,
    study_leave: 1,
    pending_requests: 4
  });
  const [workingWorkforce, setWorkingWorkforce] = useState([]);
  const [todaysLeave, setTodaysLeave] = useState([]);
  const [halfDayEmployees, setHalfDayEmployees] = useState([]);
  const [studyLeaveEmployees, setStudyLeaveEmployees] = useState([]);
  const [pendingLeaveRequests, setPendingLeaveRequests] = useState([]);

  useEffect(() => {
    if (currentView === 'admin') {
      fetchAdminSummary();
    } else if (currentView === 'employee') {
      fetchEmployeeSummary();
    }
  }, [currentView]);

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
        if (res.data.pendingLeaveRequests) setPendingLeaveRequests(res.data.pendingLeaveRequests);
      }
    } catch (err) {
      console.error('Failed to load admin summary:', err);
    }
  };

  const fetchEmployeeSummary = async () => {
    try {
      const res = await API.get('/dashboard/summary');
      if (res.data) {
        if (res.data.user && (!currentUser || currentUser.role !== 'Employee')) setUser(res.data.user);
        if (res.data.todayWork !== undefined) setTodayWork(res.data.todayWork);
        if (res.data.leaveBalance) setLeaveBalance(res.data.leaveBalance);
        if (res.data.recentLeaveRequests) setRecentLeaveRequests(res.data.recentLeaveRequests);
      }
    } catch (err) {
      console.error('Failed to load employee summary:', err);
    }
  };

  // Auth Handlers
  const handleLoginSuccess = (loggedInUser) => {
    setCurrentUser(loggedInUser);
    if (loggedInUser.role === 'Admin') {
      setAdminUser(loggedInUser);
      setCurrentView('admin');
      setActiveTab('admin-dashboard');
    } else {
      setUser(loggedInUser);
      setCurrentView('employee');
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('login');
  };

  // Admin Actions
  const handleApproveLeave = async (id) => {
    try {
      await API.post('/admin/leave/approve', { id });
      await fetchAdminSummary();
    } catch (err) {
      console.error('Failed to approve leave:', err);
    }
  };

  const handleRejectLeave = async (id) => {
    try {
      await API.post('/admin/leave/reject', { id });
      await fetchAdminSummary();
    } catch (err) {
      console.error('Failed to reject leave:', err);
    }
  };

  // Employee Actions
  const handleSaveWork = async (newDescription) => {
    try {
      await API.post('/work-entry', { work_description: newDescription });
      setTodayWork(newDescription);
    } catch (err) {
      console.error('Failed to save work entry:', err);
    }
  };

  const handleSubmitLeave = async (leaveData) => {
    try {
      await API.post('/leave/apply', leaveData);
      await fetchEmployeeSummary();
    } catch (err) {
      console.error('Failed to submit leave:', err);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      setUser(prev => ({ ...prev, status: newStatus }));
      await API.patch('/user/status', { status: newStatus });
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const toggleViewMode = () => {
    const nextMode = currentView === 'admin' ? 'employee' : 'admin';
    setCurrentView(nextMode);
    setActiveTab(nextMode === 'admin' ? 'admin-dashboard' : 'dashboard');
  };

  const adminTitles = {
    'admin-dashboard': 'Dashboard',
    'all-employees': 'All Employees',
    'work-activity': 'Work Activity',
    'admin-leave-requests': 'Leave Requests',
    'leave-calendar': 'Leave Calendar',
    'settings': 'System Settings'
  };

  const employeeTitles = {
    'dashboard': 'Dashboard',
    'work-history': "Today's Work Log",
    'leave-history': 'My Leave History'
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
          setActiveTab={setActiveTab}
          adminUser={adminUser}
          onLogout={handleLogout}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <AdminHeader
            title={adminTitles[activeTab] || 'Dashboard'}
            adminUser={adminUser}
            currentViewMode={currentView}
            onToggleViewMode={toggleViewMode}
          />

          <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">
            {activeTab === 'admin-dashboard' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight tracking-tight">
                    Workforce overview
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                    A live snapshot of your team for {new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())}.
                  </p>
                </div>

                <StatCardsGrid stats={adminStats} />
                <TodaysWorkforceTable workforce={workingWorkforce} />
                <TodaysLeaveCards leaves={todaysLeave} />
                <HalfDayAndStudyLeave
                  halfDayList={halfDayEmployees}
                  studyLeaveList={studyLeaveEmployees}
                />
                <PendingLeaveRequestsTable
                  requests={pendingLeaveRequests}
                  onApprove={handleApproveLeave}
                  onReject={handleRejectLeave}
                  onViewAll={() => setActiveTab('admin-leave-requests')}
                />
              </div>
            )}

            {activeTab === 'all-employees' && <AdminAllEmployeesView />}

            {activeTab === 'admin-leave-requests' && (
              <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Leave Requests Management</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Review, approve, or reject employee leave applications.</p>
                  </div>
                </div>
                <PendingLeaveRequestsTable
                  requests={pendingLeaveRequests}
                  onApprove={handleApproveLeave}
                  onReject={handleRejectLeave}
                />
              </div>
            )}

            {(activeTab === 'work-activity' || activeTab === 'leave-calendar' || activeTab === 'settings') && (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs max-w-4xl mx-auto">
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
        setActiveTab={setActiveTab}
        onOpenApplyLeave={() => setIsApplyLeaveOpen(true)}
        user={user}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={employeeTitles[activeTab] || 'Dashboard'}
          user={user}
        />

        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8 space-y-6">
                <GreetingBanner user={user} onUpdateStatus={handleUpdateStatus} />
                <DailyWorkCard initialWork={todayWork} onSaveWork={handleSaveWork} />
              </div>
              <div className="lg:col-span-4 space-y-6">
                <LeaveBalanceCard leaveBalance={leaveBalance} />
                <RecentLeaveRequestsCard requests={recentLeaveRequests} />
              </div>
            </div>
          )}

          {activeTab === 'work-history' && <WorkHistoryView />}

          {activeTab === 'leave-history' && (
            <LeaveHistoryView onOpenApplyLeave={() => setIsApplyLeaveOpen(true)} />
          )}
        </main>
      </div>

      <ApplyLeaveModal
        isOpen={isApplyLeaveOpen}
        onClose={() => setIsApplyLeaveOpen(false)}
        onSubmitLeave={handleSubmitLeave}
      />
    </div>
  );
}
