'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useThemeStore } from '@/store/useThemeStore';
import type { ThemeName } from '@/components/types';
import { CartesianGrid, Line, LineChart as RechartsLineChart, XAxis, YAxis } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface DataPoint {
    label: string;
    value: number;
    [key: string]: string | number;
}

interface LineChartProps {
    data: DataPoint[];
    lines?: Array<{ dataKey: string; color?: string }>;
    showGrid?: boolean;
    showAxes?: boolean;
    label?: string;
    height?: number;
    className?: string;
    theme?: ThemeName;
}

export function LineChart({
    data,
    lines = [{ dataKey: 'value' }],
    showGrid = true,
    showAxes = true,
    label,
    height: containerHeight,
    className,
    theme: propTheme,
}: LineChartProps) {
    const { currentTheme } = useThemeStore();
    const theme = propTheme || currentTheme;

    const config: ChartConfig = {
        value: {
            label: "Value",
            color: theme === 'tokyo-night' ? 'var(--chart-1)' : 
                   theme === 'impact' ? 'var(--primary)' : 
                   'var(--primary)',
        },
    };

    return (
        <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: theme === 'impact' ? 0.2 : 0.5 }}
            className={cn(
                'p-4 transition-all duration-300 hover:shadow-[0_0_15px_3px] hover:shadow-white/20',
                theme === 'tokyo-night' && 'rounded-lg bg-card/30 border border-border',
                theme === 'impact' && 'bg-linear-to-br from-white to-slate-50 border-2 border-primary',
                theme === 'elegant' && 'rounded-lg bg-card/20 border border-border/30',
                className
            )}
        >
            {label && (
                <h3
                    className={cn(
                        'mb-4',
                        theme === 'tokyo-night' && 'text-lg font-bold text-foreground',
                        theme === 'impact' && 'text-sm font-black uppercase tracking-widest',
                        theme === 'elegant' && 'text-lg font-serif text-foreground'
                    )}
                >
                    {label}
                </h3>
            )}

            <div style={{ height: containerHeight ? containerHeight - 60 : 240 }}>
                <ChartContainer config={config} className="w-full h-full">
                    <RechartsLineChart
                        data={data}
                        margin={{
                            left: 12,
                            right: 12,
                            top: 12,
                            bottom: 12
                        }}
                    >
                        {showGrid && (
                            <CartesianGrid 
                                vertical={false}
                                strokeDasharray={theme === 'impact' ? '0' : '3 3'}
                                className={cn(
                                    theme === 'tokyo-night' && 'stroke-border/30',
                                    theme === 'impact' && 'stroke-primary/10',
                                    theme === 'elegant' && 'stroke-border/20'
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
                                    theme === 'elegant' && 'font-serif italic'
                                )}
                            />
                        )}
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                        />
                            {lines.map((line, idx) => (
                            <Line
                                key={line.dataKey}
                                dataKey={line.dataKey}
                                type="natural"
                                stroke={line.color || (theme === 'tokyo-night' ? 'var(--chart-1)' : 'var(--primary)')}
                                strokeWidth={theme === 'impact' ? 3 : 2}
                                dot={({ cx, cy, payload }) => {
                                    const r = theme === 'impact' ? 4 : 3;
                                    return (
                                        <circle
                                            key={payload.label}
                                            cx={cx}
                                            cy={cy}
                                            r={r}
                                            fill={line.color || (theme === 'tokyo-night' ? 'var(--chart-1)' : 'var(--primary)')}
                                            stroke={theme === 'tokyo-night' ? 'var(--background)' : 'white'}
                                            strokeWidth={2}
                                            className={cn(
                                                "transition-all duration-300",
                                                theme === 'tokyo-night' && "hover:r-5 hover:drop-shadow-[0_0_8px_var(--chart-1)]"
                                            )}
                                        />
                                    );
                                }}
                                activeDot={{
                                    r: theme === 'impact' ? 7 : 5,
                                    className: theme === 'tokyo-night' ? 'drop-shadow-[0_0_12px_var(--chart-1)]' : ''
                                }}
                                className={cn(
                                    theme === 'tokyo-night' && 'drop-shadow-[0_0_4px_var(--chart-1)]'
                                )}
                            />
                        ))}
                    </RechartsLineChart>
                </ChartContainer>
            </div>
        </motion.div>
    );
}
