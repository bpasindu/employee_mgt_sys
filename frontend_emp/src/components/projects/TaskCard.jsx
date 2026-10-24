import React from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Calendar, 
  User, 
  Trash2, 
  Edit3, 
  Target, 
  AlertCircle 
} from 'lucide-react';

export default function TaskCard({ 
  task, 
  currentUser, 
  canManage = false, 
  onToggleStatus, 
  onEditTask, 
  onDeleteTask 
}) {
  const isCompleted = task.status === 'Completed';
  const isInProgress = task.status === 'In Progress';
  const isAssignee = currentUser && String(currentUser.id) === String(task.assigned_to);
  const canToggle = canManage || isAssignee;

  const priorityStyles = {
    Urgent: 'bg-rose-50 text-rose-700 border-rose-200',
    High: 'bg-amber-50 text-amber-700 border-amber-200',
    Medium: 'bg-blue-50 text-blue-700 border-blue-200',
    Low: 'bg-slate-50 text-slate-600 border-slate-200'
  };

  const isOverdue = task.due_date && !isCompleted && new Date(task.due_date) < new Date(new Date().setHours(0,0,0,0));

  return (
    <div className={`p-4 rounded-xl border transition-all duration-200 ${
      isCompleted 
        ? 'bg-slate-50/70 border-slate-200 opacity-80' 
        : 'bg-white border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-sm'
    }`}>
      <div className="flex items-start gap-3">
        {/* Toggle Checkbox */}
        <button
          type="button"
          disabled={!canToggle}
          onClick={() => {
            if (!canToggle) return;
            const nextStatus = isCompleted ? 'In Progress' : 'Completed';
            onToggleStatus(task.id, nextStatus);
          }}
          title={canToggle ? (isCompleted ? 'Mark as In Progress' : 'Mark as Completed') : `Assigned to ${task.assignee?.name || 'team member'}`}
          className={`mt-0.5 shrink-0 transition-colors cursor-pointer ${
            !canToggle ? 'cursor-not-allowed opacity-50' : ''
          }`}
        >
          {isCompleted ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
          ) : isInProgress ? (
            <div className="w-5 h-5 rounded-full border-2 border-amber-500 flex items-center justify-center hover:bg-amber-50">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
            </div>
          ) : (
            <Circle className="w-5 h-5 text-slate-400 hover:text-slate-600" />
          )}
        </button>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
            <span className={`text-sm font-semibold tracking-tight ${
              isCompleted ? 'line-through text-slate-400' : 'text-slate-800'
            }`}>
              {task.title}
            </span>

            {/* Badges */}
            <div className="flex items-center gap-1.5 shrink-0">
              {task.priority && (
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${priorityStyles[task.priority] || priorityStyles.Medium}`}>
                  {task.priority}
                </span>
              )}
              {isCompleted ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Completed
                </span>
              ) : isInProgress ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  In Progress
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Pending
                </span>
              )}
            </div>
          </div>

          {task.description && (
            <p className={`text-xs mt-1 leading-relaxed ${isCompleted ? 'text-slate-400' : 'text-slate-600'}`}>
              {task.description}
            </p>
          )}

          {/* Meta & Assignee Footer */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap text-xs text-slate-500">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Assignee */}
              {task.assignee ? (
                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                  {task.assignee.photo_url ? (
                    <img 
                      src={task.assignee.photo_url} 
                      alt={task.assignee.name} 
                      className="w-5 h-5 rounded-full object-cover border border-slate-200" 
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-[#07162c] text-white flex items-center justify-center text-[9px] font-bold">
                      {task.assignee.initials || 'U'}
                    </div>
                  )}
                  <span className="truncate max-w-[140px]">{task.assignee.name}</span>
                  {isAssignee && (
                    <span className="text-[9px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.2 rounded-md">
                      You
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-slate-400 italic flex items-center gap-1">
                  <User className="w-3.5 h-3.5" /> Unassigned
                </span>
              )}

              {/* Target / Milestone reference */}
              {task.target && (
                <span className="inline-flex items-center gap-1 text-[11px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                  <Target className="w-3 h-3" />
                  <span className="truncate max-w-[130px]">{task.target.title}</span>
                </span>
              )}

              {/* Due Date */}
              {task.due_date && (
                <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                  isOverdue ? 'text-rose-600 font-bold' : 'text-slate-500'
                }`}>
                  <Calendar className="w-3 h-3" />
                  {task.due_date}
                  {isOverdue && <span className="text-[9px] uppercase tracking-wider">(Overdue)</span>}
                </span>
              )}
            </div>

            {/* PM / Admin Action Controls */}
            {canManage && (
              <div className="flex items-center gap-1">
                {onEditTask && (
                  <button
                    onClick={() => onEditTask(task)}
                    className="p-1 text-slate-400 hover:text-blue-600 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Edit Task"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
                {onDeleteTask && (
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Delete Task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
