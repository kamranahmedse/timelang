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
  const result = new Date(Date.UTC(
    referenceDate.getUTCFullYear(),
    referenceDate.getUTCMonth(),
    referenceDate.getUTCDate()
  ));
  const currentDay = result.getUTCDay();
  let daysToAdd = weekday - currentDay;
  if (daysToAdd <= 0) {
    daysToAdd += 7;
  }
  result.setUTCDate(result.getUTCDate() + daysToAdd);
  return result;
}

function getLastWeekday(weekday: number, referenceDate: Date): Date {
  const result = new Date(Date.UTC(
    referenceDate.getUTCFullYear(),
    referenceDate.getUTCMonth(),
    referenceDate.getUTCDate()
  ));
  const currentDay = result.getUTCDay();
  let daysToSubtract = currentDay - weekday;
  if (daysToSubtract <= 0) {
    daysToSubtract += 7;
  }
  result.setUTCDate(result.getUTCDate() - daysToSubtract);
  return result;
}

function getThisWeekday(weekday: number, referenceDate: Date, weekStartsOn: 'sunday' | 'monday'): Date {
  const result = new Date(Date.UTC(
    referenceDate.getUTCFullYear(),
    referenceDate.getUTCMonth(),
    referenceDate.getUTCDate()
  ));
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
    let date: Date;
    switch (node.special) {
      case 'today':
        date = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate()));
        break;
      case 'tomorrow':
        date = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate() + 1));
        break;
      case 'yesterday':
        date = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate() - 1));
        break;
      case 'now':
        date = new Date(ref);
        break;
      case 'dayAfterTomorrow':
        date = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate() + 2));
        break;
      case 'dayBeforeYesterday':
        date = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate() - 2));
        break;
      default:
        date = new Date(ref);
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

  // Time only (for time ranges like "9am to 5pm")
  if (node.timeOnly && node.time) {
    const date = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate()));
    if (node.time.special === 'noon') {
      date.setUTCHours(12, 0, 0, 0);
    } else if (node.time.special === 'midnight') {
      date.setUTCHours(0, 0, 0, 0);
    } else if (node.time.hour !== undefined) {
      date.setUTCHours(node.time.hour, node.time.minute ?? 0, 0, 0);
    }
    return date;
  }

  // Weekday (potentially with relative period like "next week monday")
  if (node.weekday) {
    const weekdayNum = WEEKDAY_MAP[node.weekday.toLowerCase()] ?? 0;
    let date: Date;

    // Handle complex patterns like "next week monday"
    if (node.period && node.period.toLowerCase() === 'week') {
      // "next week monday" - get the weekday in the next/last/this week
      let weekRef: Date;
      switch (node.relative) {
        case 'next':
          weekRef = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate() + 7));
          break;
        case 'last':
          weekRef = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate() - 7));
          break;
        default:
          weekRef = ref;
      }
      date = getThisWeekday(weekdayNum, weekRef, opts.weekStartsOn);
    } else {
      // Simple relative weekday or bare weekday
      switch (node.relative) {
        case 'next':
          date = getNextWeekday(weekdayNum, ref);
          break;
        case 'last':
          date = getLastWeekday(weekdayNum, ref);
          break;
        case 'this':
          date = getThisWeekday(weekdayNum, ref, opts.weekStartsOn);
          break;
        default:
          // Bare weekday - default to next occurrence
          date = getNextWeekday(weekdayNum, ref);
      }
    }

    // Apply time if present, otherwise keep midnight (00:00)
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

  // Date format with raw parts (for US/intl format handling)
  if (node.formatParts) {
    const parts = node.formatParts as number[];
    if (parts.length < 3 || parts[0] === undefined || parts[1] === undefined || parts[2] === undefined) {
      return ref;
    }
    const [p0, p1, p2] = parts;
    let year: number, month: number, day: number;

    if (p2 > 1000) {
      // Year is at the end: MM/DD/YYYY or DD/MM/YYYY
      if (opts.dateFormat === 'intl') {
        // DD/MM/YYYY (international)
        day = p0;
        month = p1;
        year = p2;
      } else {
        // MM/DD/YYYY (US, default), but check for unambiguous cases
        // If first number > 12, it can't be a month, so interpret as day
        if (p0 > 12 && p1 <= 12) {
          // Must be DD/MM/YYYY
          day = p0;
          month = p1;
          year = p2;
        } else {
          // Standard US format
          month = p0;
          day = p1;
          year = p2;
        }
      }
    } else {
      // Assume MM/DD/YY or similar
      month = p0;
      day = p1;
      year = p2 < 100 ? (p2 > 50 ? 1900 + p2 : 2000 + p2) : p2;
    }

    return new Date(Date.UTC(year, month - 1, day));
  }

  // Month + day (+ optional year)
  if (node.month !== undefined && node.day !== undefined) {
    let year = node.year ?? ref.getUTCFullYear();
    const month = typeof node.month === 'number' ? node.month - 1 : 0;

    // Handle relative month patterns ("last december", "next january")
    if (node.relativeMonth) {
      const currentMonth = ref.getUTCMonth();
      if (node.relativeMonth === 'last') {
        // "last december" in January means previous December
        if (month >= currentMonth) {
          year--;
        }
      } else if (node.relativeMonth === 'next') {
        // "next january" in November means upcoming January
        if (month <= currentMonth) {
          year++;
        }
      }
      // 'this' keeps current year
    } else if (node.year === undefined && month < ref.getUTCMonth()) {
      // If no year specified and the month is earlier than reference month, use next year
      // This handles year rollover for dates like "january 1" when reference is in November/December
      year++;
    }

    const date = new Date(Date.UTC(year, month, node.day));

    // Validate the date - if the day overflowed to next month, the input was invalid
    if (date.getUTCMonth() !== month || date.getUTCDate() !== node.day) {
      // Return a sentinel value or throw to indicate invalid date
      // This will be caught by the caller and result in null
      throw new Error('Invalid date');
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

function convertDurationNode(node: ASTNode, parentHasHours = false): number {
  if (node.combined && Array.isArray(node.combined)) {
    // Check if any part has hours - this affects 'm' interpretation
    const hasHours = node.combined.some((d: ASTNode) => d.unit === 'hour');
    return node.combined.reduce((total: number, d: ASTNode) => total + convertDurationNode(d, hasHours), 0);
  }
  // If combined with hours, treat 'month' as 'minute' (for patterns like "2h 30m")
  let unit = node.unit;
  if (parentHasHours && unit === 'month') {
    unit = 'minute';
  }
  return durationToMs(node.value, unit);
}

// Get period dates without applying modifier (used for start/end/beginning boundary extraction)
function convertFuzzyNodeWithoutModifier(node: ASTNode, opts: Required<ParseOptions>): { start: Date; end: Date } {
  const ref = opts.referenceDate;
  const year = node.year ?? ref.getUTCFullYear();

  if (node.period === 'quarter' && node.quarter) {
    return getQuarterDates(node.quarter, year, opts.fiscalYearStart);
  }

  if (node.period === 'half' && node.half) {
    return getHalfDates(node.half, year, opts.fiscalYearStart);
  }

  if (node.period === 'season' && node.season) {
    return getSeasonDates(node.season, year);
  }

  if (node.period === 'month' && node.month !== undefined) {
    const month = typeof node.month === 'number' ? node.month - 1 : 0;
    const start = new Date(Date.UTC(year, month, 1));
    const end = new Date(Date.UTC(year, month + 1, 0));
    return { start, end };
  }

  if (node.period === 'month') {
    const month = ref.getUTCMonth();
    const start = new Date(Date.UTC(year, month, 1));
    const end = new Date(Date.UTC(year, month + 1, 0));
    return { start, end };
  }

  if (node.period === 'week') {
    const weekStart = opts.weekStartsOn === 'monday' ? 1 : 0;
    const currentDay = ref.getUTCDay();
    const daysFromStart = (currentDay - weekStart + 7) % 7;
    const start = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate() - daysFromStart));
    const end = new Date(start.getTime() + 6 * MS_PER_DAY);
    return { start, end };
  }

  if (node.period === 'day') {
    const start = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate()));
    const end = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate(), 23, 59, 59, 999));
    return { start, end };
  }

  if (node.period === 'year') {
    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year, 11, 31));
    return { start, end };
  }

  return {
    start: new Date(Date.UTC(year, 0, 1)),
    end: new Date(Date.UTC(year, 11, 31)),
  };
}

