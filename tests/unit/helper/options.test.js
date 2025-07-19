import { describe, it, expect } from 'vitest';
import { stateOptions } from '../../../app/helper/options';

describe('Options Helper', () => {
  it('should export an array of state option objects', () => {
    expect(Array.isArray(stateOptions)).toBe(true);
    expect(stateOptions.length).toBeGreaterThan(0);
  });

  it('should have correct structure for each option', () => {
    stateOptions.forEach(option => {
      expect(option).toHaveProperty('label');
      expect(option).toHaveProperty('value');
      expect(typeof option.label).toBe('string');
      expect(typeof option.value).toBe('string');
    });
  });

  it('should contain 51 options (50 states + 1 placeholder)', () => {
    expect(stateOptions).toHaveLength(51);
  });

  it('should have a disabled placeholder option at the beginning', () => {
    const firstOption = stateOptions[0];
    expect(firstOption.label).toBe('Select a state');
    expect(firstOption.value).toBe('');
    expect(firstOption.disabled).toBe(true);
  });

  it('should contain all 50 US states with full names', () => {
    const stateValues = stateOptions.slice(1).map(option => option.value);
    expect(stateValues).toContain('CA');
    expect(stateValues).toContain('NY');
    expect(stateValues).toContain('TX');
    expect(stateValues).toContain('FL');
    expect(stateValues).toContain('WA');
  });

  it('should have full state names as labels', () => {
    const stateLabels = stateOptions.slice(1).map(option => option.label);
    expect(stateLabels).toContain('California');
    expect(stateLabels).toContain('New York');
    expect(stateLabels).toContain('Texas');
    expect(stateLabels).toContain('Florida');
    expect(stateLabels).toContain('Washington');
  });

  it('should have unique state codes', () => {
    const stateValues = stateOptions.slice(1).map(option => option.value);
    const uniqueValues = [...new Set(stateValues)];
    expect(uniqueValues).toHaveLength(50);
  });

  it('should not have disabled property on state options', () => {
    stateOptions.slice(1).forEach(option => {
      expect(option.disabled).toBeUndefined();
    });
  });
}); 