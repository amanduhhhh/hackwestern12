'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import type { ComponentProps, ChartDataPoint } from '../types';

export function ChartPlaceholder({ data, onInteraction }: ComponentProps) {
  const points = (data as ChartDataPoint[]) || [];
  const maxValue = Math.max(...points.map(p => p.value), 1);
  const hasAnimated = useRef(false);

  const shouldAnimate = !hasAnimated.current;
  if (shouldAnimate) hasAnimated.current = true;

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, y: 8 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="rounded-xl bg-white p-4 shadow-sm dark:bg-zinc-800"
    >
      <div className="flex h-48 items-end gap-2">
        {points.map((point, index) => {
          const height = (point.value / maxValue) * 100;
          return (
            <motion.div
              key={point.label || index}
              initial={shouldAnimate ? { scaleY: 0 } : false}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.4, delay: shouldAnimate ? index * 0.05 : 0 }}
              style={{ height: `${height}%`, transformOrigin: 'bottom' }}
              onClick={() => onInteraction('select', { point, index })}
              className="flex-1 cursor-pointer rounded-t bg-blue-500 transition-colors hover:bg-blue-600"
              title={`${point.label}: ${point.value}`}
            />
          );
        })}
      </div>
      <div className="mt-2 flex gap-2">
        {points.map((point, index) => (
          <div
            key={index}
            className="flex-1 truncate text-center text-xs text-zinc-500 dark:text-zinc-400"
          >
            {point.label}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
