import React from 'react';
import { 
  Briefcase, 
  Users, 
  Calendar, 
  Target, 
  Crown, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export default function ProjectCard({ project, currentUser, onViewDetails }) {
  const isManager = project.permissions?.is_manager;
  const isAdmin = currentUser?.role === 'Admin';
  const stats = project.stats || { total_tasks: 0, completed_tasks: 0, progress_percent: 0, total_targets: 0, completed_targets: 0 };

  const statusColors = {
    'Planning': 'bg-sky-50 text-sky-700 border-sky-200',
    'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
    'On Hold': 'bg-amber-50 text-amber-700 border-amber-200',
    'Completed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Cancelled': 'bg-rose-50 text-rose-700 border-rose-200'
  };

  const priorityColors = {
    'Urgent': 'bg-rose-100 text-rose-800 border-rose-300',
    'High': 'bg-amber-100 text-amber-800 border-amber-300',
    'Medium': 'bg-blue-100 text-blue-800 border-blue-300',
    'Low': 'bg-slate-100 text-slate-700 border-slate-300'
  };

  const isOverdue = project.target_date && project.status !== 'Completed' && new Date(project.target_date) < new Date(new Date().setHours(0,0,0,0));

  return (
    <div className={`relative bg-white rounded-2xl border transition-all duration-300 hover:shadow-md flex flex-col justify-between overflow-hidden ${
      isManager 
        ? 'border-amber-300 ring-1 ring-amber-200/60 shadow-xs' 
        : 'border-slate-200 shadow-xs hover:border-slate-300'
    }`}>
      {/* Top Banner for Project Manager */}
      {isManager && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-white text-[11px] font-bold px-4 py-1.5 flex items-center justify-between tracking-wide">
          <div className="flex items-center gap-1.5">
            <Crown className="w-3.5 h-3.5" />
            <span>YOU ARE THE PROJECT MANAGER</span>
          </div>
          <span className="text-[10px] font-medium bg-amber-700/60 px-2 py-0.2 rounded-full">Scoped Admin Access</span>
        </div>
      )}

      <div className="p-5 sm:p-6 flex-1 flex flex-col">
        {/* Header Tags */}
        <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
              {project.code || `PRJ-${project.id}`}
            </span>
            {project.client_name && (
              <span className="text-[11px] font-semibold text-slate-600 bg-slate-50 px-2.5 py-0.5 rounded-md border border-slate-200 truncate max-w-[150px]">
                {project.client_name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityColors[project.priority] || priorityColors.Medium}`}>
              {project.priority || 'Medium'}
            </span>
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusColors[project.status] || statusColors['In Progress']}`}>
              {project.status || 'In Progress'}
            </span>
          </div>
        </div>

        {/* Project Name & Description */}
        <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug mb-1.5 hover:text-blue-600 transition-colors">
          {project.name}
        </h3>
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
          {project.description || 'No detailed description provided for this project.'}
        </p>

        {/* Project Manager Card */}
        <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {project.project_manager?.photo_url ? (
              <img 
                src={project.project_manager.photo_url} 
                alt={project.project_manager.name} 
                className="w-8 h-8 rounded-full object-cover border border-amber-200 shrink-0" 
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
                {project.project_manager?.initials || <Crown className="w-4 h-4" />}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[10px] uppercase font-bold text-amber-700 tracking-wider flex items-center gap-1">
                <Crown className="w-3 h-3" /> Project Manager
              </p>
              <p className="text-xs font-semibold text-slate-800 truncate">
                {project.project_manager?.name || 'Unassigned'}
              </p>
            </div>
          </div>

          {/* Deadline */}
          {project.target_date && (
            <div className="text-right shrink-0">
              <p className="text-[10px] font-medium text-slate-400">Target Deadline</p>
              <p className={`text-xs font-bold flex items-center gap-1 ${isOverdue ? 'text-rose-600' : 'text-slate-700'}`}>
                <Calendar className="w-3 h-3" />
                {project.target_date}
              </p>
            </div>
          )}
        </div>

        {/* Progress Metrics */}
        <div className="space-y-2 mt-auto">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-slate-600 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Tasks Progress</span>
            </span>
            <span className="font-bold text-slate-900">
              {stats.completed_tasks} / {stats.total_tasks} ({stats.progress_percent}%)
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 rounded-full ${
                stats.progress_percent === 100 
                  ? 'bg-emerald-500' 
                  : stats.progress_percent >= 50 
                    ? 'bg-blue-600' 
                    : 'bg-amber-500'
              }`}
              style={{ width: `${stats.progress_percent}%` }}
            />
          </div>

          {/* Team Members Roster & Targets Summary */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            {/* Team Members Stack */}
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <div className="flex items-center -space-x-1.5 overflow-hidden">
                {(project.team_members || []).slice(0, 4).map((m, idx) => (
                  <div 
                    key={m.id || idx}
                    title={m.name}
                    className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-[9px] font-bold border-2 border-white"
                  >
                    {m.initials || 'U'}
                  </div>
                ))}
                {(project.team_members || []).length > 4 && (
                  <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[9px] font-bold border-2 border-white">
                    +{(project.team_members || []).length - 4}
                  </div>
                )}
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                {(project.team_members || []).length} members
              </span>
            </div>

            {/* Targets count */}
            {stats.total_targets > 0 && (
              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 flex items-center gap-1">
                <Target className="w-3 h-3" />
                {stats.completed_targets}/{stats.total_targets} Targets
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] text-slate-400 font-medium">
          Created {project.created_at ? new Date(project.created_at).toLocaleDateString() : 'recently'}
        </span>
        <button
          type="button"
          onClick={() => onViewDetails(project)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer group"
        >
          <span>Open Workspace</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}
