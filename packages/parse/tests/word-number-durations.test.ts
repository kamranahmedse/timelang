import { describe, it, expect } from 'vitest';
import { parse, parseDuration, scan } from '../src/index';

const referenceDate = new Date('2025-01-15T12:00:00.000Z');

describe('Word Number Durations', () => {
  describe('Singular unit with word number', () => {
    it('should parse "five year" (singular) as 5 years', () => {
      const result = parseDuration('five year', { referenceDate });
      expect(result).not.toBeNull();
      expect(result).toBe(5 * 365 * 24 * 60 * 60 * 1000);
    });

    it('should parse "four year" (singular) as 4 years', () => {
      const result = parseDuration('four year', { referenceDate });
      expect(result).not.toBeNull();
      expect(result).toBe(4 * 365 * 24 * 60 * 60 * 1000);
    });

    it('should parse "one week" as 1 week', () => {
      const result = parseDuration('one week', { referenceDate });
      expect(result).not.toBeNull();
      expect(result).toBe(7 * 24 * 60 * 60 * 1000);
    });

    it('should parse "two month" (singular) as 2 months', () => {
      const result = parseDuration('two month', { referenceDate });
      expect(result).not.toBeNull();
      expect(result).toBe(2 * 30 * 24 * 60 * 60 * 1000);
    });
  });

  describe('Higher word numbers', () => {
    it('should parse "twenty-one days" as 21 days', () => {
      const result = parseDuration('twenty-one days', { referenceDate });
      expect(result).not.toBeNull();
      expect(result).toBe(21 * 24 * 60 * 60 * 1000);
    });

    it('should parse "twenty-four hours" as 24 hours', () => {
      const result = parseDuration('twenty-four hours', { referenceDate });
      expect(result).not.toBeNull();
      expect(result).toBe(24 * 60 * 60 * 1000);
    });

    it('should parse "twenty four hours" (without hyphen) as 24 hours', () => {
      const result = parseDuration('twenty four hours', { referenceDate });
      expect(result).not.toBeNull();
      expect(result).toBe(24 * 60 * 60 * 1000);
    });

    it('should parse "thirty days" as 30 days', () => {
      const result = parseDuration('thirty days', { referenceDate });
      expect(result).not.toBeNull();
      expect(result).toBe(30 * 24 * 60 * 60 * 1000);
    });

    it('should parse "forty years" as 40 years', () => {
      const result = parseDuration('forty years', { referenceDate });
      expect(result).not.toBeNull();
      expect(result).toBe(40 * 365 * 24 * 60 * 60 * 1000);
    });

    it('should parse "fifty minutes" as 50 minutes', () => {
      const result = parseDuration('fifty minutes', { referenceDate });
      expect(result).not.toBeNull();
      expect(result).toBe(50 * 60 * 1000);
    });

    it('should parse "sixty seconds" as 60 seconds', () => {
      const result = parseDuration('sixty seconds', { referenceDate });
      expect(result).not.toBeNull();
      expect(result).toBe(60 * 1000);
    });

    it('should parse "ninety days" as 90 days', () => {
      const result = parseDuration('ninety days', { referenceDate });
      expect(result).not.toBeNull();
      expect(result).toBe(90 * 24 * 60 * 60 * 1000);
    });

    it('should parse "hundred days" as 100 days', () => {
      const result = parseDuration('hundred days', { referenceDate });
      expect(result).not.toBeNull();
      expect(result).toBe(100 * 24 * 60 * 60 * 1000);
    });
  });

  describe('Couple patterns', () => {
    it('should parse "a couple of years" as 2 years', () => {
      const result = parseDuration('a couple of years', { referenceDate });
      expect(result).not.toBeNull();
      expect(result).toBe(2 * 365 * 24 * 60 * 60 * 1000);
    });

    it('should parse "couple of days" as 2 days', () => {
      const result = parseDuration('couple of days', { referenceDate });
      expect(result).not.toBeNull();
      expect(result).toBe(2 * 24 * 60 * 60 * 1000);
    });

    it('should parse "a couple weeks" (without of) as 2 weeks', () => {
      const result = parseDuration('a couple weeks', { referenceDate });
      expect(result).not.toBeNull();
      expect(result).toBe(2 * 7 * 24 * 60 * 60 * 1000);
    });

    it('should parse "couple hours" as 2 hours', () => {
      const result = parseDuration('couple hours', { referenceDate });
      expect(result).not.toBeNull();
      expect(result).toBe(2 * 60 * 60 * 1000);
    });
  });

  describe('Complex duration patterns', () => {
    it('should parse "the last twenty four hours" in prose', () => {
      const results = scan('the last twenty four hours', { referenceDate });
      expect(results.length).toBeGreaterThan(0);
      const match = results.find((r) => r.result.type === 'span' || r.result.type === 'duration');
      expect(match).toBeDefined();
    });

    it('should parse "ten years" as duration', () => {
      const result = parseDuration('ten years', { referenceDate });
      expect(result).not.toBeNull();
      expect(result).toBe(10 * 365 * 24 * 60 * 60 * 1000);
    });
  });
});

describe('Now/Present Reference', () => {
  it('should parse "now" as a date', () => {
    const result = parse('now', { referenceDate });
    expect(result).not.toBeNull();
    expect(result?.type).toBe('date');
  });

  it('should extract "now" from prose', () => {
    const results = scan('I need this now', { referenceDate });
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.match.toLowerCase() === 'now')).toBe(true);
  });

  it('should extract "Now" (capitalized) from prose', () => {
    const results = scan('Now is the time', { referenceDate });
    expect(results.length).toBeGreaterThan(0);
  });
});
