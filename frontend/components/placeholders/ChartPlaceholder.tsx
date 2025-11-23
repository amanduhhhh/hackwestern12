'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import type { ComponentProps } from '../types';

interface ChartItem {
  [key: string]: string | number | undefined;
}

export function ChartPlaceholder({ data, config, clickPrompt, onInteraction }: ComponentProps) {
  const items = (data as ChartItem[]) || [];
  const hasAnimated = useRef(false);

  const shouldAnimate = !hasAnimated.current;
  if (shouldAnimate) hasAnimated.current = true;

  const xField = config.template?.x || config.template?.label || 'label';
  const yField = config.template?.y || config.template?.value || 'value';

  const points = items.map(item => ({
    label: String(item[xField] ?? ''),
    value: Number(item[yField] ?? 0),
    original: item,
  }));

  const maxValue = Math.max(...points.map(p => p.value), 1);
  const isInteractive = !!clickPrompt && !!onInteraction;

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, y: 8 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="rounded bg-zinc-800 p-4"
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
              onClick={() => isInteractive && onInteraction({ clickedData: point.original })}
              className={`flex-1 rounded-t bg-blue-500 transition-colors ${
                isInteractive ? 'cursor-pointer hover:bg-blue-600' : ''
              }`}
              title={`${point.label}: ${point.value}`}
            />
          );
        })}
      </div>
      <div className="mt-2 flex gap-2">
        {points.map((point, index) => (
          <div
            key={index}
            className="flex-1 truncate text-center text-xs text-zinc-400"
          >
            {point.label}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
