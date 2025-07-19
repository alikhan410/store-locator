import { describe, it, expect } from 'vitest';
import { states } from '../../../app/helper/states';

describe('States Helper', () => {
  it('should export an array of state objects', () => {
    expect(Array.isArray(states)).toBe(true);
    expect(states.length).toBeGreaterThan(0);
  });

  it('should have correct structure for each state', () => {
    states.forEach(state => {
      expect(state).toHaveProperty('label');
      expect(state).toHaveProperty('value');
      expect(typeof state.label).toBe('string');
      expect(typeof state.value).toBe('string');
      expect(state.label.length).toBe(2);
      expect(state.value.length).toBe(2);
    });
  });

  it('should contain all 50 US states', () => {
    expect(states).toHaveLength(50);
  });

  it('should contain specific states', () => {
    const stateValues = states.map(state => state.value);
    expect(stateValues).toContain('CA');
    expect(stateValues).toContain('NY');
    expect(stateValues).toContain('TX');
    expect(stateValues).toContain('FL');
    expect(stateValues).toContain('WA');
  });

  it('should have unique state codes', () => {
    const stateValues = states.map(state => state.value);
    const uniqueValues = [...new Set(stateValues)];
    expect(uniqueValues).toHaveLength(50);
  });

  it('should have label and value as the same for each state', () => {
    states.forEach(state => {
      expect(state.label).toBe(state.value);
    });
  });
}); 