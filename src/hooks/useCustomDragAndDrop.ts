import React, { useCallback, useRef } from 'react';
import { TaskStatus, ALL_STATUSES } from '../types';
import { useTaskStore } from '../store/taskStore';

interface DragHandlers {
  handlePointerDown: (
    e: React.PointerEvent<HTMLElement>,
    taskId: string
  ) => void;
}

interface DragInfo {
  isDragging: boolean;
  draggedTaskId: string | null;
}

/**
 * Custom drag-and-drop engine built entirely on Pointer Events.
 * Supports mouse and touch natively. No external libraries.
 */
export function useCustomDragAndDrop(): DragHandlers & DragInfo {
  const moveTask = useTaskStore((s) => s.moveTask);

  const dragState = useRef({
    isDragging: false,
    draggedTaskId: null as string | null,
    clone: null as HTMLElement | null,
    placeholder: null as HTMLElement | null,
    originalElement: null as HTMLElement | null,
    initialX: 0,
    initialY: 0,
    initialRect: null as DOMRect | null,
    offsetX: 0,
    offsetY: 0,
  });

  const cleanupDrag = useCallback(() => {
    const ds = dragState.current;
    if (ds.clone && ds.clone.parentNode) {
      ds.clone.parentNode.removeChild(ds.clone);
    }
    if (ds.placeholder && ds.placeholder.parentNode) {
      ds.placeholder.parentNode.removeChild(ds.placeholder);
    }
    if (ds.originalElement) {
      ds.originalElement.style.display = '';
    }
    ds.isDragging = false;
    ds.draggedTaskId = null;
    ds.clone = null;
    ds.placeholder = null;
    ds.originalElement = null;
    ds.initialRect = null;

    document.removeEventListener('pointermove', handlePointerMove);
    document.removeEventListener('pointerup', handlePointerUp);
  }, []);

  const findDropZone = useCallback((x: number, y: number): TaskStatus | null => {
    for (const status of ALL_STATUSES) {
      const colEl = document.querySelector(
        `[data-drop-zone="${status}"]`
      ) as HTMLElement | null;
      if (!colEl) continue;
      const rect = colEl.getBoundingClientRect();
      if (
        x >= rect.left &&
        x <= rect.right &&
        y >= rect.top &&
        y <= rect.bottom
      ) {
        return status;
      }
    }
    return null;
  }, []);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    const ds = dragState.current;
    if (!ds.isDragging || !ds.clone) return;

    const x = e.clientX - ds.offsetX;
    const y = e.clientY - ds.offsetY;
    ds.clone.style.left = `${x}px`;
    ds.clone.style.top = `${y}px`;

    // Highlight valid drop zones
    const dropZone = findDropZone(e.clientX, e.clientY);
    for (const status of ALL_STATUSES) {
      const colEl = document.querySelector(
        `[data-drop-zone="${status}"]`
      ) as HTMLElement | null;
      if (colEl) {
        if (dropZone === status) {
          colEl.style.outline = '2px solid rgba(99, 102, 241, 0.6)';
          colEl.style.outlineOffset = '-2px';
        } else {
          colEl.style.outline = '';
          colEl.style.outlineOffset = '';
        }
      }
    }
  }, [findDropZone]);

  const handlePointerUp = useCallback(
    (e: PointerEvent) => {
      const ds = dragState.current;
      if (!ds.isDragging || !ds.clone) {
        cleanupDrag();
        return;
      }

      const dropZone = findDropZone(e.clientX, e.clientY);

      // Clear column highlights
      for (const status of ALL_STATUSES) {
        const colEl = document.querySelector(
          `[data-drop-zone="${status}"]`
        ) as HTMLElement | null;
        if (colEl) {
          colEl.style.outline = '';
          colEl.style.outlineOffset = '';
        }
      }

      if (dropZone && ds.draggedTaskId) {
        // Successful drop: move task
        moveTask(ds.draggedTaskId, dropZone);
        cleanupDrag();
      } else if (ds.initialRect && ds.clone) {
        // Snapback animation
        const currentRect = ds.clone.getBoundingClientRect();
        const deltaX = ds.initialRect.left - currentRect.left;
        const deltaY = ds.initialRect.top - currentRect.top;

        ds.clone.style.setProperty('--snap-x', `${deltaX}px`);
        ds.clone.style.setProperty('--snap-y', `${deltaY}px`);
        ds.clone.classList.add('drag-snapback');

        ds.clone.addEventListener('animationend', () => {
          cleanupDrag();
        }, { once: true });

        // Fallback timeout
        setTimeout(() => cleanupDrag(), 400);
      } else {
        cleanupDrag();
      }
    },
    [cleanupDrag, findDropZone, moveTask]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>, taskId: string) => {
      e.preventDefault();
      const target = e.currentTarget;
      const rect = target.getBoundingClientRect();

      const ds = dragState.current;
      ds.isDragging = true;
      ds.draggedTaskId = taskId;
      ds.originalElement = target;
      ds.initialRect = rect;
      ds.offsetX = e.clientX - rect.left;
      ds.offsetY = e.clientY - rect.top;

      // Create the visual clone
      const clone = target.cloneNode(true) as HTMLElement;
      clone.className = target.className + ' drag-clone';
      clone.style.width = `${rect.width}px`;
      clone.style.height = `${rect.height}px`;
      clone.style.left = `${rect.left}px`;
      clone.style.top = `${rect.top}px`;
      document.body.appendChild(clone);
      ds.clone = clone;

      // Create placeholder in original position
      const placeholder = document.createElement('div');
      placeholder.className = 'drag-placeholder';
      placeholder.style.height = `${target.offsetHeight}px`;
      placeholder.style.width = '100%';
      target.parentNode?.insertBefore(placeholder, target);
      ds.placeholder = placeholder;

      // Hide original
      target.style.display = 'none';

      // Capture pointer for reliable tracking
      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
    },
    [handlePointerMove, handlePointerUp]
  );

  return {
    handlePointerDown,
    isDragging: dragState.current.isDragging,
    draggedTaskId: dragState.current.draggedTaskId,
  };
}
