import React, { useState, useEffect } from 'react';
import API from '../../api';
import TaskCard from './TaskCard';
import { 
  X, 
  Briefcase, 
  Crown, 
  Users, 
  Calendar, 
  Target, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Search, 
  ChevronRight, 
  AlertCircle,
  Sparkles,
  FileText
} from 'lucide-react';

export default function ProjectDetailModal({ 
  isOpen, 
  onClose, 
  projectId, 
  currentUser, 
  isEmployeeView = false,
  onOpenEditProject, 
  onOpenCreateTask, 
  onEditTask, 
  onProjectUpdated 
}) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks' | 'targets' | 'team' | 'overview'
  const [taskFilter, setTaskFilter] = useState('all');
  const [searchTask, setSearchTask] = useState('');

  // Target creation inline state
  const [showAddTarget, setShowAddTarget] = useState(false);
  const [newTargetTitle, setNewTargetTitle] = useState('');
  const [newTargetDate, setNewTargetDate] = useState('');
  const [targetSubmitting, setTargetSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && projectId) {
      fetchProjectDetails();
    }
  }, [isOpen, projectId, isEmployeeView]);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/projects/${projectId}?scope=${isEmployeeView ? 'employee' : 'admin'}`, {
        headers: {
          'x-view-scope': isEmployeeView ? 'employee' : 'admin'
        }
      });
      if (res.data) {
        setProject(res.data);
      }
    } catch (err) {
      console.error('Failed to load project details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isManager = Boolean(
    project?.permissions?.is_manager ||
    (currentUser?.id && (
      String(project?.project_manager_id) === String(currentUser.id) ||
      (Array.isArray(project?.project_manager_ids) && project.project_manager_ids.some(id => String(id) === String(currentUser.id))) ||
      (Array.isArray(project?.project_managers) && project.project_managers.some(pm => String(pm.id || pm) === String(currentUser.id)))
    ))
  );
  const isAdmin = currentUser?.role === 'Admin';
  // STRICT: Only designated Project Managers can create and manage tasks in employee view
  const canManage = isEmployeeView ? isManager : (isAdmin || isManager);

  const handleToggleTaskStatus = async (taskId, nextStatus) => {
    try {
      await API.patch(`/projects/${projectId}/tasks/${taskId}/status`, { status: nextStatus });
      await fetchProjectDetails();
      if (onProjectUpdated) onProjectUpdated();
    } catch (err) {
      console.error('Failed to update task status:', err);
      alert(err.response?.data?.error || 'Failed to update task status');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await API.delete(`/projects/${projectId}/tasks/${taskId}`);
      await fetchProjectDetails();
      if (onProjectUpdated) onProjectUpdated();
    } catch (err) {
      console.error('Failed to delete task:', err);
      alert(err.response?.data?.error || 'Failed to delete task');
    }
  };

  const handleToggleTarget = async (targetId, currentStatus) => {
    if (!canManage) return;
    try {
      await API.patch(`/projects/${projectId}/targets/${targetId}`, { is_completed: !currentStatus });
      await fetchProjectDetails();
      if (onProjectUpdated) onProjectUpdated();
    } catch (err) {
      console.error('Failed to toggle target:', err);
    }
  };

  const handleAddTargetSubmit = async (e) => {
    e.preventDefault();
    if (!newTargetTitle.trim()) return;
    try {
      setTargetSubmitting(true);
      await API.post(`/projects/${projectId}/targets`, {
        title: newTargetTitle,
        target_date: newTargetDate || null
      });
      setNewTargetTitle('');
      setNewTargetDate('');
      setShowAddTarget(false);
      await fetchProjectDetails();
      if (onProjectUpdated) onProjectUpdated();
    } catch (err) {
      console.error('Failed to add target:', err);
      alert(err.response?.data?.error || 'Failed to add target');
    } finally {
      setTargetSubmitting(false);
    }
  };

  const handleDeleteTarget = async (targetId) => {
    if (!window.confirm('Are you sure you want to delete this milestone target?')) return;
    try {
      await API.delete(`/projects/${projectId}/targets/${targetId}`);
      await fetchProjectDetails();
      if (onProjectUpdated) onProjectUpdated();
    } catch (err) {
      console.error('Failed to delete target:', err);
    }
  };

  const tasks = project?.tasks || [];
  const targets = project?.targets || [];
  const members = project?.team_members || [];
  const stats = project?.stats || { total_tasks: 0, completed_tasks: 0, progress_percent: 0 };

  const filteredTasks = tasks.filter(t => {
    const matchesFilter = taskFilter === 'all' 
      ? true 
      : taskFilter === 'my_tasks'
        ? currentUser && String(t.assigned_to) === String(currentUser.id)
        : t.status.toLowerCase() === taskFilter.toLowerCase();
    
    const matchesSearch = !searchTask.trim() || 
      (t.title && t.title.toLowerCase().includes(searchTask.toLowerCase())) ||
      (t.description && t.description.toLowerCase().includes(searchTask.toLowerCase())) ||
      (t.assignee?.name && t.assignee.name.toLowerCase().includes(searchTask.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[94vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Top Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-white truncate">
                  {loading ? 'Loading project workspace...' : project?.name}
                </h2>
                {project?.code && (
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                    {project.code}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 truncate">
                {project?.client_name ? `Client: ${project.client_name}` : 'Internal Project'}
                {project?.target_date ? ` • Target: ${project.target_date}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canManage && (
              <button
                onClick={() => onOpenEditProject(project)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Edit Details</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Project Manager Privileges Banner */}
        {isManager && (
          <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 px-6 py-2 text-white text-xs font-semibold flex items-center justify-between tracking-wide shrink-0">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              <span>You have Project Manager administrative privileges for this project.</span>
            </div>
            <span className="text-[11px] font-bold bg-amber-700/60 px-2.5 py-0.5 rounded-full">
              Full Scoped Power
            </span>
          </div>
        )}

        {/* Quick Tabs & Summary Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-4 flex-wrap shrink-0">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'tasks' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tasks ({tasks.length})
            </button>
            <button
              onClick={() => setActiveTab('targets')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'targets' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Milestones ({targets.length})
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'team' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Team ({members.length})
            </button>
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'overview' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Overview
            </button>
          </div>

          {/* Quick Progress */}
          <div className="flex items-center gap-3 text-xs shrink-0">
            <span className="text-slate-500 font-medium">Completion:</span>
            <div className="w-24 h-2 rounded-full bg-slate-200 overflow-hidden">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-300" 
                style={{ width: `${stats.progress_percent}%` }}
              />
            </div>
            <span className="font-bold text-slate-800">{stats.progress_percent}%</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="py-20 text-center text-slate-400">Loading project data...</div>
          ) : (
            <>
              {/* TAB 1: TASKS */}
              {activeTab === 'tasks' && (
                <div className="space-y-4">
                  {/* Task Toolbar */}
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    {/* Search & Filter */}
                    <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search tasks by title, instructions, assignee..."
                          value={searchTask}
                          onChange={(e) => setSearchTask(e.target.value)}
                          className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 bg-white"
                        />
                      </div>

                      <select
                        value={taskFilter}
                        onChange={(e) => setTaskFilter(e.target.value)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="all">All Tasks</option>
                        <option value="my_tasks">Assigned to Me</option>
                        <option value="pending">Pending</option>
                        <option value="in progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>

                    {/* Add Task Button (PM / Admin) */}
                    {canManage && (
                      <button
                        onClick={() => onOpenCreateTask(project)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm cursor-pointer shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Task</span>
                      </button>
                    )}
                  </div>

                  {/* Tasks List */}
                  {filteredTasks.length === 0 ? (
                    <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                      <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-700">No tasks found</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {canManage 
                          ? 'Click "Add Task" to create assignments for your team members.' 
                          : 'No tasks currently match your filter criteria.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {filteredTasks.map(task => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          currentUser={currentUser}
                          canManage={canManage}
                          onToggleStatus={handleToggleTaskStatus}
                          onEditTask={() => onEditTask(task, project)}
                          onDeleteTask={handleDeleteTask}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: TARGETS / MILESTONES */}
              {activeTab === 'targets' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Project Targets & Milestones</h4>
                      <p className="text-xs text-slate-500">Track key deliverables and deadlines for {project.name}.</p>
                    </div>
                    {canManage && (
                      <button
                        onClick={() => setShowAddTarget(prev => !prev)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{showAddTarget ? 'Cancel' : 'Add Target'}</span>
                      </button>
                    )}
                  </div>

                  {/* Inline Add Target Form */}
                  {showAddTarget && (
                    <form onSubmit={handleAddTargetSubmit} className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200 space-y-3 animate-in fade-in">
                      <div className="font-bold text-xs text-indigo-950 uppercase tracking-wider">New Milestone / Target</div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <input
                            type="text"
                            required
                            placeholder="Target description e.g. Finish Zoho Books payment gateway"
                            value={newTargetTitle}
                            onChange={(e) => setNewTargetTitle(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-indigo-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>
                        <div>
                          <input
                            type="date"
                            value={newTargetDate}
                            onChange={(e) => setNewTargetDate(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-indigo-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowAddTarget(false)}
                          className="px-3 py-1 text-xs text-slate-500 hover:text-slate-700"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={targetSubmitting}
                          className="px-4 py-1 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs cursor-pointer"
                        >
                          {targetSubmitting ? 'Saving...' : 'Save Target'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Targets List */}
                  {targets.length === 0 ? (
                    <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                      <Target className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-700">No project targets defined yet</p>
                      <p className="text-xs text-slate-400 mt-1">Milestones help track overall project progress against deadlines.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {targets.map(tg => (
                        <div 
                          key={tg.id} 
                          className={`p-4 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                            tg.is_completed ? 'bg-emerald-50/50 border-emerald-200' : 'bg-white border-slate-200 shadow-xs'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <button
                              type="button"
                              disabled={!canManage}
                              onClick={() => handleToggleTarget(tg.id, tg.is_completed)}
                              className={`shrink-0 ${!canManage ? 'cursor-default' : 'cursor-pointer'}`}
                            >
                              {tg.is_completed ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                              ) : (
                                <div className="w-5 h-5 rounded-full border-2 border-slate-300 hover:border-slate-500" />
                              )}
                            </button>
                            <div className="min-w-0">
                              <p className={`text-sm font-semibold truncate ${tg.is_completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                {tg.title}
                              </p>
                              {tg.target_date && (
                                <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                  <Calendar className="w-3 h-3" /> Target Date: {tg.target_date}
                                </p>
                              )}
                            </div>
                          </div>

                          {canManage && (
                            <button
                              onClick={() => handleDeleteTarget(tg.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 cursor-pointer"
                              title="Delete Target"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: TEAM MEMBERS */}
              {activeTab === 'team' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Project Team Members</h4>
                      <p className="text-xs text-slate-500">Personnel assigned to collaborate on this project.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {members.map(member => {
                      const isPM = (Array.isArray(project.project_manager_ids) && project.project_manager_ids.some(id => String(id) === String(member.id))) ||
                                   (Array.isArray(project.project_managers) && project.project_managers.some(pm => String(pm.id || pm) === String(member.id))) ||
                                   String(project.project_manager_id) === String(member.id);
                      const memberTasks = tasks.filter(t => String(t.assigned_to) === String(member.id));
                      const memberCompleted = memberTasks.filter(t => t.status === 'Completed').length;

                      return (
                        <div 
                          key={member.id} 
                          className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
                            isPM ? 'bg-amber-50/60 border-amber-200' : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {member.photo_url ? (
                              <img 
                                src={member.photo_url} 
                                alt={member.name} 
                                className="w-10 h-10 rounded-full object-cover border border-slate-200" 
                              />
                            ) : (
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xs ${
                                isPM ? 'bg-amber-500' : 'bg-slate-800'
                              }`}>
                                {member.initials || 'U'}
                              </div>
                            )}

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs font-bold text-slate-900 truncate">{member.name}</p>
                                {isPM && (
                                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-md flex items-center gap-0.5">
                                    <Crown className="w-3 h-3 text-amber-600" /> PM
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 truncate">{member.email}</p>
                              <p className="text-[10px] text-slate-500 font-medium">{member.department || 'Employee'}</p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                              {memberCompleted}/{memberTasks.length} Done
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 4: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-5">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Detailed Scope</h4>
                    <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                      {project.description || 'No detailed scope provided.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                      <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Project Schedule</span>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Start Date:</span>
                        <span className="font-bold text-slate-800">{project.start_date || 'Not specified'}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Target Deadline:</span>
                        <span className="font-bold text-slate-800">{project.target_date || 'Not specified'}</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                      <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Manager & Authority</span>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">{(project.project_managers?.length || 1) > 1 ? 'Project Managers:' : 'Project Manager:'}</span>
                        <span className="font-bold text-slate-800 text-right">
                          {project.project_managers && project.project_managers.length > 0
                            ? project.project_managers.map(pm => pm.name).join(', ')
                            : (project.project_manager?.name || 'Unassigned')}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Authority Type:</span>
                        <span className="font-bold text-amber-700">Project Scoped Admin</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-400">
            {stats.completed_tasks} of {stats.total_tasks} tasks finished
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close Workspace
          </button>
        </div>
      </div>
    </div>
  );
}