function convertFuzzyNode(node: ASTNode, opts: Required<ParseOptions>): { start: Date; end: Date } {
  const ref = opts.referenceDate;
  const year = node.year ?? ref.getUTCFullYear();

  if (node.period === 'quarter' && node.quarter) {
    let targetYear = year;
    // If no explicit year and quarter is in the past, roll to next year
    if (node.year === undefined) {
      const { end: qEnd } = getQuarterDates(node.quarter, targetYear, opts.fiscalYearStart);
      if (qEnd < ref) {
        targetYear++;
      }
    }
    const { start, end } = getQuarterDates(node.quarter, targetYear, opts.fiscalYearStart);
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

  // Month with a specific month number
  if (node.period === 'month' && node.month !== undefined) {
    const month = typeof node.month === 'number' ? node.month - 1 : 0;
    const start = new Date(Date.UTC(year, month, 1));
    const end = new Date(Date.UTC(year, month + 1, 0)); // Last day of month
    if (node.modifier) {
      return getModifiedPeriod(start, end, node.modifier);
    }
    return { start, end };
  }

  // "month" without a specific month (uses current month)
  if (node.period === 'month') {
    const month = ref.getUTCMonth();
    const start = new Date(Date.UTC(year, month, 1));
    const end = new Date(Date.UTC(year, month + 1, 0));
    if (node.modifier) {
      return getModifiedPeriod(start, end, node.modifier);
    }
    return { start, end };
  }

  // "week" without a specific week (uses current week)
  if (node.period === 'week') {
    const weekStart = opts.weekStartsOn === 'monday' ? 1 : 0;
    const currentDay = ref.getUTCDay();
    const daysFromStart = (currentDay - weekStart + 7) % 7;
    const start = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate() - daysFromStart));
    const end = new Date(start.getTime() + 6 * MS_PER_DAY);
    if (node.modifier) {
      return getModifiedPeriod(start, end, node.modifier);
    }
    return { start, end };
  }

  // "day" without a specific day (uses current day)
  if (node.period === 'day') {
    const start = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate()));
    const end = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate(), 23, 59, 59, 999));
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

