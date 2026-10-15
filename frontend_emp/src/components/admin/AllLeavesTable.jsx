import React, { useState, useMemo } from 'react';
import { CheckCircle2, XCircle, Ban, Search, Calendar, FileText, FilterX, Clock, X, Loader2 } from 'lucide-react';

export default function AllLeavesTable({ leaves = [], onCancelLeave }) {
  const [cancelTarget, setCancelTarget] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'Approved' | 'Rejected' | 'Cancelled'
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Reset date filters
  const handleClearDateFilter = () => {
    setFromDate('');
    setToDate('');
  };

  // Counts for tabs
  const counts = useMemo(() => {
    const approved = leaves.filter(l => l.status === 'Approved').length;
    const rejected = leaves.filter(l => l.status === 'Rejected').length;
    const cancelled = leaves.filter(l => l.status === 'Cancelled' || l.status === 'Cancelled by Admin').length;
    return {
      all: leaves.length,
      approved,
      rejected,
      cancelled
    };
  }, [leaves]);

  // Filtered leaves list
  const filteredLeaves = useMemo(() => {
    return leaves.filter(item => {
      // 1. Status Filter
      if (activeFilter === 'Approved' && item.status !== 'Approved') return false;
      if (activeFilter === 'Rejected' && item.status !== 'Rejected') return false;
      if (activeFilter === 'Cancelled' && item.status !== 'Cancelled' && item.status !== 'Cancelled by Admin') return false;

      // 2. Date Filter (From Date & To Date)
      const itemFrom = item.from_date || '';
      const itemTo = item.to_date || itemFrom;

      if (fromDate) {
        // Leave must finish on or after the selected From Date
        if (itemTo < fromDate && itemFrom < fromDate) return false;
      }

      if (toDate) {
        // Leave must start on or before the selected To Date
        if (itemFrom > toDate) return false;
      }

      // 3. Search Term Filter
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        const empName = (item.employee_name || '').toLowerCase();
        const lType = (item.leave_type || '').toLowerCase();
        const reason = (item.reason || '').toLowerCase();
        const dept = (item.department || '').toLowerCase();
        const fromD = (item.from_date || '').toLowerCase();
        const toD = (item.to_date || '').toLowerCase();

        return (
          empName.includes(term) ||
          lType.includes(term) ||
          reason.includes(term) ||
          dept.includes(term) ||
          fromD.includes(term) ||
          toD.includes(term)
        );
      }

      return true;
    });
  }, [leaves, activeFilter, searchTerm, fromDate, toDate]);

  const hasActiveDateFilter = Boolean(fromDate || toDate);

  const handleConfirmCancel = async () => {
    if (!cancelTarget || !onCancelLeave) return;
    setIsCancelling(true);
    try {
      await onCancelLeave(cancelTarget.id);
      setCancelTarget(null);
    } catch (err) {
      console.error('Cancel leave failed:', err);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden mt-8">
      {/* Box Header */}
      <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200/60 shadow-2xs">
              <Calendar className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">All Leaves History</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Overview of all Approved, Rejected, and User Cancelled leaves
              </p>
            </div>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs font-bold border border-slate-200/60 self-start lg:self-auto">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({counts.all})
          </button>
          <button
            onClick={() => setActiveFilter('Approved')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'Approved'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approved ({counts.approved})
          </button>
          <button
            onClick={() => setActiveFilter('Rejected')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'Rejected'
                ? 'bg-red-600 text-white shadow-2xs'
                : 'text-red-700 hover:bg-red-50'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            Rejected ({counts.rejected})
          </button>
          <button
            onClick={() => setActiveFilter('Cancelled')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'Cancelled'
                ? 'bg-slate-700 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Ban className="w-3.5 h-3.5" />
            Cancelled ({counts.cancelled})
          </button>
        </div>
      </div>

      {/* Date Filter & Search Controls Bar */}
      <div className="bg-slate-50/70 p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        {/* Date Filter Inputs */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-slate-700 flex items-center gap-1.5 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            Filter by Date:
          </span>

          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-400">From:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="text-xs text-slate-800 font-semibold focus:outline-none bg-transparent cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-400">To:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="text-xs text-slate-800 font-semibold focus:outline-none bg-transparent cursor-pointer"
            />
          </div>

          {hasActiveDateFilter && (
            <button
              onClick={handleClearDateFilter}
              className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-bold px-2.5 py-1 rounded-xl flex items-center gap-1 transition-all cursor-pointer"
              title="Clear Date Filter"
            >
              <FilterX className="w-3 h-3" />
              Clear Date
            </button>
          )}
        </div>

        {/* Search Input Box */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search employee, leave type..."
            className="bg-white border border-slate-200 text-xs text-slate-700 placeholder-slate-400 rounded-xl pl-8 pr-3 py-1.5 w-44 sm:w-56 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
            <tr>
              <th className="px-6 py-3.5">Employee</th>
              <th className="px-6 py-3.5">Leave Type</th>
              <th className="px-6 py-3.5">From Date</th>
              <th className="px-6 py-3.5">To Date</th>
              <th className="px-6 py-3.5">Duration</th>
              <th className="px-6 py-3.5">Reason</th>
              <th className="px-6 py-3.5">Applied Date</th>
              <th className="px-6 py-3.5 text-center">Status</th>
              <th className="px-6 py-3.5 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filteredLeaves.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-10 text-center text-slate-400 font-medium">
                  <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  No leave records found matching the selected date and status filters.
                </td>
              </tr>
            ) : (
              filteredLeaves.map((item) => {
                let statusBadge = null;
                if (item.status === 'Approved') {
                  statusBadge = (
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold px-2.5 py-1 rounded-md inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Approved
                    </span>
                  );
                } else if (item.status === 'Rejected') {
                  statusBadge = (
                    <span className="bg-red-50 text-red-700 border border-red-200 text-[11px] font-bold px-2.5 py-1 rounded-md inline-flex items-center gap-1">
                      <XCircle className="w-3 h-3 text-red-600" />
                      Rejected
                    </span>
                  );
                } else if (item.status === 'Cancelled by Admin') {
                  statusBadge = (
                    <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold px-2.5 py-1 rounded-md inline-flex items-center gap-1">
                      <Ban className="w-3 h-3 text-rose-600" />
                      Cancelled by Admin
                    </span>
                  );
                } else if (item.status === 'Cancelled') {
                  statusBadge = (
                    <span className="bg-slate-100 text-slate-700 border border-slate-300 text-[11px] font-bold px-2.5 py-1 rounded-md inline-flex items-center gap-1">
                      <Ban className="w-3 h-3 text-slate-500" />
                      Cancelled by User
                    </span>
                  );
                } else {
                  statusBadge = (
                    <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold px-2.5 py-1 rounded-md">
                      {item.status}
                    </span>
                  );
                }

                return (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Employee */}
                    <td className="px-6 py-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-900 font-bold text-xs flex items-center justify-center border border-blue-200 shrink-0 overflow-hidden shadow-2xs">
                          {item.photo_url ? (
                            <img src={item.photo_url} alt={item.employee_name} className="w-full h-full object-cover" />
                          ) : (
                            item.initials || (item.employee_name ? item.employee_name.slice(0, 2).toUpperCase() : 'EP')
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-slate-900 font-extrabold">{item.employee_name}</div>
                          {item.department && <div className="text-[10px] text-slate-400 font-medium truncate">{item.department}</div>}
                        </div>
                      </div>
                    </td>

                    {/* Leave Type */}
                    <td className="px-6 py-4 text-slate-700 font-semibold">
                      {item.leave_type === 'Special Leave' ? (
                        <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-bold px-2.5 py-1 rounded-md inline-flex items-center gap-1">
                          🔄 Special Leave
                        </span>
                      ) : item.leave_type === 'Short Leave' ? (
                        <span className="bg-teal-50 text-teal-700 border border-teal-200 text-[11px] font-bold px-2.5 py-1 rounded-md inline-flex items-center gap-1">
                          ⏱️ Short Leave
                        </span>
                      ) : item.leave_type === 'Power Cut' ? (
                        <span className="bg-amber-50 text-amber-800 border border-amber-300 text-[11px] font-bold px-2.5 py-1 rounded-md inline-flex items-center gap-1 shadow-2xs">
                          ⚡ Power Cut
                        </span>
                      ) : item.leave_type === 'Weather Condition' ? (
                        <span className="bg-sky-50 text-sky-800 border border-sky-300 text-[11px] font-bold px-2.5 py-1 rounded-md inline-flex items-center gap-1 shadow-2xs">
                          🌧️ Weather Condition
                        </span>
                      ) : (
                        <span className="text-slate-800">{item.leave_type}</span>
                      )}
                    </td>

                    {/* From Date */}
                    <td className="px-6 py-4 text-slate-700 font-bold">{item.from_date || '-'}</td>

                    {/* To Date */}
                    <td className="px-6 py-4 text-slate-700 font-bold">{item.to_date || '-'}</td>

                    {/* Duration */}
                    <td className="px-6 py-4 font-bold text-slate-800">{item.duration || `${item.days_count} day(s)`}</td>

                    {/* Reason */}
                    <td className="px-6 py-4 text-slate-600 max-w-sm whitespace-pre-wrap break-words text-xs leading-relaxed" title={item.reason}>
                      {item.reason || '-'}
                    </td>

                    {/* Applied Date */}
                    <td className="px-6 py-4 text-slate-400 text-[11px]">{item.applied_date || '-'}</td>

                    {/* Status */}
                    <td className="px-6 py-4 text-center">{statusBadge}</td>

                    {/* Action */}
                    <td className="px-6 py-4 text-center">
                      {(item.status === 'Approved' || item.status === 'Pending') ? (
                        <button
                          onClick={() => setCancelTarget(item)}
                          className="bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 hover:text-rose-800 border border-rose-200 hover:border-rose-300 text-[11px] font-bold px-2.5 py-1 rounded-lg inline-flex items-center gap-1 transition-all cursor-pointer shadow-2xs hover:shadow-xs"
                          title="Cancel this leave request"
                        >
                          <Ban className="w-3 h-3 text-rose-600" />
                          <span>Cancel</span>
                        </button>
                      ) : (
                        <span className="text-slate-300 font-bold">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Admin Cancel Leave Confirmation Modal */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-base">
                <Ban className="w-5 h-5 text-rose-600" />
                <span>Cancel Leave Application</span>
              </div>
              <button
                onClick={() => setCancelTarget(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                disabled={isCancelling}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to cancel this leave for <strong className="text-slate-900">{cancelTarget.employee_name}</strong>?
            </p>

            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Employee:</span>
                <span className="font-bold text-slate-800">{cancelTarget.employee_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Leave Type:</span>
                <span className="font-bold text-slate-800">{cancelTarget.leave_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Dates:</span>
                <span className="font-bold text-slate-800">
                  {cancelTarget.from_date === cancelTarget.to_date
                    ? cancelTarget.from_date
                    : `${cancelTarget.from_date} → ${cancelTarget.to_date}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Duration:</span>
                <span className="font-bold text-slate-800">{cancelTarget.duration || `${cancelTarget.days_count} day(s)`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Current Status:</span>
                <span className="font-bold text-emerald-600">{cancelTarget.status}</span>
              </div>
            </div>

            {cancelTarget.status === 'Approved' && cancelTarget.leave_type !== 'Power Cut' && cancelTarget.leave_type !== 'Weather Condition' && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 leading-relaxed">
                ✨ <strong>Quota Restoration:</strong> The deducted <strong>{cancelTarget.days_count} day(s)</strong> will be automatically restored back to {cancelTarget.employee_name}&apos;s leave balance immediately upon cancellation.
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelTarget(null)}
                disabled={isCancelling}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                No, Keep Leave
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isCancelling}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-xs font-bold text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Cancelling...</span>
                  </>
                ) : (
                  <>
                    <Ban className="w-3.5 h-3.5" />
                    <span>Yes, Cancel Leave</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
