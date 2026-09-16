import React, { useState, useEffect } from 'react';
import API from '../api';
import { ClipboardList, Plus } from 'lucide-react';

export default function LeaveHistoryView({ onOpenApplyLeave }) {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaveHistory();
  }, []);

  const fetchLeaveHistory = async () => {
    try {
      const res = await API.get('/leave/history');
      setLeaves(res.data || []);
    } catch (err) {
      console.error('Failed to fetch leave history:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">My Leave History</h2>
          <p className="text-xs text-slate-500 mt-0.5">Track your submitted leave requests and approval status.</p>
        </div>
        <button
          onClick={onOpenApplyLeave}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Apply Leave</span>
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-8 text-center text-slate-400 text-sm">Loading leave history...</div>
      ) : leaves.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600">No leave history found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-3.5">Leave Type</th>
                <th className="px-6 py-3.5">Duration</th>
                <th className="px-6 py-3.5">Days</th>
                <th className="px-6 py-3.5">Reason</th>
                <th className="px-6 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {leaves.map((leave) => {
                const sDate = leave.start_date ? leave.start_date.split('T')[0] : '';
                const eDate = leave.end_date ? leave.end_date.split('T')[0] : '';

                return (
                  <tr key={leave.id || Math.random()} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">{leave.leave_type}</td>
                    <td className="px-6 py-4 text-slate-600">{sDate} to {eDate}</td>
                    <td className="px-6 py-4 text-slate-700 font-semibold">{leave.days_count}</td>
                    <td className="px-6 py-4 text-slate-500 max-w-xs truncate">{leave.reason || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border ${
                        leave.status === 'Approved'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200/80'
                          : leave.status === 'Pending'
                          ? 'bg-amber-50 text-amber-600 border-amber-200/80'
                          : 'bg-rose-50 text-rose-600 border-rose-200/80'
                      }`}>
                        {leave.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
