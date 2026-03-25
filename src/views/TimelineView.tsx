import React, { useMemo } from 'react';
import { useTaskStore, applyFilters } from '../store/taskStore';
import { Task, User } from '../types';

interface TimelineViewProps {
  presenceMap: Map<string, User[]>;
}

// ─── Helpers ─────────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

// ─── Priority colors for timeline bars ───────────────────────────────

const BAR_COLORS: Record<string, string> = {
  Critical: 'bg-red-500/70 border-red-500/40',
  High: 'bg-orange-500/60 border-orange-500/40',
  Medium: 'bg-amber-500/50 border-amber-500/30',
  Low: 'bg-slate-500/50 border-slate-500/30',
};

// ─── Timeline View ───────────────────────────────────────────────────

export const TimelineView = React.memo(function TimelineView({
  presenceMap,
}: TimelineViewProps) {
  const tasks = useTaskStore((s) => s.tasks);
  const filters = useTaskStore((s) => s.filters);
  const filteredTasks = useMemo(
    () => applyFilters(tasks, filters),
    [tasks, filters]
  );

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const todayStr = toDateStr(year, month, now.getDate());
  const daysInMonth = getDaysInMonth(year, month);

  // Days array
  const days = useMemo(() => {
    const arr: Array<{ date: string; day: number; dayName: string; isWeekend: boolean }> = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(year, month, d);
      arr.push({
        date: toDateStr(year, month, d),
        day: d,
        dayName: dt.toLocaleDateString('en-US', { weekday: 'short' }),
        isWeekend: dt.getDay() === 0 || dt.getDay() === 6,
      });
    }
    return arr;
  }, [year, month, daysInMonth]);

  // Filter tasks that have at least one date within this month
  const monthStart = toDateStr(year, month, 1);
  const monthEnd = toDateStr(year, month, daysInMonth);

  const timelineTasks = useMemo(() => {
    return filteredTasks
      .filter((task) => {
        const start = task.startDate ?? task.dueDate;
        const end = task.dueDate ?? task.startDate;
        if (!start && !end) return false;
        const taskStart = start ?? end ?? '';
        const taskEnd = end ?? start ?? '';
        return taskEnd >= monthStart && taskStart <= monthEnd;
      })
      .slice(0, 80);
  }, [filteredTasks, monthStart, monthEnd]);

  // Column width
  const COL_W = 42;
  const totalWidth = daysInMonth * COL_W;

  // Today column index
  const todayIndex = now.getDate() - 1;

  return (
    <div className="flex flex-col h-full">
      {/* Month Header */}
      <div className="px-4 py-3 border-b border-slate-700/30">
        <h2 className="text-sm font-semibold text-slate-200">
          {now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h2>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Showing {timelineTasks.length} of {filteredTasks.length} tasks with dates
        </p>
      </div>

      {/* Scrollable container */}
      <div className="flex-1 overflow-auto">
        <div style={{ minWidth: totalWidth + 200 }} className="relative">
          {/* Day headers */}
          <div className="flex sticky top-0 z-20 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/40">
            {/* Task label column */}
            <div className="w-[200px] shrink-0 px-3 py-2 border-r border-slate-700/30">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                Task
              </span>
            </div>
            {/* Day columns */}
            {days.map((d) => (
              <div
                key={d.date}
                className={`flex flex-col items-center justify-center py-2 border-r border-slate-800/40
                  ${d.isWeekend ? 'bg-slate-800/20' : ''}
                  ${d.date === todayStr ? 'bg-indigo-500/10' : ''}
                `}
                style={{ width: COL_W, minWidth: COL_W }}
              >
                <span className="text-[9px] text-slate-600 uppercase">{d.dayName}</span>
                <span
                  className={`text-[11px] font-medium ${
                    d.date === todayStr ? 'text-indigo-400' : 'text-slate-400'
                  }`}
                >
                  {d.day}
                </span>
              </div>
            ))}
          </div>

          {/* Today indicator line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-red-500/60 z-10 pointer-events-none"
            style={{ left: 200 + todayIndex * COL_W + COL_W / 2 }}
          />

          {/* Task rows */}
          {timelineTasks.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <p className="text-sm text-slate-500">No tasks with dates this month</p>
                <p className="text-[11px] text-slate-600 mt-1">
                  Adjust filters or check task dates
                </p>
              </div>
            </div>
          ) : (
            timelineTasks.map((task) => (
              <TimelineRow
                key={task.id}
                task={task}
                monthStart={monthStart}
                monthEnd={monthEnd}
                daysInMonth={daysInMonth}
                colWidth={COL_W}
                todayStr={todayStr}
                presenceUsers={presenceMap.get(task.id) ?? []}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
});

// ─── Timeline Row ────────────────────────────────────────────────────

interface TimelineRowProps {
  task: Task;
  monthStart: string;
  monthEnd: string;
  daysInMonth: number;
  colWidth: number;
  todayStr: string;
  presenceUsers: User[];
}

const TimelineRow = React.memo(function TimelineRow({
  task,
  monthStart,
  monthEnd,
  daysInMonth,
  colWidth,
  todayStr,
  presenceUsers,
}: TimelineRowProps) {
  const taskStart = task.startDate ?? task.dueDate ?? monthStart;
  const taskEnd = task.dueDate ?? task.startDate ?? monthEnd;

  // Clamp to month bounds
  const clampedStart = taskStart < monthStart ? monthStart : taskStart;
  const clampedEnd = taskEnd > monthEnd ? monthEnd : taskEnd;

  // Calculate positions (1-indexed day)
  const startDay = clamp(parseInt(clampedStart.split('-')[2] ?? '1'), 1, daysInMonth);
  const endDay = clamp(parseInt(clampedEnd.split('-')[2] ?? '1'), 1, daysInMonth);

  const left = (startDay - 1) * colWidth;
  const width = Math.max(colWidth, (endDay - startDay + 1) * colWidth);

  const isOverdue = task.dueDate ? task.dueDate < todayStr : false;
  const barColor = BAR_COLORS[task.priority] ?? 'bg-slate-500/50 border-slate-500/30';
  const initials = task.assignee.name.split(' ').map((n) => n[0]).join('');

  return (
    <div className="flex items-center h-10 border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors group">
      {/* Task label */}
      <div className="w-[200px] shrink-0 px-3 flex items-center gap-2 border-r border-slate-700/30">
        <div
          className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold text-white shrink-0"
          style={{ backgroundColor: task.assignee.avatarColor }}
        >
          {initials}
        </div>
        <span className="text-[11px] text-slate-300 truncate flex-1" title={task.title}>
          {task.title}
        </span>
        {presenceUsers.length > 0 && (
          <div className="flex -space-x-1">
            {presenceUsers.slice(0, 1).map((u) => (
              <div
                key={u.id}
                className="presence-ring w-4 h-4 rounded-full border border-slate-900 text-[6px] font-bold text-white flex items-center justify-center"
                style={{ backgroundColor: u.avatarColor }}
              >
                {u.name[0]}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Timeline bar */}
      <div className="relative flex-1 h-full" style={{ minWidth: daysInMonth * colWidth }}>
        <div
          className={`absolute top-2 h-6 rounded-md border flex items-center px-2 
            ${barColor} 
            ${isOverdue ? 'ring-1 ring-red-500/40' : ''}
            transition-all duration-200 group-hover:brightness-125
          `}
          style={{ left, width }}
          title={`${task.title}\n${taskStart} → ${taskEnd}`}
        >
          <span className="text-[9px] text-white/80 truncate font-medium">
            {task.title.length > width / 6 ? '' : task.title}
          </span>
        </div>
      </div>
    </div>
  );
});
