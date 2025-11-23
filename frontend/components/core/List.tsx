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
    onItemClick?: (item: T, index: number) => void;
    className?: string;
    theme?: ThemeName;
}

export function List<T extends Record<string, unknown>>({
    items,
    template,
    ranked = false,
    onItemClick,
    className,
    theme: propTheme,
}: ListProps<T>) {
    const { currentTheme } = useThemeStore();
    const theme = propTheme || currentTheme;
    const themeConfig = THEMES[theme];

    const getRankIcon = (index: number) => {
        if (!ranked) return null;
        return index + 1;
    };

    return (
        <div className={cn('flex flex-col gap-2 max-w-[700px]', className)}>
            {items.map((item, index) => {
                const primaryValue = item[template.primary] as string | number | null | undefined;
                const secondaryValue = template.secondary ? (item[template.secondary] as string | number | null | undefined) : null;
                const metaValue = template.meta ? (item[template.meta] as string | number | null | undefined) : null;

                return (
                    <motion.div
                        key={(item.id as string | number) || index}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                            duration: theme === 'impact' ? 0.15 : 0.2,
                            delay: index * 0.05,
                            ease: 'easeOut'
                        }}
                        onClick={() => onItemClick?.(item, index)}
                        className={cn(
                            'p-3 transition-all duration-300',
                            onItemClick && 'cursor-pointer',
                            theme === 'tokyo-night' && 'rounded-lg bg-card/30 hover:bg-card/60 backdrop-blur-sm border border-border hover:shadow-[0_0_15px_3px] hover:shadow-white/20',
                            theme === 'impact' && 'bg-linear-to-br from-white to-slate-50 border-l-4 border-primary shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all',
                            theme === 'elegant' && 'rounded-md bg-card/40 hover:bg-card/60 border border-border/40 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.12)] transition-all duration-500',
                            theme === 'neobrutalism' && 'rounded-lg bg-card border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5'
                        )}
                    >
                        <div className="flex items-center gap-3">
                            {ranked && (
                                <div
                                    className={cn(
                                        'shrink-0',
                                        theme === 'tokyo-night' && 'text-2xl font-bold text-foreground',
                                        theme === 'impact' && 'text-2xl font-black',
                                        theme === 'elegant' && 'text-xl font-serif text-muted-foreground',
                                        theme === 'neobrutalism' && 'text-2xl font-bold text-primary'
                                    )}
                                    style={theme === 'impact' ? { color: 'var(--chart-3)' } : undefined}
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
                                        theme === 'elegant' && 'font-serif text-base',
                                        theme === 'neobrutalism' && 'font-bold text-foreground'
                                    )}
                                >
                                    {String(primaryValue ?? '')}
                                </div>
                                {secondaryValue && (
                                    <div
                                        className={cn(
                                            'text-sm truncate',
                                            theme === 'tokyo-night' && 'text-foreground',
                                            theme === 'impact' && 'font-bold uppercase text-xs mt-0.5 text-muted-foreground',
                                            theme === 'elegant' && 'text-muted-foreground',
                                            theme === 'neobrutalism' && 'font-medium text-foreground'
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
                                        theme === 'tokyo-night' && 'font-mono text-foreground',
                                        theme === 'impact' && 'font-black text-xs text-muted-foreground',
                                        theme === 'elegant' && 'font-sans text-muted-foreground',
                                        theme === 'neobrutalism' && 'font-bold text-foreground'
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
                        theme === 'neobrutalism' && 'font-bold',
                        'text-muted-foreground'
                    )}
                >
                    No items
                </div>
            )}
        </div>
    );
}
