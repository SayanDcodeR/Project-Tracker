import React from 'react';
import { TaskPriority, TaskStatus } from '../types';

interface BadgeProps {
  variant: 'priority' | 'status';
  value: TaskPriority | TaskStatus;
}

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: 'bg-slate-600/40 text-slate-300 border-slate-500/30',
  [TaskPriority.MEDIUM]: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  [TaskPriority.HIGH]: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  [TaskPriority.CRITICAL]: 'bg-red-500/20 text-red-300 border-red-500/30',
};

const STATUS_COLORS: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: 'bg-slate-600/40 text-slate-300 border-slate-500/30',
  [TaskStatus.IN_PROGRESS]: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  [TaskStatus.IN_REVIEW]: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  [TaskStatus.DONE]: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
};

const PRIORITY_DOTS: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: 'bg-slate-400',
  [TaskPriority.MEDIUM]: 'bg-amber-400',
  [TaskPriority.HIGH]: 'bg-orange-400',
  [TaskPriority.CRITICAL]: 'bg-red-400',
};

export const Badge = React.memo(function Badge({ variant, value }: BadgeProps) {
  const colorClass = variant === 'priority'
    ? PRIORITY_COLORS[value as TaskPriority]
    : STATUS_COLORS[value as TaskStatus];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium rounded-full border ${colorClass}`}
    >
      {variant === 'priority' && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOTS[value as TaskPriority]}`}
        />
      )}
      {value}
    </span>
  );
});
