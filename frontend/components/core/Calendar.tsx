'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useThemeStore } from '@/store/useThemeStore';
import { THEMES } from '@/lib/themes';
import type { ThemeName } from '@/components/types';

interface CalendarDate {
    date: string;
    description: string;
}

interface CalendarProps {
    dates?: CalendarDate[];
    onDateClick?: (date: CalendarDate) => void;
    className?: string;
    theme?: ThemeName;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export function Calendar({
    dates = [],
    onDateClick,
    className,
    theme: propTheme,
}: CalendarProps) {
    const { currentTheme } = useThemeStore();
    const theme = propTheme || currentTheme;
    const themeConfig = THEMES[theme];

    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());

    const datesMap = new Map<string, string>();
    dates.forEach(({ date, description }) => {
        datesMap.set(date, description);
    });

    const isToday = (day: number, month: number, year: number) => {
        return (
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear()
        );
    };

    const hasEvent = (day: number, month: number, year: number) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return datesMap.has(dateStr);
    };

    const getEventDescription = (day: number, month: number, year: number) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return datesMap.get(dateStr);
    };

    const getDaysInMonth = (month: number, year: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (month: number, year: number) => {
        return new Date(year, month, 1).getDay();
    };

    const handlePrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const handleNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) {
        days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        days.push(day);
    }

    const cardAnim = themeConfig.animations.card as { initial?: any; animate?: any };
    const initial = cardAnim.initial ?? false;
    const animateValue = cardAnim.animate ?? {};
    const { transition, ...animate } = animateValue && typeof animateValue === 'object' && 'transition' in animateValue
        ? animateValue
        : { ...animateValue, transition: undefined };

    const getDayStyles = (day: number | null, isTodayDay: boolean, hasEventDay: boolean) => {
        if (!day) return '';

        const baseStyles = cn(
            'w-10 h-10 flex items-center justify-center rounded-md text-sm font-medium transition-all cursor-pointer relative',
            theme === 'tokyo-night' && 'hover:bg-primary/20 hover:text-primary',
            theme === 'impact' && 'hover:bg-primary/10 hover:border-l-2 hover:border-primary',
            theme === 'elegant' && 'hover:bg-primary/5 hover:shadow-sm',
            theme === 'neobrutalism' && 'hover:bg-secondary hover:border-2 hover:border-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
        );

        if (isTodayDay) {
            return cn(
                baseStyles,
                theme === 'tokyo-night' && 'bg-primary/30 text-primary border border-primary/50',
                theme === 'impact' && 'bg-primary text-white font-black',
                theme === 'elegant' && 'bg-primary/20 text-primary border border-primary/30',
                theme === 'neobrutalism' && 'bg-primary text-primary-foreground border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
            );
        }

        if (hasEventDay) {
            return cn(
                baseStyles,
                theme === 'tokyo-night' && 'text-foreground',
                theme === 'impact' && 'font-bold',
                theme === 'elegant' && 'text-primary',
                theme === 'neobrutalism' && 'font-bold'
            );
        }

        return cn(
            baseStyles,
            theme === 'tokyo-night' && 'text-muted-foreground',
            theme === 'impact' && 'text-foreground',
            theme === 'elegant' && 'text-muted-foreground',
            theme === 'neobrutalism' && 'text-foreground'
        );
    };

    const getEventIndicator = (hasEventDay: boolean) => {
        if (!hasEventDay) return null;

        return (
            <div
                className={cn(
                    'absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full',
                    theme === 'tokyo-night' && 'bg-primary',
                    theme === 'impact' && 'bg-primary',
                    theme === 'elegant' && 'bg-primary',
                    theme === 'neobrutalism' && 'bg-foreground'
                )}
            />
        );
    };

    return (
        <motion.div
            initial={initial}
            animate={animate}
            transition={transition}
            className={cn(
                themeConfig.styles.card,
                'p-6',
                className
            )}
        >
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={handlePrevMonth}
                    className={cn(
                        'p-2 rounded-md transition-all',
                        theme === 'tokyo-night' && 'hover:bg-primary/20 text-primary',
                        theme === 'impact' && 'hover:bg-primary/10 hover:border-l-2 hover:border-primary',
                        theme === 'elegant' && 'hover:bg-primary/5',
                        theme === 'neobrutalism' && 'hover:bg-secondary hover:border-2 hover:border-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    )}
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>

                <h3 className={cn(
                    themeConfig.fonts.heading,
                    'text-lg',
                    theme === 'tokyo-night' && 'text-foreground',
                    theme === 'impact' && 'text-foreground',
                    theme === 'elegant' && 'text-foreground',
                    theme === 'neobrutalism' && 'text-foreground'
                )}>
                    {MONTHS[currentMonth]} {currentYear}
                </h3>

                <button
                    onClick={handleNextMonth}
                    className={cn(
                        'p-2 rounded-md transition-all',
                        theme === 'tokyo-night' && 'hover:bg-primary/20 text-primary',
                        theme === 'impact' && 'hover:bg-primary/10 hover:border-l-2 hover:border-primary',
                        theme === 'elegant' && 'hover:bg-primary/5',
                        theme === 'neobrutalism' && 'hover:bg-secondary hover:border-2 hover:border-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    )}
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2">
                {DAYS.map((day) => (
                    <div
                        key={day}
                        className={cn(
                            'text-center text-xs font-medium',
                            theme === 'tokyo-night' && 'text-muted-foreground',
                            theme === 'impact' && 'text-foreground font-bold uppercase',
                            theme === 'elegant' && 'text-muted-foreground',
                            theme === 'neobrutalism' && 'text-foreground font-bold'
                        )}
                    >
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
                {days.map((day, index) => {
                    const isTodayDay = day !== null && isToday(day, currentMonth, currentYear);
                    const hasEventDay = day !== null && hasEvent(day, currentMonth, currentYear);
                    const description = day !== null ? getEventDescription(day, currentMonth, currentYear) : null;

                    return (
                        <div
                            key={index}
                            className="relative group"
                        >
                            {day !== null ? (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                        if (hasEventDay && description && onDateClick) {
                                            onDateClick({
                                                date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
                                                description
                                            });
                                        }
                                    }}
                                    className={getDayStyles(day, isTodayDay, hasEventDay)}
                                >
                                    {day}
                                    {getEventIndicator(hasEventDay)}
                                    {hasEventDay && description && (
                                        <div
                                            className={cn(
                                                'absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50',
                                                theme === 'tokyo-night' && 'bg-card border border-border text-foreground shadow-lg',
                                                theme === 'impact' && 'bg-white border-l-4 border-primary text-foreground shadow-lg',
                                                theme === 'elegant' && 'bg-card/95 border border-border/50 text-foreground shadow-lg backdrop-blur-sm',
                                                theme === 'neobrutalism' && 'bg-card border-2 border-black text-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                                            )}
                                        >
                                            {description}
                                            <div
                                                className={cn(
                                                    'absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent',
                                                    theme === 'tokyo-night' && 'border-t-border',
                                                    theme === 'impact' && 'border-t-white',
                                                    theme === 'elegant' && 'border-t-border/50',
                                                    theme === 'neobrutalism' && 'border-t-black'
                                                )}
                                            />
                                        </div>
                                    )}
                                </motion.button>
                            ) : (
                                <div className="w-10 h-10" />
                            )}
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );
}

