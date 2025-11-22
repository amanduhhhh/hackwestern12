import { Variants } from 'framer-motion';

export type ThemeName = 'tokyo-night' | 'impact' | 'elegant';

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
  [key: string]: string | undefined;
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

export type ComponentData =
  | ListItem[]
  | CardData
  | ChartDataPoint[]
  | GridItem[]
  | TimelineEvent[]
  | null;

export interface ComponentConfig {
  template?: {
    primary?: string;
    secondary?: string;
    [key: string]: string | undefined;
  };
  columns?: number;
  layout?: string;
}

export interface InteractionPayload {
  componentType: string;
  interaction: string | null;
  item?: ListItem | GridItem | TimelineEvent;
  event?: TimelineEvent;
  point?: ChartDataPoint;
  data?: CardData;
  index?: number;
}

export interface ComponentProps {
  data: ComponentData;
  config: ComponentConfig;
  onInteraction: (type: string, payload: Omit<InteractionPayload, 'componentType' | 'interaction'>) => void;
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
