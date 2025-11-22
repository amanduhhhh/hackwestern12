/**
 * @jest-environment jsdom
 */

import { generateSlotId, resolveDataSource, parseConfig } from '@/components/utils';
import type { DataContext } from '@/components/types';

describe('generateSlotId', () => {
  it('should return explicit slot-id if present', () => {
    const el = document.createElement('component-slot');
    el.setAttribute('slot-id', 'my-custom-id');
    el.setAttribute('type', 'List');
    el.setAttribute('data-source', 'music::tracks');

    expect(generateSlotId(el)).toBe('my-custom-id');
  });

  it('should generate id from type and data-source', () => {
    const el = document.createElement('component-slot');
    el.setAttribute('type', 'List');
    el.setAttribute('data-source', 'music::tracks');

    expect(generateSlotId(el)).toBe('List::music::tracks');
  });

  it('should handle missing type', () => {
    const el = document.createElement('component-slot');
    el.setAttribute('data-source', 'music::tracks');

    expect(generateSlotId(el)).toBe('unknown::music::tracks');
  });

  it('should handle missing data-source', () => {
    const el = document.createElement('component-slot');
    el.setAttribute('type', 'Chart');

    expect(generateSlotId(el)).toBe('Chart::');
  });
});

describe('resolveDataSource', () => {
  const mockContext: DataContext = {
    music: {
      tracks: [
        { id: '1', title: 'Song A' },
        { id: '2', title: 'Song B' },
      ],
      count: 42,
    },
    user: {
      profile: {
        name: 'John',
        email: 'john@example.com',
      },
    },
  };

  it('should resolve array data', () => {
    const result = resolveDataSource(mockContext, 'music::tracks');

    expect(result).toEqual([
      { id: '1', title: 'Song A' },
      { id: '2', title: 'Song B' },
    ]);
  });

  it('should resolve object data', () => {
    const result = resolveDataSource(mockContext, 'user::profile');

    expect(result).toEqual({
      name: 'John',
      email: 'john@example.com',
    });
  });

  it('should return null for primitive values', () => {
    const result = resolveDataSource(mockContext, 'music::count');

    expect(result).toBeNull();
  });

  it('should return null for null dataSource', () => {
    expect(resolveDataSource(mockContext, null)).toBeNull();
  });

  it('should return null for invalid format', () => {
    expect(resolveDataSource(mockContext, 'invalid')).toBeNull();
    expect(resolveDataSource(mockContext, 'too::many::parts')).toBeNull();
  });

  it('should return null for missing namespace', () => {
    expect(resolveDataSource(mockContext, 'unknown::key')).toBeNull();
  });

  it('should return null for missing key', () => {
    expect(resolveDataSource(mockContext, 'music::unknown')).toBeNull();
  });
});

describe('parseConfig', () => {
  it('should parse valid JSON config', () => {
    const config = '{"template": {"primary": "title"}, "columns": 3}';
    const result = parseConfig(config);

    expect(result).toEqual({
      template: { primary: 'title' },
      columns: 3,
    });
  });

  it('should return empty object for null', () => {
    expect(parseConfig(null)).toEqual({});
  });

  it('should return empty object for empty string', () => {
    expect(parseConfig('')).toEqual({});
  });

  it('should return empty object for invalid JSON', () => {
    expect(parseConfig('not json')).toEqual({});
    expect(parseConfig('{invalid}')).toEqual({});
  });

  it('should parse empty object config', () => {
    expect(parseConfig('{}')).toEqual({});
  });
});
