import React, { useMemo } from 'react';
import { useTaskStore, applyFilters } from '../store/taskStore';
import { TaskStatus, ALL_STATUSES, User, Task } from '../types';
import { TaskCard } from '../components/TaskCard';
import { useCustomDragAndDrop } from '../hooks/useCustomDragAndDrop';

interface KanbanViewProps {
  presenceMap: Map<string, User[]>;
}

const COLUMN_STYLES: Record<TaskStatus, { accent: string; bg: string; icon: string }> = {
  [TaskStatus.TODO]: {
    accent: 'border-slate-500/40',
    bg: 'bg-slate-500/5',
    icon: '○',
  },
  [TaskStatus.IN_PROGRESS]: {
    accent: 'border-blue-500/40',
    bg: 'bg-blue-500/5',
    icon: '◐',
  },
  [TaskStatus.IN_REVIEW]: {
    accent: 'border-purple-500/40',
    bg: 'bg-purple-500/5',
    icon: '◑',
  },
  [TaskStatus.DONE]: {
    accent: 'border-emerald-500/40',
    bg: 'bg-emerald-500/5',
    icon: '●',
  },
};

const COLUMN_DOT_COLORS: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: 'bg-slate-400',
  [TaskStatus.IN_PROGRESS]: 'bg-blue-400',
  [TaskStatus.IN_REVIEW]: 'bg-purple-400',
  [TaskStatus.DONE]: 'bg-emerald-400',
};

// ─── Single Column ───────────────────────────────────────────────────

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  presenceMap: Map<string, User[]>;
  onPointerDown: (e: React.PointerEvent<HTMLElement>, taskId: string) => void;
}

const KanbanColumn = React.memo(function KanbanColumn({
  status,
  tasks,
  presenceMap,
  onPointerDown,
}: KanbanColumnProps) {
  const style = COLUMN_STYLES[status];
  const dotColor = COLUMN_DOT_COLORS[status];

  return (
    <div
      data-drop-zone={status}
      className={`
        flex flex-col rounded-xl border ${style.accent} ${style.bg}
        min-w-[280px] max-w-[340px] flex-1
      `}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/30">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
          <h2 className="text-sm font-semibold text-slate-200">{status}</h2>
        </div>
        <span className="text-[11px] font-medium text-slate-500 bg-slate-700/40 px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      {/* Column Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-[200px] max-h-[calc(100vh-260px)]">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-700/30 flex items-center justify-center mb-3">
              <span className="text-2xl opacity-40">{style.icon}</span>
            </div>
            <p className="text-xs text-slate-500 font-medium">No tasks</p>
            <p className="text-[10px] text-slate-600 mt-1">
              Drag tasks here to move them
            </p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onPointerDown={onPointerDown}
              presenceUsers={presenceMap.get(task.id)}
              compact
            />
          ))
        )}
      </div>
    </div>
  );
});

// ─── Main Kanban View ────────────────────────────────────────────────

export const KanbanView = React.memo(function KanbanView({
  presenceMap,
}: KanbanViewProps) {
  const tasks = useTaskStore((s) => s.tasks);
  const filters = useTaskStore((s) => s.filters);
  const { handlePointerDown } = useCustomDragAndDrop();

  const filteredTasks = useMemo(
    () => applyFilters(tasks, filters),
    [tasks, filters]
  );

  const tasksByStatus = useMemo(() => {
    const map = new Map<TaskStatus, Task[]>();
    for (const status of ALL_STATUSES) {
      map.set(status, filteredTasks.filter((t) => t.status === status));
    }
    return map;
  }, [filteredTasks]);

  return (
    <div className="flex gap-4 p-4 overflow-x-auto h-full">
      {ALL_STATUSES.map((status) => (
        <KanbanColumn
          key={status}
          status={status}
          tasks={tasksByStatus.get(status) ?? []}
          presenceMap={presenceMap}
          onPointerDown={handlePointerDown}
        />
      ))}
    </div>
  );
});