function convertASTToResult(ast: ASTNode, opts: Required<ParseOptions>, originalInput?: string): ParseResult | null {
  if (!ast || !ast.nodeType) {
    return null;
  }

  let title: string | null = null;
  let expression = ast;

  // Handle titled expressions
  if (ast.nodeType === 'titled') {
    // Extract original title from input using offsets to preserve case
    if (originalInput && ast.titleStart !== undefined && ast.titleEnd !== undefined) {
      title = originalInput.slice(ast.titleStart, ast.titleEnd).trim();
    } else {
      title = ast.title;
    }
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
        // For month-only dates, use end of month
        if (expression.end.monthOnly) {
          const month = typeof expression.end.month === 'number' ? expression.end.month - 1 : 0;
          const year = expression.end.year ?? opts.referenceDate.getUTCFullYear();
          end = new Date(Date.UTC(year, month + 1, 0)); // Last day of month
        }
        // For year-only dates, use end of year
        if (expression.end.yearOnly) {
          const year = expression.end.year;
          end = new Date(Date.UTC(year, 11, 31)); // Dec 31
        }
      } else if (expression.end.nodeType === 'fuzzy') {
        const fuzzy = convertFuzzyNode(expression.end, opts);
        end = fuzzy.end;
      } else {
        end = new Date(opts.referenceDate);
      }

      // Handle year rollover for cross-month ranges (e.g., "december 20 to january 5")
      if (end < start) {
        // If end is before start, it likely means the end should be in the next year
        // Check if this is a month crossing (not just same day time issue)
        const endMonth = end.getUTCMonth();
        const startMonth = start.getUTCMonth();
        if (endMonth < startMonth) {
          // End month is earlier in year, add a year
          end = new Date(Date.UTC(
            end.getUTCFullYear() + 1,
            end.getUTCMonth(),
            end.getUTCDate(),
            end.getUTCHours(),
            end.getUTCMinutes()
          ));
        }
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
      // If the modifier specifies a boundary (start/end/beginning), return a date
      const mod = expression.modifier;
      if (mod === 'start' || mod === 'beginning') {
        // For start/beginning, return the START of the period
        const periodDates = convertFuzzyNodeWithoutModifier(expression, opts);
        return {
          type: 'date',
          date: periodDates.start,
          title,
        };
      }
      if (mod === 'end') {
        // For end, return the END of the period
        const periodDates = convertFuzzyNodeWithoutModifier(expression, opts);
        return {
          type: 'date',
          date: periodDates.end,
          title,
        };
      }
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

  // Keep original input for title case preservation
  const originalInput = input.trim();
  // Normalize input for parsing (lowercase for keyword matching)
  // Don't collapse whitespace - offsets need to match between normalized and originalInput
  const normalized = originalInput.toLowerCase();
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
    return convertASTToResult(ast, opts, originalInput);
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
