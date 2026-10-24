import React, { useState, useEffect } from 'react';
import API from '../../api';
import ProjectCard from './ProjectCard';
import TaskCard from './TaskCard';
import CreateProjectModal from './CreateProjectModal';
import CreateTaskModal from './CreateTaskModal';
import ProjectDetailModal from './ProjectDetailModal';
import { 
  Briefcase, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  Crown, 
  Users, 
  Target, 
  Layers,
  Sparkles,
  AlertCircle
} from 'lucide-react';

export default function ProjectManagementView({ currentUser, allEmployees = [], isEmployeeView = false }) {
  const [projects, setProjects] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // View state: 'projects' | 'my-tasks'
  const [viewMode, setViewMode] = useState('projects');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');

  // Modals state
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);

  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [taskProjectContext, setTaskProjectContext] = useState(null);
  const [taskToEdit, setTaskToEdit] = useState(null);

  const [employeeList, setEmployeeList] = useState(allEmployees || []);

  const isAdmin = currentUser?.role === 'Admin';

  useEffect(() => {
    fetchProjects();
    fetchMyTasks();
    if (!allEmployees || allEmployees.length === 0) {
      fetchEmployees();
    } else {
      setEmployeeList(allEmployees);
    }
  }, [currentUser, allEmployees, isEmployeeView]);

  const fetchEmployees = async () => {
    try {
      const res = await API.get('/projects/meta/employees');
      if (res.data && Array.isArray(res.data)) {
        setEmployeeList(res.data);
      }
    } catch (e) {
      console.warn('Error loading employees in ProjectManagementView:', e);
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/projects?user_id=${currentUser?.id || ''}&scope=${isEmployeeView ? 'employee' : 'admin'}`, {
        headers: {
          'x-user-id': currentUser?.id ? String(currentUser.id) : '',
          'x-user-role': isEmployeeView ? 'Employee' : (currentUser?.role || ''),
          'x-view-scope': isEmployeeView ? 'employee' : 'admin'
        }
      });
      if (res.data) {
        setProjects(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyTasks = async () => {
    try {
      const res = await API.get(`/projects/my-tasks?user_id=${currentUser?.id || ''}`, {
        headers: {
          'x-user-id': currentUser?.id ? String(currentUser.id) : '',
          'x-user-role': currentUser?.role || ''
        }
      });
      if (res.data) {
        setMyTasks(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      console.error('Error fetching my-tasks:', err);
    }
  };

  // Project CRUD Actions
  const handleSaveProject = async (projectData) => {
    if (projectToEdit) {
      await API.put(`/projects/${projectToEdit.id}`, projectData);
    } else {
      await API.post('/projects', projectData);
    }
    await fetchProjects();
    await fetchMyTasks();
  };

  const handleOpenWorkspace = (proj) => {
    setSelectedProjectId(proj.id);
    setIsDetailOpen(true);
  };

  const handleOpenEditProject = (proj) => {
    setProjectToEdit(proj);
    setIsCreateProjectOpen(true);
  };

  // Task CRUD Actions
  const handleOpenCreateTask = (proj) => {
    setTaskProjectContext(proj);
    setTaskToEdit(null);
    setIsCreateTaskOpen(true);
  };

  const handleOpenEditTask = (task, proj) => {
    setTaskProjectContext(proj);
    setTaskToEdit(task);
    setIsCreateTaskOpen(true);
  };

  const handleSaveTask = async (taskData) => {
    if (!taskProjectContext) return;
    if (taskToEdit) {
      await API.put(`/projects/${taskProjectContext.id}/tasks/${taskToEdit.id}`, taskData);
    } else {
      await API.post(`/projects/${taskProjectContext.id}/tasks`, taskData);
    }
    await fetchProjects();
    await fetchMyTasks();
  };

  const handleToggleMyTaskStatus = async (taskId, nextStatus) => {
    const task = myTasks.find(t => t.id === taskId);
    if (!task) return;
    try {
      await API.patch(`/projects/${task.project_id}/tasks/${taskId}/status`, { status: nextStatus });
      await fetchMyTasks();
      await fetchProjects();
    } catch (err) {
      console.error('Failed to toggle task status:', err);
    }
  };

  // Employee visibility check:
  // In Admin dashboard, Admins see all projects.
  // In Employee view, users (including Admins viewing in employee mode) only see projects assigned to them (as Project Manager or Team Member).
  const isProjectVisibleToUser = (p) => {
    if (isAdmin && !isEmployeeView) return true;
    const myId = currentUser?.id;
    if (!myId) return false;

    const isPm = String(p.project_manager_id) === String(myId) ||
      (Array.isArray(p.project_manager_ids) && p.project_manager_ids.some(id => String(id) === String(myId))) ||
      (Array.isArray(p.project_managers) && p.project_managers.some(pm => String(pm.id || pm) === String(myId)));
    const isMember = (Array.isArray(p.members) && p.members.some(id => String(id) === String(myId))) ||
      (Array.isArray(p.team_members) && p.team_members.some(m => String(m.id || m) === String(myId)));

    return isPm || isMember;
  };

  const visibleProjects = projects.filter(isProjectVisibleToUser);

  // Computed metrics
  const totalProjectsCount = visibleProjects.length;
  const inProgressProjectsCount = visibleProjects.filter(p => p.status === 'In Progress').length;
  const myCompletedTasksCount = myTasks.filter(t => t.status === 'Completed').length;
  const managedByMeCount = visibleProjects.filter(p => p.permissions?.is_manager).length;

  // Filtered projects
  const filteredProjects = visibleProjects.filter(p => {
    const matchesSearch = !searchTerm.trim() ||
      (p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.client_name && p.client_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.code && p.code.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;

    const matchesRole = roleFilter === 'All' 
      ? true 
      : roleFilter === 'managed' 
        ? p.permissions?.is_manager 
        : roleFilter === 'assigned'
          ? !p.permissions?.is_manager
          : true;

    return matchesSearch && matchesStatus && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Title & Action Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Briefcase className="w-6 h-6 text-blue-600" />
            <span>Projects & Task Management</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Coordinate company deliverables, assign tasks, and track milestone deadlines.
          </p>
        </div>

        {isAdmin && !isEmployeeView && (
          <button
            type="button"
            onClick={() => {
              setProjectToEdit(null);
              setIsCreateProjectOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm hover:shadow-md cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Project</span>
          </button>
        )}
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Projects */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Projects</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{totalProjectsCount}</p>
            <p className="text-[10px] text-blue-600 font-semibold mt-0.5">{inProgressProjectsCount} currently in progress</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* My Tasks */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">My Assigned Tasks</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{myTasks.length}</p>
            <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">{myCompletedTasksCount} completed</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Projects I Manage */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Projects I Manage</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{isAdmin ? 'All (Admin)' : managedByMeCount}</p>
            <p className="text-[10px] text-amber-600 font-semibold mt-0.5">{isAdmin ? 'Full System Authority' : 'Scoped Admin Role'}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Crown className="w-5 h-5" />
          </div>
        </div>

        {/* Overall Tasks in System */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">My Pending Tasks</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{myTasks.length - myCompletedTasksCount}</p>
            <p className="text-[10px] text-rose-500 font-semibold mt-0.5">Need attention</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* View Mode & Filter Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('projects')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                viewMode === 'projects' 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Projects ({projects.length})
            </button>
            <button
              type="button"
              onClick={() => setViewMode('my-tasks')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                viewMode === 'my-tasks' 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My Tasks ({myTasks.length})
            </button>
          </div>

          {/* Search & Filters */}
          {viewMode === 'projects' && (
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search */}
              <div className="relative min-w-[200px] flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="All">All Statuses</option>
                <option value="In Progress">In Progress</option>
                <option value="Planning">Planning</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
              </select>

              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="All">All Roles</option>
                <option value="managed">Projects I Manage</option>
                <option value="assigned">Team Member</option>
              </select>
            </div>
          )}
        </div>

        {/* Tab Body */}
        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="py-20 text-center text-slate-400">Loading projects workspace...</div>
          ) : viewMode === 'projects' ? (
            /* PROJECTS GRID VIEW */
            filteredProjects.length === 0 ? (
              <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">No projects found</p>
                <p className="text-xs text-slate-400 mt-1">
                  {isAdmin 
                    ? 'Click "+ New Project" above to create a project and assign your team.'
                    : 'You are not assigned to any projects yet. Contact your administrator.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredProjects.map(project => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    currentUser={currentUser}
                    onViewDetails={handleOpenWorkspace}
                  />
                ))}
              </div>
            )
          ) : (
            /* MY TASKS VIEW */
            myTasks.length === 0 ? (
              <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">All caught up!</p>
                <p className="text-xs text-slate-400 mt-1">You do not have any pending tasks assigned to you right now.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
                  <span>Click the check circle on any task to mark it completed or in progress:</span>
                  <span className="font-bold text-slate-800">
                    {myCompletedTasksCount} of {myTasks.length} Completed
                  </span>
                </div>

                {myTasks.map(task => (
                  <div key={task.id} className="relative">
                    {task.project && (
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Briefcase className="w-3 h-3 text-blue-600" />
                        <span>{task.project.name} ({task.project.code})</span>
                      </div>
                    )}
                    <TaskCard
                      task={task}
                      currentUser={currentUser}
                      canManage={false}
                      onToggleStatus={handleToggleMyTaskStatus}
                    />
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {/* MODALS */}
      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => {
          setIsCreateProjectOpen(false);
          setProjectToEdit(null);
        }}
        onSubmit={handleSaveProject}
        employees={employeeList}
        projectToEdit={projectToEdit}
      />

      <ProjectDetailModal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedProjectId(null);
        }}
        projectId={selectedProjectId}
        currentUser={currentUser}
        isEmployeeView={isEmployeeView}
        onOpenEditProject={(proj) => {
          setIsDetailOpen(false);
          handleOpenEditProject(proj);
        }}
        onOpenCreateTask={(proj) => handleOpenCreateTask(proj)}
        onEditTask={(task, proj) => handleOpenEditTask(task, proj)}
        onProjectUpdated={() => {
          fetchProjects();
          fetchMyTasks();
        }}
      />

      <CreateTaskModal
        isOpen={isCreateTaskOpen}
        onClose={() => {
          setIsCreateTaskOpen(false);
          setTaskToEdit(null);
        }}
        onSubmit={handleSaveTask}
        project={taskProjectContext}
        taskToEdit={taskToEdit}
      />
    </div>
  );
}
