import React, { useCallback, useMemo, useRef, useState } from 'react';

interface VirtualScrollProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor?: (item: T, index: number) => string | number;
  className?: string;
}

/**
 * Custom virtual scrolling component.
 * Only renders visible items + 5-item buffer for smooth scrolling.
 * No external libraries.
 */
export function VirtualScroll<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  keyExtractor,
  className = '',
}: VirtualScrollProps<T>): React.JSX.Element {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  const { startIndex, endIndex, visibleItems } = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(
      items.length - 1,
      start + Math.ceil(containerHeight / itemHeight) + 5
    );

    const visible: Array<{ item: T; index: number }> = [];
    for (let i = start; i <= end; i++) {
      const item = items[i];
      if (item !== undefined) {
        visible.push({ item, index: i });
      }
    }

    return { startIndex: start, endIndex: end, visibleItems: visible };
  }, [scrollTop, itemHeight, containerHeight, items]);

  const totalHeight = items.length * itemHeight;

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`overflow-y-auto relative ${className}`}
      style={{ height: containerHeight }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index }) => {
          const key = keyExtractor ? keyExtractor(item, index) : index;
          return (
          <div
            key={key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: itemHeight,
              transform: `translateY(${index * itemHeight}px)`,
            }}
          >
            {renderItem(item, index)}
          </div>
        )})}
      </div>
      {/* Hidden for debugging, expose indices */}
      <span
        className="sr-only"
        data-start={startIndex}
        data-end={endIndex}
      />
    </div>
  );
}
