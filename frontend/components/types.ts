import { Variants } from 'framer-motion';

export type ThemeName = 'tokyo-night' | 'impact' | 'elegant' | 'neobrutalism';

export interface ThemeConfig {
  fonts: {
    heading: string;
    body: string;
    accent?: string;
  };
  animations: {
    card: Variants;
    list: Variants;
    chart: Variants;
  };
  styles: {
    card: string;
    cardHover: string;
    border: string;
  };
}

export interface BaseComponentProps {
  className?: string;
  theme?: ThemeName;
}

export interface ListItem {
  id: string | number;
  title?: string;
  subtitle?: string;
  [key: string]: string | number | undefined;
}

export interface CardData {
  title?: string;
  description?: string;
  image?: string;
  value?: string | number;
  trend?: { value: number; label: string };
  [key: string]: string | number | { value: number; label: string } | undefined;
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface GridItem {
  id: string | number;
  title?: string;
  image?: string;
}

export interface TimelineEvent {
  id: string | number;
  title: string;
  description?: string;
  timestamp?: string;
}

export interface CalendarDate {
  date: string;
  description: string;
}

export type ComponentData =
  | ListItem[]
  | CardData
  | ChartDataPoint[]
  | GridItem[]
  | TimelineEvent[]
  | CalendarDate[]
  | null;

export interface ComponentConfig {
  template?: {
    primary?: string;
    secondary?: string;
    value?: string;
    [key: string]: string | undefined;
  };
  columns?: number;
  layout?: string;
  size?: 'sm' | 'md' | 'lg';
  orientation?: string;
}

export interface InteractionPayload {
  componentType: string;
  clickPrompt: string | null;
  slotId: string;
  clickedData: unknown;
}

export interface ComponentProps {
  data: ComponentData;
  config: ComponentConfig;
  clickPrompt?: string;
  slotId?: string;
  onInteraction?: (payload: { clickedData: unknown }) => void;
}

export type ComponentRegistry = Record<string, React.ComponentType<ComponentProps>>;

export type DataValue = ComponentData | string | number | boolean;

export interface DataContext {
  [namespace: string]: {
    [key: string]: DataValue;
  };
}

export interface HydrationLog {
  timestamp: number;
  stage: 'parse' | 'sanitize' | 'detect' | 'resolve' | 'mount' | 'complete';
  message: string;
  data?: {
    slotCount?: number;
    componentType?: string;
    dataResolved?: boolean;
    props?: ComponentProps;
  };
}
