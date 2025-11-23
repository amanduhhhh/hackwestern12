import type { ComponentRegistry } from './types';
import {
  CardAdapter,
  ListAdapter,
  ChartAdapter,
  TimelineAdapter,
  GridAdapter,
  TableAdapter,
  VinylAdapter,
  CalendarAdapter,
} from './adapters';

export const COMPONENT_REGISTRY: ComponentRegistry = {
  List: ListAdapter,
  Card: CardAdapter,
  Chart: ChartAdapter,
  Grid: GridAdapter,
  Timeline: TimelineAdapter,
  Table: TableAdapter,
  Vinyl: VinylAdapter,
  Calendar: CalendarAdapter,
};
