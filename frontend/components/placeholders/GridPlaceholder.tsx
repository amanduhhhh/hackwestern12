'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import type { ComponentProps, GridItem } from '../types';

export function GridPlaceholder({ data, config, onInteraction }: ComponentProps) {
  const items = (data as GridItem[]) || [];
  const columns = config.columns || 3;
  const hasAnimated = useRef(false);

  const shouldAnimate = !hasAnimated.current;
  if (shouldAnimate) hasAnimated.current = true;

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="grid gap-4"
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {items.map((item, index) => (
        <motion.div
          key={item.id || index}
          initial={shouldAnimate ? { opacity: 0, scale: 0.95 } : false}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, delay: shouldAnimate ? index * 0.03 : 0 }}
          onClick={() => onInteraction('select', { item, index })}
          className="cursor-pointer overflow-hidden rounded-lg bg-white shadow-sm transition-all hover:shadow-md dark:bg-zinc-800"
        >
          {item.image && (
            <div className="aspect-square bg-zinc-200 dark:bg-zinc-700">
              <img
                src={String(item.image)}
                alt={String(item.title || '')}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          {item.title && (
            <div className="p-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {String(item.title)}
            </div>
          )}
        </motion.div>
      ))}
    </motion.div>
  );
}
