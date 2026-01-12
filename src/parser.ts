// Parser implementation - converts grammar AST to result types
import nearley from 'nearley';
import grammar from './grammar.js';
import type { ParseResult, ParseOptions } from './index.js';

// Duration constants in milliseconds
const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = 60 * MS_PER_SECOND;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;
const MS_PER_WEEK = 7 * MS_PER_DAY;
const MS_PER_MONTH = 30 * MS_PER_DAY; // Approximate
const MS_PER_YEAR = 365 * MS_PER_DAY; // Approximate

// Weekday mapping (0 = Sunday)
const WEEKDAY_MAP: Record<string, number> = {
  sunday: 0, sun: 0,
  monday: 1, mon: 1,
  tuesday: 2, tue: 2, tues: 2,
  wednesday: 3, wed: 3,
  thursday: 4, thu: 4, thur: 4, thurs: 4,
  friday: 5, fri: 5,
  saturday: 6, sat: 6,
};

interface ASTNode {
  nodeType: string;
  [key: string]: any;
}

function getDefaultOptions(options?: ParseOptions): Required<ParseOptions> {
  return {
    referenceDate: options?.referenceDate ?? new Date(),
    fiscalYearStart: options?.fiscalYearStart ?? 'january',
    weekStartsOn: options?.weekStartsOn ?? 'sunday',
    dateFormat: options?.dateFormat ?? 'intl',
  };
}

function durationToMs(value: number, unit: string): number {
  switch (unit) {
    case 'second':
    case 'seconds':
    case 'sec':
    case 'secs':
    case 's':
      return value * MS_PER_SECOND;
    case 'minute':
    case 'minutes':
    case 'min':
    case 'mins':
      return value * MS_PER_MINUTE;
    case 'hour':
    case 'hours':
    case 'hr':
    case 'hrs':
    case 'h':
      return value * MS_PER_HOUR;
    case 'day':
    case 'days':
    case 'd':
      return value * MS_PER_DAY;
    case 'week':
    case 'weeks':
    case 'wk':
    case 'wks':
    case 'w':
      return value * MS_PER_WEEK;
    case 'month':
    case 'months':
    case 'mo':
    case 'mos':
      return value * MS_PER_MONTH;
    case 'year':
    case 'years':
    case 'yr':
    case 'yrs':
    case 'y':
      return value * MS_PER_YEAR;
    default:
      return value * MS_PER_DAY;
  }
}

function getNextWeekday(weekday: number, referenceDate: Date): Date {
  const result = new Date(referenceDate);
  const currentDay = result.getUTCDay();
  let daysToAdd = weekday - currentDay;
  if (daysToAdd <= 0) {
    daysToAdd += 7;
  }
  result.setUTCDate(result.getUTCDate() + daysToAdd);
  return result;
}

function getLastWeekday(weekday: number, referenceDate: Date): Date {
  const result = new Date(referenceDate);
  const currentDay = result.getUTCDay();
  let daysToSubtract = currentDay - weekday;
  if (daysToSubtract <= 0) {
    daysToSubtract += 7;
  }
  result.setUTCDate(result.getUTCDate() - daysToSubtract);
  return result;
}

function getThisWeekday(weekday: number, referenceDate: Date, weekStartsOn: 'sunday' | 'monday'): Date {
  const result = new Date(referenceDate);
  const currentDay = result.getUTCDay();
  const weekStart = weekStartsOn === 'monday' ? 1 : 0;

  // Calculate days since start of week
  let daysSinceWeekStart = currentDay - weekStart;
  if (daysSinceWeekStart < 0) {
    daysSinceWeekStart += 7;
  }

  // Calculate days to target weekday from start of week
  let daysToTarget = weekday - weekStart;
  if (daysToTarget < 0) {
    daysToTarget += 7;
  }

  // Calculate actual date
  const daysToMove = daysToTarget - daysSinceWeekStart;
  result.setUTCDate(result.getUTCDate() + daysToMove);
  return result;
}

