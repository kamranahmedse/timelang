import { FISCAL_START_MONTH } from './constants';

export interface DateRange {
  start: Date;
  end: Date;
}

export function getQuarterDates(
  quarter: number,
  year: number,
  fiscalYearStart: string
): DateRange {
  const fiscalStartMonth = FISCAL_START_MONTH[fiscalYearStart] ?? 0;
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

  const end = new Date(Date.UTC(endYear, endMonth, 0));

  return { start, end };
}

export function getHalfDates(
  half: number,
  year: number,
  fiscalYearStart: string
): DateRange {
  const fiscalStartMonth = FISCAL_START_MONTH[fiscalYearStart] ?? 0;
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

export function getSeasonDates(season: string, year: number): DateRange {
  switch (season) {
    case 'spring':
      return {
        start: new Date(Date.UTC(year, 2, 20)),
        end: new Date(Date.UTC(year, 5, 20)),
      };
    case 'summer':
      return {
        start: new Date(Date.UTC(year, 5, 21)),
        end: new Date(Date.UTC(year, 8, 22)),
      };
    case 'fall':
    case 'autumn':
      return {
        start: new Date(Date.UTC(year, 8, 23)),
        end: new Date(Date.UTC(year, 11, 20)),
      };
    case 'winter':
      return {
        start: new Date(Date.UTC(year, 11, 21)),
        end: new Date(Date.UTC(year + 1, 2, 19)),
      };
    default:
      return {
        start: new Date(Date.UTC(year, 0, 1)),
        end: new Date(Date.UTC(year, 11, 31)),
      };
  }
}

export function getModifiedPeriod(
  start: Date,
  end: Date,
  modifier: string
): DateRange {
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
