'use client';

import { List } from '@/components/core/List';
import type { ComponentProps, ListItem } from '../types';

export function ListAdapter({ data, config, onInteraction }: ComponentProps) {
  const items = (data as ListItem[]) || [];
  const template = config.template || { primary: 'title', secondary: 'subtitle' };

  return (
    <List
      items={items}
      template={{
        primary: template.primary || 'title',
        secondary: template.secondary,
        meta: template.meta,
      }}
      ranked={config.layout === 'ranked'}
      onItemClick={(item, index) => onInteraction('select', { item, index })}
    />
  );
}

