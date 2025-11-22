'use client';

import { useRef, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useThemeStore } from '@/store/useThemeStore';
import { THEMES } from '@/lib/themes';
import type { ThemeName } from '@/components/types';

interface CardProps {
    variant?: 'default' | 'metric' | 'stat' | 'image';
    icon?: ReactNode;
    title?: string;
    value?: string | number;
    subtitle?: string;
    trend?: { value: number; label: string };
    onClick?: () => void;
    children?: ReactNode;
    image?: string;
    className?: string;
    theme?: ThemeName;
}

export function Card({
    variant = 'default',
    icon,
    title,
    value,
    subtitle,
    trend,
    onClick,
    children,
    image,
    className,
    theme: propTheme,
}: CardProps) {
    const { currentTheme } = useThemeStore();
    const theme = propTheme || currentTheme;
    const themeConfig = THEMES[theme];

    const baseStyles = cn(
        themeConfig.styles.card,
        onClick && themeConfig.styles.cardHover,
        'p-4 transition-all duration-300 hover:shadow-[0_0_15px_3px] hover:shadow-white/20',
        className
    );

    const renderContent = () => {
        if (children) {
            return children;
        }

        if (variant === 'metric') {
            return (
                <>
                    {theme === 'tokyo-night' && (
                        <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                    {theme === 'impact' && icon && (
                        <div className="absolute right-0 top-0 opacity-5 -mr-4 -mt-4 transform rotate-12 group-hover:scale-110 transition-transform duration-500">
                            {icon}
                        </div>
                    )}
                    {theme === 'elegant' && (
                        <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full opacity-5 blur-2xl transition-opacity duration-700 group-hover:opacity-15 bg-primary" />
                    )}

                    <div className="relative z-10 flex flex-col h-full justify-between min-h-[140px]">
                        {title && (
                            <span
                                className={cn(
                                    'text-sm text-muted-foreground',
                                    theme === 'impact' && 'text-xs font-black uppercase tracking-widest',
                                    theme === 'elegant' && 'font-sans text-xs uppercase tracking-widest opacity-70',
                                    theme === 'tokyo-night' && 'font-medium'
                                )}
                            >
                                {title}
                            </span>
                        )}
                        {value && (
                            <div className={cn(themeConfig.fonts.heading)}>
                                <div
                                    className={cn(
                                        'text-4xl',
                                        theme === 'tokyo-night' && 'font-bold text-[hsl(var(--chart-1))] drop-shadow-[0_0_12px_hsl(var(--chart-1))] group-hover:drop-shadow-[0_0_20px_hsl(var(--chart-1))] transition-all',
                                        theme === 'impact' && 'font-black tracking-tighter bg-clip-text text-transparent bg-linear-to-br from-primary to-slate-700',
                                        theme === 'elegant' && 'font-serif font-medium tracking-tight text-primary'
                                    )}
                                >
                                    {value}
                                </div>
                                {subtitle && (
                                    <p
                                        className={cn(
                                            'text-xs text-muted-foreground mt-2',
                                            theme === 'impact' && 'font-bold uppercase tracking-widest',
                                            theme === 'elegant' && 'font-sans font-medium uppercase tracking-widest opacity-70'
                                        )}
                                    >
                                        {subtitle}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </>
            );
        }

        if (variant === 'stat') {
            const isPositive = trend ? trend.value >= 0 : true;

            return (
                <>
                    {theme === 'tokyo-night' && (
                        <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                    {theme === 'impact' && icon && (
                        <div className="absolute right-0 top-0 opacity-5 -mr-4 -mt-4 transform rotate-12 group-hover:scale-110 transition-transform duration-500">
                            {icon}
                        </div>
                    )}

                    <div className="relative z-10">
                        <div className="flex items-center justify-between space-y-0 pb-2">
                            {title && (
                                <h3
                                    className={cn(
                                        'text-sm font-medium text-muted-foreground',
                                        theme === 'impact' && 'text-xs font-black uppercase tracking-widest'
                                    )}
                                >
                                    {title}
                                </h3>
                            )}
                            {icon && (
                                <div
                                    className={cn(
                                        'h-4 w-4',
                                        theme === 'tokyo-night' && 'text-[hsl(var(--chart-2))] drop-shadow-[0_0_8px_hsl(var(--chart-2))] group-hover:scale-110 transition-all duration-300'
                                    )}
                                >
                                    {icon}
                                </div>
                            )}
                        </div>
                        <div>
                            {value && (
                                <div
                                    className={cn(
                                        'text-2xl font-bold',
                                        theme === 'tokyo-night' && 'text-foreground group-hover:text-[hsl(var(--chart-1))] group-hover:drop-shadow-[0_0_10px_hsl(var(--chart-1))] transition-all',
                                        theme === 'impact' && 'font-black',
                                        theme === 'elegant' && 'font-serif'
                                    )}
                                >
                                    {value}
                                </div>
                            )}
                            {subtitle && !trend && (
                                <p
                                    className={cn(
                                        'text-xs text-muted-foreground mt-1',
                                        theme === 'impact' && 'font-bold uppercase tracking-widest',
                                        theme === 'elegant' && 'font-sans italic'
                                    )}
                                >
                                    {subtitle}
                                </p>
                            )}
                            {trend && (
                                <div
                                    className={cn(
                                        'flex items-center text-xs mt-1 px-2 py-1',
                                        theme === 'impact' && 'font-bold shadow-sm',
                                        theme === 'tokyo-night' && (isPositive ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--error))]'),
                                        theme === 'impact' && (isPositive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600')
                                    )}
                                    style={theme === 'elegant' ? {
                                        color: isPositive ? 'var(--success)' : 'var(--error)'
                                    } : undefined}
                                >
                                    <span>{trend.label}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            );
        }

        if (variant === 'image') {
            return (
                <>
                    {image && (
                        <div className={cn(
                            'mb-4 overflow-hidden',
                            theme === 'tokyo-night' && 'rounded-lg',
                            theme === 'impact' && '',
                            theme === 'elegant' && 'rounded-lg'
                        )}>
                            <div className={cn(
                                'aspect-square bg-muted',
                                theme === 'tokyo-night' && 'rounded-lg',
                                theme === 'impact' && '',
                                theme === 'elegant' && 'rounded-lg'
                            )}>
                                <img
                                    src={image}
                                    alt={title || ''}
                                    className="h-full w-full object-cover"
                                />
                            </div>
                        </div>
                    )}
                    {title && (
                        <h3 className={cn(
                            'font-semibold',
                            themeConfig.fonts.heading,
                            theme === 'impact' && 'text-xs uppercase tracking-widest',
                            theme === 'elegant' && 'text-sm'
                        )}>
                            {title}
                        </h3>
                    )}
                    {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
                    {children && <div className="mt-2">{children}</div>}
                </>
            );
        }

        return (
            <>
                {title && <h3 className={cn('font-semibold', themeConfig.fonts.heading)}>{title}</h3>}
                {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
                {children && <div className="mt-2">{children}</div>}
            </>
        );
    };

    const cardAnim = themeConfig.animations.card as { initial?: any; animate?: any };
    const initial = cardAnim.initial ?? false;
    const animateValue = cardAnim.animate ?? {};
    const { transition, ...animate } = animateValue && typeof animateValue === 'object' && 'transition' in animateValue
        ? animateValue
        : { ...animateValue, transition: undefined };

    return (
        <motion.div
            initial={initial}
            animate={animate}
            transition={transition}
            onClick={onClick}
            className={baseStyles}
        >
            {renderContent()}
        </motion.div>
    );
}
