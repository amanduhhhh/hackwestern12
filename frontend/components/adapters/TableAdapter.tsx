'use client';

import { Table } from '@/components/core/Table';
import type { ComponentProps } from '../types';

interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
}

export function TableAdapter({ data, config, onInteraction }: ComponentProps) {
  const rows = (data as Record<string, unknown>[]) || [];
  const columns = (config.columns as TableColumn[]) || [];

  return (
    <Table
      columns={columns}
      data={rows}
      onSort={(key, direction) => {
        onInteraction('sort', { index: 0, item: { key, direction } as any });
      }}
    />
  );
}

