import {
  getNextWeekday,
  getLastWeekday,
  getThisWeekday,
} from '../utils/weekday';
import type { ASTNode, RequiredParseOptions } from '../parser';
import {WEEKDAY_MAP} from "../utils/constants";

interface TimeInfo {
  hour?: number;
  minute?: number;
  special?: string;
}

function applyTime(date: Date, time: TimeInfo): void {
  if (time.special === 'noon') {
    date.setUTCHours(12, 0, 0, 0);
  } else if (time.special === 'midnight') {
    date.setUTCHours(0, 0, 0, 0);
  } else if (time.hour !== undefined) {
    date.setUTCHours(time.hour, time.minute ?? 0, 0, 0);
  }
}

function convertSpecialDay(
  node: ASTNode,
  opts: RequiredParseOptions
): Date {
  const ref = opts.referenceDate;
  let date: Date;

  switch (node.special) {
    case 'today':
      date = new Date(
        Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate())
      );
      break;
    case 'tomorrow':
      date = new Date(
        Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate() + 1)
      );
      break;
    case 'yesterday':
      date = new Date(
        Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate() - 1)
      );
      break;
    case 'now':
      date = new Date(ref);
      break;
    case 'dayAfterTomorrow':
      date = new Date(
        Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate() + 2)
      );
      break;
    case 'dayBeforeYesterday':
      date = new Date(
        Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate() - 2)
      );
      break;
    default:
      date = new Date(ref);
  }

  if (node.time) {
    applyTime(date, node.time as TimeInfo);
  }

  return date;
}

function convertTimeOnly(
  node: ASTNode,
  opts: RequiredParseOptions
): Date {
  const ref = opts.referenceDate;
  const date = new Date(
    Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate())
  );

  if (node.time) {
    applyTime(date, node.time as TimeInfo);
  }

  return date;
}

function convertWeekday(
  node: ASTNode,
  opts: RequiredParseOptions
): Date {
  const ref = opts.referenceDate;
  const weekdayNum = WEEKDAY_MAP[(node.weekday as string).toLowerCase()] ?? 0;
  let date: Date;

  if (node.period && (node.period as string).toLowerCase() === 'week') {
    let weekRef: Date;
    switch (node.relative) {
      case 'next':
        weekRef = new Date(
          Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate() + 7)
        );
        break;
      case 'last':
        weekRef = new Date(
          Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate() - 7)
        );
        break;
      default:
        weekRef = ref;
    }
    date = getThisWeekday(weekdayNum, weekRef, opts.weekStartsOn);
  } else {
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
        date = getNextWeekday(weekdayNum, ref);
    }
  }

  if (node.time) {
    applyTime(date, node.time as TimeInfo);
  }

  return date;
}

function convertDateFormat(
  node: ASTNode,
  opts: RequiredParseOptions
): Date {
  const ref = opts.referenceDate;
  const parts = node.formatParts as number[];

  if (
    parts.length < 3 ||
    parts[0] === undefined ||
    parts[1] === undefined ||
    parts[2] === undefined
  ) {
    return ref;
  }

  const [p0, p1, p2] = parts;
  let year: number, month: number, day: number;

  if (p2 > 1000) {
    if (opts.dateFormat === 'intl') {
      day = p0;
      month = p1;
      year = p2;
    } else {
      if (p0 > 12 && p1 <= 12) {
        day = p0;
        month = p1;
        year = p2;
      } else {
        month = p0;
        day = p1;
        year = p2;
      }
    }
  } else {
    month = p0;
    day = p1;
    year = p2 < 100 ? (p2 > 50 ? 1900 + p2 : 2000 + p2) : p2;
  }

  return new Date(Date.UTC(year, month - 1, day));
}

function convertMonthDay(
  node: ASTNode,
  opts: RequiredParseOptions
): Date {
  const ref = opts.referenceDate;
  let year = (node.year as number) ?? ref.getUTCFullYear();
  const month = typeof node.month === 'number' ? node.month - 1 : 0;

  if (node.relativeMonth) {
    const currentMonth = ref.getUTCMonth();
    if (node.relativeMonth === 'last') {
      if (month >= currentMonth) {
        year--;
      }
    } else if (node.relativeMonth === 'next') {
      if (month <= currentMonth) {
        year++;
      }
    }
  } else if (node.year === undefined && month < ref.getUTCMonth()) {
    year++;
  }

  const date = new Date(Date.UTC(year, month, node.day as number));

  if (date.getUTCMonth() !== month || date.getUTCDate() !== node.day) {
    throw new Error('Invalid date');
  }

  if (node.time) {
    applyTime(date, node.time as TimeInfo);
  }

  return date;
}

function convertRelativePeriod(
  node: ASTNode,
  opts: RequiredParseOptions
): Date {
  const ref = opts.referenceDate;
  const period = (node.period as string).toLowerCase();

  switch (period) {
    case 'day': {
      const start = new Date(
        Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate())
      );
      if (node.relative === 'next') {
        start.setUTCDate(start.getUTCDate() + 1);
      } else if (node.relative === 'last') {
        start.setUTCDate(start.getUTCDate() - 1);
      }
      return start;
    }

    case 'week': {
      const start = new Date(
        Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate())
      );
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
    }

    case 'month':
      if (node.relative === 'next') {
        return new Date(
          Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() + 1, 1)
        );
      } else if (node.relative === 'last') {
        return new Date(
          Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() - 1, 1)
        );
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

export function convertDateNode(
  node: ASTNode,
  opts: RequiredParseOptions
): Date {
  if (node.special) {
    return convertSpecialDay(node, opts);
  }

  if (node.timeOnly && node.time) {
    return convertTimeOnly(node, opts);
  }

  if (node.weekday) {
    return convertWeekday(node, opts);
  }

  if (node.formatParts) {
    return convertDateFormat(node, opts);
  }

  if (node.month !== undefined && node.day !== undefined) {
    return convertMonthDay(node, opts);
  }

  if (node.relative && node.period) {
    return convertRelativePeriod(node, opts);
  }

  return new Date(opts.referenceDate);
}
