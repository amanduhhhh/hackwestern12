'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useThemeStore } from '@/store/useThemeStore';
import { THEMES } from '@/lib/themes';
import type { ThemeName } from '@/components/types';
import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface DataPoint {
    label: string;
    value: number;
    [key: string]: string | number;
}

interface BarChartProps {
    data: DataPoint[];
    showGrid?: boolean;
    showAxes?: boolean;
    label?: string;
    height?: number;
    className?: string;
    theme?: ThemeName;
}

export function BarChart({
    data,
    showGrid = true,
    showAxes = true,
    label,
    height: containerHeight,
    className,
    theme: propTheme,
}: BarChartProps) {
    const { currentTheme } = useThemeStore();
    const theme = propTheme || currentTheme;

    const config: ChartConfig = {
        value: {
            label: "Value",
            color: theme === 'tokyo-night' ? 'var(--chart-1)' : theme === 'neobrutalism' ? 'var(--chart-1)' : 'var(--primary)',
        },
    };

    const themeConfig = THEMES[theme];
    const chartAnim = themeConfig.animations.chart as { initial?: any; animate?: any };
    const chartInitial = chartAnim.initial ?? false;
    const chartAnimateValue = chartAnim.animate ?? {};
    const { transition: chartTransition, ...chartAnimate } = chartAnimateValue && typeof chartAnimateValue === 'object' && 'transition' in chartAnimateValue
        ? chartAnimateValue
        : { ...chartAnimateValue, transition: undefined };

    return (
        <motion.div
            initial={chartInitial}
            animate={chartAnimate}
            transition={chartTransition}
            className={cn(
                'p-4 transition-all duration-300',
                theme === 'tokyo-night' && 'rounded-lg bg-card/30 border border-border hover:shadow-[0_0_15px_3px] hover:shadow-white/20',
                theme === 'impact' && 'bg-linear-to-br from-white to-slate-50 hover:shadow-[0_0_15px_3px] hover:shadow-white/20',
                theme === 'elegant' && 'rounded-md bg-card/40 border border-border/40 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.12)] duration-500',
                theme === 'neobrutalism' && 'rounded-lg bg-card border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5',
                className
            )}
        >
            {label && (
                <h3
                    className={cn(
                        'mb-4',
                        theme === 'tokyo-night' && 'text-lg font-bold text-foreground',
                        theme === 'impact' && 'text-sm font-black uppercase tracking-widest',
                        theme === 'elegant' && 'text-lg font-serif text-foreground',
                        theme === 'neobrutalism' && 'text-base font-bold text-foreground'
                    )}
                >
                    {label}
                </h3>
            )}

            <div style={{ height: containerHeight ? containerHeight - 60 : 240 }}>
                <ChartContainer config={config} className="w-full h-full">
                    <RechartsBarChart
                        data={data}
                        margin={{
                            left: 12,
                            right: 12,
                            top: 12,
                            bottom: 12
                        }}
                    >
                        <defs>
                            {theme === 'tokyo-night' && (
                                <linearGradient id="tokyoBarGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={1} />
                                    <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0.6} />
                                </linearGradient>
                            )}
                        </defs>
                        {showGrid && (
                            <CartesianGrid 
                                vertical={false}
                                strokeDasharray={theme === 'impact' ? '0' : theme === 'neobrutalism' ? '0' : '3 3'}
                                className={cn(
                                    theme === 'tokyo-night' && 'stroke-border/30',
                                    theme === 'impact' && 'stroke-primary/10',
                                    theme === 'elegant' && 'stroke-border/20',
                                    theme === 'neobrutalism' && 'stroke-black/20'
                                )}
                            />
                        )}
                        {showAxes && (
                            <XAxis
                                dataKey="label"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                tickFormatter={(value) => value.slice(0, 3)}
                                className={cn(
                                    theme === 'impact' && 'font-bold uppercase text-[10px]',
                                    theme === 'elegant' && 'font-serif italic',
                                    theme === 'neobrutalism' && 'font-bold text-[10px]'
                                )}
                            />
                        )}
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                        />
                        <Bar
                            dataKey="value"
                            radius={theme === 'impact' ? [0, 0, 0, 0] : theme === 'neobrutalism' ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                            fill={
                                theme === 'tokyo-night' ? 'url(#tokyoBarGradient)' :
                                theme === 'neobrutalism' ? 'var(--chart-1)' :
                                'var(--primary)'
                            }
                            isAnimationActive={true}
                            animationDuration={theme === 'impact' ? 300 : 400}
                            animationBegin={0}
                            className={cn(
                                "transition-all duration-300",
                                theme === 'impact' && "hover:fill-primary/80",
                                theme === 'elegant' && "hover:fill-primary/80",
                                theme === 'neobrutalism' && "hover:fill-[var(--chart-2)]"
                            )}
                        />
                    </RechartsBarChart>
                </ChartContainer>
            </div>
        </motion.div>
    );
}
