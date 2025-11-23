'use client';

import { Card } from '@/components/core/Card';
import type { ComponentProps, CardData } from '../types';

export function CardAdapter({ data, config, onInteraction }: ComponentProps) {
  const cardData = (data as CardData) || {};
  const template = config.template || {};

  const title = template.primary
    ? cardData[template.primary]
    : cardData.title;
  const description = template.secondary
    ? cardData[template.secondary]
    : cardData.description;
  const value = template.value
    ? cardData[template.value]
    : cardData.value;

  const variant = config.layout === 'metric' ? 'metric' : 
                  config.layout === 'stat' ? 'stat' : 
                  cardData.image ? 'image' :
                  'default';
  
  const size = (config.size as 'sm' | 'md' | 'lg') || 'md';

  let trend = undefined;
  if (variant === 'stat' && cardData.trend) {
    const trendData = cardData.trend as { value?: number; label?: string };
    trend = {
      value: trendData.value ?? 0,
      label: trendData.label ?? '',
    };
  }

  return (
    <Card
      variant={variant}
      size={size}
      title={title ? String(title) : undefined}
      subtitle={description ? String(description) : undefined}
      value={value !== undefined ? String(value) : undefined}
      trend={trend}
      image={cardData.image ? String(cardData.image) : undefined}
      onClick={() => onInteraction('click', { data: cardData })}
    />
  );
}

