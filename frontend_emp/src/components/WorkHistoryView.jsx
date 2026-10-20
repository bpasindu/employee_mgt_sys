import React, { useState, useEffect } from 'react';
import API from '../api';
import { Briefcase, Calendar, Clock, Check, Loader2 } from 'lucide-react';
import { TodayWorkTableDisplay, parseWorkDesc, stringifyWorkDesc } from '../utils/workEntryUtils';

export default function WorkHistoryView({ userId }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) fetchHistory();
  }, [userId]);

  const fetchHistory = async () => {
    try {
      const res = await API.get(`/work-entry/history?user_id=${userId}`);
      const list = Array.isArray(res.data) ? res.data : (res.data?.entries || []);
      setEntries(list);
    } catch (err) {
      console.error('Failed to fetch work history:', err);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRowChange = async (entryId, entryDate, rowIndex, field, value) => {
    let updatedWorkDesc = '';
    let updatedRows = [];
    let parsedData = null;

    setEntries(prev => prev.map(entry => {
      const isTarget = (entryId && entry.id === entryId) || (entryDate && entry.entry_date === entryDate);
      if (!isTarget) return entry;

      parsedData = parseWorkDesc(entry.work_description);
      const rows = [...(parsedData.workEntries || [])];
      if (rows[rowIndex]) {
        rows[rowIndex] = { ...rows[rowIndex], [field]: value };
      }
      updatedRows = rows;
      updatedWorkDesc = stringifyWorkDesc({
        cleanText: parsedData.cleanText,
        workEntries: rows,
        clientTags: parsedData.clientTags,
        afterOfficeHours: parsedData.afterOfficeHours
      });

      return {
        ...entry,
        work_description: updatedWorkDesc,
        _saving: true,
        _saved: false
      };
    }));

    try {
      await API.post('/work-entry', {
        user_id: userId,
        entry_id: entryId,
        entry_date: entryDate,
        work_description: updatedWorkDesc,
        work_entries: updatedRows,
        after_office_hours: parsedData?.afterOfficeHours,
        clients: parsedData?.clientTags
      });

      setEntries(prev => prev.map(e => {
        const isTarget = (entryId && e.id === entryId) || (entryDate && e.entry_date === entryDate);
        return isTarget ? { ...e, _saving: false, _saved: true } : e;
      }));

      setTimeout(() => {
        setEntries(prev => prev.map(e => {
          const isTarget = (entryId && e.id === entryId) || (entryDate && e.entry_date === entryDate);
          return isTarget ? { ...e, _saved: false } : e;
        }));
      }, 2500);
    } catch (err) {
      console.error('Failed to save updated work status/review:', err);
      setEntries(prev => prev.map(e => {
        const isTarget = (entryId && e.id === entryId) || (entryDate && e.entry_date === entryDate);
        return isTarget ? { ...e, _saving: false, _error: true } : e;
      }));
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Today's Work Log & History</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Review past daily work entries. You can update work status and client reviews anytime, even for past dates.
          </p>
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
            <div key={entry.id || entry.entry_date || Math.random()} className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {entry.entry_date ? entry.entry_date.split('T')[0] : 'Today'}
                    </span>
                    <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                      Status & Review Editable
                    </span>
                  </div>

                  {entry._saving && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Updating...</span>
                    </span>
                  )}
                  {entry._saved && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 animate-in fade-in">
                      <Check className="w-3.5 h-3.5" />
                      <span>Updated successfully</span>
                    </span>
                  )}
                  {entry._error && (
                    <span className="text-[11px] font-bold text-rose-600">
                      Failed to save update
                    </span>
                  )}
                </div>
                <div>
                  <TodayWorkTableDisplay 
                    rawWork={entry.work_description} 
                    allowStatusEdit={true}
                    onRowChange={(rowIndex, field, value) => handleRowChange(entry.id, entry.entry_date, rowIndex, field, value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
