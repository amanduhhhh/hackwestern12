'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useThemeStore } from '@/store/useThemeStore';
import { THEMES } from '@/lib/themes';
import type { ThemeName } from '@/components/types';

interface TimelineEvent {
    title: string;
    description?: string;
    timestamp?: string;
}

interface TimelineProps {
    events: TimelineEvent[];
    orientation?: 'vertical' | 'horizontal';
    onEventClick?: (event: TimelineEvent, index: number) => void;
    className?: string;
    theme?: ThemeName;
}

export function Timeline({
    events,
    orientation = 'vertical',
    onEventClick,
    className,
    theme: propTheme,
}: TimelineProps) {
    const { currentTheme } = useThemeStore();
    const theme = propTheme || currentTheme;

    const isVertical = orientation === 'vertical';

    return (
        <motion.div
            initial={false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className={cn(
                'relative',
                isVertical ? 'pl-6' : 'flex gap-4 overflow-x-auto pb-4',
                className
            )}
        >
            {isVertical && (
                <div
                    className={cn(
                        'absolute left-2 top-0 h-full w-0.5',
                        theme === 'tokyo-night' && 'bg-primary/30',
                        theme === 'impact' && 'bg-primary w-1',
                        theme === 'elegant' && 'bg-primary/20'
                    )}
                />
            )}

            {!isVertical && (
                <div
                    className={cn(
                        'absolute left-0 top-1/2 h-0.5 -translate-y-1/2',
                        theme === 'tokyo-night' && 'bg-primary/30',
                        theme === 'impact' && 'bg-primary h-1',
                        theme === 'elegant' && 'bg-primary/20'
                    )}
                    style={{ width: orientation === 'horizontal' ? 'calc(100% - 2rem)' : undefined }}
                />
            )}

            {events.map((event, index) => (
                <motion.div
                    key={index}
                    initial={false}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                        duration: theme === 'impact' ? 0.15 : 0.2,
                        delay: 0,
                    }}
                    onClick={() => onEventClick?.(event, index)}
                        className={cn(
                            'relative',
                            isVertical ? 'mb-4' : 'shrink-0 w-64',
                        onEventClick && 'cursor-pointer'
                    )}
                >
                    <div
                        className={cn(
                            'absolute',
                            isVertical ? [
                                theme === 'impact' ? '-left-[23px]' : '-left-[21px]',
                                'top-1/2 -translate-y-1/2'
                            ] : 'left-1/2 -top-6 -translate-x-1/2',
                            theme === 'tokyo-night' && 'h-3 w-3 rounded-full bg-white',
                            theme === 'impact' && 'h-4 w-4 bg-primary border-2 border-white shadow-md',
                            theme === 'elegant' && 'h-3 w-3 rounded-full bg-primary/60 border border-primary'
                        )}
                    />

                    <div
                        className={cn(
                            'p-3 shadow-sm transition-all duration-300 hover:shadow-[0_0_15px_3px] hover:shadow-white/20',
                            onEventClick && 'cursor-pointer',
                            theme === 'tokyo-night' && 'rounded-lg bg-card/50 backdrop-blur-sm border border-border',
                            theme === 'impact' && 'bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]',
                            theme === 'elegant' && 'rounded-lg bg-card/40 border border-border/30'
                        )}
                    >
                        <div
                            className={cn(
                                'font-medium',
                                theme === 'tokyo-night' && 'text-foreground',
                                theme === 'impact' && 'font-black uppercase text-sm tracking-tight',
                                theme === 'elegant' && 'font-serif text-foreground'
                            )}
                        >
                            {event.title}
                        </div>
                        {event.description && (
                            <div
                                className={cn(
                                    'mt-1 text-sm text-muted-foreground',
                                    theme === 'impact' && 'font-bold text-xs'
                                )}
                            >
                                {event.description}
                            </div>
                        )}
                        {event.timestamp && (
                            <div
                                className={cn(
                                    'mt-2 text-xs',
                                    theme === 'tokyo-night' && 'text-muted-foreground font-mono',
                                    theme === 'impact' && 'text-muted-foreground font-bold uppercase',
                                    theme === 'elegant' && 'text-muted-foreground font-sans italic'
                                )}
                            >
                                {event.timestamp}
                            </div>
                        )}
                    </div>
                </motion.div>
            ))}
        </motion.div>
    );
}
