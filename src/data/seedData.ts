import { Task, TaskStatus, TaskPriority, User } from '../types';

// ─── Assignee Pool ───────────────────────────────────────────────────

export const ASSIGNEES: User[] = [
  { id: 'u1', name: 'Alex Chen', avatarColor: '#6366f1', isOnline: true },
  { id: 'u2', name: 'Sara Kim', avatarColor: '#ec4899', isOnline: true },
  { id: 'u3', name: 'Marcus Rivera', avatarColor: '#f59e0b', isOnline: false },
  { id: 'u4', name: 'Priya Patel', avatarColor: '#10b981', isOnline: true },
  { id: 'u5', name: 'Jordan Lee', avatarColor: '#3b82f6', isOnline: false },
  { id: 'u6', name: 'Olivia Nguyen', avatarColor: '#8b5cf6', isOnline: true },
];

// ─── Helper arrays ───────────────────────────────────────────────────

const STATUSES: TaskStatus[] = [
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.IN_REVIEW,
  TaskStatus.DONE,
];

const PRIORITIES: TaskPriority[] = [
  TaskPriority.LOW,
  TaskPriority.MEDIUM,
  TaskPriority.HIGH,
  TaskPriority.CRITICAL,
];

const TASK_TITLES: string[] = [
  'Implement user authentication flow',
  'Design dashboard layout',
  'Fix navigation bug on mobile',
  'Write API documentation',
  'Set up CI/CD pipeline',
  'Optimize database queries',
  'Create onboarding tutorial',
  'Refactor payment module',
  'Add dark mode support',
  'Build notification system',
  'Update dependencies',
  'Write unit tests for auth',
  'Design email templates',
  'Implement search functionality',
  'Fix memory leak in dashboard',
  'Add export to CSV feature',
  'Create admin panel',
  'Optimize image loading',
  'Implement WebSocket connections',
  'Build analytics dashboard',
  'Fix CORS issues',
  'Add two-factor authentication',
  'Create user profile page',
  'Implement file upload system',
  'Design mobile navigation',
  'Add localization support',
  'Fix date formatting bug',
  'Implement rate limiting',
  'Build settings page',
  'Create error logging system',
  'Add pagination to API',
  'Fix responsive layout issues',
  'Implement checkout flow',
  'Design landing page',
  'Add social login support',
  'Create data migration scripts',
  'Fix timezone handling',
  'Implement caching layer',
  'Build report generator',
  'Add accessibility features',
  'Fix SSR hydration mismatch',
  'Implement real-time updates',
  'Create component library',
  'Add keyboard shortcuts',
  'Fix form validation errors',
  'Implement drag reordering',
  'Build email notification service',
  'Add performance monitoring',
  'Create automated backups',
  'Fix Safari rendering issues',
];

const DESCRIPTIONS: string[] = [
  'This task requires careful planning and implementation.',
  'Needs to be coordinated with the design team.',
  'Priority item for the current sprint.',
  'Follow the established patterns in the codebase.',
  'Ensure backward compatibility with existing features.',
  'Must include comprehensive test coverage.',
  'Coordinate with the backend team on API contracts.',
  'Review the existing implementation before starting.',
  'Consider edge cases and error handling.',
  'Document all changes in the changelog.',
];

// ─── Seed generator ──────────────────────────────────────────────────

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function generateSeedData(count: number = 500): Task[] {
  const rand = seededRandom(42);
  const tasks: Task[] = [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  for (let i = 0; i < count; i++) {
    const r = rand();
    const titleIndex = Math.floor(rand() * TASK_TITLES.length);
    const descIndex = Math.floor(rand() * DESCRIPTIONS.length);
    const assigneeIndex = Math.floor(rand() * ASSIGNEES.length);

    // Status distribution: 30% TODO, 25% IN_PROGRESS, 20% IN_REVIEW, 25% DONE
    let statusIndex: number;
    if (r < 0.30) statusIndex = 0;
    else if (r < 0.55) statusIndex = 1;
    else if (r < 0.75) statusIndex = 2;
    else statusIndex = 3;

    // Priority distribution: 30% Low, 30% Medium, 25% High, 15% Critical
    const pr = rand();
    let priorityIndex: number;
    if (pr < 0.30) priorityIndex = 0;
    else if (pr < 0.60) priorityIndex = 1;
    else if (pr < 0.85) priorityIndex = 2;
    else priorityIndex = 3;

    // Date generation
    // ~15% have no start date
    const hasStartDate = rand() > 0.15;
    // ~10% have no due date
    const hasDueDate = rand() > 0.10;

    let startDate: string | null = null;
    let dueDate: string | null = null;

    if (hasStartDate) {
      // Start date: between 30 days ago and 15 days from now
      const startOffset = Math.floor(rand() * 45) - 30;
      const sd = new Date(today);
      sd.setDate(sd.getDate() + startOffset);
      startDate = sd.toISOString().split('T')[0] ?? null;
    }

    if (hasDueDate) {
      const dueRoll = rand();
      const dd = new Date(today);

      if (dueRoll < 0.20) {
        // ~20% overdue: 1-14 days ago
        dd.setDate(dd.getDate() - Math.floor(rand() * 14) - 1);
      } else if (dueRoll < 0.30) {
        // ~10% due today
        // dd stays as today
      } else {
        // ~70% future: 1-30 days from now
        dd.setDate(dd.getDate() + Math.floor(rand() * 30) + 1);
      }
      dueDate = dd.toISOString().split('T')[0] ?? null;
    }

    // Created date: 1-60 days ago
    const createdOffset = Math.floor(rand() * 60) + 1;
    const cd = new Date(today);
    cd.setDate(cd.getDate() - createdOffset);

    const title = TASK_TITLES[titleIndex];
    const description = DESCRIPTIONS[descIndex];
    const status = STATUSES[statusIndex];
    const priority = PRIORITIES[priorityIndex];
    const assignee = ASSIGNEES[assigneeIndex];

    if (!title || !description || status === undefined || priority === undefined || !assignee) {
      continue;
    }

    tasks.push({
      id: `task-${String(i + 1).padStart(4, '0')}`,
      title: `${title} #${i + 1}`,
      description,
      status,
      priority,
      assignee,
      startDate,
      dueDate,
      createdAt: cd.toISOString(),
    });
  }

  return tasks;
}
