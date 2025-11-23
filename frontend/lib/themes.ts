import { Variants } from 'framer-motion';
import type { ThemeName, ThemeConfig } from '@/components/types';

export const THEMES: Record<ThemeName, ThemeConfig> = {
    'tokyo-night': {
        fonts: {
            heading: 'font-sans font-bold',
            body: 'font-sans',
            accent: 'font-mono',
        },
        animations: {
            card: {
                initial: { opacity: 0, scale: 0.98 },
                animate: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
            },
            list: {
                initial: { opacity: 0, x: -8 },
                animate: { opacity: 1, x: 0, transition: { duration: 0.2 } },
            },
            chart: {
                initial: { opacity: 0, y: 8 },
                animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
            },
        },
        styles: {
            card: 'bg-card/50 backdrop-blur-sm border border-border rounded-xl',
            cardHover: 'hover:bg-card/80 transition-colors cursor-pointer group relative overflow-hidden',
            border: 'border',
        },
    },
    impact: {
        fonts: {
            heading: 'font-sans font-black uppercase tracking-tight',
            body: 'font-sans font-bold',
        },
        animations: {
            card: {
                initial: { opacity: 0, y: 4 },
                animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
            },
            list: {
                initial: { opacity: 0, x: -4 },
                animate: { opacity: 1, x: 0, transition: { duration: 0.15 } },
            },
            chart: {
                initial: { opacity: 0 },
                animate: { opacity: 1, transition: { duration: 0.2 } },
            },
        },
        styles: {
            card: 'bg-linear-to-br from-white to-slate-50 border-l-4 border-primary shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)]',
            cardHover: 'hover:shadow-[0_12px_30px_-6px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all group relative',
            border: 'border-2',
        },
    },
    elegant: {
        fonts: {
            heading: 'font-serif font-medium tracking-wide',
            body: 'font-sans',
            accent: 'font-accent italic',
        },
        animations: {
            card: {
                initial: { opacity: 0, y: 8 },
                animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
            },
            list: {
                initial: { opacity: 0, y: 4 },
                animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
            },
            chart: {
                initial: { opacity: 0 },
                animate: { opacity: 1, transition: { duration: 0.7 } },
            },
        },
        styles: {
            card: 'bg-card/40 border border-border/40 rounded-md shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08)]',
            cardHover: 'hover:bg-card/80 hover:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.12)] transition-all duration-500 group relative overflow-hidden',
            border: 'border',
        },
    },
    neobrutalism: {
        fonts: {
            heading: 'font-[var(--font-space-grotesk)] font-bold',
            body: 'font-[var(--font-space-grotesk)] font-medium',
            accent: 'font-[var(--font-space-grotesk)] font-bold',
        },
        animations: {
            card: {
                initial: { opacity: 0, scale: 0.95 },
                animate: { opacity: 1, scale: 1, transition: { duration: 0.2, type: 'spring', stiffness: 200 } },
            },
            list: {
                initial: { opacity: 0, x: -8 },
                animate: { opacity: 1, x: 0, transition: { duration: 0.2, type: 'spring', stiffness: 200 } },
            },
            chart: {
                initial: { opacity: 0, scale: 0.9 },
                animate: { opacity: 1, scale: 1, transition: { duration: 0.3, type: 'spring', stiffness: 150 } },
            },
        },
        styles: {
            card: 'bg-card border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
            cardHover: 'hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all cursor-pointer group relative',
            border: 'border-2 border-black',
        },
    },
};
