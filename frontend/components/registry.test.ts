import { COMPONENT_REGISTRY } from './registry';

describe('COMPONENT_REGISTRY', () => {
  const expectedComponents = ['List', 'Card', 'Chart', 'Grid', 'Timeline'];

  it('contains all expected components', () => {
    expectedComponents.forEach((name) => {
      expect(COMPONENT_REGISTRY[name]).toBeDefined();
      expect(typeof COMPONENT_REGISTRY[name]).toBe('function');
    });
  });

  it('has no extra components', () => {
    expect(Object.keys(COMPONENT_REGISTRY)).toHaveLength(expectedComponents.length);
  });
});
