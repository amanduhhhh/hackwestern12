'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useThemeStore } from '@/store/useThemeStore';
import { THEMES } from '@/lib/themes';
import type { ThemeName } from '@/components/types';

interface TableColumn {
    key: string;
    label: string;
    sortable?: boolean;
}

interface TableProps<T = Record<string, unknown>> {
    columns: TableColumn[];
    data: T[];
    onSort?: (key: string, direction: 'asc' | 'desc') => void;
    comparison?: boolean;
    className?: string;
    theme?: ThemeName;
}

export function Table<T extends Record<string, unknown>>({
    columns,
    data,
    onSort,
    comparison = false,
    className,
    theme: propTheme,
}: TableProps<T>) {
    const { currentTheme } = useThemeStore();
    const theme = propTheme || currentTheme;
    const themeConfig = THEMES[theme];
    const hasAnimated = useRef(false);

    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const shouldAnimate = !hasAnimated.current;
    if (shouldAnimate) hasAnimated.current = true;

    const handleSort = (key: string) => {
        const newDirection = sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortKey(key);
        setSortDirection(newDirection);
        onSort?.(key, newDirection);
    };

    const chartAnim = themeConfig.animations.chart as { initial?: any; animate?: any };
    const chartInitial = chartAnim.initial ?? false;
    const chartAnimateValue = chartAnim.animate ?? {};
    const { transition: chartTransition, ...chartAnimate } = chartAnimateValue && typeof chartAnimateValue === 'object' && 'transition' in chartAnimateValue
        ? chartAnimateValue
        : { ...chartAnimateValue, transition: undefined };

    const listAnim = themeConfig.animations.list as { initial?: any; animate?: any };
    const listInitial = listAnim.initial ?? false;
    const listAnimateValue = listAnim.animate ?? {};
    const { transition: listTransition, ...listAnimate } = listAnimateValue && typeof listAnimateValue === 'object' && 'transition' in listAnimateValue
        ? listAnimateValue
        : { ...listAnimateValue, transition: undefined };

    return (
        <motion.div
            initial={chartInitial}
            animate={chartAnimate}
            transition={chartTransition}
            className={cn(
                'overflow-x-auto transition-all duration-300',
                theme === 'tokyo-night' && 'rounded-lg bg-card/30 border border-border hover:shadow-[0_0_15px_3px] hover:shadow-white/20',
                theme === 'impact' && 'border-2 border-black hover:shadow-[0_0_15px_3px] hover:shadow-white/20',
                theme === 'elegant' && 'rounded-md bg-card/40 border border-border/40 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.12)] duration-500',
                className
            )}
        >
            <table className="w-full">
                <thead>
                    <tr
                        className={cn(
                            'border-b',
                            theme === 'tokyo-night' && 'border-border bg-card/50',
                            theme === 'impact' && 'border-black bg-linear-to-r from-slate-50 to-white',
                            theme === 'elegant' && 'border-border/40 bg-card/10'
                        )}
                    >
                        {columns.map((column) => (
                            <th
                                key={column.key}
                                onClick={() => column.sortable && handleSort(column.key)}
                                className={cn(
                                    'px-4 py-3 text-left',
                                    column.sortable && 'cursor-pointer hover:bg-muted/20 transition-colors',
                                    theme === 'tokyo-night' && 'text-sm font-medium text-muted-foreground',
                                    theme === 'impact' && 'text-xs font-black uppercase tracking-widest',
                                    theme === 'elegant' && 'text-sm font-serif text-muted-foreground'
                                )}
                                style={theme === 'impact' ? { color: 'var(--chart-3)' } : undefined}
                            >
                                <div className="flex items-center gap-2">
                                    {column.label}
                                    {column.sortable && sortKey === column.key && (
                                        <span className="text-primary">
                                            {sortDirection === 'asc' ? (
                                                <ChevronUp className="w-4 h-4" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4" />
                                            )}
                                        </span>
                                    )}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, index) => (
                        <motion.tr
                            key={index}
                            initial={listInitial}
                            animate={listAnimate}
                            transition={{
                                ...listTransition,
                                delay: index * 0.03,
                            }}
                            className={cn(
                                'border-b last:border-b-0 transition-colors',
                                theme === 'tokyo-night' && 'border-border hover:bg-muted/20',
                                theme === 'impact' && 'border-slate-200 hover:bg-slate-50 even:bg-slate-50/50',
                                theme === 'elegant' && 'border-border/20 hover:bg-card/10'
                            )}
                        >
                            {columns.map((column) => (
                                <td
                                    key={column.key}
                                    className={cn(
                                        'px-4 py-3',
                                        theme === 'tokyo-night' && 'text-sm text-foreground',
                                        theme === 'impact' && 'text-sm font-bold',
                                        theme === 'elegant' && 'text-sm font-sans'
                                    )}
                                >
                                    {String(row[column.key] ?? '')}
                                </td>
                            ))}
                        </motion.tr>
                    ))}
                </tbody>
            </table>
            {data.length === 0 && (
                <div
                    className={cn(
                        'py-8 text-center text-muted-foreground',
                        theme === 'impact' && 'font-black uppercase tracking-widest'
                    )}
                >
                    No data
                </div>
            )}
        </motion.div>
    );
}
