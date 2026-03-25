import { create } from 'zustand';
import {
  Task,
  TaskStatus,
  TaskPriority,
  FilterState,
  SortConfig,
  ViewMode,
} from '../types';
import { generateSeedData } from '../data/seedData';

// ─── Store Interface ─────────────────────────────────────────────────

interface TaskStore {
  // Data
  tasks: Task[];
  
  // Filter
  filters: FilterState;
  
  // Sort (for list view)
  sort: SortConfig;
  
  // View
  viewMode: ViewMode;
  
  // Actions
  setViewMode: (mode: ViewMode) => void;
  moveTask: (taskId: string, newStatus: TaskStatus) => void;
  updateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  setSort: (sort: SortConfig) => void;
}

// ─── Default filter state ────────────────────────────────────────────

const defaultFilters: FilterState = {
  statuses: [],
  priorities: [],
  assignees: [],
  dateRangeStart: null,
  dateRangeEnd: null,
};

// ─── Store ───────────────────────────────────────────────────────────

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: generateSeedData(500),
  
  filters: { ...defaultFilters },
  
  sort: { field: 'dueDate', direction: 'asc' },
  
  viewMode: 'kanban',
  
  setViewMode: (mode: ViewMode) => set({ viewMode: mode }),
  
  moveTask: (taskId: string, newStatus: TaskStatus) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task
      ),
    })),
  
  updateTaskStatus: (taskId: string, newStatus: TaskStatus) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task
      ),
    })),
  
  setFilters: (newFilters: Partial<FilterState>) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),
  
  resetFilters: () => set({ filters: { ...defaultFilters } }),
  
  setSort: (sort: SortConfig) => set({ sort }),
}));

// ─── Pure filter function (use with useMemo, NOT as Zustand selector) ──

export function applyFilters(tasks: Task[], filters: FilterState): Task[] {
  return tasks.filter((task) => {
    if (filters.statuses.length > 0 && !filters.statuses.includes(task.status)) {
      return false;
    }
    if (filters.priorities.length > 0 && !filters.priorities.includes(task.priority)) {
      return false;
    }
    if (filters.assignees.length > 0 && !filters.assignees.includes(task.assignee.id)) {
      return false;
    }
    if (filters.dateRangeStart && task.dueDate) {
      if (task.dueDate < filters.dateRangeStart) return false;
    }
    if (filters.dateRangeEnd && task.dueDate) {
      if (task.dueDate > filters.dateRangeEnd) return false;
    }
    return true;
  });
}

export function selectTasksByStatus(
  tasks: Task[],
  status: TaskStatus
): Task[] {
  return tasks.filter((t) => t.status === status);
}

export function sortTasks(tasks: Task[], sort: SortConfig): Task[] {
  const sorted = [...tasks];
  const dir = sort.direction === 'asc' ? 1 : -1;
  
  const priorityMap: Record<TaskPriority, number> = {
    [TaskPriority.CRITICAL]: 0,
    [TaskPriority.HIGH]: 1,
    [TaskPriority.MEDIUM]: 2,
    [TaskPriority.LOW]: 3,
  };
  
  const statusMap: Record<TaskStatus, number> = {
    [TaskStatus.TODO]: 0,
    [TaskStatus.IN_PROGRESS]: 1,
    [TaskStatus.IN_REVIEW]: 2,
    [TaskStatus.DONE]: 3,
  };
  
  sorted.sort((a, b) => {
    switch (sort.field) {
      case 'title':
        return dir * a.title.localeCompare(b.title);
      case 'priority':
        return dir * (priorityMap[a.priority] - priorityMap[b.priority]);
      case 'status':
        return dir * (statusMap[a.status] - statusMap[b.status]);
      case 'dueDate': {
        const dateA = a.dueDate ?? '9999-12-31';
        const dateB = b.dueDate ?? '9999-12-31';
        return dir * dateA.localeCompare(dateB);
      }
      default:
        return 0;
    }
  });
  
  return sorted;
}
