'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import type { ComponentProps, GridItem } from '../types';

export function GridPlaceholder({ data, config, clickPrompt, onInteraction }: ComponentProps) {
  const rawItems = (data as (GridItem | string | number)[]) || [];
  const columns = config.columns || 3;
  const template = config.template || {};
  const hasAnimated = useRef(false);

  const shouldAnimate = !hasAnimated.current;
  if (shouldAnimate) hasAnimated.current = true;

  const isInteractive = !!clickPrompt && !!onInteraction;

  const items = rawItems.map((item, idx) => {
    if (typeof item === 'object' && item !== null) {
      return item as GridItem;
    }
    return { id: idx, value: item } as GridItem;
  });

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="grid gap-4"
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {items.map((item, index) => {
        const titleKey = template.title || 'title';
        const titleValue = item[titleKey] ?? item['value'];
        const imageKey = template.image || 'image';
        const imageValue = item[imageKey];

        return (
          <motion.div
            key={item.id || index}
            initial={shouldAnimate ? { opacity: 0, scale: 0.95 } : false}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: shouldAnimate ? index * 0.03 : 0 }}
            onClick={() => isInteractive && onInteraction({ clickedData: item })}
            className={`overflow-hidden rounded-lg bg-white shadow-sm transition-all dark:bg-zinc-800 ${
              isInteractive ? 'cursor-pointer hover:shadow-md' : ''
            }`}
          >
            {imageValue && (
              <div className="aspect-square bg-zinc-200 dark:bg-zinc-700">
                <img
                  src={String(imageValue)}
                  alt={String(titleValue || '')}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            {titleValue && (
              <div className="p-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {String(titleValue)}
              </div>
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
}
