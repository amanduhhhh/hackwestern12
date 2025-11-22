import type { ComponentConfig, ComponentData, DataContext } from './types';

export function generateSlotId(slot: Element): string {
  const explicitId = slot.getAttribute('slot-id');
  if (explicitId) return explicitId;

  const type = slot.getAttribute('type') || 'unknown';
  const dataSource = slot.getAttribute('data-source') || '';
  return `${type}::${dataSource}`;
}

export function resolveDataSource(
  dataContext: DataContext,
  dataSource: string | null
): ComponentData {
  if (!dataSource) return null;

  const parts = dataSource.split('::');
  if (parts.length !== 2) return null;

  const [namespace, key] = parts;
  const namespaceData = dataContext[namespace];
  if (!namespaceData) return null;

  const value = namespaceData[key];
  if (value === null || value === undefined || typeof value !== 'object') {
    return null;
  }
  return value as ComponentData;
}

export function parseConfig(configString: string | null): ComponentConfig {
  if (!configString) return {};
  try {
    return JSON.parse(configString) as ComponentConfig;
  } catch {
    return {};
  }
}
