import React, { useState, useEffect, useRef } from 'react';
import { 
  Save, 
  Check, 
  Building2, 
  Plus, 
  Trash2, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronDown, 
  X, 
  Edit3,
  HelpCircle
} from 'lucide-react';
import API from '../api';
import { parseWorkDesc } from '../utils/workEntryUtils';

export default function DailyWorkCard({ initialWork, onSaveWork }) {
  // Table rows: array of { id, company, isZohoClient, work, status, review }
  const [rows, setRows] = useState([
    {
      id: Date.now(),
      company: '',
      isZohoClient: false,
      work: '',
      status: 'Pending',
      review: 'Pending Review'
    }
  ]);

  const [availableClients, setAvailableClients] = useState([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Active row being searched for company
  const [activeCompanySearchRowId, setActiveCompanySearchRowId] = useState(null);
  const [companySearchQuery, setCompanySearchQuery] = useState('');

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

  // Populate from initialWork
  useEffect(() => {
    if (initialWork !== undefined) {
      const rawText = initialWork || '';
      const { cleanText, clientTags, afterOfficeHours, workEntries } = parseWorkDesc(rawText);

      // After Office Hours
      if (afterOfficeHours) {
        setHasAfterOffice(true);
        const parts = afterOfficeHours.split('-').map(s => s.trim());
        if (parts.length >= 2) {
          setAfterOfficeStart(formatTime12to24(parts[0]));
          setAfterOfficeEnd(formatTime12to24(parts[1]));
        }
      } else {
        setHasAfterOffice(false);
        setAfterOfficeStart('17:00');
        setAfterOfficeEnd('18:30');
      }

      // Populate rows
      if (workEntries && workEntries.length > 0) {
        setRows(workEntries.map((entry, idx) => ({
          id: entry.id || Date.now() + idx,
          company: entry.company || '',
          isZohoClient: !!entry.isZohoClient,
          work: entry.work || '',
          status: entry.status || 'Pending',
          review: entry.review || 'Pending Review'
        })));
      } else if (clientTags.length > 0) {
        // Migration from legacy clients
        setRows(clientTags.map((cName, idx) => ({
          id: Date.now() + idx,
          company: cName,
          isZohoClient: true,
          work: idx === 0 ? cleanText : '',
          status: 'Pending',
          review: 'Pending Review'
        })));
      } else if (cleanText) {
        setRows([
          {
            id: Date.now(),
            company: '',
            isZohoClient: false,
            work: cleanText,
            status: 'Pending',
            review: 'Pending Review'
          }
        ]);
      } else {
        setRows([
          {
            id: Date.now(),
            company: '',
            isZohoClient: false,
            work: '',
            status: 'Pending',
            review: 'Pending Review'
          }
        ]);
      }
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

  // Row Manipulation
  const handleAddRow = () => {
    setRows(prev => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        company: '',
        isZohoClient: false,
        work: '',
        status: 'Pending',
        review: 'Pending Review'
      }
    ]);
  };

  const handleRemoveRow = (id) => {
    if (rows.length === 1) {
      // Clear the single row instead of deleting it completely
      setRows([
        {
          id: Date.now(),
          company: '',
          isZohoClient: false,
          work: '',
          status: 'Pending',
          review: 'Pending Review'
        }
      ]);
    } else {
      setRows(prev => prev.filter(r => r.id !== id));
    }
  };

  const handleRowChange = (id, field, value) => {
    setRows(prev => prev.map(r => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const handleSelectCompany = (rowId, companyName, isZoho = false) => {
    handleRowChange(rowId, 'company', companyName);
    handleRowChange(rowId, 'isZohoClient', isZoho);
    setActiveCompanySearchRowId(null);
    setCompanySearchQuery('');
  };

  // Filtered Zoho clients based on query (User Rule: Do NOT show clients initially, only when searching!)
  const filteredZohoClients = companySearchQuery.trim().length > 0
    ? availableClients.filter((client) => {
        const cName = client.contact_name || client.company_name || '';
        return cName.toLowerCase().includes(companySearchQuery.trim().toLowerCase());
      })
    : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return;

    // Filter valid rows
    const validRows = rows.map(r => ({
      ...r,
      company: (r.company || '').trim(),
      work: (r.work || '').trim(),
      status: r.status || 'Pending',
      review: r.review || 'Pending Review'
    }));

    setIsSaving(true);
    const afterOfficeData = hasAfterOffice ? {
      enabled: true,
      startTime: formatTime24to12(afterOfficeStart),
      endTime: formatTime24to12(afterOfficeEnd)
    } : null;

    // Extract clients for legacy analytics and indexing
    const clientList = Array.from(new Set(
      validRows.map(r => r.company).filter(Boolean)
    ));

    // Build human-readable summary
    const summaryLines = validRows
      .filter(r => r.company || r.work)
      .map((r, idx) => {
        const comp = r.company || 'General / Unspecified';
        const w = r.work || 'No description';
        return `${idx + 1}. [${comp}] ${w} (Status: ${r.status} | Client Review: ${r.review})`;
      });

    let finalWorkText = summaryLines.join('\n');
    finalWorkText += `\n[WorkEntries: ${JSON.stringify(validRows)}]`;

    await onSaveWork(finalWorkText, clientList, afterOfficeData, validRows);
    setIsSaving(false);

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/80 mb-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Daily Work Entry</p>
        <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 flex items-center gap-1">
          <Building2 className="w-3 h-3 text-blue-600" />
          <span>Zoho Books Sync ({availableClients.length} Live Clients)</span>
        </span>
      </div>

      {/* Main Heading & Subtitle */}
      <h3 className="text-xl font-bold text-slate-900 mt-1">What are you working on today?</h3>
      <p className="text-xs text-slate-500 mt-0.5 mb-5">
        Record each client or project worked on, along with your activity description, status, and client review.
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* FOUR-COLUMN WORK ENTRIES TABLE */}
        <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-slate-50/40 shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-100/80 text-[11px] uppercase font-bold text-slate-600 tracking-wider">
                <tr>
                  <th className="px-4 py-3.5 w-[22%] min-w-[220px]">1. Select Company / Project</th>
                  <th className="px-4 py-3.5 w-[48%] min-w-[320px]">2. Relevant Work</th>
                  <th className="px-4 py-3.5 w-[14%] min-w-[130px] whitespace-nowrap">3. Work Status</th>
                  <th className="px-4 py-3.5 w-[16%] min-w-[150px] whitespace-nowrap">4. Client's Review</th>
                  <th className="px-3 py-3.5 w-12 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 bg-white font-medium">
                {rows.map((row, index) => {
                  const isSearchingThisRow = activeCompanySearchRowId === row.id;

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* COLUMN 1: SELECT COMPANY (Zoho Search or Manual Entry) */}
                      <td className="px-4 py-3 align-top min-w-[200px]">
                        {!isSearchingThisRow && row.company ? (
                          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-blue-50/60 border border-blue-200/80">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`p-1 rounded-md shrink-0 ${row.isZohoClient ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                                <Building2 className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0">
                                <span className="block font-bold text-slate-900 text-xs truncate" title={row.company}>
                                  {row.company}
                                </span>
                                <span className="text-[10px] text-blue-700 font-semibold">
                                  {row.isZohoClient ? 'Zoho Books Client' : 'Manual / Custom Project'}
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveCompanySearchRowId(row.id);
                                setCompanySearchQuery(row.company);
                              }}
                              className="text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-white hover:bg-blue-100 px-2 py-1 rounded-md border border-blue-200 transition-colors cursor-pointer shrink-0"
                            >
                              Change
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {/* Search / Entry Box */}
                            <div className="relative flex items-center gap-1.5">
                              <div className="relative flex-1">
                                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                  type="text"
                                  value={isSearchingThisRow ? companySearchQuery : (row.company || '')}
                                  onFocus={() => {
                                    setActiveCompanySearchRowId(row.id);
                                    setCompanySearchQuery(row.company || '');
                                  }}
                                  onChange={(e) => {
                                    setActiveCompanySearchRowId(row.id);
                                    setCompanySearchQuery(e.target.value);
                                  }}
                                  placeholder="Search Zoho client or type name..."
                                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 rounded-xl pl-8 pr-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium transition-all"
                                />
                              </div>

                              {isSearchingThisRow && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveCompanySearchRowId(null);
                                    setCompanySearchQuery('');
                                  }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                                  title="Close Search"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            {/* Dropdown Results (ONLY shown when searching as requested!) */}
                            {isSearchingThisRow && (
                              <div className="p-2.5 bg-white rounded-xl border border-blue-200 shadow-md space-y-2 animate-in fade-in duration-150">
                                {companySearchQuery.trim().length === 0 ? (
                                  <div className="p-2 text-center text-slate-400 text-[11px] italic">
                                    Type in search box to find Zoho Books clients, or manually enter company name.
                                  </div>
                                ) : (
                                  <>
                                    {/* Option to add manually */}
                                    <button
                                      type="button"
                                      onClick={() => handleSelectCompany(row.id, companySearchQuery.trim(), false)}
                                      className="w-full text-left bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-between gap-1 shadow-2xs"
                                    >
                                      <span className="truncate">Add manual: "{companySearchQuery.trim()}"</span>
                                      <Plus className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                                    </button>

                                    {/* Zoho Clients Results */}
                                    <div className="max-h-36 overflow-y-auto pr-1 space-y-1">
                                      {isLoadingClients ? (
                                        <div className="text-xs text-slate-400 italic py-1 text-center">Loading Zoho clients...</div>
                                      ) : filteredZohoClients.length === 0 ? (
                                        <div className="text-xs text-slate-400 italic py-1 text-center">
                                          No Zoho Books clients match "{companySearchQuery}"
                                        </div>
                                      ) : (
                                        filteredZohoClients.slice(0, 15).map((client) => {
                                          const cName = client.contact_name || client.company_name;
                                          return (
                                            <button
                                              type="button"
                                              key={client.id || cName}
                                              onClick={() => handleSelectCompany(row.id, cName, true)}
                                              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-blue-700 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all flex items-center justify-between cursor-pointer"
                                            >
                                              <span className="truncate">{cName}</span>
                                              <span className="text-[10px] text-blue-600 font-bold bg-blue-100 px-1.5 py-0.2 rounded shrink-0">
                                                Zoho
                                              </span>
                                            </button>
                                          );
                                        })
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* COLUMN 2: RELEVANT WORK */}
                      <td className="px-4 py-3 align-top">
                        <textarea
                          value={row.work}
                          onChange={(e) => handleRowChange(row.id, 'work', e.target.value)}
                          placeholder="Describe the specific work and tasks performed for this company..."
                          rows={3}
                          className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-xl p-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-y font-normal min-h-[85px] leading-relaxed"
                        />
                      </td>

                      {/* COLUMN 3: WORK STATUS */}
                      <td className="px-4 py-3 align-top whitespace-nowrap">
                        <select
                          value={row.status}
                          onChange={(e) => handleRowChange(row.id, 'status', e.target.value)}
                          className={`text-xs font-bold rounded-xl px-2.5 py-2 border transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-full ${
                            row.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : row.status === 'In Progress'
                              ? 'bg-blue-50 text-blue-800 border-blue-300'
                              : 'bg-amber-50 text-amber-800 border-amber-300'
                          }`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </td>

                      {/* COLUMN 4: CLIENT'S REVIEW */}
                      <td className="px-4 py-3 align-top whitespace-nowrap">
                        <select
                          value={row.review}
                          onChange={(e) => handleRowChange(row.id, 'review', e.target.value)}
                          className={`text-xs font-bold rounded-xl px-2.5 py-2 border transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-full ${
                            row.review === 'Approved'
                              ? 'bg-teal-50 text-teal-800 border-teal-300'
                              : row.review === 'Not Approved'
                              ? 'bg-rose-50 text-rose-800 border-rose-300'
                              : 'bg-slate-50 text-slate-700 border-slate-300'
                          }`}
                        >
                          <option value="Pending Review">Pending Review</option>
                          <option value="Approved">Approved</option>
                          <option value="Not Approved">Not Approved</option>
                        </select>
                      </td>

                      {/* COLUMN 5: ACTION (REMOVE ROW) */}
                      <td className="px-3 py-3 align-top text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(row.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer: Add Row Action */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2">
            <button
              type="button"
              onClick={handleAddRow}
              className="bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs hover:border-blue-300"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Company Work Row</span>
            </button>
            <span className="text-[11px] font-semibold text-slate-500">
              {rows.length} {rows.length === 1 ? 'company entry' : 'company entries'}
            </span>
          </div>
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

              {/* Duration display */}
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
            {rows.filter(r => r.company || r.work).length} of {rows.length} rows filled
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
