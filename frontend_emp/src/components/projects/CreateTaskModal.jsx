import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckSquare, 
  Calendar, 
  User, 
  Target, 
  AlertCircle 
} from 'lucide-react';

export default function CreateTaskModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  project, 
  taskToEdit = null 
}) {
  const isEditing = Boolean(taskToEdit);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_to: '',
    target_id: '',
    priority: 'Medium',
    due_date: '',
    status: 'Pending'
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (taskToEdit) {
      setFormData({
        title: taskToEdit.title || '',
        description: taskToEdit.description || '',
        assigned_to: taskToEdit.assigned_to ? String(taskToEdit.assigned_to) : '',
        target_id: taskToEdit.target_id ? String(taskToEdit.target_id) : '',
        priority: taskToEdit.priority || 'Medium',
        due_date: taskToEdit.due_date || '',
        status: taskToEdit.status || 'Pending'
      });
    } else {
      setFormData({
        title: '',
        description: '',
        assigned_to: '',
        target_id: '',
        priority: 'Medium',
        due_date: '',
        status: 'Pending'
      });
    }
    setError('');
  }, [taskToEdit, isOpen]);

  if (!isOpen || !project) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Please provide a task title.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await onSubmit({
        ...formData,
        assigned_to: formData.assigned_to ? parseInt(formData.assigned_to, 10) : null,
        target_id: formData.target_id ? parseInt(formData.target_id, 10) : null
      });
      onClose();
    } catch (err) {
      console.error('Task save error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to save task');
    } finally {
      setSubmitting(false);
    }
  };

  const members = project.team_members || [];
  const targets = project.targets || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                {isEditing ? 'Edit Task' : 'Add New Task'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {project.name}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Test POS transaction settlement under latency"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium text-slate-800"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Task Instructions & Details
            </label>
            <textarea
              rows={3}
              placeholder="Provide specific guidelines, bug reproduction steps, or requirements..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800 resize-none"
            />
          </div>

          {/* Assign Member */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>Assign to Team Member</span>
            </label>
            <select
              value={formData.assigned_to}
              onChange={(e) => setFormData(prev => ({ ...prev, assigned_to: e.target.value }))}
              className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white text-slate-800"
            >
              <option value="">-- Unassigned (Choose member) --</option>
              {members.map(member => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.department || 'Employee'})
                </option>
              ))}
            </select>
          </div>

          {/* Link to Target / Milestone */}
          {targets.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-indigo-600" />
                <span>Link to Project Target / Milestone</span>
              </label>
              <select
                value={formData.target_id}
                onChange={(e) => setFormData(prev => ({ ...prev, target_id: e.target.value }))}
                className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white text-slate-800"
              >
                <option value="">-- Optional (No specific target) --</option>
                {targets.map(tg => (
                  <option key={tg.id} value={tg.id}>
                    {tg.title} {tg.is_completed ? '(Completed)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Priority, Due Date, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Due Date
              </label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Submit buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
