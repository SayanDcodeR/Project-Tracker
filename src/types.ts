// ─── Enums ───────────────────────────────────────────────────────────

export enum TaskStatus {
  TODO = 'To Do',
  IN_PROGRESS = 'In Progress',
  IN_REVIEW = 'In Review',
  DONE = 'Done',
}

export enum TaskPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical',
}

// ─── Interfaces ──────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  avatarColor: string;
  isOnline: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: User;
  startDate: string | null;   // ISO date string or null
  dueDate: string | null;     // ISO date string or null
  createdAt: string;           // ISO date string
}

export interface FilterState {
  statuses: TaskStatus[];
  priorities: TaskPriority[];
  assignees: string[];         // user IDs
  dateRangeStart: string | null;
  dateRangeEnd: string | null;
}

export interface SortConfig {
  field: 'title' | 'priority' | 'status' | 'dueDate';
  direction: 'asc' | 'desc';
}

export interface DragState {
  isDragging: boolean;
  draggedTaskId: string | null;
  initialRect: DOMRect | null;
  currentDropZone: TaskStatus | null;
}

export type ViewMode = 'kanban' | 'list' | 'timeline';

// ─── Presence ────────────────────────────────────────────────────────

export interface PresenceState {
  /** Maps task IDs to array of users currently viewing that task */
  taskPresence: Map<string, User[]>;
  /** Total number of active simulated users */
  activeUsers: User[];
}

// ─── Priority order for sorting ──────────────────────────────────────

export const PRIORITY_ORDER: Record<TaskPriority, number> = {
  [TaskPriority.CRITICAL]: 0,
  [TaskPriority.HIGH]: 1,
  [TaskPriority.MEDIUM]: 2,
  [TaskPriority.LOW]: 3,
};

export const STATUS_ORDER: Record<TaskStatus, number> = {
  [TaskStatus.TODO]: 0,
  [TaskStatus.IN_PROGRESS]: 1,
  [TaskStatus.IN_REVIEW]: 2,
  [TaskStatus.DONE]: 3,
};

export const ALL_STATUSES: TaskStatus[] = [
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.IN_REVIEW,
  TaskStatus.DONE,
];

export const ALL_PRIORITIES: TaskPriority[] = [
  TaskPriority.LOW,
  TaskPriority.MEDIUM,
  TaskPriority.HIGH,
  TaskPriority.CRITICAL,
];
