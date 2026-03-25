import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { useTaskStore, applyFilters, sortTasks } from '../store/taskStore';
import { Task, TaskStatus, ALL_STATUSES, User, SortConfig } from '../types';
import { Badge } from '../components/Badge';
import { VirtualScroll } from '../components/VirtualScroll';

interface ListViewProps {
  presenceMap: Map<string, User[]>;
}

// ─── Due date text helper ────────────────────────────────────────────

function dueDateDisplay(dueDate: string | null): { text: string; className: string } {
  if (!dueDate) return { text: '—', className: 'text-slate-600' };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(dueDate + 'T00:00:00');
  const diffMs = due.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return { text: 'Due Today', className: 'text-amber-400 font-medium' };
  if (diffDays < 0)
    return {
      text: `${Math.abs(diffDays)}d overdue`,
      className: 'text-red-400 font-medium',
    };
  return {
    text: due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    className: 'text-slate-400',
  };
}

// ─── Sort Header ─────────────────────────────────────────────────────

interface SortHeaderProps {
  label: string;
  field: SortConfig['field'];
  currentSort: SortConfig;
  onSort: (sort: SortConfig) => void;
  className?: string;
}

function SortHeader({ label, field, currentSort, onSort, className = '' }: SortHeaderProps) {
  const isActive = currentSort.field === field;

  const handleClick = () => {
    if (isActive) {
      onSort({ field, direction: currentSort.direction === 'asc' ? 'desc' : 'asc' });
    } else {
      onSort({ field, direction: 'asc' });
    }
  };

  return (
    <button
      type="button"
      aria-label={`Sort by ${label}`}
      onClick={handleClick}
      className={`flex items-center gap-1 text-[11px] uppercase tracking-wider font-semibold hover:text-slate-200 transition-colors ${
        isActive ? 'text-indigo-400' : 'text-slate-500'
      } ${className}`}
    >
      {label}
      {isActive && (
        <svg
          className={`w-3 h-3 transition-transform ${
            currentSort.direction === 'desc' ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      )}
    </button>
  );
}

// ─── Row Component ───────────────────────────────────────────────────

interface ListRowProps {
  task: Task;
  presenceUsers: User[];
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
}

const ListRow = React.memo(function ListRow({ task, presenceUsers, onStatusChange }: ListRowProps) {
  const due = dueDateDisplay(task.dueDate);
  const initials = task.assignee.name.split(' ').map((n) => n[0]).join('').toUpperCase();

  return (
    <div className="flex items-center gap-3 px-4 h-full border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors group">
      {/* ID */}
      <span className="text-[10px] font-mono text-slate-600 w-[72px] shrink-0 tracking-wider">
        {task.id}
      </span>

      {/* Title + Presence */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-sm text-slate-200 truncate">{task.title}</span>
        {presenceUsers.length > 0 && (
          <div className="flex -space-x-1">
            {presenceUsers.slice(0, 2).map((u) => (
              <div
                key={u.id}
                className="presence-ring w-5 h-5 rounded-full border-2 border-slate-900 text-[7px] font-bold text-white flex items-center justify-center"
                style={{ backgroundColor: u.avatarColor }}
                title={u.name}
              >
                {u.name[0]}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status – inline select */}
      <div className="w-[130px] shrink-0">
        <select
          value={task.status}
          aria-label="Change task status"
          onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
          className="bg-slate-800/80 border border-slate-700/50 rounded-lg text-[11px] text-slate-300 px-2 py-1 w-full focus:outline-none focus:border-indigo-500/50 cursor-pointer"
        >
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Priority */}
      <div className="w-[90px] shrink-0">
        <Badge variant="priority" value={task.priority} />
      </div>

      {/* Assignee */}
      <div className="flex items-center gap-2 w-[130px] shrink-0">
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
          style={{ backgroundColor: task.assignee.avatarColor }}
        >
          {initials}
        </div>
        <span className="text-xs text-slate-400 truncate">{task.assignee.name}</span>
      </div>

      {/* Due Date */}
      <div className="w-[90px] shrink-0 text-right">
        <span className={`text-[11px] ${due.className}`}>{due.text}</span>
      </div>
    </div>
  );
});

// ─── Main List View ──────────────────────────────────────────────────

const ROW_HEIGHT = 48;

export const ListView = React.memo(function ListView({ presenceMap }: ListViewProps) {
  const tasks = useTaskStore((s) => s.tasks);
  const filters = useTaskStore((s) => s.filters);
  const sort = useTaskStore((s) => s.sort);
  const setSort = useTaskStore((s) => s.setSort);
  const updateTaskStatus = useTaskStore((s) => s.updateTaskStatus);

  const [containerHeight, setContainerHeight] = useState(window.innerHeight - 220);

  useEffect(() => {
    const handleResize = () => setContainerHeight(window.innerHeight - 220);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filteredTasks = useMemo(
    () => applyFilters(tasks, filters),
    [tasks, filters]
  );

  const sortedTasks = useMemo(
    () => sortTasks(filteredTasks, sort),
    [filteredTasks, sort]
  );

  const handleStatusChange = useCallback(
    (taskId: string, newStatus: TaskStatus) => {
      updateTaskStatus(taskId, newStatus);
    },
    [updateTaskStatus]
  );

  const renderRow = useCallback(
    (task: Task) => (
      <ListRow
        task={task}
        presenceUsers={presenceMap.get(task.id) ?? []}
        onStatusChange={handleStatusChange}
      />
    ),
    [presenceMap, handleStatusChange]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Table Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-700/40 bg-slate-900/60 sticky top-0 z-10">
        <div className="w-[72px] shrink-0">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">ID</span>
        </div>
        <div className="flex-1">
          <SortHeader label="Title" field="title" currentSort={sort} onSort={setSort} />
        </div>
        <div className="w-[130px] shrink-0">
          <SortHeader label="Status" field="status" currentSort={sort} onSort={setSort} />
        </div>
        <div className="w-[90px] shrink-0">
          <SortHeader label="Priority" field="priority" currentSort={sort} onSort={setSort} />
        </div>
        <div className="w-[130px] shrink-0">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Assignee</span>
        </div>
        <div className="w-[90px] shrink-0 text-right">
          <SortHeader label="Due" field="dueDate" currentSort={sort} onSort={setSort} />
        </div>
      </div>

      {/* Virtual Scrolled Rows */}
      <div className="flex-1">
        <VirtualScroll
          items={sortedTasks}
          itemHeight={ROW_HEIGHT}
          containerHeight={containerHeight}
          renderItem={renderRow}
          keyExtractor={(task) => task.id}
        />
      </div>

      {/* Footer count */}
      <div className="px-4 py-2 border-t border-slate-700/30 text-[11px] text-slate-500">
        {sortedTasks.length} tasks
      </div>
    </div>
  );
});
