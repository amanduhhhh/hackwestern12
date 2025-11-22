'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import type { ComponentProps, TimelineEvent } from '../types';

export function TimelinePlaceholder({ data, onInteraction }: ComponentProps) {
  const events = (data as TimelineEvent[]) || [];
  const hasAnimated = useRef(false);

  const shouldAnimate = !hasAnimated.current;
  if (shouldAnimate) hasAnimated.current = true;

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="relative pl-6"
    >
      <div className="absolute left-2 top-0 h-full w-0.5 bg-zinc-200 dark:bg-zinc-700" />

      {events.map((event, index) => (
        <motion.div
          key={event.id || index}
          initial={shouldAnimate ? { opacity: 0, x: -8 } : false}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, delay: shouldAnimate ? index * 0.08 : 0 }}
          onClick={() => onInteraction('select', { event, index })}
          className="relative mb-4 cursor-pointer"
        >
          <div className="absolute -left-6 top-1.5 h-3 w-3 rounded-full bg-blue-500" />
          <div className="rounded-lg bg-white p-3 shadow-sm transition-shadow hover:shadow-md dark:bg-zinc-800">
            <div className="font-medium text-zinc-900 dark:text-zinc-100">
              {event.title}
            </div>
            {event.description && (
              <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {event.description}
              </div>
            )}
            {event.timestamp && (
              <div className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
                {event.timestamp}
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
