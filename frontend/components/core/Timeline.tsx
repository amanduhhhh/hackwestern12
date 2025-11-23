'use client';

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

    const themeConfig = THEMES[theme];
    const listAnim = themeConfig.animations.list as { initial?: any; animate?: any };
    const listInitial = listAnim.initial ?? false;
    const listAnimateValue = listAnim.animate ?? {};
    const { transition: listTransition, ...listAnimate } = listAnimateValue && typeof listAnimateValue === 'object' && 'transition' in listAnimateValue
        ? listAnimateValue
        : { ...listAnimateValue, transition: undefined };

    return (
        <motion.div
            initial={listInitial}
            animate={listAnimate}
            transition={listTransition}
            className={cn(
                'relative max-w-[700px]',
                isVertical ? 'pl-8' : 'flex gap-4 overflow-x-auto pb-4',
                className
            )}
        >
            {isVertical && (
                <div
                    className={cn(
                        'absolute top-0 h-full w-0.5',
                        theme === 'tokyo-night' && 'left-2 bg-primary/30',
                        theme === 'impact' && 'left-2 w-1',
                        theme === 'elegant' && 'left-2 bg-primary/20',
                        theme === 'neobrutalism' && 'left-3 w-1 bg-black'
                    )}
                    style={theme === 'impact' ? { backgroundColor: 'var(--chart-3)' } : undefined}
                />
            )}

            {!isVertical && (
                <div
                    className={cn(
                        'absolute left-0 top-1/2 h-0.5 -translate-y-1/2',
                        theme === 'tokyo-night' && 'bg-primary/30',
                        theme === 'impact' && 'bg-primary h-1',
                        theme === 'elegant' && 'bg-primary/20',
                        theme === 'neobrutalism' && 'h-1 bg-black'
                    )}
                    style={{ width: orientation === 'horizontal' ? 'calc(100% - 2rem)' : undefined }}
                />
            )}

            {events.map((event, index) => (
                <motion.div
                    key={index}
                    initial={listInitial}
                    animate={listAnimate}
                    transition={{
                        ...listTransition,
                        delay: index * 0.08,
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
                                theme === 'tokyo-night' ? '-left-[29px]' :
                                theme === 'impact' ? '-left-[30px]' :
                                theme === 'elegant' ? '-left-[29px]' :
                                theme === 'neobrutalism' ? '-left-[26px]' :
                                '-left-[29px]',
                                'top-1/2 -translate-y-1/2'
                            ] : 'left-1/2 -top-6 -translate-x-1/2',
                            theme === 'tokyo-night' && 'h-3 w-3 rounded-full bg-white',
                            theme === 'impact' && 'h-4 w-4 bg-primary border-2 border-white shadow-md',
                            theme === 'elegant' && 'h-3 w-3 rounded-full bg-primary/60 border border-primary',
                            theme === 'neobrutalism' && 'h-4 w-4 rounded-lg bg-secondary border-2 border-black'
                        )}
                    />

                    <div
                        className={cn(
                            'p-3 transition-all duration-300',
                            onEventClick && 'cursor-pointer',
                            theme === 'tokyo-night' && 'rounded-lg bg-card/50 backdrop-blur-sm border border-border hover:shadow-[0_0_15px_3px] hover:shadow-white/20',
                            theme === 'impact' && 'bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-[4px_4px_2px_0px_rgba(0,0,0,0.08)] hover:-translate-y-0.5',
                            theme === 'elegant' && 'rounded-lg bg-card/40 hover:bg-card/60 border border-border/40 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.12)] transition-all duration-500',
                            theme === 'neobrutalism' && 'rounded-lg bg-card border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5'
                        )}
                    >
                        <div
                            className={cn(
                                'font-medium',
                                theme === 'tokyo-night' && 'text-foreground',
                                theme === 'impact' && 'font-black uppercase text-sm tracking-tight',
                                theme === 'elegant' && 'font-serif text-foreground',
                                theme === 'neobrutalism' && 'font-bold text-foreground'
                            )}
                        >
                            {event.title}
                        </div>
                        {event.description && (
                            <div
                                className={cn(
                                    'mt-1 text-sm',
                                    theme === 'tokyo-night' && 'text-foreground',
                                    theme === 'impact' && 'font-bold text-xs text-muted-foreground',
                                    theme === 'elegant' && 'text-muted-foreground',
                                    theme === 'neobrutalism' && 'font-medium text-foreground'
                                )}
                            >
                                {event.description}
                            </div>
                        )}
                        {event.timestamp && (
                            <div
                                className={cn(
                                    'mt-2 text-xs',
                                    theme === 'tokyo-night' && 'text-foreground font-mono',
                                    theme === 'impact' && 'text-muted-foreground font-bold uppercase',
                                    theme === 'elegant' && 'text-muted-foreground font-sans italic',
                                    theme === 'neobrutalism' && 'font-bold text-foreground'
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
