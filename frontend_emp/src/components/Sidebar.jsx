import React from 'react';
import { 
  LayoutDashboard, 
  Briefcase, 
  CalendarPlus, 
  ClipboardList, 
  LogOut,
  Users
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, onOpenApplyLeave, user, onLogout }) {
  return (
    <aside className="w-64 bg-[#07162c] text-slate-300 flex flex-col justify-between h-screen sticky top-0 border-r border-slate-800 select-none shrink-0">
      {/* Top Branding & Navigation */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-8 px-1">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-snug tracking-tight">PeopleOps</h1>
            <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Work Management</p>
          </div>
        </div>

        {/* Navigation Section 1: MY WORKSPACE */}
        <div className="mb-6">
          <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase px-3 mb-2">My Workspace</p>
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-[#152a4a] text-white shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#0c1f3a]'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('work-history')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'work-history'
                  ? 'bg-[#152a4a] text-white shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#0c1f3a]'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Today's Work</span>
            </button>
          </nav>
        </div>

        {/* Navigation Section 2: LEAVE */}
        <div>
          <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase px-3 mb-2">Leave</p>
          <nav className="space-y-1">
            <button
              onClick={onOpenApplyLeave}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-[#0c1f3a] transition-all"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>Apply Leave</span>
            </button>

            <button
              onClick={() => setActiveTab('leave-history')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'leave-history'
                  ? 'bg-[#152a4a] text-white shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#0c1f3a]'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>My Leave History</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Bottom Profile Card */}
      <div className="p-4 border-t border-slate-800/80">
        <div className="bg-[#0c1f3a] rounded-2xl p-3 flex items-center justify-between border border-slate-800/90 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-slate-100 text-[#07162c] font-bold text-xs flex items-center justify-center shrink-0 shadow-inner">
              {user?.initials || 'KP'}
            </div>
            <div className="min-w-0">
              <h4 className="text-white text-xs font-semibold truncate leading-tight">
                {user?.name || 'Kasun Perera'}
              </h4>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                {user?.title || 'Software Engineer'}
              </p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            title="Log out"
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
