import React, { useState } from 'react';
import { X, CalendarPlus, Plus, Trash2 } from 'lucide-react';

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function ApplyLeaveModal({ isOpen, onClose, onSubmitLeave, user }) {
  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [halfDaySession, setHalfDaySession] = useState('Morning');
  // Special Leave: list of { day, session } entries
  const [specialEntries, setSpecialEntries] = useState([]);
  const [pendingDay, setPendingDay] = useState('Monday');
  const [pendingSession, setPendingSession] = useState('Morning');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [daysCount, setDaysCount] = useState(1);
  const [reason, setReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setLeaveType('Casual Leave');
    setHalfDaySession('Morning');
    setSpecialEntries([]);
    setPendingDay('Monday');
    setPendingSession('Morning');
    setStartDate('');
    setEndDate('');
    setDaysCount(1);
    setReason('');
    setErrorMsg('');
  };

  const isHalfDay = leaveType === 'Half Day';
  const isSpecialLeave = leaveType === 'Special Leave';

  const calculateDays = (sDate, eDate) => {
    if (!sDate || !eDate) return 1;
    const s = new Date(sDate);
    const e = new Date(eDate);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return 1;
    const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 1;
  };

  const handleStartDateChange = (val) => {
    setStartDate(val);
    setErrorMsg('');
    if (isHalfDay || isSpecialLeave) {
      setEndDate(val);
      setDaysCount(0.5);
    } else {
      const targetEnd = endDate && endDate >= val ? endDate : val;
      if (!endDate || endDate < val) setEndDate(val);
      setDaysCount(calculateDays(val, targetEnd));
    }
  };

  const handleEndDateChange = (val) => {
    setEndDate(val);
    setErrorMsg('');
    if (startDate) {
      setDaysCount(calculateDays(startDate, val));
    }
  };

  const handleLeaveTypeChange = (newType) => {
    setLeaveType(newType);
    setErrorMsg('');
    if (newType === 'Half Day' || newType === 'Special Leave') {
      setDaysCount(0.5);
      if (startDate) setEndDate(startDate);
    } else {
      if (startDate && endDate) {
        setDaysCount(calculateDays(startDate, endDate));
      } else {
        setDaysCount(1);
      }
    }
  };

  const addSpecialEntry = () => {
    // Check for duplicate day
    const exists = specialEntries.find(e => e.day === pendingDay);
    if (exists) {
      setErrorMsg(`${pendingDay} is already added. Remove it first to change the session.`);
      return;
    }
    setSpecialEntries(prev => [...prev, { day: pendingDay, session: pendingSession }]);
    setErrorMsg('');
    // Auto-advance to next available day
    const usedDays = [...specialEntries.map(e => e.day), pendingDay];
    const nextDay = ALL_DAYS.find(d => !usedDays.includes(d));
    if (nextDay) setPendingDay(nextDay);
  };

  const removeSpecialEntry = (day) => {
    setSpecialEntries(prev => prev.filter(e => e.day !== day));
    setErrorMsg('');
  };

  // Sort entries by day order
  const sortedEntries = [...specialEntries].sort(
    (a, b) => ALL_DAYS.indexOf(a.day) - ALL_DAYS.indexOf(b.day)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!startDate) return;

    if (isSpecialLeave && specialEntries.length === 0) {
      setErrorMsg('Please add at least one day for Special Leave.');
      return;
    }

    const finalEndDate = (isHalfDay || isSpecialLeave) ? startDate : endDate;
    if (!finalEndDate) return;

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const finalDaysCount = (isHalfDay || isSpecialLeave) ? 0.5 : (Number(daysCount) || 1);

      // Build the day_of_week string: "Monday:Morning,Wednesday:Evening"
      const dayOfWeekStr = isSpecialLeave
        ? sortedEntries.map(e => `${e.day}:${e.session}`).join(',')
        : null;

      let finalReason = reason;
      if (isHalfDay) {
        finalReason = `[${halfDaySession} Half Day] ${reason}`.trim();
      } else if (isSpecialLeave) {
        const entryDesc = sortedEntries.map(e => `${e.day} (${e.session})`).join(', ');
        finalReason = `[Special Leave - ${entryDesc}] ${reason}`.trim();
      }

      await onSubmitLeave({
        leave_type: leaveType,
        start_date: startDate,
        end_date: finalEndDate,
        days_count: finalDaysCount,
        day_of_week: dayOfWeekStr,
        start_time: null,
        end_time: null,
        is_recurring: isSpecialLeave ? 1 : 0,
        reason: finalReason
      });

      // Construct WhatsApp message
      const empName = user?.name || 'Employee';
      const empDept = user?.department ? ` (${user.department})` : '';
      const waNumber = '94775227748';
      
      const leaveDurationStr = isSpecialLeave 
        ? sortedEntries.map(e => `${e.day} (${e.session})`).join(', ') + ` starting ${startDate}`
        : `${startDate} to ${finalEndDate} (${finalDaysCount} ${finalDaysCount === 1 ? 'day' : 'days'})`;

      const waMessage = 
`*New Leave Request Submission*
----------------------------------
*Employee Name:* ${empName}${empDept}
*Leave Type:* ${leaveType}
*Duration / Time:* ${leaveDurationStr}
*Reason / Details:* ${finalReason || 'None'}
----------------------------------
Submitted via P W Holdings Employee Management System`;

      const encodedMsg = encodeURIComponent(waMessage);
      const waUrl = `https://wa.me/${waNumber}?text=${encodedMsg}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');

      resetForm();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to submit leave request';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableDays = ALL_DAYS.filter(d => !specialEntries.find(e => e.day === d));

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CalendarPlus className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Apply for Leave</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl font-semibold leading-relaxed">
              ⚠️ {errorMsg}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Leave Type</label>
            <select
              value={leaveType}
              onChange={(e) => handleLeaveTypeChange(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
            >
              <option value="Casual Leave">Casual Leave</option>
              <option value="Medical Leave">Medical Leave</option>
              <option value="Half Day">Half Day</option>
              <option value="Study Leave">Study Leave</option>
              <option value="Special Leave">Special Leave (Weekly Recurring)</option>
            </select>
          </div>

          {/* Special Leave: Add day + session entries one by one */}
          {isSpecialLeave && (
            <div className="bg-purple-50/70 p-3.5 rounded-xl border border-purple-200/60 space-y-3">
              <div className="flex items-center gap-2 text-purple-800 font-bold text-xs">
                <span>🔄 Weekly Recurring Special Leave</span>
              </div>

              {/* Added entries list */}
              {sortedEntries.length > 0 && (
                <div className="space-y-1.5">
                  {sortedEntries.map(entry => (
                    <div
                      key={entry.day}
                      className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-purple-200/80 shadow-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">{entry.day}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          entry.session === 'Morning'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}>
                          {entry.session === 'Morning' ? '🌅' : '🌆'} {entry.session}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSpecialEntry(entry.day)}
                        className="text-slate-400 hover:text-rose-500 transition-colors p-0.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new entry row */}
              {availableDays.length > 0 && (
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="block text-[10px] font-semibold text-purple-900 mb-1">Day</label>
                    <select
                      value={pendingDay}
                      onChange={(e) => setPendingDay(e.target.value)}
                      className="w-full border border-purple-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-medium"
                    >
                      {availableDays.map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-semibold text-purple-900 mb-1">Session</label>
                    <div className="flex bg-purple-100/60 p-0.5 rounded-lg border border-purple-200/50">
                      <button
                        type="button"
                        onClick={() => setPendingSession('Morning')}
                        className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                          pendingSession === 'Morning'
                            ? 'bg-white text-amber-700 shadow-xs border border-amber-200'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        🌅 Morning
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingSession('Evening')}
                        className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                          pendingSession === 'Evening'
                            ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        🌆 Evening
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={addSpecialEntry}
                    className="bg-purple-600 hover:bg-purple-700 text-white p-1.5 rounded-lg transition-colors shadow-xs cursor-pointer shrink-0"
                    title="Add day"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}

              {availableDays.length === 0 && (
                <p className="text-[10px] text-purple-600 font-medium text-center">All days have been added.</p>
              )}
            </div>
          )}

          {/* Half Day Session Options (Morning / Evening) */}
          {isHalfDay && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Half Day Session</label>
              <div className="grid grid-cols-2 gap-2 bg-amber-50/60 p-1 rounded-xl border border-amber-200/50">
                <button
                  type="button"
                  onClick={() => setHalfDaySession('Morning')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    halfDaySession === 'Morning'
                      ? 'bg-white text-amber-700 shadow-2xs border border-amber-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🌅 Morning Session
                </button>
                <button
                  type="button"
                  onClick={() => setHalfDaySession('Evening')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    halfDaySession === 'Evening'
                      ? 'bg-white text-indigo-700 shadow-2xs border border-indigo-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🌆 Evening Session
                </button>
              </div>
            </div>
          )}

          {/* Date Fields */}
          {(isHalfDay || isSpecialLeave) ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isSpecialLeave ? 'Effective Start Date' : 'Date'}
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    min={startDate}
                    value={endDate}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Total Days (Auto-calculated)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={daysCount}
                  onChange={(e) => setDaysCount(e.target.value)}
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reason (Optional)</label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Brief reason for your leave request..."
              className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none font-medium"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
