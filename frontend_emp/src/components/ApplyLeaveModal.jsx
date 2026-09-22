import React, { useState } from 'react';
import { X, CalendarPlus } from 'lucide-react';

export default function ApplyLeaveModal({ isOpen, onClose, onSubmitLeave, user }) {
  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [halfDaySession, setHalfDaySession] = useState('Morning'); // 'Morning' | 'Evening'
  const [dayOfWeek, setDayOfWeek] = useState('Monday');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('13:00');
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
    setDayOfWeek('Monday');
    setStartTime('09:00');
    setEndTime('13:00');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!startDate) return;

    const finalEndDate = (isHalfDay || isSpecialLeave) ? startDate : endDate;
    if (!finalEndDate) return;

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const finalDaysCount = (isHalfDay || isSpecialLeave) ? 0.5 : (Number(daysCount) || 1);

      let finalReason = reason;
      if (isHalfDay) {
        finalReason = `[${halfDaySession} Half Day] ${reason}`.trim();
      } else if (isSpecialLeave) {
        finalReason = `[Special Leave - Every ${dayOfWeek} (${startTime} - ${endTime})] ${reason}`.trim();
      }

      await onSubmitLeave({
        leave_type: leaveType,
        start_date: startDate,
        end_date: finalEndDate,
        days_count: finalDaysCount,
        day_of_week: isSpecialLeave ? dayOfWeek : null,
        start_time: isSpecialLeave ? startTime : null,
        end_time: isSpecialLeave ? endTime : null,
        is_recurring: isSpecialLeave ? 1 : 0,
        reason: finalReason
      });

      // Construct WhatsApp message with Employee Name and open primary WhatsApp app/web
      const empName = user?.name || 'Employee';
      const empDept = user?.department ? ` (${user.department})` : '';
      const waNumber = '94775227748';
      
      const leaveDurationStr = isSpecialLeave 
        ? `Every ${dayOfWeek} from ${startTime} to ${endTime} (Starting ${startDate})`
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
      
      // Open in primary WhatsApp Web or Desktop application
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

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
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

          {/* Special Leave Options (Recurring Day of Week & Time Period) */}
          {isSpecialLeave && (
            <div className="bg-purple-50/70 p-3.5 rounded-xl border border-purple-200/60 space-y-3">
              <div className="flex items-center gap-2 text-purple-800 font-bold text-xs">
                <span>🔄 Weekly Recurring Special Leave</span>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-purple-900 mb-1">Day of the Week</label>
                <select
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(e.target.value)}
                  className="w-full border border-purple-200 rounded-xl px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-medium"
                >
                  <option value="Monday">Every Monday</option>
                  <option value="Tuesday">Every Tuesday</option>
                  <option value="Wednesday">Every Wednesday</option>
                  <option value="Thursday">Every Thursday</option>
                  <option value="Friday">Every Friday</option>
                  <option value="Saturday">Every Saturday</option>
                  <option value="Sunday">Every Sunday</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-purple-900 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full border border-purple-200 rounded-xl px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-purple-900 mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full border border-purple-200 rounded-xl px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-medium"
                  />
                </div>
              </div>
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
                  max="30"
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
