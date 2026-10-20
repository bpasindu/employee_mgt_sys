import React from 'react';
import { Building2, CheckCircle2, Clock, AlertCircle, XCircle, HelpCircle } from 'lucide-react';

/**
 * Parses raw work description text into structured components:
 * - workEntries: array of { id, company, isZohoClient, work, status, review }
 * - clientTags: array of string client names
 * - afterOfficeHours: string or null
 * - cleanText: readable description without metadata tags
 */
export function parseWorkDesc(rawDesc) {
  if (!rawDesc) {
    return { cleanText: '', clientTags: [], afterOfficeHours: null, workEntries: [] };
  }

  const rawStr = String(rawDesc);

  // 1. Extract [WorkEntries: JSON]
  let workEntries = [];
  const entriesMatch = rawStr.match(/\[WorkEntries:\s*(\[.*?\])\]/s);
  if (entriesMatch && entriesMatch[1]) {
    try {
      const parsed = JSON.parse(entriesMatch[1]);
      if (Array.isArray(parsed)) {
        workEntries = parsed;
      }
    } catch (e) {
      console.warn('Failed to parse [WorkEntries] JSON:', e);
    }
  }

  // 2. Extract [Clients: A, B]
  let clientTags = [];
  const tagMatch = rawStr.match(/\[Clients:\s*([^\]]+)\]/i);
  if (tagMatch && tagMatch[1]) {
    clientTags = tagMatch[1].split(',').map(s => s.trim()).filter(Boolean);
  } else if (workEntries.length > 0) {
    clientTags = workEntries.map(e => e.company).filter(Boolean);
  }

  // 3. Extract [After Office Hours: 17:00 - 18:30]
  const afterOfficeMatch = rawStr.match(/\[After Office(?:\s*Hours)?:\s*([^\]]+)\]/i);
  const afterOfficeHours = afterOfficeMatch ? afterOfficeMatch[1].trim() : null;

  // 4. Clean human-readable text
  const cleanText = rawStr
    .replace(/\[WorkEntries:\s*\[.*?\]\]/gis, '')
    .replace(/\n?\[Clients:[^\]]+\]/gi, '')
    .replace(/\n?\[After Office(?:\s*Hours)?:\s*[^\]]+\]/gi, '')
    .trim();

  return { cleanText, clientTags, afterOfficeHours, workEntries };
}

/**
 * Renders status badge for work row (Completed, Pending, In Progress)
 */
export function StatusBadge({ status }) {
  const norm = (status || '').toLowerCase().trim();
  if (norm === 'completed') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs whitespace-nowrap">
        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
        <span>Completed</span>
      </span>
    );
  }
  if (norm === 'pending') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs whitespace-nowrap">
        <Clock className="w-3 h-3 text-amber-600 shrink-0" />
        <span>Pending</span>
      </span>
    );
  }
  if (norm === 'in progress' || norm === 'progress') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs whitespace-nowrap">
        <Clock className="w-3 h-3 text-blue-600 shrink-0" />
        <span>In Progress</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
      <span>{status || 'Pending'}</span>
    </span>
  );
}

/**
 * Renders review badge for work row (Approved, Not Approved, Pending Review)
 */
export function ReviewBadge({ review }) {
  const norm = (review || '').toLowerCase().trim();
  if (norm === 'approved') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 shadow-2xs whitespace-nowrap">
        <CheckCircle2 className="w-3 h-3 text-teal-600 shrink-0" />
        <span>Approved</span>
      </span>
    );
  }
  if (norm === 'not approved' || norm === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs whitespace-nowrap">
        <XCircle className="w-3 h-3 text-rose-600 shrink-0" />
        <span>Not Approved</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-50 text-slate-600 border border-slate-200 shadow-2xs whitespace-nowrap">
      <HelpCircle className="w-3 h-3 text-slate-400 shrink-0" />
      <span>{review || 'Pending Review'}</span>
    </span>
  );
}

/**
 * Re-serializes parsed work components back into standard raw string format
 */
export function stringifyWorkDesc({ cleanText = '', workEntries = [], clientTags = [], afterOfficeHours = null }) {
  let finalDesc = (cleanText || '').trim();
  if (Array.isArray(workEntries) && workEntries.length > 0) {
    finalDesc = `${finalDesc}\n[WorkEntries: ${JSON.stringify(workEntries)}]`.trim();
  }
  if (Array.isArray(clientTags) && clientTags.length > 0) {
    finalDesc = `${finalDesc}\n[Clients: ${clientTags.join(', ')}]`.trim();
  }
  if (afterOfficeHours) {
    finalDesc = `${finalDesc}\n[After Office Hours: ${afterOfficeHours}]`.trim();
  }
  return finalDesc;
}

