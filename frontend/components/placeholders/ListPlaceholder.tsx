'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import type { ComponentProps, ListItem } from '../types';

export function ListPlaceholder({ data, config, onInteraction }: ComponentProps) {
  const items = (data as ListItem[]) || [];
  const template = config.template || { primary: 'title', secondary: 'subtitle' };
  const hasAnimated = useRef(false);

  const shouldAnimate = !hasAnimated.current;
  if (shouldAnimate) hasAnimated.current = true;

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, y: 8 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex flex-col gap-2"
    >
      {items.map((item, index) => {
        const primaryKey = template.primary || 'title';
        const secondaryKey = template.secondary || 'subtitle';
        const primaryValue = item[primaryKey];
        const secondaryValue = item[secondaryKey];

        return (
          <motion.div
            key={item.id || index}
            initial={shouldAnimate ? { opacity: 0, x: -8 } : false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: shouldAnimate ? index * 0.05 : 0 }}
            onClick={() => onInteraction('select', { item, index })}
            className="cursor-pointer rounded-lg bg-zinc-100 p-3 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
          >
            <div className="font-medium text-zinc-900 dark:text-zinc-100">
              {String(primaryValue || '')}
            </div>
            {secondaryValue ? (
              <div className="text-sm text-zinc-500 dark:text-zinc-400">
                {String(secondaryValue)}
              </div>
            ) : null}
          </motion.div>
        );
      })}
      {items.length === 0 && (
        <div className="py-4 text-center text-sm text-zinc-400">No items</div>
      )}
    </motion.div>
  );
}