function getQuarterDates(quarter: number, year: number, fiscalYearStart: string): { start: Date; end: Date } {
  const fiscalStartMonth = {
    january: 0, april: 3, july: 6, october: 9,
  }[fiscalYearStart] ?? 0;

  const quarterStartMonth = (fiscalStartMonth + (quarter - 1) * 3) % 12;
  let startYear = year;
  if (quarterStartMonth < fiscalStartMonth) {
    startYear++;
  }

  const start = new Date(Date.UTC(startYear, quarterStartMonth, 1));
  const endMonth = (quarterStartMonth + 3) % 12;
  let endYear = startYear;
  if (endMonth < quarterStartMonth) {
    endYear++;
  }
  const end = new Date(Date.UTC(endYear, endMonth, 0)); // Last day of previous month

  return { start, end };
}

function getHalfDates(half: number, year: number, fiscalYearStart: string): { start: Date; end: Date } {
  const fiscalStartMonth = {
    january: 0, april: 3, july: 6, october: 9,
  }[fiscalYearStart] ?? 0;

  const halfStartMonth = (fiscalStartMonth + (half - 1) * 6) % 12;
  let startYear = year;
  if (halfStartMonth < fiscalStartMonth) {
    startYear++;
  }

  const start = new Date(Date.UTC(startYear, halfStartMonth, 1));
  const endMonth = (halfStartMonth + 6) % 12;
  let endYear = startYear;
  if (endMonth < halfStartMonth || endMonth === halfStartMonth) {
    endYear++;
  }
  const end = new Date(Date.UTC(endYear, endMonth, 0));

  return { start, end };
}

function getSeasonDates(season: string, year: number): { start: Date; end: Date } {
  // Northern hemisphere seasons
  switch (season) {
    case 'spring':
      return {
        start: new Date(Date.UTC(year, 2, 20)), // March 20
        end: new Date(Date.UTC(year, 5, 20)),   // June 20
      };
    case 'summer':
      return {
        start: new Date(Date.UTC(year, 5, 21)), // June 21
        end: new Date(Date.UTC(year, 8, 22)),   // September 22
      };
    case 'fall':
    case 'autumn':
      return {
        start: new Date(Date.UTC(year, 8, 23)),  // September 23
        end: new Date(Date.UTC(year, 11, 20)),   // December 20
      };
    case 'winter':
      return {
        start: new Date(Date.UTC(year, 11, 21)), // December 21
        end: new Date(Date.UTC(year + 1, 2, 19)), // March 19 next year
      };
    default:
      return {
        start: new Date(Date.UTC(year, 0, 1)),
        end: new Date(Date.UTC(year, 11, 31)),
      };
  }
}

function getModifiedPeriod(
  start: Date,
  end: Date,
  modifier: string
): { start: Date; end: Date } {
  const duration = end.getTime() - start.getTime();
  const third = duration / 3;
  const half = duration / 2;

  switch (modifier) {
    case 'early':
    case 'beginning':
    case 'start':
      return {
        start,
        end: new Date(start.getTime() + third),
      };
    case 'mid':
    case 'middle':
      return {
        start: new Date(start.getTime() + third),
        end: new Date(start.getTime() + 2 * third),
      };
    case 'late':
    case 'end':
      return {
        start: new Date(start.getTime() + 2 * third),
        end,
      };
    case 'first':
      return {
        start,
        end: new Date(start.getTime() + half),
      };
    case 'second':
      return {
        start: new Date(start.getTime() + half),
        end,
      };
    default:
      return { start, end };
  }
}

