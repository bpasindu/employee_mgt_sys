import React, { useState, useEffect } from 'react';
import API from '../api';
import { Briefcase, Calendar, Clock } from 'lucide-react';

export default function WorkHistoryView({ userId }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) fetchHistory();
  }, [userId]);

  const fetchHistory = async () => {
    try {
      const res = await API.get(`/work-entry/history?user_id=${userId}`);
      setEntries(res.data || []);
    } catch (err) {
      console.error('Failed to fetch work history:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Today's Work Log & History</h2>
          <p className="text-xs text-slate-500 mt-0.5">Review your past daily work entries and logged priorities.</p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-8 text-center text-slate-400 text-sm">Loading history...</div>
      ) : entries.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600">No work entries logged yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div key={entry.id || Math.random()} className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {entry.entry_date ? entry.entry_date.split('T')[0] : 'Today'}
                  </span>
                </div>
                <p className="text-sm text-slate-800 leading-relaxed font-normal bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {entry.work_description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
