import {
  MS_PER_SECOND,
  MS_PER_MINUTE,
  MS_PER_HOUR,
  MS_PER_DAY,
  MS_PER_WEEK,
  MS_PER_MONTH,
  MS_PER_YEAR,
} from '../utils/constants';
import type { ASTNode } from '../parser';

function durationToMs(value: number, unit: string): number {
  switch (unit) {
    case 'second':
      return value * MS_PER_SECOND;
    case 'minute':
      return value * MS_PER_MINUTE;
    case 'hour':
      return value * MS_PER_HOUR;
    case 'day':
      return value * MS_PER_DAY;
    case 'week':
      return value * MS_PER_WEEK;
    case 'month':
      return value * MS_PER_MONTH;
    case 'year':
      return value * MS_PER_YEAR;
    default:
      return 0;
  }
}

export function convertDurationNode(
  node: ASTNode,
  parentHasHours = false
): number {
  if (node.combined && Array.isArray(node.combined)) {
    const hasHours = node.combined.some(
      (d: ASTNode) => d.unit === 'hour'
    );
    return node.combined.reduce(
      (total: number, d: ASTNode) =>
        total + convertDurationNode(d, hasHours),
      0
    );
  }

  let unit = node.unit as string;
  if (parentHasHours && unit === 'month') {
    unit = 'minute';
  }

  return durationToMs(node.value as number, unit);
}