function convertDateNode(node: ASTNode, opts: Required<ParseOptions>): Date {
  const ref = opts.referenceDate;

  // Special days
  if (node.special) {
    switch (node.special) {
      case 'today':
        return new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate()));
      case 'tomorrow':
        return new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate() + 1));
      case 'yesterday':
        return new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate() - 1));
      case 'now':
        return new Date(ref);
      default:
        return new Date(ref);
    }
  }

  // Weekday
  if (node.weekday) {
    const weekdayNum = WEEKDAY_MAP[node.weekday.toLowerCase()] ?? 0;
    switch (node.relative) {
      case 'next':
        return getNextWeekday(weekdayNum, ref);
      case 'last':
        return getLastWeekday(weekdayNum, ref);
      case 'this':
        return getThisWeekday(weekdayNum, ref, opts.weekStartsOn);
      default:
        // Bare weekday - default to next occurrence
        return getNextWeekday(weekdayNum, ref);
    }
  }

  // Month + day (+ optional year)
  if (node.month !== undefined && node.day !== undefined) {
    const year = node.year ?? ref.getUTCFullYear();
    const month = typeof node.month === 'number' ? node.month - 1 : 0;
    const date = new Date(Date.UTC(year, month, node.day));

    // If no year specified and date is in the past, use next year
    if (node.year === undefined && date.getTime() < ref.getTime()) {
      date.setUTCFullYear(date.getUTCFullYear() + 1);
    }

    // Apply time if present
    if (node.time) {
      if (node.time.special === 'noon') {
        date.setUTCHours(12, 0, 0, 0);
      } else if (node.time.special === 'midnight') {
        date.setUTCHours(0, 0, 0, 0);
      } else if (node.time.hour !== undefined) {
        date.setUTCHours(node.time.hour, node.time.minute ?? 0, 0, 0);
      }
    }

    return date;
  }

  // Relative period (next/last/this week/month/year)
  if (node.relative && node.period) {
    const period = node.period.toLowerCase();
    let start: Date;

    switch (period) {
      case 'day':
        start = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate()));
        if (node.relative === 'next') {
          start.setUTCDate(start.getUTCDate() + 1);
        } else if (node.relative === 'last') {
          start.setUTCDate(start.getUTCDate() - 1);
        }
        return start;

      case 'week':
        start = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate()));
        const weekStart = opts.weekStartsOn === 'monday' ? 1 : 0;
        const currentDay = start.getUTCDay();
        const daysFromStart = (currentDay - weekStart + 7) % 7;
        start.setUTCDate(start.getUTCDate() - daysFromStart);
        if (node.relative === 'next') {
          start.setUTCDate(start.getUTCDate() + 7);
        } else if (node.relative === 'last') {
          start.setUTCDate(start.getUTCDate() - 7);
        }
        return start;

      case 'month':
        if (node.relative === 'next') {
          return new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() + 1, 1));
        } else if (node.relative === 'last') {
          return new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() - 1, 1));
        }
        return new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), 1));

      case 'year':
        if (node.relative === 'next') {
          return new Date(Date.UTC(ref.getUTCFullYear() + 1, 0, 1));
        } else if (node.relative === 'last') {
          return new Date(Date.UTC(ref.getUTCFullYear() - 1, 0, 1));
        }
        return new Date(Date.UTC(ref.getUTCFullYear(), 0, 1));

      default:
        return new Date(ref);
    }
  }

  return new Date(ref);
}

function convertDurationNode(node: ASTNode): number {
  if (node.combined && Array.isArray(node.combined)) {
    return node.combined.reduce((total: number, d: ASTNode) => total + convertDurationNode(d), 0);
  }
  return durationToMs(node.value, node.unit);
}

function convertFuzzyNode(node: ASTNode, opts: Required<ParseOptions>): { start: Date; end: Date } {
  const ref = opts.referenceDate;
  const year = node.year ?? ref.getUTCFullYear();

  if (node.period === 'quarter' && node.quarter) {
    const { start, end } = getQuarterDates(node.quarter, year, opts.fiscalYearStart);
    if (node.modifier) {
      return getModifiedPeriod(start, end, node.modifier);
    }
    return { start, end };
  }

  if (node.period === 'half' && node.half) {
    const { start, end } = getHalfDates(node.half, year, opts.fiscalYearStart);
    if (node.modifier) {
      return getModifiedPeriod(start, end, node.modifier);
    }
    return { start, end };
  }

  if (node.period === 'season' && node.season) {
    const { start, end } = getSeasonDates(node.season, year);
    if (node.modifier) {
      return getModifiedPeriod(start, end, node.modifier);
    }
    return { start, end };
  }

  if (node.period === 'month' && node.month !== undefined) {
    const month = typeof node.month === 'number' ? node.month - 1 : 0;
    const start = new Date(Date.UTC(year, month, 1));
    const end = new Date(Date.UTC(year, month + 1, 0)); // Last day of month
    if (node.modifier) {
      return getModifiedPeriod(start, end, node.modifier);
    }
    return { start, end };
  }

  if (node.period === 'year') {
    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year, 11, 31));
    if (node.modifier) {
      return getModifiedPeriod(start, end, node.modifier);
    }
    return { start, end };
  }

  // Default: current year
  return {
    start: new Date(Date.UTC(year, 0, 1)),
    end: new Date(Date.UTC(year, 11, 31)),
  };
}

