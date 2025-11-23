'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import type { ComponentProps, TimelineEvent } from '../types';

export function TimelinePlaceholder({ data, config, clickPrompt, onInteraction }: ComponentProps) {
  const rawEvents = (data as Record<string, unknown>[]) || [];
  const template = config.template || { title: 'title', description: 'description' };
  const hasAnimated = useRef(false);

  const shouldAnimate = !hasAnimated.current;
  if (shouldAnimate) hasAnimated.current = true;

  const isInteractive = !!clickPrompt && !!onInteraction;

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="relative pl-6"
    >
      <div className="absolute left-2 top-0 h-full w-0.5 bg-zinc-200 dark:bg-zinc-700" />

      {rawEvents.map((event, index) => {
        const titleKey = template.title || 'title';
        const descriptionKey = template.description || 'description';
        const titleValue = event[titleKey as string];
        const descriptionValue = event[descriptionKey as string];

        return (
          <motion.div
            key={(event.id as string) || index}
            initial={shouldAnimate ? { opacity: 0, x: -8 } : false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: shouldAnimate ? index * 0.08 : 0 }}
            onClick={() => isInteractive && onInteraction({ clickedData: event })}
            className={`relative mb-4 ${isInteractive ? 'cursor-pointer' : ''}`}
          >
            <div className="absolute -left-6 top-1.5 h-3 w-3 rounded-full bg-blue-500" />
            <div className="rounded-lg bg-white p-3 shadow-sm transition-shadow hover:shadow-md dark:bg-zinc-800">
              <div className="font-medium text-zinc-900 dark:text-zinc-100">
                {titleValue ? String(titleValue) : ''}
              </div>
              {descriptionValue && (
                <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {String(descriptionValue)}
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
      {rawEvents.length === 0 && (
        <div className="py-4 text-center text-sm text-zinc-400">No events</div>
      )}
    </motion.div>
  );
}
