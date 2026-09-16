import React from 'react';
import { Calendar } from 'lucide-react';

export default function LeaveBalanceCard({ leaveBalance }) {
  const available = leaveBalance?.available_days ?? 14;
  const used = leaveBalance?.used_days ?? 10;
  const total = leaveBalance?.total_days ?? 24;

  const usedPercentage = Math.min(100, Math.max(0, (used / total) * 100));

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/80 mb-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500">Available leave</p>
        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
          <Calendar className="w-5 h-5" />
        </div>
      </div>

      {/* Main Stat */}
      <div className="my-2">
        <span className="text-4xl font-black text-slate-900 tracking-tight">{available}</span>
        <span className="text-sm font-medium text-slate-500 ml-2">days</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden my-3">
        <div
          className="bg-[#07162c] h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${usedPercentage}%` }}
        />
      </div>

      {/* Progress Legend */}
      <div className="flex items-center justify-between text-xs font-medium text-slate-500">
        <span>{used} days used</span>
        <span>{total} total</span>
      </div>
    </div>
  );
}
