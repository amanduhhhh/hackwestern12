'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useThemeStore } from '@/store/useThemeStore';
import { THEMES } from '@/lib/themes';
import type { ThemeName } from '@/components/types';

interface VinylCardProps {
    title: string;
    artist: string;
    image?: string;
    label?: string;
    onClick?: () => void;
    className?: string;
    theme?: ThemeName;
}

export function VinylCard({
    title,
    artist,
    image,
    label = 'Most Played',
    onClick,
    className,
    theme: propTheme,
}: VinylCardProps) {
    const { currentTheme } = useThemeStore();
    const theme = propTheme || currentTheme;
    const themeConfig = THEMES[theme];

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
            className={cn(
                'relative p-6',
                themeConfig.styles.card,
                onClick && themeConfig.styles.cardHover,
                onClick && 'cursor-pointer',
                className
            )}
        >
            <div className="relative flex flex-col items-center">
                <div className={cn(
                    'text-xs uppercase tracking-widest mb-4 font-bold',
                    theme === 'tokyo-night' && 'text-muted-foreground',
                    theme === 'impact' && 'text-primary font-black tracking-wider',
                    theme === 'elegant' && 'font-serif text-muted-foreground tracking-wider',
                    theme === 'neobrutalism' && 'font-space-grotesk text-primary'
                )}>
                    {label}
                </div>

                <div className="relative">
                    {theme !== 'neobrutalism' && (
                        <div 
                            className="absolute inset-0 rounded-full opacity-10 blur-xl vinyl-shadow"
                            style={{ 
                                width: '280px', 
                                height: '280px',
                                backgroundColor: 'black',
                            }} 
                        />
                    )}
                    
                    <div 
                        className={cn(
                            'relative rounded-full vinyl-disc',
                            theme === 'tokyo-night' && 'bg-linear-to-br from-gray-900 via-gray-800 to-black',
                            theme === 'impact' && 'bg-linear-to-br from-slate-900 via-slate-800 to-black',
                            theme === 'elegant' && 'bg-linear-to-br from-gray-900 via-slate-800 to-gray-900',
                            theme === 'neobrutalism' && 'bg-linear-to-br from-primary via-primary to-secondary border-4 border-black'
                        )}
                        style={{
                            width: '280px',
                            height: '280px',
                            boxShadow: theme === 'neobrutalism' 
                                ? 'none'
                                : 'inset 0 0 40px rgba(0,0,0,0.5), 0 0 20px rgba(0,0,0,0.3)',
                        }}
                    >
                        {[...Array(15)].map((_, i) => (
                            <div
                                key={i}
                                className={cn(
                                    'absolute rounded-full border opacity-30',
                                    theme === 'tokyo-night' && 'border-gray-700',
                                    theme === 'impact' && 'border-gray-600',
                                    theme === 'elegant' && 'border-gray-700',
                                    theme === 'neobrutalism' && 'border-black opacity-20'
                                )}
                                style={{
                                    width: `${140 + i * 8}px`,
                                    height: `${140 + i * 8}px`,
                                    left: '50%',
                                    top: '50%',
                                    transform: 'translate(-50%, -50%)',
                                }}
                            />
                        ))}
                        
                        <div 
                            className={cn(
                                'absolute rounded-full overflow-hidden',
                                theme === 'neobrutalism' && 'border-2 border-black'
                            )}
                            style={{
                                width: '90px',
                                height: '90px',
                                left: '50%',
                                top: '50%',
                                transform: 'translate(-50%, -50%)',
                                boxShadow: theme === 'neobrutalism'
                                    ? 'none'
                                    : 'inset 0 0 20px rgba(0,0,0,0.2), 0 0 10px rgba(0,0,0,0.1)',
                            }}
                        >
                            {image ? (
                                <img 
                                    src={image}
                                    alt={title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className={cn(
                                        'w-full h-full',
                                    theme === 'tokyo-night' && 'bg-gray-800',
                                    theme === 'impact' && 'bg-slate-200',
                                    theme === 'elegant' && 'bg-gray-100',
                                    theme === 'neobrutalism' && 'bg-card'
                                )} />
                            )}
                            
                            <div 
                                className="absolute rounded-full bg-black"
                                style={{
                                    width: '14px',
                                    height: '14px',
                                    left: '50%',
                                    top: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    boxShadow: 'inset 0 0 4px rgba(255,255,255,0.1)',
                                    zIndex: 10,
                                }}
                            />
                            
                            <div 
                                className={cn(
                                    'absolute rounded-full border-2 opacity-40',
                                    theme === 'neobrutalism' ? 'border-black' : 'border-black'
                                )}
                                style={{
                                    width: '75px',
                                    height: '75px',
                                    left: '50%',
                                    top: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    zIndex: 5,
                                }}
                            />
                        </div>
                        
                        {theme !== 'neobrutalism' && (
                            <div 
                                className="absolute rounded-full opacity-20"
                                style={{
                                    width: '220px',
                                    height: '220px',
                                    left: '20%',
                                    top: '20%',
                                    background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
                                    pointerEvents: 'none',
                                }}
                            />
                        )}
                    </div>
                </div>
                
                <div className="mt-6 text-center">
                    <h3 className={cn(
                        'font-bold mb-1',
                        theme === 'tokyo-night' && 'text-foreground text-lg',
                        theme === 'impact' && 'font-black uppercase tracking-tight text-base',
                        theme === 'elegant' && 'font-serif text-lg',
                        theme === 'neobrutalism' && 'font-space-grotesk text-foreground text-lg'
                    )}>
                        {title}
                    </h3>
                    {artist && (
                        <p className={cn(
                            'text-sm',
                            theme === 'tokyo-night' && 'text-muted-foreground',
                            theme === 'impact' && 'font-bold text-muted-foreground uppercase text-xs',
                            theme === 'elegant' && 'text-muted-foreground',
                            theme === 'neobrutalism' && 'font-space-grotesk text-secondary'
                        )}>
                            {artist}
                        </p>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

