import React from 'react';
import { Clock } from 'lucide-react';

export default function HalfDayAndStudyLeave({ halfDayList = [], studyLeaveList = [] }) {
  const studyLeave = studyLeaveList.length > 0 ? studyLeaveList[0] : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      {/* Half-Day Employees Card */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-6 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Half-Day Employees</h3>
          <p className="text-xs text-slate-500 mt-0.5 mb-5">Employees with a partial work day</p>

          {halfDayList.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-xs font-medium bg-slate-50/50 rounded-2xl border border-slate-100">
              No employees on half-day schedule today.
            </div>
          ) : (
            <div className="space-y-4">
              {halfDayList.map((emp) => (
                <div key={emp.id || Math.random()} className="border border-slate-100 bg-slate-50/50 rounded-2xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                        {emp.initials}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{emp.name}</h4>
                        <p className="text-[11px] text-slate-500">
                          {emp.department} · {emp.half_day_type || 'Half Day'}
                        </p>
                      </div>
                    </div>
                    <span className="bg-amber-50 text-amber-600 border border-amber-200/80 text-[10px] font-bold px-2 py-0.5 rounded-md">
                      Half Day
                    </span>
                  </div>

                  {emp.time_slot && (
                    <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5 mt-2">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>{emp.time_slot}</span>
                    </div>
                  )}
                  <p className="text-xs text-slate-500 mt-1 font-medium">{emp.reason || 'Personal'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Study Leave Card */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-6 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Study Leave</h3>
          <p className="text-xs text-slate-500 mt-0.5 mb-5">Approved study time for today</p>

          {!studyLeave ? (
            <div className="py-6 text-center text-slate-400 text-xs font-medium bg-slate-50/50 rounded-2xl border border-slate-100">
              No employees on study leave today.
            </div>
          ) : (
            <div className="bg-[#eaf4fd] border border-blue-200/70 rounded-2xl p-6 relative overflow-hidden">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-900 font-bold text-xs flex items-center justify-center border border-blue-200 shrink-0">
                    {studyLeave.initials}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{studyLeave.name}</h4>
                    <p className="text-xs text-slate-600 mt-0.5 font-medium">
                      {studyLeave.department} · {studyLeave.position}
                    </p>
                  </div>
                </div>
                <span className="bg-sky-100 text-sky-700 border border-sky-200 text-[11px] font-bold px-2.5 py-1 rounded-md">
                  Study Leave
                </span>
              </div>

              {studyLeave.time_slot && (
                <div className="text-sm font-extrabold text-blue-900 flex items-center gap-2 my-3">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>{studyLeave.time_slot}</span>
                </div>
              )}
              <p className="text-xs text-slate-600 font-medium">{studyLeave.reason || 'Examination'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
