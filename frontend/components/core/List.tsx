'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useThemeStore } from '@/store/useThemeStore';
import { THEMES } from '@/lib/themes';
import type { ThemeName } from '@/components/types';

interface ListProps<T = Record<string, unknown>> {
    items: T[];
    template: { primary: string; secondary?: string; meta?: string };
    ranked?: boolean;
    highlightTop3?: boolean;
    onItemClick?: (item: T, index: number) => void;
    className?: string;
    theme?: ThemeName;
}

export function List<T extends Record<string, unknown>>({
    items,
    template,
    ranked = false,
    highlightTop3 = true,
    onItemClick,
    className,
    theme: propTheme,
}: ListProps<T>) {
    const { currentTheme } = useThemeStore();
    const theme = propTheme || currentTheme;
    const themeConfig = THEMES[theme];

    const getRankIcon = (index: number) => {
        if (!ranked) return null;
        
        if (highlightTop3) {
            if (index === 0) return theme === 'impact' ? '🥇' : theme === 'elegant' ? '①' : '1';
            if (index === 1) return theme === 'impact' ? '🥈' : theme === 'elegant' ? '②' : '2';
            if (index === 2) return theme === 'impact' ? '🥉' : theme === 'elegant' ? '③' : '3';
        }
        
        return index + 1;
    };

    return (
        <motion.div
            initial={false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: theme === 'impact' ? 0.15 : 0.2 }}
            className={cn('flex flex-col gap-2', className)}
        >
            {items.map((item, index) => {
                const primaryValue = item[template.primary] as string | number | null | undefined;
                const secondaryValue = template.secondary ? (item[template.secondary] as string | number | null | undefined) : null;
                const metaValue = template.meta ? (item[template.meta] as string | number | null | undefined) : null;

                return (
                    <motion.div
                        key={(item.id as string | number) || index}
                        initial={false}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                            duration: theme === 'impact' ? 0.15 : 0.2,
                            delay: 0,
                        }}
                        onClick={() => onItemClick?.(item, index)}
                        className={cn(
                            'p-3 transition-all duration-300 hover:shadow-[0_0_15px_3px] hover:shadow-white/20',
                            onItemClick && 'cursor-pointer',
                            theme === 'tokyo-night' && [
                                'rounded-lg bg-card/30 hover:bg-card/60 backdrop-blur-sm border border-border',
                                ranked && highlightTop3 && index === 0 && 'shadow-[0_0_20px_4px] shadow-chart-1/30 border-chart-1/40 hover:shadow-[0_0_25px_5px]',
                                ranked && highlightTop3 && index === 1 && 'shadow-[0_0_18px_3px] shadow-chart-2/25 border-chart-2/35 hover:shadow-[0_0_22px_4px]',
                                ranked && highlightTop3 && index === 2 && 'shadow-[0_0_16px_3px] shadow-chart-3/20 border-chart-3/30 hover:shadow-[0_0_20px_4px]',
                            ],
                            theme === 'impact' &&
                            'bg-linear-to-br from-white to-slate-50 border-l-4 border-primary shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all',
                            theme === 'elegant' &&
                            'rounded-lg bg-card/20 hover:bg-card/40 border border-border/30 transition-all duration-300'
                        )}
                    >
                        <div className="flex items-center gap-3">
                            {ranked && (
                                <div
                                    className={cn(
                                        'shrink-0',
                                        theme === 'tokyo-night' && [
                                            'text-2xl font-bold',
                                            highlightTop3 && index === 0 && 'text-[hsl(var(--chart-1))] drop-shadow-[0_0_8px_hsl(var(--chart-1))]',
                                            highlightTop3 && index === 1 && 'text-[hsl(var(--chart-2))] drop-shadow-[0_0_6px_hsl(var(--chart-2))]',
                                            highlightTop3 && index === 2 && 'text-[hsl(var(--chart-3))] drop-shadow-[0_0_5px_hsl(var(--chart-3))]',
                                            (!highlightTop3 || index > 2) && 'text-primary',
                                        ],
                                        theme === 'impact' && 'text-2xl font-black',
                                        theme === 'elegant' && 'text-xl font-serif text-primary/60'
                                    )}
                                >
                                    {getRankIcon(index)}
                                </div>
                            )}

                            <div className="flex-1 min-w-0">
                                <div
                                    className={cn(
                                        'font-medium truncate',
                                        theme === 'tokyo-night' && 'text-foreground',
                                        theme === 'impact' && 'font-black uppercase tracking-tight text-sm',
                                        theme === 'elegant' && 'font-serif text-base'
                                    )}
                                >
                                    {String(primaryValue ?? '')}
                                </div>
                                {secondaryValue && (
                                    <div
                                        className={cn(
                                            'text-sm text-muted-foreground truncate',
                                            theme === 'impact' && 'font-bold uppercase text-xs mt-0.5'
                                        )}
                                    >
                                        {String(secondaryValue ?? '')}
                                    </div>
                                )}
                            </div>

                            {metaValue && (
                                <div
                                    className={cn(
                                        'shrink-0 text-sm',
                                        theme === 'tokyo-night' && 'font-mono text-muted-foreground',
                                        theme === 'impact' && 'font-black text-xs',
                                        theme === 'elegant' && 'font-sans text-muted-foreground'
                                    )}
                                >
                                    {String(metaValue)}
                                </div>
                            )}
                        </div>
                    </motion.div>
                );
            })}
            {items.length === 0 && (
                <div
                    className={cn(
                        'py-8 text-center',
                        theme === 'impact' && 'font-black uppercase tracking-widest',
                        'text-muted-foreground'
                    )}
                >
                    No items
                </div>
            )}
        </motion.div>
    );
}
