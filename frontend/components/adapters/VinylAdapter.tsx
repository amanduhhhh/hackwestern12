'use client';

import { VinylCard } from '@/components/core/VinylCard';
import type { ComponentProps } from '../types';

export function VinylAdapter({ data, config, onInteraction }: ComponentProps) {
    const vinylData = (data as Record<string, unknown>) || {};
    const template = config.template || {};

    const title = template.primary
        ? vinylData[template.primary]
        : vinylData.title || vinylData.name || vinylData.album || Object.values(vinylData)[0];
    const artist = template.secondary
        ? vinylData[template.secondary]
        : vinylData.artist || vinylData.genre || vinylData.year || vinylData.creator || undefined;
    const image = vinylData.image as string | undefined;
    const label = config.layout || 'Most Played';

    return (
        <VinylCard
            title={title ? String(title) : 'Unknown'}
            artist={artist ? String(artist) : ''}
            image={image}
            label={label}
            onClick={() => onInteraction('click', { data: vinylData })}
        />
    );
}

