import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { User } from '../types';
import { ASSIGNEES } from '../data/seedData';
import { useTaskStore } from '../store/taskStore';

interface PresenceData {
  taskPresence: Map<string, User[]>;
  activeUsers: User[];
}

const SIMULATED_USERS: User[] = [
  { id: 'sim-1', name: 'Emily Zhang', avatarColor: '#f43f5e', isOnline: true },
  { id: 'sim-2', name: 'Raj Mehta', avatarColor: '#06b6d4', isOnline: true },
  { id: 'sim-3', name: 'Liam O\'Brien', avatarColor: '#84cc16', isOnline: true },
  { id: 'sim-4', name: 'Fatima Al-Rashid', avatarColor: '#a855f7', isOnline: true },
];

/**
 * Simulates 2-4 users browsing the board and viewing tasks.
 * Returns a Map<TaskId, User[]> of which users are on which tasks,
 * and a list of currently active simulated users.
 */
export function useMockPresence(): PresenceData {
  const tasks = useTaskStore((s) => s.tasks);
  const [presence, setPresence] = useState<Map<string, User[]>>(new Map());
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const updatePresence = useCallback(() => {
    if (tasks.length === 0) return;

    // Randomly pick 2-4 active users
    const numActive = 2 + Math.floor(Math.random() * 3);
    const shuffled = [...SIMULATED_USERS].sort(() => Math.random() - 0.5);
    const active = shuffled.slice(0, numActive);
    setActiveUsers(active);

    // Each active user views a random task
    const newPresence = new Map<string, User[]>();
    for (const user of active) {
      const randomTask = tasks[Math.floor(Math.random() * tasks.length)];
      if (!randomTask) continue;
      const taskId = randomTask.id;
      const existing = newPresence.get(taskId) ?? [];
      existing.push(user);
      newPresence.set(taskId, existing);
    }
    setPresence(newPresence);
  }, [tasks]);

  useEffect(() => {
    // Initial presence
    updatePresence();

    // Update every 3-5 seconds for realistic feel
    function queueNextUpdate() {
      intervalRef.current = setTimeout(() => {
        updatePresence();
        queueNextUpdate();
      }, 3000 + Math.random() * 2000);
    }
    
    queueNextUpdate();

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, [updatePresence]);

  // Also include real assignees as "online" for display purposes
  const allActive = useMemo(() => [
    ...activeUsers,
    ...ASSIGNEES.filter((a) => a.isOnline),
  ], [activeUsers]);

  return {
    taskPresence: presence,
    activeUsers: allActive,
  };
}
