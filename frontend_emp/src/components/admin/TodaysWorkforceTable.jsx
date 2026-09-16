import React, { useState } from 'react';
import { Search, ChevronDown, ArrowUpRight } from 'lucide-react';

export default function TodaysWorkforceTable({ workforce = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All departments');

  const departments = ['All departments', 'IT', 'Finance', 'Operations', 'HR', 'Marketing'];

  const filtered = workforce.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          emp.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          emp.today_work.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = departmentFilter === 'All departments' ||
                        emp.department.toLowerCase() === departmentFilter.toLowerCase();
    return matchesSearch && matchesDept;
  });

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 mb-8 overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Today's Workforce</h3>
          <p className="text-xs text-slate-500 mt-0.5">Employees currently working today</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search workforce"
              className="bg-slate-50 border border-slate-200 text-xs text-slate-700 placeholder-slate-400 rounded-xl pl-9 pr-3 py-2 w-48 sm:w-56 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Department Filter Dropdown */}
          <div className="relative">
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-xl pl-3 pr-8 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold">
            <tr>
              <th className="px-6 py-3.5">Employee</th>
              <th className="px-6 py-3.5">Department</th>
              <th className="px-6 py-3.5">Position</th>
              <th className="px-6 py-3.5">Today's work</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5">Updated</th>
              <th className="px-4 py-3.5 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-slate-400 font-medium">
                  No matching employees working today.
                </td>
              </tr>
            ) : (
              filtered.map((emp) => (
                <tr key={emp.id || Math.random()} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-900 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-200/60 shadow-2xs">
                        {emp.initials}
                      </div>
                      <span className="font-bold text-slate-900 text-xs">{emp.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{emp.department}</td>
                  <td className="px-6 py-4 text-slate-700 font-medium max-w-[130px] truncate">{emp.position}</td>
                  <td className="px-6 py-4 text-slate-800 font-normal max-w-xs truncate">{emp.today_work}</td>
                  <td className="px-6 py-4">
                    <span className="bg-emerald-50 text-emerald-600 border border-emerald-200/80 text-[11px] font-bold px-2.5 py-0.5 rounded-md">
                      {emp.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-[11px] font-medium whitespace-nowrap">{emp.updated_ago}</td>
                  <td className="px-4 py-4 text-right">
                    <button className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors">
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
