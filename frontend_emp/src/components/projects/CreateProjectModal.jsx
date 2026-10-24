import React, { useState, useEffect } from 'react';
import { 
  X, 
  Briefcase, 
  Crown, 
  Users, 
  Calendar, 
  Target, 
  Check, 
  Search, 
  AlertCircle 
} from 'lucide-react';

export default function CreateProjectModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  employees = [], 
  projectToEdit = null 
}) {
  const isEditing = Boolean(projectToEdit);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    client_name: '',
    description: '',
    priority: 'Medium',
    status: 'In Progress',
    start_date: new Date().toISOString().split('T')[0],
    target_date: '',
    project_manager_id: '',
    members: []
  });

  const [memberSearch, setMemberSearch] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (projectToEdit) {
      const pmIds = Array.isArray(projectToEdit.project_manager_ids) && projectToEdit.project_manager_ids.length > 0
        ? projectToEdit.project_manager_ids.map(String)
        : (projectToEdit.project_manager_id ? [String(projectToEdit.project_manager_id)] : []);

      setFormData({
        name: projectToEdit.name || '',
        code: projectToEdit.code || '',
        client_name: projectToEdit.client_name || '',
        description: projectToEdit.description || '',
        priority: projectToEdit.priority || 'Medium',
        status: projectToEdit.status || 'In Progress',
        start_date: projectToEdit.start_date || new Date().toISOString().split('T')[0],
        target_date: projectToEdit.target_date || '',
        project_manager_id: pmIds[0] || '',
        project_manager_ids: pmIds,
        members: (projectToEdit.members || []).map(id => String(id))
      });
    } else {
      setFormData({
        name: '',
        code: '',
        client_name: '',
        description: '',
        priority: 'Medium',
        status: 'In Progress',
        start_date: new Date().toISOString().split('T')[0],
        target_date: '',
        project_manager_id: '',
        project_manager_ids: [],
        members: []
      });
    }
    setError('');
  }, [projectToEdit, isOpen]);

  if (!isOpen) return null;

  const handleMemberToggle = (empId) => {
    const strId = String(empId);
    setFormData(prev => {
      const exists = prev.members.includes(strId);
      const nextMembers = exists 
        ? prev.members.filter(id => id !== strId)
        : [...prev.members, strId];

      // If removed member was in PMs list, also remove them from PMs
      let nextPmIds = prev.project_manager_ids;
      if (exists && prev.project_manager_ids.includes(strId)) {
        nextPmIds = prev.project_manager_ids.filter(id => id !== strId);
      }

      return {
        ...prev,
        members: nextMembers,
        project_manager_ids: nextPmIds,
        project_manager_id: nextPmIds[0] || ''
      };
    });
  };

  const handleAddPm = (pmId) => {
    if (!pmId) return;
    const strId = String(pmId);
    setFormData(prev => {
      const nextPmIds = prev.project_manager_ids.includes(strId)
        ? prev.project_manager_ids
        : [...prev.project_manager_ids, strId];

      // Auto-include PM in members list if not already present
      const nextMembers = !prev.members.includes(strId)
        ? [...prev.members, strId]
        : prev.members;

      return {
        ...prev,
        project_manager_ids: nextPmIds,
        project_manager_id: nextPmIds[0] || '',
        members: nextMembers
      };
    });
  };

  const handleRemovePm = (pmId) => {
    const strId = String(pmId);
    setFormData(prev => {
      const nextPmIds = prev.project_manager_ids.filter(id => id !== strId);
      return {
        ...prev,
        project_manager_ids: nextPmIds,
        project_manager_id: nextPmIds[0] || ''
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Please provide a project name.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await onSubmit({
        ...formData,
        project_manager_ids: formData.project_manager_ids.map(id => parseInt(id, 10)).filter(Boolean),
        project_manager_id: formData.project_manager_ids[0] ? parseInt(formData.project_manager_ids[0], 10) : null,
        members: formData.members.map(id => parseInt(id, 10))
      });
      onClose();
    } catch (err) {
      console.error('Project save error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to save project');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const q = memberSearch.toLowerCase();
    return (emp.name && emp.name.toLowerCase().includes(q)) ||
           (emp.email && emp.email.toLowerCase().includes(q)) ||
           (emp.department && emp.department.toLowerCase().includes(q));
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                {isEditing ? 'Edit Project Details' : 'Create New Project'}
              </h2>
              <p className="text-xs text-slate-400">
                {isEditing ? 'Update project settings and manage team configuration' : 'Set up a new initiative, assign team members, and appoint a Project Manager'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Project Name & Code */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Project Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Helan POS Upgrade & Integration"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Project Code
              </label>
              <input
                type="text"
                placeholder="e.g. PRJ-POS-01"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-mono text-slate-800"
              />
            </div>
          </div>

          {/* Client & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Client / Company (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Helans Retail, Wycherley, Bio Grow"
                value={formData.client_name}
                onChange={(e) => setFormData(prev => ({ ...prev, client_name: e.target.value }))}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-slate-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                >
                  <option value="Planning">Planning</option>
                  <option value="In Progress">In Progress</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Project Description & Objectives
            </label>
            <textarea
              rows={3}
              placeholder="Outline project scope, deliverables, key technical requirements..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-slate-800 resize-none"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Target Deadline Date
              </label>
              <input
                type="date"
                value={formData.target_date}
                onChange={(e) => setFormData(prev => ({ ...prev, target_date: e.target.value }))}
                className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800"
              />
            </div>
          </div>

          {/* PROJECT MANAGER DESIGNATION */}
          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-600" />
                <span>Appoint Project Managers ({formData.project_manager_ids.length})</span>
              </label>
              <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                Grants Scoped Admin Rights
              </span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Designated team members will have administrative authority for <strong>this project</strong>, allowing them to edit details, add milestones, create tasks, and assign team members. You can appoint one or multiple project managers.
            </p>

            {/* Selected PM badges */}
            {formData.project_manager_ids.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1 pb-1">
                {formData.project_manager_ids.map(pmId => {
                  const emp = employees.find(e => String(e.id) === String(pmId)) || { id: pmId, name: `Employee #${pmId}` };
                  return (
                    <div key={pmId} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300 shadow-2xs">
                      <Crown className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>{emp.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePm(pmId)}
                        className="text-amber-700 hover:text-rose-600 ml-1 p-0.5 rounded-md hover:bg-amber-200 transition-colors cursor-pointer"
                        title="Remove Project Manager role"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <select
              value=""
              onChange={(e) => {
                if (e.target.value) handleAddPm(e.target.value);
              }}
              className="w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/30 bg-white text-slate-900 cursor-pointer"
            >
              <option value="">+ Click to appoint Project Manager...</option>
              {employees
                .filter(emp => !formData.project_manager_ids.includes(String(emp.id)))
                .map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.department || 'Employee'}) - {emp.email}
                  </option>
                ))}
            </select>
          </div>

          {/* TEAM MEMBERS SELECTION */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Assign Team Members ({formData.members.length} selected)</span>
              </label>
              {formData.members.length > 0 && (
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, members: [], project_manager_id: '' }))}
                  className="text-[11px] text-slate-400 hover:text-rose-600 cursor-pointer"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Search Box */}
            <div className="relative mb-2">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search employees by name, email, department..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700"
              />
            </div>

            {/* Members Scrollable List */}
            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50/50 p-1">
              {filteredEmployees.length === 0 ? (
                <p className="text-xs text-slate-400 p-4 text-center">No matching employees found</p>
              ) : (
                filteredEmployees.map(emp => {
                  const isChecked = formData.members.includes(String(emp.id));
                  const isPM = String(formData.project_manager_id) === String(emp.id);

                  return (
                    <div
                      key={emp.id}
                      onClick={() => handleMemberToggle(emp.id)}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                        isChecked ? 'bg-blue-50/80 text-blue-900' : 'hover:bg-white text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{emp.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{emp.email} • {emp.department || 'Employee'}</p>
                        </div>
                      </div>

                      {isPM && (
                        <span className="shrink-0 text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-200">
                          <Crown className="w-3 h-3 text-amber-600" /> PM
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  );
}
