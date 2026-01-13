import { describe, it, expect } from 'vitest';
import { parse } from '../src/index';

const referenceDate = new Date('2025-01-15T12:00:00.000Z'); // Wednesday

describe('Day with Time Range', () => {
  describe('tomorrow with time range', () => {
    it('should parse "tomorrow between 5pm and 6pm"', () => {
      const result = parse('tomorrow between 5pm and 6pm', { referenceDate });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('span');
      if (result?.type === 'span') {
        expect(result.start.getUTCDate()).toBe(16);
        expect(result.start.getUTCHours()).toBe(17);
        expect(result.end.getUTCHours()).toBe(18);
      }
    });

    it('should parse "tomorrow from 5pm to 6pm"', () => {
      const result = parse('tomorrow from 5pm to 6pm', { referenceDate });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('span');
      if (result?.type === 'span') {
        expect(result.start.getUTCDate()).toBe(16);
        expect(result.start.getUTCHours()).toBe(17);
        expect(result.end.getUTCHours()).toBe(18);
      }
    });

    it('should parse "tomorrow 5pm-6pm"', () => {
      const result = parse('tomorrow 5pm-6pm', { referenceDate });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('span');
      if (result?.type === 'span') {
        expect(result.start.getUTCDate()).toBe(16);
        expect(result.start.getUTCHours()).toBe(17);
        expect(result.end.getUTCHours()).toBe(18);
      }
    });
  });

  describe('next weekday with time range', () => {
    it('should parse "next monday between 5pm and 6pm"', () => {
      const result = parse('next monday between 5pm and 6pm', { referenceDate });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('span');
      if (result?.type === 'span') {
        expect(result.start.getUTCDate()).toBe(20); // Next Monday is Jan 20
        expect(result.start.getUTCHours()).toBe(17);
        expect(result.end.getUTCHours()).toBe(18);
      }
    });

    it('should parse "next monday from 5pm to 6pm"', () => {
      const result = parse('next monday from 5pm to 6pm', { referenceDate });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('span');
      if (result?.type === 'span') {
        expect(result.start.getUTCDate()).toBe(20);
        expect(result.start.getUTCHours()).toBe(17);
        expect(result.end.getUTCHours()).toBe(18);
      }
    });

    it('should parse "friday between 2pm and 4pm"', () => {
      const result = parse('friday between 2pm and 4pm', { referenceDate });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('span');
      if (result?.type === 'span') {
        expect(result.start.getUTCDate()).toBe(17); // Friday is Jan 17
        expect(result.start.getUTCHours()).toBe(14);
        expect(result.end.getUTCHours()).toBe(16);
      }
    });
  });

  describe('today with time range', () => {
    it('should parse "today between 3pm and 5pm"', () => {
      const result = parse('today between 3pm and 5pm', { referenceDate });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('span');
      if (result?.type === 'span') {
        expect(result.start.getUTCDate()).toBe(15);
        expect(result.start.getUTCHours()).toBe(15);
        expect(result.end.getUTCHours()).toBe(17);
      }
    });

    it('should parse "today from 9am to 10am"', () => {
      const result = parse('today from 9am to 10am', { referenceDate });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('span');
      if (result?.type === 'span') {
        expect(result.start.getUTCDate()).toBe(15);
        expect(result.start.getUTCHours()).toBe(9);
        expect(result.end.getUTCHours()).toBe(10);
      }
    });
  });
});
