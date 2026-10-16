import React, { useState, useEffect } from 'react';
import { Save, Check, Building2, Plus, X, Search, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import API from '../api';

export default function DailyWorkCard({ initialWork, onSaveWork }) {
  const [workText, setWorkText] = useState('');
  const [availableClients, setAvailableClients] = useState([]);
  const [selectedClients, setSelectedClients] = useState([]);
  const [clientSearch, setClientSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isLoadingClients, setIsLoadingClients] = useState(true);

  // After Office Hours State
  const [hasAfterOffice, setHasAfterOffice] = useState(false);
  const [afterOfficeStart, setAfterOfficeStart] = useState('17:00');
  const [afterOfficeEnd, setAfterOfficeEnd] = useState('18:30');

  // Time conversion helpers
  const formatTime24to12 = (time24) => {
    if (!time24) return '';
    if (time24.includes('AM') || time24.includes('PM')) return time24;
    const [hStr, mStr] = time24.split(':');
    let h = parseInt(hStr, 10);
    const m = mStr || '00';
    if (isNaN(h)) return time24;
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    const hDisplay = h < 10 ? `0${h}` : `${h}`;
    return `${hDisplay}:${m} ${ampm}`;
  };

  const formatTime12to24 = (time12) => {
    if (!time12) return '17:00';
    const match = time12.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!match) return '17:00';
    let h = parseInt(match[1], 10);
    const m = match[2];
    const ampm = (match[3] || '').toUpperCase();
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return `${h < 10 ? '0' : ''}${h}:${m}`;
  };

  const calculateDuration = (start24, end24) => {
    if (!start24 || !end24) return null;
    const [h1, m1] = start24.split(':').map(Number);
    const [h2, m2] = end24.split(':').map(Number);
    const totalMinutes = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (totalMinutes <= 0) return null;
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hrs === 0) return `${mins} mins`;
    if (mins === 0) return `${hrs} hr${hrs > 1 ? 's' : ''}`;
    return `${hrs} hr${hrs > 1 ? 's' : ''} ${mins} mins`;
  };

  useEffect(() => {
    if (initialWork !== undefined) {
      const rawText = initialWork || '';

      // Clients extraction
      const tagMatch = rawText.match(/\[Clients:\s*([^\]]+)\]/i);
      if (tagMatch && tagMatch[1]) {
        const clientList = tagMatch[1].split(',').map(s => s.trim()).filter(Boolean);
        setSelectedClients(clientList);
      } else {
        setSelectedClients([]);
      }

      // After Office Hours extraction
      const afterOfficeMatch = rawText.match(/\[After Office(?:\s*Hours)?:\s*([^\]]+)\]/i);
      if (afterOfficeMatch && afterOfficeMatch[1]) {
        setHasAfterOffice(true);
        const parts = afterOfficeMatch[1].split('-').map(s => s.trim());
        if (parts.length >= 2) {
          setAfterOfficeStart(formatTime12to24(parts[0]));
          setAfterOfficeEnd(formatTime12to24(parts[1]));
        }
      } else {
        setHasAfterOffice(false);
        setAfterOfficeStart('17:00');
        setAfterOfficeEnd('18:30');
      }

      // Clean work description text
      const cleanText = rawText
        .replace(/\n?\[Clients:[^\]]+\]/gi, '')
        .replace(/\n?\[After Office(?:\s*Hours)?:\s*[^\]]+\]/gi, '')
        .trim();
      setWorkText(cleanText);
    }
  }, [initialWork]);

  useEffect(() => {
    fetchZohoClients();
  }, []);

  const fetchZohoClients = async () => {
    try {
      const res = await API.get('/zoho/clients');
      const list = res.data?.clients || [];
      setAvailableClients(list);
    } catch (err) {
      console.error('Failed to fetch Zoho clients:', err);
    } finally {
      setIsLoadingClients(false);
    }
  };

  const toggleClientSelection = (clientName) => {
    if (!clientName) return;
    const trimmed = clientName.trim();
    if (!trimmed) return;
    if (selectedClients.includes(trimmed)) {
      setSelectedClients(prev => prev.filter(c => c !== trimmed));
    } else {
      setSelectedClients(prev => [...prev, trimmed]);
    }
  };

  const filteredClients = availableClients.filter((client) => {
    const cName = client.contact_name || client.company_name || '';
    return cName.toLowerCase().includes(clientSearch.toLowerCase());
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    const afterOfficeData = hasAfterOffice ? {
      enabled: true,
      startTime: formatTime24to12(afterOfficeStart),
      endTime: formatTime24to12(afterOfficeEnd)
    } : null;

    await onSaveWork(workText, selectedClients, afterOfficeData);
    setIsSaving(false);

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/80 mb-6">
      {/* Top Label */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Daily Work Entry</p>
        <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 flex items-center gap-1">
          <Building2 className="w-3 h-3 text-blue-600" />
          <span>Zoho Books Sync ({availableClients.length} Live Clients)</span>
        </span>
      </div>

      {/* Main Heading & Subtitle */}
      <h3 className="text-xl font-bold text-slate-900 mt-1">What are you working on today?</h3>
      <p className="text-xs text-slate-500 mt-0.5 mb-4">
        Keep your team informed with a clear summary of your priorities for today.
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ZOHO CLIENT SELECTION */}
        <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Select Zoho Books Client(s) Worked For Today</span>
            </label>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full border border-blue-200">
              {selectedClients.length} Selected
            </span>
          </div>

          {selectedClients.length > 0 && (
            <div className="flex flex-wrap gap-1.5 p-2 bg-white rounded-xl border border-blue-100 shadow-2xs">
              {selectedClients.map((cName) => (
                <span
                  key={cName}
                  className="bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg border border-blue-700 flex items-center gap-1.5 shadow-2xs"
                >
                  <CheckCircle2 className="w-3 h-3 text-blue-200" />
                  <span>{cName}</span>
                  <button
                    type="button"
                    onClick={() => toggleClientSelection(cName)}
                    className="hover:text-rose-200 p-0.5 rounded-full transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              placeholder={`Search from ${availableClients.length > 0 ? availableClients.length + '+ ' : ''}Zoho Books clients...`}
              className="w-full bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 rounded-xl pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
            />
          </div>

          <div className="max-h-36 overflow-y-auto pr-1 flex flex-wrap gap-1.5 pt-1">
            {clientSearch.trim().length > 0 && !selectedClients.includes(clientSearch.trim()) && (
              <button
                type="button"
                onClick={() => {
                  toggleClientSelection(clientSearch.trim());
                  setClientSearch('');
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-2.5 py-1 rounded-lg border border-emerald-700 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <Plus className="w-3 h-3 text-white" />
                <span>Add "{clientSearch.trim()}"</span>
              </button>
            )}
            {isLoadingClients ? (
              <span className="text-xs text-slate-400 italic">Loading Zoho Books clients...</span>
            ) : filteredClients.length === 0 && clientSearch.trim().length === 0 ? (
              <span className="text-xs text-slate-400 italic">No clients found matching search</span>
            ) : (
              filteredClients.slice(0, 30).map((client) => {
                const cName = client.contact_name || client.company_name;
                const isSelected = selectedClients.includes(cName);
                return (
                  <button
                    type="button"
                    key={client.id || cName}
                    onClick={() => toggleClientSelection(cName)}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-700 shadow-2xs font-bold'
                        : 'bg-white text-slate-700 border-slate-200/90 hover:border-blue-300 hover:bg-blue-50/50'
                    }`}
                  >
                    <span>{cName}</span>
                    {isSelected ? <X className="w-3 h-3 text-white" /> : <Plus className="w-3 h-3 text-slate-400" />}
                  </button>
                );
              })
            )}
            {filteredClients.length > 30 && (
              <span className="text-[11px] font-semibold text-slate-400 self-center px-1">
                + {filteredClients.length - 30} more (use search to find specific client)
              </span>
            )}
          </div>
        </div>

        {/* Work Description Textarea */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Today's work description
          </label>
          <textarea
            value={workText}
            onChange={(e) => setWorkText(e.target.value.slice(0, 500))}
            placeholder="Describe your goals and tasks for today..."
            rows={4}
            className="w-full border border-slate-200 rounded-xl p-3.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none font-normal"
          />
        </div>

        {/* AFTER OFFICE HOURS SECTION */}
        <div className={`p-4 rounded-xl border transition-all ${
          hasAfterOffice 
            ? 'bg-slate-50/90 border-blue-200/80 shadow-2xs' 
            : 'bg-slate-50/70 border-slate-200/80'
        }`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className={`p-2 rounded-lg shrink-0 mt-0.5 transition-colors ${
                hasAfterOffice ? 'bg-blue-600 text-white shadow-2xs' : 'bg-slate-200 text-slate-600'
              }`}>
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    Worked After Office Hours?
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                    Office Hours: 8:30 AM – 5:00 PM
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Record extended work or overtime performed after regular office hours (5:00 PM onwards).
                </p>
              </div>
            </div>

            {/* Toggle switch */}
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={hasAfterOffice}
                onChange={(e) => setHasAfterOffice(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Time pickers when enabled */}
          {hasAfterOffice && (
            <div className="mt-4 pt-3.5 border-t border-slate-200 space-y-3 animate-in fade-in duration-200">
              {/* Custom Start & End Time Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                      <span>Start Time</span>
                      <span className="text-[10px] text-slate-400 font-normal">(After 5:00 PM)</span>
                    </label>
                    <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {formatTime24to12(afterOfficeStart)}
                    </span>
                  </div>
                  <input
                    type="time"
                    value={afterOfficeStart}
                    onChange={(e) => setAfterOfficeStart(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                      <span>End Time</span>
                    </label>
                    <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {formatTime24to12(afterOfficeEnd)}
                    </span>
                  </div>
                  <input
                    type="time"
                    value={afterOfficeEnd}
                    onChange={(e) => setAfterOfficeEnd(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Duration and Status display */}
              <div className="flex items-center justify-between flex-wrap gap-2 pt-0.5">
                {calculateDuration(afterOfficeStart, afterOfficeEnd) ? (
                  <span className="text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-2xs">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>Duration:</span>
                    <strong className="text-slate-900 font-extrabold">
                      {calculateDuration(afterOfficeStart, afterOfficeEnd)}
                    </strong>
                    <span className="text-[10px] text-slate-500 font-medium">
                      ({formatTime24to12(afterOfficeStart)} – {formatTime24to12(afterOfficeEnd)})
                    </span>
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>End time should be after start time</span>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer info & button */}
        <div className="flex items-center justify-between pt-1">
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
              className="bg-[#022851] hover:bg-[#03376e] active:scale-[0.98] text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
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
