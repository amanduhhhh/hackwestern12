'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import type { ComponentProps, CardData } from '../types';

export function CardPlaceholder({ data, config, onInteraction }: ComponentProps) {
  const cardData = (data as CardData) || {};
  const template = config.template || {};
  const hasAnimated = useRef(false);

  const shouldAnimate = !hasAnimated.current;
  if (shouldAnimate) hasAnimated.current = true;

  const title = template.primary
    ? cardData[template.primary]
    : cardData.title;
  const description = template.secondary
    ? cardData[template.secondary]
    : cardData.description;

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, scale: 0.98 } : false}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      onClick={() => onInteraction('click', { data: cardData })}
      className="cursor-pointer overflow-hidden rounded-xl bg-white shadow-sm transition-shadow hover:shadow-md dark:bg-zinc-800"
    >
      {cardData.image && (
        <div className="aspect-video bg-zinc-200 dark:bg-zinc-700">
          <img
            src={String(cardData.image)}
            alt={String(title || '')}
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <div className="p-4">
        {title ? (
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
            {String(title)}
          </h3>
        ) : null}
        {description ? (
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {String(description)}
          </p>
        ) : null}
      </div>
    </motion.div>
  );
}
