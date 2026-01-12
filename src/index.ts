// timelang - Natural language time expression parser

export interface DateResult {
  type: 'date';
  date: Date;
  title: string | null;
}

export interface DurationResult {
  type: 'duration';
  duration: number;
  title: string | null;
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

export type ParseResult = DateResult | DurationResult | SpanResult | FuzzyResult;

export interface ParseOptions {
  referenceDate?: Date;
  fiscalYearStart?: 'january' | 'april' | 'july' | 'october';
  weekStartsOn?: 'sunday' | 'monday';
  dateFormat?: 'us' | 'intl' | 'auto';
}

import { parseInternal, extractInternal } from './parser.js';

export function parse(input: string, options?: ParseOptions): ParseResult | null {
  return parseInternal(input, options);
}

export function parseDate(input: string, options?: ParseOptions): Date | null {
  const result = parse(input, options);
  if (result && result.type === 'date') {
    return result.date;
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
      duration: result.type === 'span' ? result.duration : result.end.getTime() - result.start.getTime(),
    };
  }
  return null;
}

export function extract(input: string, options?: ParseOptions): ParseResult[] {
  return extractInternal(input, options);
}
