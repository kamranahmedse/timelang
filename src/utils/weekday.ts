export function getNextWeekday(weekday: number, referenceDate: Date): Date {
  const result = new Date(
    Date.UTC(
      referenceDate.getUTCFullYear(),
      referenceDate.getUTCMonth(),
      referenceDate.getUTCDate()
    )
  );
  const currentDay = result.getUTCDay();
  let daysToAdd = weekday - currentDay;
  if (daysToAdd <= 0) {
    daysToAdd += 7;
  }
  result.setUTCDate(result.getUTCDate() + daysToAdd);
  return result;
}

export function getLastWeekday(weekday: number, referenceDate: Date): Date {
  const result = new Date(
    Date.UTC(
      referenceDate.getUTCFullYear(),
      referenceDate.getUTCMonth(),
      referenceDate.getUTCDate()
    )
  );
  const currentDay = result.getUTCDay();
  let daysToSubtract = currentDay - weekday;
  if (daysToSubtract <= 0) {
    daysToSubtract += 7;
  }
  result.setUTCDate(result.getUTCDate() - daysToSubtract);
  return result;
}

export function getThisWeekday(
  weekday: number,
  referenceDate: Date,
  weekStartsOn: 'sunday' | 'monday'
): Date {
  const result = new Date(
    Date.UTC(
      referenceDate.getUTCFullYear(),
      referenceDate.getUTCMonth(),
      referenceDate.getUTCDate()
    )
  );
  const currentDay = result.getUTCDay();
  const weekStart = weekStartsOn === 'monday' ? 1 : 0;

  let daysSinceWeekStart = currentDay - weekStart;
  if (daysSinceWeekStart < 0) {
    daysSinceWeekStart += 7;
  }

  let daysToTarget = weekday - weekStart;
  if (daysToTarget < 0) {
    daysToTarget += 7;
  }

  const daysToMove = daysToTarget - daysSinceWeekStart;
  result.setUTCDate(result.getUTCDate() + daysToMove);
  return result;
}
