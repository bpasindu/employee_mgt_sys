import React from 'react';

export default function TodaysLeaveCards({ leaves = [] }) {
  const displayLeaves = leaves.length > 0 ? leaves : [
    { id: 15, name: 'Kavindu Perera', initials: 'KP', department: 'Operations', position: 'Operations Executive', leave_type: 'Annual Leave', duration: 'Full Day', reason: 'Personal' },
    { id: 16, name: 'Dilshan Fernando', initials: 'DF', department: 'Finance', position: 'Accounts Assistant', leave_type: 'Casual Leave', duration: 'Full Day', reason: 'Personal matter' },
    { id: 17, name: 'Shehan Silva', initials: 'SS', department: 'Marketing', position: 'Brand Executive', leave_type: 'Medical Leave', duration: 'Full Day', reason: 'Medical appointment' }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-6 mb-8">
      <div className="mb-5">
        <h3 className="text-lg font-bold text-slate-900">Today's Leave</h3>
        <p className="text-xs text-slate-500 mt-0.5">Employees away on approved full-day leave</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {displayLeaves.map((item) => (
          <div key={item.id || Math.random()} className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
            {/* Header info */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200 shrink-0">
                  {item.initials}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm leading-tight">{item.name}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {item.department} · {item.position}
                  </p>
                </div>
              </div>
              <span className="bg-rose-50 text-rose-600 border border-rose-200/80 text-[10px] font-bold px-2 py-1 rounded-md shrink-0">
                On Leave
              </span>
            </div>

            {/* Leave Details Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs mb-3 border-t border-slate-100 pt-3">
              <div>
                <span className="text-[11px] text-slate-400 font-medium block">Leave type</span>
                <span className="font-bold text-slate-800 text-xs mt-0.5 block">{item.leave_type}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-medium block">Duration</span>
                <span className="font-semibold text-slate-800 text-xs mt-0.5 block">{item.duration || 'Full Day'}</span>
              </div>
            </div>

            <div className="text-xs">
              <span className="text-[11px] text-slate-400 font-medium block">Reason</span>
              <span className="font-medium text-slate-700 text-xs mt-0.5 block">{item.reason}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
