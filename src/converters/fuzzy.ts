import { MS_PER_DAY } from '../utils/constants';
import {
  getQuarterDates,
  getHalfDates,
  getSeasonDates,
  getModifiedPeriod,
  type DateRange,
} from '../utils/calendar';
import type { ASTNode, RequiredParseOptions } from '../parser';

export function convertFuzzyNodeWithoutModifier(
  node: ASTNode,
  opts: RequiredParseOptions
): DateRange {
  const ref = opts.referenceDate;
  const year = (node.year as number) ?? ref.getUTCFullYear();

  if (node.period === 'quarter' && node.quarter) {
    return getQuarterDates(
      node.quarter as number,
      year,
      opts.fiscalYearStart
    );
  }

  if (node.period === 'half' && node.half) {
    return getHalfDates(node.half as number, year, opts.fiscalYearStart);
  }

  if (node.period === 'season' && node.season) {
    return getSeasonDates(node.season as string, year);
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
    const start = new Date(
      Date.UTC(
        ref.getUTCFullYear(),
        ref.getUTCMonth(),
        ref.getUTCDate() - daysFromStart
      )
    );
    const end = new Date(start.getTime() + 6 * MS_PER_DAY);
    return { start, end };
  }

  if (node.period === 'day') {
    const start = new Date(
      Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate())
    );
    const end = new Date(
      Date.UTC(
        ref.getUTCFullYear(),
        ref.getUTCMonth(),
        ref.getUTCDate(),
        23,
        59,
        59,
        999
      )
    );
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

export function convertFuzzyNode(
  node: ASTNode,
  opts: RequiredParseOptions
): DateRange {
  const ref = opts.referenceDate;
  const year = (node.year as number) ?? ref.getUTCFullYear();

  if (node.period === 'quarter' && node.quarter) {
    let targetYear = year;
    if (node.year === undefined) {
      const { end: qEnd } = getQuarterDates(
        node.quarter as number,
        targetYear,
        opts.fiscalYearStart
      );
      if (qEnd < ref) {
        targetYear++;
      }
    }
    const { start, end } = getQuarterDates(
      node.quarter as number,
      targetYear,
      opts.fiscalYearStart
    );
    if (node.modifier) {
      return getModifiedPeriod(start, end, node.modifier as string);
    }
    return { start, end };
  }

  if (node.period === 'half' && node.half) {
    const { start, end } = getHalfDates(
      node.half as number,
      year,
      opts.fiscalYearStart
    );
    if (node.modifier) {
      return getModifiedPeriod(start, end, node.modifier as string);
    }
    return { start, end };
  }

  if (node.period === 'season' && node.season) {
    const { start, end } = getSeasonDates(node.season as string, year);
    if (node.modifier) {
      return getModifiedPeriod(start, end, node.modifier as string);
    }
    return { start, end };
  }

  if (node.period === 'month' && node.month !== undefined) {
    const month = typeof node.month === 'number' ? node.month - 1 : 0;
    const start = new Date(Date.UTC(year, month, 1));
    const end = new Date(Date.UTC(year, month + 1, 0));
    if (node.modifier) {
      return getModifiedPeriod(start, end, node.modifier as string);
    }
    return { start, end };
  }

  if (node.period === 'month') {
    const month = ref.getUTCMonth();
    const start = new Date(Date.UTC(year, month, 1));
    const end = new Date(Date.UTC(year, month + 1, 0));
    if (node.modifier) {
      return getModifiedPeriod(start, end, node.modifier as string);
    }
    return { start, end };
  }

  if (node.period === 'week') {
    const weekStart = opts.weekStartsOn === 'monday' ? 1 : 0;
    const currentDay = ref.getUTCDay();
    const daysFromStart = (currentDay - weekStart + 7) % 7;
    const start = new Date(
      Date.UTC(
        ref.getUTCFullYear(),
        ref.getUTCMonth(),
        ref.getUTCDate() - daysFromStart
      )
    );
    const end = new Date(start.getTime() + 6 * MS_PER_DAY);
    if (node.modifier) {
      return getModifiedPeriod(start, end, node.modifier as string);
    }
    return { start, end };
  }

  if (node.period === 'day') {
    const start = new Date(
      Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate())
    );
    const end = new Date(
      Date.UTC(
        ref.getUTCFullYear(),
        ref.getUTCMonth(),
        ref.getUTCDate(),
        23,
        59,
        59,
        999
      )
    );
    if (node.modifier) {
      return getModifiedPeriod(start, end, node.modifier as string);
    }
    return { start, end };
  }

  if (node.period === 'year') {
    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year, 11, 31));
    if (node.modifier) {
      return getModifiedPeriod(start, end, node.modifier as string);
    }
    return { start, end };
  }

  return {
    start: new Date(Date.UTC(year, 0, 1)),
    end: new Date(Date.UTC(year, 11, 31)),
  };
}
