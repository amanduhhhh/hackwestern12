'use client';

import { Calendar } from '@/components/core/Calendar';
import type { ComponentProps, CalendarDate } from '../types';

export function CalendarAdapter({ data, config, onInteraction }: ComponentProps) {
  const calendarDates = (data as CalendarDate[]) || [];

  return (
    <Calendar
      dates={calendarDates}
      onDateClick={(date) => {
        if (onInteraction) {
          onInteraction({ clickedData: date });
        }
      }}
    />
  );
}

