import React, { useCallback, useRef, useState } from 'react';
import { useTaskStore } from '../store/taskStore';
import { TaskStatus, TaskPriority, ALL_STATUSES, ALL_PRIORITIES } from '../types';
import { ASSIGNEES } from '../data/seedData';

// ─── Multi-Select Dropdown ──────────────────────────────────────────

interface MultiSelectProps<T extends string> {
  label: string;
  options: T[];
  selected: T[];
  onChange: (selected: T[]) => void;
  renderOption?: (opt: T) => React.ReactNode;
}

function MultiSelect<T extends string>({
  label,
  options,
  selected,
  onChange,
  renderOption,
}: MultiSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const toggle = useCallback(
    (value: T) => {
      if (selected.includes(value)) {
        onChange(selected.filter((s) => s !== value));
      } else {
        onChange([...selected, value]);
      }
    },
    [selected, onChange]
  );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={`Toggle ${label} filter`}
        onClick={() => setOpen(!open)}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium
          border transition-all duration-200
          ${
            selected.length > 0
              ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300'
              : 'border-slate-600/50 bg-slate-800/60 text-slate-400 hover:border-slate-500/70'
          }
        `}
      >
        {label}
        {selected.length > 0 && (
          <span className="bg-indigo-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
            {selected.length}
          </span>
        )}
        <svg
          className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 z-50 min-w-[180px] bg-slate-800 border border-slate-600/60 rounded-lg shadow-xl py-1 max-h-[240px] overflow-y-auto">
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                aria-label={`Toggle filter option ${opt}`}
                onClick={() => toggle(opt)}
                className={`
                  w-full text-left px-3 py-1.5 text-xs flex items-center gap-2
                  hover:bg-slate-700/60 transition-colors
                  ${selected.includes(opt) ? 'text-indigo-300' : 'text-slate-300'}
                `}
              >
                <span
                  className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[10px] shrink-0
                    ${
                      selected.includes(opt)
                        ? 'bg-indigo-500 border-indigo-500 text-white'
                        : 'border-slate-500'
                    }
                  `}
                >
                  {selected.includes(opt) && '✓'}
                </span>
                {renderOption ? renderOption(opt) : opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── FilterBar ───────────────────────────────────────────────────────

export const FilterBar = React.memo(function FilterBar() {
  const filters = useTaskStore((s) => s.filters);
  const setFilters = useTaskStore((s) => s.setFilters);
  const resetFilters = useTaskStore((s) => s.resetFilters);

  const hasActiveFilters =
    filters.statuses.length > 0 ||
    filters.priorities.length > 0 ||
    filters.assignees.length > 0 ||
    filters.dateRangeStart !== null ||
    filters.dateRangeEnd !== null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Filter icon */}
      <div className="flex items-center gap-1.5 text-slate-400 mr-1">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
        <span className="text-xs font-medium">Filters</span>
      </div>

      {/* Status */}
      <MultiSelect<TaskStatus>
        label="Status"
        options={ALL_STATUSES}
        selected={filters.statuses}
        onChange={(statuses) => setFilters({ statuses })}
      />

      {/* Priority */}
      <MultiSelect<TaskPriority>
        label="Priority"
        options={ALL_PRIORITIES}
        selected={filters.priorities}
        onChange={(priorities) => setFilters({ priorities })}
      />

      {/* Assignee */}
      <MultiSelect<string>
        label="Assignee"
        options={ASSIGNEES.map((a) => a.id)}
        selected={filters.assignees}
        onChange={(assignees) => setFilters({ assignees })}
        renderOption={(id) => ASSIGNEES.find((a) => a.id === id)?.name ?? id}
      />

      {/* Date Range Start */}
      <div className="flex items-center gap-1">
        <label className="text-[10px] text-slate-500 uppercase tracking-wider">From</label>
        <input
          type="date"
          aria-label="Filter date range start"
          value={filters.dateRangeStart ?? ''}
          onChange={(e) =>
            setFilters({ dateRangeStart: e.target.value || null })
          }
          className="bg-slate-800/60 border border-slate-600/50 rounded-lg text-xs text-slate-300 px-2 py-1.5 focus:outline-none focus:border-indigo-500/50"
        />
      </div>

      {/* Date Range End */}
      <div className="flex items-center gap-1">
        <label className="text-[10px] text-slate-500 uppercase tracking-wider">To</label>
        <input
          type="date"
          aria-label="Filter date range end"
          value={filters.dateRangeEnd ?? ''}
          onChange={(e) =>
            setFilters({ dateRangeEnd: e.target.value || null })
          }
          className="bg-slate-800/60 border border-slate-600/50 rounded-lg text-xs text-slate-300 px-2 py-1.5 focus:outline-none focus:border-indigo-500/50"
        />
      </div>

      {/* Reset */}
      {hasActiveFilters && (
        <button
          type="button"
          aria-label="Clear all filters"
          onClick={resetFilters}
          className="px-2.5 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          Clear all
        </button>
      )}
    </div>
  );
});
