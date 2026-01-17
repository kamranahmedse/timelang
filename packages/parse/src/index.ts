import { parseInternal, scanInternal } from './parser';
import type { ScanMatch } from './parser';

export type { ScanMatch };

export interface DateResult {
  type: 'date';
  date: Date;
  title: string | null;
}

export interface DurationResult {
  type: 'duration';
  duration: number;
  title: string | null;
  approximate?: boolean;
}

export interface SpanResult {
  type: 'span';
  start: Date;
  end: Date;
  duration: number;
  title: string | null;
}

export interface FuzzyResult {
  type: 'fuzzy';
  start: Date;
  end: Date;
  approximate: true;
  title: string | null;
}

export type ParseResult = DateResult | DurationResult | SpanResult | FuzzyResult | null;

export interface ParseOptions {
  referenceDate?: Date;
  fiscalYearStart?: 'january' | 'april' | 'july' | 'october';
  weekStartsOn?: 'sunday' | 'monday';
  dateFormat?: 'us' | 'intl' | 'auto';
}

export function parse(input: string, options?: ParseOptions): ParseResult | null {
  return parseInternal(input, options);
}

export function parseDate(input: string, options?: ParseOptions): Date | null {
  const result = parse(input, options);
  if (!result) {
    return null;
  }

  if (result.type === 'date') {
    return result.date;
  }

  if (result.type === 'duration') {
    const ref = options?.referenceDate ?? new Date();
    return new Date(ref.getTime() + result.duration);
  }

  if (result.type === 'fuzzy') {
    return result.start;
  }

  return null;
}

export function parseDuration(input: string, options?: ParseOptions): number | null {
  const result = parse(input, options);
  if (result && result.type === 'duration') {
    return result.duration;
  }
  return null;
}

export function parseSpan(
  input: string,
  options?: ParseOptions
): { start: Date; end: Date; duration: number } | null {
  const result = parse(input, options);
  if (result && (result.type === 'span' || result.type === 'fuzzy')) {
    return {
      start: result.start,
      end: result.end,
      duration:
        result.type === 'span'
          ? result.duration
          : result.end.getTime() - result.start.getTime(),
    };
  }
  return null;
}

export function scan(input: string, options?: ParseOptions): ScanMatch[] {
  return scanInternal(input, options);
}