/**
 * Reusable 4-column structured display component for Today's Work
 * Used in TodaysWorkforceTable, AdminAllEmployeesView, AdminWorkActivityView, WorkHistoryView
 */
export function TodayWorkTableDisplay({ rawWork, compact = false, allowStatusEdit = false, onRowChange = null }) {
  if (!rawWork || !rawWork.trim()) {
    return <span className="text-slate-400 italic text-xs">No description yet</span>;
  }

  const { cleanText, clientTags, afterOfficeHours, workEntries } = parseWorkDesc(rawWork);

  // If structured 4-column entries exist
  if (workEntries && workEntries.length > 0) {
    return (
      <div className="space-y-2 w-full">
        <div className="overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-2xs">
          <table className="w-full text-left text-xs divide-y divide-slate-100">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              <tr>
                <th className="px-3 py-2 whitespace-nowrap">Company</th>
                <th className="px-3 py-2">Relevant Work</th>
                <th className="px-3 py-2 whitespace-nowrap">Work Status</th>
                <th className="px-3 py-2 whitespace-nowrap">Client's Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {workEntries.map((row, idx) => (
                <tr key={row.id || idx} className="hover:bg-slate-50/60 transition-colors">
                  {/* Column 1: Company */}
                  <td className="px-3 py-2 align-top whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <div className={`p-1 rounded ${row.isZohoClient ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
                        <Building2 className="w-3 h-3 shrink-0" />
                      </div>
                      <span className="font-bold text-slate-900 text-xs">
                        {row.company || <span className="text-slate-400 italic font-normal">Unspecified</span>}
                      </span>
                    </div>
                  </td>

                  {/* Column 2: Relevant Work */}
                  <td className="px-3 py-2 align-top text-slate-700 min-w-[220px] w-full break-words">
                    <p className="whitespace-pre-wrap leading-relaxed text-xs">
                      {row.work || <span className="text-slate-400 italic font-normal">No details provided</span>}
                    </p>
                  </td>

                  {/* Column 3: Work Status */}
                  <td className="px-3 py-2 align-top whitespace-nowrap">
                    {allowStatusEdit ? (
                      <select
                        value={row.status || 'Pending'}
                        onChange={(e) => onRowChange && onRowChange(idx, 'status', e.target.value)}
                        className={`text-xs font-bold rounded-xl px-2.5 py-1.5 border transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
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
                    ) : (
                      <StatusBadge status={row.status} />
                    )}
                  </td>

                  {/* Column 4: Client's Review */}
                  <td className="px-3 py-2 align-top whitespace-nowrap">
                    {allowStatusEdit ? (
                      <select
                        value={row.review || 'Pending Review'}
                        onChange={(e) => onRowChange && onRowChange(idx, 'review', e.target.value)}
                        className={`text-xs font-bold rounded-xl px-2.5 py-1.5 border transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
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
                    ) : (
                      <ReviewBadge review={row.review} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* After Office Hours Badge */}
        {afterOfficeHours && (
          <div className="flex items-center gap-1.5 pt-0.5">
            <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">After Office:</span>
            <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
              <Clock className="w-3 h-3 text-orange-200" />
              <span>{afterOfficeHours}</span>
            </span>
          </div>
        )}
      </div>
    );
  }

  // Fallback for legacy plain text entries
  return (
    <div className="max-h-[250px] overflow-y-auto pr-1.5 whitespace-pre-wrap leading-relaxed text-xs text-slate-700 bg-slate-50/60 p-2.5 rounded-xl border border-slate-100 space-y-2">
      <div>{cleanText || 'Work submitted'}</div>
      {clientTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-200/60">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clients:</span>
          {clientTags.map(cName => (
            <span key={cName} className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
              <Building2 className="w-3 h-3 text-blue-200" />
              <span>{cName}</span>
            </span>
          ))}
        </div>
      )}
      {afterOfficeHours && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-200/60">
          <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">After Office:</span>
          <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
            <Clock className="w-3 h-3 text-orange-200" />
            <span>{afterOfficeHours}</span>
          </span>
        </div>
      )}
    </div>
  );
}
