import { describe, it, expect } from 'vitest';
import { parse, parseDate, parseDuration, parseSpan, scan } from '../src';

describe('timelang setup', () => {
  it('should export parse function', () => {
    expect(typeof parse).toBe('function');
  });

  it('should export parseDate function', () => {
    expect(typeof parseDate).toBe('function');
  });

  it('should export parseDuration function', () => {
    expect(typeof parseDuration).toBe('function');
  });

  it('should export parseSpan function', () => {
    expect(typeof parseSpan).toBe('function');
  });

  it('should export scan function', () => {
    expect(typeof scan).toBe('function');
  });

  it('parse should return null for unimplemented input', () => {
    expect(parse('test')).toBe(null);
  });
});
