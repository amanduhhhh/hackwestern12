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
