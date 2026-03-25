import { useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTaskStore } from '../store/taskStore';
import { TaskStatus, TaskPriority } from '../types';

/**
 * Bi-directionally syncs filter state between the Zustand store
 * and URL search params. Uses a guard flag to prevent infinite loops.
 */
export function useUrlFilters(): void {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useTaskStore((s) => s.filters);
  const setFilters = useTaskStore((s) => s.setFilters);
  const isSyncing = useRef(false);
  const isInitialized = useRef(false);

  // ─── URL → Store (on mount only) ────────────────────────────────
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const statusParam = searchParams.get('status');
    const priorityParam = searchParams.get('priority');
    const assigneeParam = searchParams.get('assignee');
    const dateStart = searchParams.get('dateStart');
    const dateEnd = searchParams.get('dateEnd');

    // Only apply if there are actually URL params
    if (!statusParam && !priorityParam && !assigneeParam && !dateStart && !dateEnd) {
      return;
    }

    isSyncing.current = true;

    const statuses = statusParam
      ? statusParam.split(',').filter((s): s is TaskStatus =>
          Object.values(TaskStatus).includes(s as TaskStatus)
        )
      : [];

    const priorities = priorityParam
      ? priorityParam.split(',').filter((p): p is TaskPriority =>
          Object.values(TaskPriority).includes(p as TaskPriority)
        )
      : [];

    const assignees = assigneeParam ? assigneeParam.split(',') : [];

    setFilters({
      statuses,
      priorities,
      assignees,
      dateRangeStart: dateStart ?? null,
      dateRangeEnd: dateEnd ?? null,
    });

    // Allow store→URL sync after this frame
    requestAnimationFrame(() => {
      isSyncing.current = false;
    });
  }, [searchParams, setFilters]);

  // ─── Store → URL (when filters change) ──────────────────────────
  const syncToUrl = useCallback(() => {
    if (isSyncing.current) return;

    const params = new URLSearchParams();

    if (filters.statuses.length > 0) {
      params.set('status', filters.statuses.join(','));
    }
    if (filters.priorities.length > 0) {
      params.set('priority', filters.priorities.join(','));
    }
    if (filters.assignees.length > 0) {
      params.set('assignee', filters.assignees.join(','));
    }
    if (filters.dateRangeStart) {
      params.set('dateStart', filters.dateRangeStart);
    }
    if (filters.dateRangeEnd) {
      params.set('dateEnd', filters.dateRangeEnd);
    }

    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  // Debounce the URL update to avoid rapid re-renders
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isInitialized.current) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(syncToUrl, 100);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [syncToUrl]);
}
