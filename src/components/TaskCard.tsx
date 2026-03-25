import React, { useMemo } from 'react';
import { Task, User } from '../types';
import { Badge } from './Badge';

interface TaskCardProps {
  task: Task;
  onPointerDown?: (e: React.PointerEvent<HTMLElement>, taskId: string) => void;
  presenceUsers?: User[];
  compact?: boolean;
}

function getDueDateInfo(dueDate: string | null): {
  text: string;
  isOverdue: boolean;
  isDueToday: boolean;
} {
  if (!dueDate) return { text: 'No due date', isOverdue: false, isDueToday: false };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(dueDate + 'T00:00:00');
  const diffMs = due.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { text: 'Due Today', isOverdue: false, isDueToday: true };
  } else if (diffDays < 0) {
    return {
      text: `${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''} overdue`,
      isOverdue: true,
      isDueToday: false,
    };
  } else {
    const formatted = due.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    return { text: formatted, isOverdue: false, isDueToday: false };
  }
}

export const TaskCard = React.memo(function TaskCard({
  task,
  onPointerDown,
  presenceUsers = [],
  compact = false,
}: TaskCardProps) {
  const dueDateInfo = useMemo(() => getDueDateInfo(task.dueDate), [task.dueDate]);

  const initials = task.assignee.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div
      data-task-id={task.id}
      onPointerDown={onPointerDown ? (e) => onPointerDown(e, task.id) : undefined}
      className={`
        relative group rounded-xl border border-slate-700/60 bg-slate-800/70
        backdrop-blur-sm p-3.5 cursor-grab active:cursor-grabbing
        hover:border-slate-600/80 hover:bg-slate-800/90
        transition-all duration-200 select-none touch-none
        ${compact ? 'py-2.5' : ''}
      `}
    >
      {/* Presence avatar rings */}
      {presenceUsers.length > 0 && (
        <div className="absolute -top-2 -right-2 flex -space-x-1.5 z-10">
          {presenceUsers.slice(0, 2).map((user) => (
            <div
              key={user.id}
              className="presence-ring w-6 h-6 rounded-full border-2 border-slate-800 flex items-center justify-center text-[8px] font-bold text-white"
              style={{ backgroundColor: user.avatarColor }}
              title={user.name}
            >
              {user.name.split(' ').map(n => n[0]).join('')}
            </div>
          ))}
          {presenceUsers.length > 2 && (
            <div className="w-6 h-6 rounded-full border-2 border-slate-800 bg-slate-600 flex items-center justify-center text-[8px] font-bold text-white">
              +{presenceUsers.length - 2}
            </div>
          )}
        </div>
      )}

      {/* Header: ID and Priority */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[10px] font-mono text-slate-500 tracking-wider uppercase">
          {task.id}
        </span>
        <Badge variant="priority" value={task.priority} />
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-slate-100 leading-tight mb-2 line-clamp-2">
        {task.title}
      </h3>

      {!compact && (
        <p className="text-xs text-slate-400 leading-relaxed mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Footer: Assignee + Due Date */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
            style={{ backgroundColor: task.assignee.avatarColor }}
          >
            {initials}
          </div>
          <span className="text-xs text-slate-400 truncate max-w-[80px]">
            {task.assignee.name.split(' ')[0]}
          </span>
        </div>

        <span
          className={`text-[11px] font-medium ${
            dueDateInfo.isOverdue
              ? 'text-red-400'
              : dueDateInfo.isDueToday
              ? 'text-amber-400'
              : 'text-slate-500'
          }`}
        >
          {dueDateInfo.text}
        </span>
      </div>
    </div>
  );
});
