import type { ComponentRegistry } from './types';
import {
  ListPlaceholder,
  CardPlaceholder,
  ChartPlaceholder,
  GridPlaceholder,
  TimelinePlaceholder,
  TablePlaceholder,
  ClickablePlaceholder,
} from './placeholders';

export const COMPONENT_REGISTRY: ComponentRegistry = {
  List: ListPlaceholder,
  Card: CardPlaceholder,
  Chart: ChartPlaceholder,
  Grid: GridPlaceholder,
  Timeline: TimelinePlaceholder,
  Table: TablePlaceholder,
  Clickable: ClickablePlaceholder,
};
