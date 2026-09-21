import React, { useState } from 'react';
import { Search, Bell, ChevronDown, User, ShieldCheck } from 'lucide-react';

export default function AdminHeader({ title, adminUser, currentViewMode, onToggleViewMode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
        {/* Role Switcher Pill */}
        <button
          onClick={onToggleViewMode}
          className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
          title="Switch Dashboard View"
        >
          {currentViewMode === 'admin' ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Admin Mode</span>
              <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-md font-bold ml-1">Switch to Employee</span>
            </>
          ) : (
            <>
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>Employee Mode</span>
              <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-md font-bold ml-1">Switch to Admin</span>
            </>
          )}
        </button>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search"
            className="bg-slate-50 border border-slate-200 text-sm text-slate-700 placeholder-slate-400 rounded-xl pl-9 pr-4 py-1.5 w-56 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>



        {/* Profile Avatar & Dropdown */}
        <div className="relative">
          <div
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-1.5 cursor-pointer pl-1 hover:opacity-85 transition-opacity"
          >
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-900 font-bold text-xs flex items-center justify-center border border-blue-200 shadow-xs">
              {adminUser?.initials || 'NS'}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>

          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-20 text-xs font-medium text-slate-700">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="font-bold text-slate-900">{adminUser?.name || 'Nadeesha Silva'}</p>
              </div>
              <button
                onClick={() => {
                  onToggleViewMode();
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 text-blue-600 font-semibold"
              >
                Switch View Mode
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
