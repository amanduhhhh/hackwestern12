'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import type { ComponentProps } from '../types';

interface TableRow {
  [key: string]: string | number | boolean | undefined;
}

export function TablePlaceholder({ data, config, clickPrompt, onInteraction }: ComponentProps) {
  const rows = (data as TableRow[]) || [];
  const template = config.template || {};
  const hasAnimated = useRef(false);

  const shouldAnimate = !hasAnimated.current;
  if (shouldAnimate) hasAnimated.current = true;

  const isInteractive = !!clickPrompt && !!onInteraction;

  // Get columns from template or infer from first row
  const columns: string[] = template.columns
    ? (template.columns as unknown as string[])
    : rows.length > 0
      ? Object.keys(rows[0]).filter(k => k !== 'id')
      : [];

  // Format header labels
  const formatHeader = (key: string) => {
    return key
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Format cell values
  const formatValue = (value: unknown) => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') {
      if (value >= 1000) return value.toLocaleString();
      return value.toString();
    }
    return String(value);
  };

  if (rows.length === 0) {
    return (
      <div className="py-4 text-center text-sm text-zinc-400">No data</div>
    );
  }

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, y: 8 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="overflow-x-auto rounded bg-zinc-800"
    >
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-700">
            {columns.map((col) => (
              <th
                key={col}
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400"
              >
                {formatHeader(col)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <motion.tr
              key={row.id ?? rowIndex}
              initial={shouldAnimate ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: shouldAnimate ? rowIndex * 0.03 : 0 }}
              onClick={() => isInteractive && onInteraction({ clickedData: row })}
              className={`border-b border-zinc-700/50 last:border-0 ${
                isInteractive
                  ? 'cursor-pointer hover:bg-zinc-700/50 transition-colors'
                  : ''
              }`}
            >
              {columns.map((col) => (
                <td key={col} className="px-4 py-3 text-zinc-200">
                  {formatValue(row[col])}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
}
