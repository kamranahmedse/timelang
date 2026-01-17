import { describe, it, expect } from 'vitest';
import { scan, parse } from '../src/index';

const referenceDate = new Date('2025-01-15T12:00:00.000Z');

describe('Prose Extraction', () => {
  describe('Word number + unit scanning', () => {
    it('should scan "five year" in prose', () => {
      const result = scan('stocks hit a five year low', { referenceDate });
      expect(result.length).toBeGreaterThan(0);
      expect(result.some((m) => m.match === 'five year')).toBe(true);
    });

    it('should scan "four year" in prose', () => {
      const result = scan('In the Philippines, a four year low', { referenceDate });
      expect(result.length).toBeGreaterThan(0);
      expect(result.some((m) => m.match === 'four year')).toBe(true);
    });

    it('should scan "ten years" in prose', () => {
      const result = scan('after ten years of boom', { referenceDate });
      expect(result.length).toBeGreaterThan(0);
      expect(result.some((m) => m.match === 'ten years')).toBe(true);
    });
  });

  describe('Couple patterns scanning', () => {
    it('should scan "a couple of years" in prose', () => {
      const result = scan("it's not going to change for a couple of years", { referenceDate });
      expect(result.length).toBeGreaterThan(0);
      expect(result.some((m) => m.match === 'a couple of years')).toBe(true);
    });
  });

  describe('Standalone year scanning', () => {
    it('should scan "2000" in prose', () => {
      const result = scan('by the opening of the 2000 Olympics', { referenceDate });
      expect(result.length).toBeGreaterThan(0);
      expect(result.some((m) => m.match === '2000')).toBe(true);
    });

    it('should scan "1996" in prose', () => {
      const result = scan('his unsuccessful 1996 campaign', { referenceDate });
      expect(result.length).toBeGreaterThan(0);
      expect(result.some((m) => m.match === '1996')).toBe(true);
    });

    it('should scan "1901" in prose', () => {
      const result = scan('Australia has been independent since 1901', { referenceDate });
      expect(result.length).toBeGreaterThan(0);
      expect(result.some((m) => m.match === '1901')).toBe(true);
    });
  });

  describe('Large number durations scanning', () => {
    it('should scan "210 years" in prose', () => {
      const result = scan('Turning its back on 210 years of loyalty', { referenceDate });
      expect(result.length).toBeGreaterThan(0);
      expect(result.some((m) => m.match === '210 years')).toBe(true);
    });

    it('should scan "almost a hundred years" in prose', () => {
      const result = scan('as it has for almost a hundred years', { referenceDate });
      expect(result.length).toBeGreaterThan(0);
    });
  });
});

describe('Date Resolution', () => {
  describe('Month-only dates', () => {
    it('should resolve October in January to previous year', () => {
      const result = parse('October', { referenceDate });
      expect(result).not.toBeNull();
      if (result && result.type === 'date') {
        expect(result.date.getUTCFullYear()).toBe(2024);
        expect(result.date.getUTCMonth()).toBe(9);
      }
    });

    it('should resolve March in January to same year', () => {
      const result = parse('March', { referenceDate });
      expect(result).not.toBeNull();
      if (result && result.type === 'date') {
        expect(result.date.getUTCFullYear()).toBe(2025);
        expect(result.date.getUTCMonth()).toBe(2);
      }
    });
  });

  describe('Year-only dates', () => {
    it('should parse standalone year', () => {
      const result = parse('2000', { referenceDate });
      expect(result).not.toBeNull();
      if (result && result.type === 'date') {
        expect(result.date.getUTCFullYear()).toBe(2000);
      }
    });

    it('should resolve next year correctly', () => {
      const result = parse('next year', { referenceDate });
      expect(result).not.toBeNull();
      if (result && result.type === 'date') {
        expect(result.date.getUTCFullYear()).toBe(2026);
      }
    });

    it('should resolve last year correctly', () => {
      const result = parse('last year', { referenceDate });
      expect(result).not.toBeNull();
      if (result && result.type === 'date') {
        expect(result.date.getUTCFullYear()).toBe(2024);
      }
    });
  });

  describe('Weekday resolution', () => {
    it('Wednesday on Wednesday should be today', () => {
      const result = parse('Wednesday', { referenceDate });
      expect(result).not.toBeNull();
      if (result && result.type === 'date') {
        expect(result.date.getUTCFullYear()).toBe(2025);
        expect(result.date.getUTCMonth()).toBe(0);
        expect(result.date.getUTCDate()).toBe(15);
      }
    });

    it('Thursday on Wednesday should be next Thursday', () => {
      const result = parse('Thursday', { referenceDate });
      expect(result).not.toBeNull();
      if (result && result.type === 'date') {
        expect(result.date.getUTCFullYear()).toBe(2025);
        expect(result.date.getUTCMonth()).toBe(0);
        expect(result.date.getUTCDate()).toBe(16);
      }
    });
  });
});
