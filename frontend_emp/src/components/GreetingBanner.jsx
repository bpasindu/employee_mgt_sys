import React, { useState } from 'react';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12)  return { text: 'Good Morning',   emoji: '☀️' };
  if (hour >= 12 && hour < 17) return { text: 'Good Afternoon', emoji: '🌤️' };
  if (hour >= 17 && hour < 21) return { text: 'Good Evening',   emoji: '🌆' };
  return                                { text: 'Good Night',     emoji: '🌙' };
}

export default function GreetingBanner({ user, onUpdateStatus }) {
  const { text: greetingText, emoji: greetingEmoji } = getGreeting();
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date());

  const firstName = user?.name ? user.name.split(' ')[0] : 'Kasun';
  const currentStatus = user?.status || 'Working';

  const statuses = ['Working', 'WFH', 'On Leave'];

  return (
    <div className="bg-[#022851] text-white rounded-2xl p-6 shadow-sm border border-blue-900 relative overflow-hidden mb-6">
      {/* Date Header */}
      <p className="text-xs font-medium text-blue-200/90">{formattedDate}</p>

      {/* Main Greeting */}
      <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 mb-4 flex items-center gap-2">
        {greetingText}, {firstName} <span className="inline-block animate-bounce">{greetingEmoji}</span>
      </h2>

      {/* Status Badge */}
      <div className="relative inline-block">
        <button
          onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
          className="bg-blue-900/60 hover:bg-blue-900/90 border border-blue-400/30 text-white text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-xs transition-all cursor-pointer"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Today's Status: <strong>{currentStatus}</strong></span>
        </button>

        {/* Status Switch Dropdown */}
        {isStatusMenuOpen && (
          <div className="absolute left-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-20 text-slate-800">
            {statuses.map(st => (
              <button
                key={st}
                onClick={() => {
                  onUpdateStatus(st);
                  setIsStatusMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-slate-50 transition-colors ${
                  st === currentStatus ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-slate-700'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
