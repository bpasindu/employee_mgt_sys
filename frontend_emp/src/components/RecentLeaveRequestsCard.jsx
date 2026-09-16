import React from 'react';

export default function RecentLeaveRequestsCard({ requests = [] }) {
  // Default mock list matching the screenshot if empty
  const list = requests.length > 0 ? requests : [
    { id: 1, leave_type: 'Annual Leave', start_date: '2026-09-18', days_count: 2, status: 'Approved' },
    { id: 2, leave_type: 'Casual Leave', start_date: '2026-08-28', days_count: 1, status: 'Approved' },
    { id: 3, leave_type: 'Medical Leave', start_date: '2026-07-14', days_count: 2, status: 'Approved' }
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/80">
      <h3 className="text-base font-bold text-slate-900 mb-2">Recent leave requests</h3>

      <div className="divide-y divide-slate-100">
        {list.map((req) => {
          const daysText = `${req.days_count} ${req.days_count === 1 ? 'Day' : 'Days'}`;
          const dateFormatted = req.start_date ? req.start_date.split('T')[0] : '';

          return (
            <div key={req.id || Math.random()} className="py-3.5 flex items-center justify-between first:pt-2 last:pb-0">
              <div>
                <h4 className="text-sm font-bold text-slate-800 leading-tight">{req.leave_type}</h4>
                <p className="text-xs font-medium text-slate-400 mt-0.5">
                  {dateFormatted} · {daysText}
                </p>
              </div>

              <span className={`text-xs font-semibold px-3 py-1 rounded-xl border ${
                req.status === 'Approved'
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200/80'
                  : req.status === 'Pending'
                  ? 'bg-amber-50 text-amber-600 border-amber-200/80'
                  : 'bg-rose-50 text-rose-600 border-rose-200/80'
              }`}>
                {req.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
