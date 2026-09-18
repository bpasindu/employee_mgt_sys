import React, { useState } from 'react';
import { X, CalendarPlus } from 'lucide-react';

export default function ApplyLeaveModal({ isOpen, onClose, onSubmitLeave }) {
  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [durationOption, setDurationOption] = useState('Full Day'); // 'Full Day' | 'Half Day'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [daysCount, setDaysCount] = useState(1);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setLeaveType('Casual Leave');
    setDurationOption('Full Day');
    setStartDate('');
    setEndDate('');
    setDaysCount(1);
    setReason('');
  };

  const handleLeaveTypeChange = (newType) => {
    setLeaveType(newType);
    if (newType === 'Half Day') {
      setDurationOption('Half Day');
      setDaysCount(0.5);
    } else if (durationOption === 'Half Day' && newType !== 'Casual Leave' && newType !== 'Medical Leave') {
      setDurationOption('Full Day');
      setDaysCount(1);
    }
  };

  const handleDurationChange = (option) => {
    setDurationOption(option);
    if (option === 'Half Day') {
      setDaysCount(0.5);
    } else {
      setDaysCount(1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate) return;

    setIsSubmitting(true);
    try {
      const finalLeaveType = (leaveType === 'Casual Leave' || leaveType === 'Medical Leave') && durationOption === 'Half Day' 
        ? 'Half Day' 
        : leaveType;

      await onSubmitLeave({
        leave_type: finalLeaveType,
        start_date: startDate,
        end_date: endDate,
        days_count: Number(daysCount) || 1,
        reason: durationOption === 'Half Day' ? `[Half Day ${leaveType}] ${reason}`.trim() : reason
      });
      resetForm();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const showDurationToggle = leaveType === 'Casual Leave' || leaveType === 'Medical Leave' || leaveType === 'Half Day';

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
            </select>
          </div>

          {/* Duration Toggle (Full Day / Half Day) */}
          {showDurationToggle && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Leave Duration</label>
              <div className="grid grid-cols-2 gap-2 bg-slate-100/80 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => handleDurationChange('Full Day')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                    durationOption === 'Full Day'
                      ? 'bg-white text-blue-600 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  ☀️ Full Day (1.0)
                </button>
                <button
                  type="button"
                  onClick={() => handleDurationChange('Half Day')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                    durationOption === 'Half Day'
                      ? 'bg-white text-amber-600 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  🌓 Half Day (0.5)
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Total Days</label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="30"
              value={daysCount}
              onChange={(e) => setDaysCount(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
            />
          </div>

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
