import React, { useMemo, Suspense, lazy } from 'react';
import { useTaskStore, applyFilters } from './store/taskStore';
import { ViewMode, User } from './types';
import { FilterBar } from './components/FilterBar';
import { useUrlFilters } from './hooks/useUrlFilters';
import { useMockPresence } from './hooks/useMockPresence';

const KanbanView = lazy(() => import('./views/KanbanView').then(m => ({ default: m.KanbanView })));
const ListView = lazy(() => import('./views/ListView').then(m => ({ default: m.ListView })));
const TimelineView = lazy(() => import('./views/TimelineView').then(m => ({ default: m.TimelineView })));

// ─── View Icons ──────────────────────────────────────────────────────

const VIEW_TABS: Array<{ id: ViewMode; label: string; icon: React.ReactNode }> = [
  {
    id: 'kanban',
    label: 'Board',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
      </svg>
    ),
  },
  {
    id: 'list',
    label: 'List',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
  },
  {
    id: 'timeline',
    label: 'Timeline',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
];

// ─── Presence Bar ────────────────────────────────────────────────────

interface PresenceBarProps {
  activeUsers: User[];
}

const PresenceBar = React.memo(function PresenceBar({ activeUsers }: PresenceBarProps) {
  const unique = useMemo(() => {
    const seen = new Set<string>();
    return activeUsers.filter((u) => {
      if (seen.has(u.id)) return false;
      seen.add(u.id);
      return true;
    });
  }, [activeUsers]);

  const displayCount = Math.min(unique.length, 5);
  const overflow = unique.length - displayCount;

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {unique.slice(0, displayCount).map((user) => (
          <div
            key={user.id}
            className="w-7 h-7 rounded-full border-2 border-slate-900 flex items-center justify-center text-[9px] font-bold text-white"
            style={{ backgroundColor: user.avatarColor }}
            title={user.name}
          >
            {user.name.split(' ').map((n) => n[0]).join('')}
          </div>
        ))}
        {overflow > 0 && (
          <div className="w-7 h-7 rounded-full border-2 border-slate-900 bg-slate-600 flex items-center justify-center text-[9px] font-bold text-white">
            +{overflow}
          </div>
        )}
      </div>
      <span className="text-xs text-slate-400">
        <span className="text-indigo-400 font-medium">{unique.length}</span>
        {' '}people viewing this board
      </span>
    </div>
  );
});

// ─── App ─────────────────────────────────────────────────────────────

export default function App() {
  // Sync URL filters
  useUrlFilters();

  const viewMode = useTaskStore((s) => s.viewMode);
  const setViewMode = useTaskStore((s) => s.setViewMode);
  const tasks = useTaskStore((s) => s.tasks);
  const filters = useTaskStore((s) => s.filters);
  const totalTasks = tasks.length;

  // Derive filtered tasks with useMemo (stable reference)
  const filteredTasks = useMemo(() => applyFilters(tasks, filters), [tasks, filters]);
  const filteredCount = filteredTasks.length;

  // Mock presence
  const { taskPresence, activeUsers } = useMockPresence();

  return (
    <div className="h-screen flex flex-col bg-[#0f1117] overflow-hidden">
      {/* ─── Top Navigation Bar ─────────────────────────────────── */}
      <header className="shrink-0 border-b border-slate-800/60 bg-slate-900/80 backdrop-blur-lg relative z-20">
        <div className="px-5 py-3 flex items-center justify-between">
          {/* Left: Logo + Title */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">V</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">
                Velozity Board
              </h1>
              <p className="text-[10px] text-slate-500">
                {filteredCount} of {totalTasks} tasks
              </p>
            </div>
          </div>

          {/* Center: View Tabs */}
          <div className="flex items-center gap-1 bg-slate-800/50 rounded-xl p-1">
            {VIEW_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                aria-label={`Switch to ${tab.label} view`}
                onClick={() => setViewMode(tab.id)}
                className={`
                  flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium
                  transition-all duration-200
                  ${
                    viewMode === tab.id
                      ? 'bg-indigo-500/20 text-indigo-300 shadow-sm shadow-indigo-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/40'
                  }
                `}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Right: Presence */}
          <PresenceBar activeUsers={activeUsers} />
        </div>

        {/* Filter Bar */}
        <div className="px-5 py-2.5 border-t border-slate-800/40">
          <FilterBar />
        </div>
      </header>

      {/* ─── Main Content ───────────────────────────────────────── */}
      <main className="flex-1 overflow-hidden relative">
        <Suspense fallback={
          <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-slate-500">
            <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
        }>
          {viewMode === 'kanban' && <KanbanView presenceMap={taskPresence} />}
          {viewMode === 'list' && <ListView presenceMap={taskPresence} />}
          {viewMode === 'timeline' && <TimelineView presenceMap={taskPresence} />}
        </Suspense>
      </main>
    </div>
  );
}
