import React, { useState, useEffect } from 'react';
import { Save, Check } from 'lucide-react';

export default function DailyWorkCard({ initialWork, onSaveWork }) {
  const [workText, setWorkText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (initialWork !== undefined) {
      setWorkText(initialWork);
    }
  }, [initialWork]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    await onSaveWork(workText);
    setIsSaving(false);

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/80 mb-6">
      {/* Top Label */}
      <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Daily Work Entry</p>

      {/* Main Heading & Subtitle */}
      <h3 className="text-xl font-bold text-slate-900 mt-1">What are you working on today?</h3>
      <p className="text-xs text-slate-500 mt-0.5 mb-5">
        Keep your team informed with a clear summary of your priorities.
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <label className="block text-xs font-semibold text-slate-700 mb-2">
          Today's work description
        </label>

        <textarea
          value={workText}
          onChange={(e) => setWorkText(e.target.value.slice(0, 500))}
          placeholder="Describe your goals and tasks for today..."
          rows={4}
          className="w-full border border-slate-200 rounded-xl p-3.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none font-normal"
        />

        {/* Footer info & button */}
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-slate-400 font-medium">
            {workText.length}/500 characters
          </span>

          <div className="flex items-center gap-3">
            {savedSuccess && (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                <Check className="w-3.5 h-3.5" /> Saved!
              </span>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="bg-[#52708e] hover:bg-[#435e79] active:scale-[0.98] text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Updating...' : 'Update work'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