function convertASTToResult(ast: ASTNode, opts: Required<ParseOptions>): ParseResult | null {
  if (!ast || !ast.nodeType) {
    return null;
  }

  let title: string | null = null;
  let expression = ast;

  // Handle titled expressions
  if (ast.nodeType === 'titled') {
    title = ast.title;
    expression = ast.expression;
  }

  switch (expression.nodeType) {
    case 'date': {
      const date = convertDateNode(expression, opts);
      return {
        type: 'date',
        date,
        title,
      };
    }

    case 'duration': {
      const duration = convertDurationNode(expression);
      return {
        type: 'duration',
        duration,
        title,
      };
    }

    case 'span': {
      let start: Date;
      if (expression.start.nodeType === 'date') {
        start = convertDateNode(expression.start, opts);
      } else if (expression.start.nodeType === 'fuzzy') {
        const fuzzy = convertFuzzyNode(expression.start, opts);
        start = fuzzy.start;
      } else {
        start = new Date(opts.referenceDate);
      }

      let duration = 0;
      if (expression.duration) {
        duration = convertDurationNode(expression.duration);
      }

      const end = new Date(start.getTime() + duration);

      return {
        type: 'span',
        start,
        end,
        duration,
        title,
      };
    }

    case 'range': {
      let start: Date;
      let end: Date;

      if (expression.start.nodeType === 'date') {
        start = convertDateNode(expression.start, opts);
      } else if (expression.start.nodeType === 'fuzzy') {
        const fuzzy = convertFuzzyNode(expression.start, opts);
        start = fuzzy.start;
      } else {
        start = new Date(opts.referenceDate);
      }

      if (expression.end.nodeType === 'date') {
        end = convertDateNode(expression.end, opts);
      } else if (expression.end.nodeType === 'fuzzy') {
        const fuzzy = convertFuzzyNode(expression.end, opts);
        end = fuzzy.end;
      } else {
        end = new Date(opts.referenceDate);
      }

      const duration = end.getTime() - start.getTime();

      return {
        type: 'span',
        start,
        end,
        duration,
        title,
      };
    }

    case 'fuzzy': {
      const { start, end } = convertFuzzyNode(expression, opts);
      return {
        type: 'fuzzy',
        start,
        end,
        approximate: true,
        title,
      };
    }

    case 'relative': {
      const duration = convertDurationNode(expression.duration);
      const ref = opts.referenceDate;

      let start: Date;
      let end: Date;

      if (expression.direction === 'past') {
        end = new Date(ref);
        start = new Date(ref.getTime() - duration);
      } else {
        start = new Date(ref);
        end = new Date(ref.getTime() + duration);
      }

      return {
        type: 'span',
        start,
        end,
        duration,
        title,
      };
    }

    default:
      return null;
  }
}

export function parseInternal(input: string, options?: ParseOptions): ParseResult | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  // Normalize input
  const normalized = input.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!normalized) {
    return null;
  }

  const opts = getDefaultOptions(options);

  try {
    const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
    parser.feed(normalized);

    if (parser.results.length === 0) {
      return null;
    }

    // Pick the first result (they should be equivalent for our grammar)
    const ast = parser.results[0];
    return convertASTToResult(ast, opts);
  } catch {
    return null;
  }
}

export function extractInternal(input: string, options?: ParseOptions): ParseResult[] {
  if (!input || typeof input !== 'string') {
    return [];
  }

  // Split by separators: comma, semicolon, newline, " and " (but not "and" in titles)
  const segments = input
    .split(/[,;\n]|\s+and\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const results: ParseResult[] = [];

  for (const segment of segments) {
    const result = parseInternal(segment, options);
    if (result) {
      results.push(result);
    }
  }

  return results;
}
