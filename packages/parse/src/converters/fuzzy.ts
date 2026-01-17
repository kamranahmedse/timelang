import { MS_PER_DAY, MS_PER_WEEK, WEEKDAY_MAP } from '../utils/constants';
import {
  getQuarterDates,
  getHalfDates,
  getSeasonDates,
  getModifiedPeriod,
  getCurrentQuarter,
  type DateRange,
} from '../utils/calendar';
import type { ASTNode, RequiredParseOptions } from '../parser';

function getWeekendDates(ref: Date, relative: string, _opts: RequiredParseOptions): DateRange {
  const currentDay = ref.getUTCDay();

  // Calculate offset to this coming Saturday
  const saturdayOffset = (6 - currentDay + 7) % 7;
  let saturday = new Date(
    Date.UTC(
      ref.getUTCFullYear(),
      ref.getUTCMonth(),
      ref.getUTCDate() + saturdayOffset
    )
  );

  if (relative === 'next') {
    // "next weekend" means the weekend after this weekend
    saturday = new Date(saturday.getTime() + MS_PER_WEEK);
  } else if (relative === 'last') {
    // "last weekend" means the most recent past weekend
    if (currentDay === 6 || currentDay === 0) {
      // Currently on weekend, go back one more week
      saturday = new Date(saturday.getTime() - MS_PER_WEEK);
    }
    saturday = new Date(saturday.getTime() - MS_PER_WEEK);
  }

  const sunday = new Date(saturday.getTime() + MS_PER_DAY);
  const sundayEnd = new Date(
    Date.UTC(
      sunday.getUTCFullYear(),
      sunday.getUTCMonth(),
      sunday.getUTCDate(),
      23,
      59
    )
  );

  return { start: saturday, end: sundayEnd };
}

function getNightDates(ref: Date, relative: string | undefined, weekday: string | undefined): DateRange {
  let baseDate = new Date(ref);

  if (relative === 'last') {
    baseDate = new Date(
      Date.UTC(
        ref.getUTCFullYear(),
        ref.getUTCMonth(),
        ref.getUTCDate() - 1
      )
    );
  } else if (relative === 'tomorrow') {
    baseDate = new Date(
      Date.UTC(
        ref.getUTCFullYear(),
        ref.getUTCMonth(),
        ref.getUTCDate() + 1
      )
    );
  } else if (weekday) {
    const targetDay = WEEKDAY_MAP[weekday.toLowerCase()];
    if (targetDay !== undefined) {
      const currentDay = ref.getUTCDay();
      let daysToAdd = (targetDay - currentDay + 7) % 7;
      if (daysToAdd === 0) {
        daysToAdd = 7;
      }
      baseDate = new Date(
        Date.UTC(
          ref.getUTCFullYear(),
          ref.getUTCMonth(),
          ref.getUTCDate() + daysToAdd
        )
      );
    }
  }

  const start = new Date(
    Date.UTC(
      baseDate.getUTCFullYear(),
      baseDate.getUTCMonth(),
      baseDate.getUTCDate(),
      18,
      0
    )
  );
  const end = new Date(
    Date.UTC(
      baseDate.getUTCFullYear(),
      baseDate.getUTCMonth(),
      baseDate.getUTCDate(),
      23,
      59
    )
  );

  return { start, end };
}

