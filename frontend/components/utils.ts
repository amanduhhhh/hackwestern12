import type { ComponentConfig, ComponentData, DataContext } from './types';

export function generateSlotId(slot: Element): string {
  const explicitId = slot.getAttribute('slot-id');
  if (explicitId) return explicitId;

  const type = slot.getAttribute('type') || 'unknown';
  const dataSource = slot.getAttribute('data-source') || '';
  return `${type}::${dataSource}`;
}

function resolvePath(obj: unknown, path: string): unknown {
  // Handle paths like "teams[0].schedule" or "teams"
  const parts = path.match(/([^[\].]+)|\[(\d+)\]/g);
  if (!parts) return undefined;

  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;

    // Check if it's an array index like "[0]"
    const indexMatch = part.match(/^\[(\d+)\]$/);
    if (indexMatch) {
      const index = parseInt(indexMatch[1], 10);
      if (!Array.isArray(current)) return undefined;
      current = current[index];
    } else {
      // It's a property name
      if (typeof current !== 'object') return undefined;
      current = (current as Record<string, unknown>)[part];
    }
  }
  return current;
}

export function resolveDataSource(
  dataContext: DataContext,
  dataSource: string | null
): ComponentData {
  if (!dataSource) return null;

  const parts = dataSource.split('::');
  if (parts.length !== 2) return null;

  const [namespace, path] = parts;
  const namespaceData = dataContext[namespace];
  if (!namespaceData) return null;

  // Support path resolution like "teams[0].schedule"
  const value = resolvePath(namespaceData, path);
  if (value === null || value === undefined || typeof value !== 'object') {
    return null;
  }
  return value as ComponentData;
}

export function resolveDataValue(
  dataContext: DataContext,
  dataSource: string | null
): string | number | null {
  if (!dataSource) return null;

  const parts = dataSource.split('::');
  if (parts.length !== 2) return null;

  const [namespace, path] = parts;
  const namespaceData = dataContext[namespace];
  if (!namespaceData) return null;

  // Support path resolution like "teams[0].wins"
  const value = resolvePath(namespaceData, path);
  if (value === null || value === undefined) {
    return null;
  }
  
  if (Array.isArray(value)) {
    return value.length;
  }
  
  if (typeof value === 'object') {
    return null;
  }
  
  return value as string | number;
}

export function parseConfig(configString: string | null): ComponentConfig {
  if (!configString) return {};
  try {
    return JSON.parse(configString) as ComponentConfig;
  } catch {
    return {};
  }
}
