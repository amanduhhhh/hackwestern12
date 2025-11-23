'use client';

import { motion } from 'framer-motion';
import type { ComponentProps } from '../types';

export function ClickablePlaceholder({ data, config, clickPrompt, onInteraction }: ComponentProps) {
  const label = (data as string) || config.label || 'Click';
  const className = config.class || 'px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors';
  
  const isInteractive = !!clickPrompt && !!onInteraction;

  const handleClick = () => {
    if (isInteractive) {
      onInteraction({ clickedData: { label, action: clickPrompt } });
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className={className}
      disabled={!isInteractive}
    >
      {label}
    </motion.button>
  );
}

