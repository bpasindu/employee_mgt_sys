import React from 'react';
import { Ban } from 'lucide-react';
import { getLeaveCancellationStatus, formatSpecialDays } from '../utils/leaveUtils';

export default function RecentLeaveRequestsCard({ requests = [], onCancelLeave }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/80">
      <h3 className="text-base font-bold text-slate-900 mb-2">Recent leave requests</h3>

      {requests.length === 0 ? (
        <div className="py-6 text-center text-slate-400 text-xs font-medium">
          No recent leave requests found.
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {requests.map((req) => {
            const isSpecial = req.leave_type === 'Special Leave' || req.leave_type?.includes('Special');
            const isShortLeave = req.leave_type === 'Short Leave' || req.leave_type?.includes('Short');
            const isPowerCut = req.leave_type === 'Power Cut' || req.leave_type?.includes('Power Cut');
            const isWeatherCondition = req.leave_type === 'Weather Condition' || req.leave_type?.includes('Weather Condition');
            const daysText = isSpecial && req.day_of_week 
              ? formatSpecialDays(req.day_of_week)
              : isShortLeave && req.start_time && req.end_time
              ? `${req.start_time.slice(0,5)} - ${req.end_time.slice(0,5)}`
              : `${req.days_count} ${req.days_count === 1 ? 'Day' : 'Days'}`;
            const dateFormatted = req.start_date ? req.start_date.split('T')[0] : '';
            const cancelStatus = getLeaveCancellationStatus(req);

            return (
              <div key={req.id || Math.random()} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between first:pt-2 last:pb-0 gap-2.5">
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-800 leading-tight">
                    {isSpecial ? (
                      <span className="text-purple-700 font-bold flex items-center gap-1">
                        🔄 Special Leave
                      </span>
                    ) : isShortLeave ? (
                      <span className="text-teal-700 font-bold flex items-center gap-1">
                        ⏱️ Short Leave
                      </span>
                    ) : isPowerCut ? (
                      <span className="text-amber-800 font-bold flex items-center gap-1">
                        ⚡ Power Cut
                      </span>
                    ) : isWeatherCondition ? (
                      <span className="text-sky-800 font-bold flex items-center gap-1">
                        🌧️ Weather Condition
                      </span>
                    ) : req.leave_type}
                  </h4>
                  <p className="text-xs font-medium text-slate-400 mt-0.5 truncate">
                    {dateFormatted} · {daysText}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto flex-wrap">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-xl border ${
                    req.status === 'Approved'
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200/80'
                      : req.status === 'Pending'
                      ? 'bg-amber-50 text-amber-600 border-amber-200/80'
                      : req.status === 'Cancelled'
                      ? 'bg-slate-100 text-slate-500 border-slate-200'
                      : 'bg-rose-50 text-rose-600 border-rose-200/80'
                  }`}>
                    {req.status}
                  </span>

                  {cancelStatus.canCancel && onCancelLeave && (
                    <button
                      onClick={() => onCancelLeave(req)}
                      className="bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 hover:text-rose-800 border border-rose-200 hover:border-rose-300 text-xs font-bold px-2.5 py-1 rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title={
                        isWeatherCondition 
                          ? 'Weather cleared? Cancel leave and resume work' 
                          : isPowerCut 
                          ? 'Power back? Cancel leave and resume work' 
                          : 'Cancel leave request'
                      }
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