function getBasePeriodDates(
  node: ASTNode,
  opts: RequiredParseOptions,
  year: number
): DateRange {
  const ref = opts.referenceDate;

  if (node.period === 'weekend') {
    return getWeekendDates(ref, node.relative as string || 'this', opts);
  }

  if (node.period === 'tonight') {
    return getNightDates(ref, undefined, undefined);
  }

  if (node.period === 'night') {
    return getNightDates(ref, node.relative as string, node.weekday as string);
  }

  if (node.period === 'fortnight') {
    const count = (node.count as number) || 1;
    const relative = node.relative as string;
    const twoWeeks = 14 * MS_PER_DAY;

    if (relative === 'last') {
      const end = new Date(ref);
      const start = new Date(ref.getTime() - twoWeeks);
      return { start, end };
    }
    // Default to next/future
    const start = new Date(ref);
    const end = new Date(ref.getTime() + count * twoWeeks);
    return { start, end };
  }

  if (node.period === 'quarter') {
    let quarter = node.quarter as number | undefined;
    let targetYear = year;

    if (!quarter && node.relative) {
      const currentQuarter = getCurrentQuarter(ref, opts.fiscalYearStart);

      if (node.relative === 'this') {
        quarter = currentQuarter;
      } else if (node.relative === 'next') {
        quarter = currentQuarter + 1;
        if (quarter > 4) {
          quarter = 1;
          targetYear++;
        }
      } else if (node.relative === 'last' || node.relative === 'past') {
        quarter = currentQuarter - 1;
        if (quarter < 1) {
          quarter = 4;
          targetYear--;
        }
      }
    }

    if (quarter) {
      return getQuarterDates(quarter, targetYear, opts.fiscalYearStart);
    }
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
    const end = new Date(
      Date.UTC(
        start.getUTCFullYear(),
        start.getUTCMonth(),
        start.getUTCDate() + 6,
        23,
        59,
        59,
        999
      )
    );
    return { start, end };
  }

  if (node.period === 'weekNumber' && node.weekNumber !== undefined) {
    const weekNum = node.weekNumber as number;
    const targetYear = (node.year as number) ?? ref.getUTCFullYear();
    const weekStart = opts.weekStartsOn === 'monday' ? 1 : 0;

    // Week 1 starts on the first week containing a Thursday (ISO) or first of year
    const jan1 = new Date(Date.UTC(targetYear, 0, 1));
    const jan1Day = jan1.getUTCDay();
    const daysToFirstWeekStart = (weekStart - jan1Day + 7) % 7;
    const firstWeekStart = new Date(jan1.getTime() + daysToFirstWeekStart * MS_PER_DAY);

    const start = new Date(firstWeekStart.getTime() + (weekNum - 1) * MS_PER_WEEK);
    const end = new Date(
      Date.UTC(
        start.getUTCFullYear(),
        start.getUTCMonth(),
        start.getUTCDate() + 6,
        23,
        59,
        59,
        999
      )
    );
    return { start, end };
  }

  if (node.period === 'weekOf' && node.baseDate) {
    const baseDate = node.baseDate as ASTNode;
    let targetDate: Date;

    if (baseDate.month !== undefined && baseDate.day !== undefined) {
      const month = typeof baseDate.month === 'number' ? baseDate.month - 1 : 0;
      const day = baseDate.day as number;
      const targetYear = (baseDate.year as number) ?? ref.getUTCFullYear();
      targetDate = new Date(Date.UTC(targetYear, month, day));
    } else {
      targetDate = ref;
    }

    const weekStart = opts.weekStartsOn === 'monday' ? 1 : 0;
    const currentDay = targetDate.getUTCDay();
    const daysFromStart = (currentDay - weekStart + 7) % 7;
    const start = new Date(
      Date.UTC(
        targetDate.getUTCFullYear(),
        targetDate.getUTCMonth(),
        targetDate.getUTCDate() - daysFromStart
      )
    );
    const end = new Date(
      Date.UTC(
        start.getUTCFullYear(),
        start.getUTCMonth(),
        start.getUTCDate() + 6,
        23,
        59,
        59,
        999
      )
    );
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

  if (node.period === 'ytd') {
    const start = new Date(Date.UTC(ref.getUTCFullYear(), 0, 1));
    const end = new Date(ref);
    return { start, end };
  }

  if (node.period === 'weekOfMonth' && node.week !== undefined && node.month !== undefined) {
    const targetMonth = (node.month as number) - 1;
    const weekNum = node.week as number;
    const targetYear = (node.year as number) ?? ref.getUTCFullYear();

    const monthStart = new Date(Date.UTC(targetYear, targetMonth, 1));
    const weekStart = opts.weekStartsOn === 'monday' ? 1 : 0;
    const firstDay = monthStart.getUTCDay();
    const daysToFirstWeekStart = (weekStart - firstDay + 7) % 7;
    const firstWeekStart = new Date(monthStart.getTime() + daysToFirstWeekStart * MS_PER_DAY);

    const start = new Date(firstWeekStart.getTime() + (weekNum - 1) * MS_PER_WEEK);
    const end = new Date(
      Date.UTC(
        start.getUTCFullYear(),
        start.getUTCMonth(),
        start.getUTCDate() + 6,
        23,
        59,
        59,
        999
      )
    );
    return { start, end };
  }

  return {
    start: new Date(Date.UTC(year, 0, 1)),
    end: new Date(Date.UTC(year, 11, 31)),
  };
}

export function convertFuzzyNodeWithoutModifier(
  node: ASTNode,
  opts: RequiredParseOptions
): DateRange {
  const ref = opts.referenceDate;
  const year = (node.year as number) ?? ref.getUTCFullYear();
  return getBasePeriodDates(node, opts, year);
}

export function convertFuzzyNode(
  node: ASTNode,
  opts: RequiredParseOptions
): DateRange {
  const ref = opts.referenceDate;
  let year = (node.year as number) ?? ref.getUTCFullYear();

  if (node.period === 'quarter' && node.quarter && node.year === undefined) {
    const { end: qEnd } = getQuarterDates(
      node.quarter as number,
      year,
      opts.fiscalYearStart
    );
    if (qEnd < ref) {
      year++;
    }
  }

  const { start, end } = getBasePeriodDates(node, opts, year);

  if (node.modifier) {
    return getModifiedPeriod(start, end, node.modifier as string);
  }

  return { start, end };
}
