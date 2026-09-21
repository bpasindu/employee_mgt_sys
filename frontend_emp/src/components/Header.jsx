import React from 'react';
import { Search, Bell, ChevronDown, ShieldCheck } from 'lucide-react';

export default function Header({ title, user, onToggleViewMode }) {
  // Format current or display date matching screenshot: "Monday, September 14, 2026"
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date());

  return (
    <header className="bg-white border-b border-slate-200/80 px-8 py-4 flex items-center justify-between sticky top-0 z-10 shadow-xs">
      {/* Title & Date */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 leading-tight">{title || 'Dashboard'}</h2>
        <p className="text-xs text-slate-500 font-medium mt-0.5">{formattedDate}</p>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Switch to Admin button — only shown if the logged-in user is an Admin */}
        {onToggleViewMode && (
          <button
            onClick={onToggleViewMode}
            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
            title="Switch to Admin Dashboard"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Employee Mode</span>
            <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-md font-bold ml-1">Switch to Admin</span>
          </button>
        )}
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search"
            className="bg-slate-50 border border-slate-200 text-sm text-slate-700 placeholder-slate-400 rounded-xl pl-9 pr-4 py-1.5 w-60 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>



        {/* Profile Initials Dropdown */}
        <div className="flex items-center gap-1.5 cursor-pointer pl-2 hover:opacity-85 transition-opacity">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-900 font-bold text-xs flex items-center justify-center border border-blue-200 shadow-xs">
            {user?.initials || 'KP'}
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>
    </header>
  );
}
