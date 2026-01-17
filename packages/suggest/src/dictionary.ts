export const WEEKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export const MODIFIERS = ["this", "next", "last", "past"];

export const RELATIVE_DAYS = ["yesterday", "today", "tomorrow"];

export const RELATIVE_WEEKS = ["this week", "next week", "last week", "past week"];

export const RELATIVE_MONTHS = ["this month", "next month", "last month", "past month"];

export const RELATIVE_YEARS = ["this year", "next year", "last year", "past year"];

export const RELATIVE_QUARTERS = ["this quarter", "next quarter", "last quarter", "past quarter"];

export const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];

export const TIME_OF_DAY = ["morning", "afternoon", "evening"];

export const END_OF_PERIODS = [
  "end of day",
  "end of week",
  "end of month",
  "end of year",
  "eod",
];

export const START_OF_PERIODS = [
  "start of week",
  "start of month",
  "start of year",
  "beginning of month",
  "beginning of year",
];

export const SPECIAL_DAYS = [
  "day after tomorrow",
  "day before yesterday",
];

export const NOW_EXPRESSIONS = ["now"];

export const LATER_EXPRESSIONS = ["later today", "later this week"];

export const IN_A_EXPRESSIONS = [
  "in an hour",
  "in a minute",
  "in a day",
  "in a week",
  "in a fortnight",
  "half an hour",
];

export const TIME_UNITS = ["minute", "hour", "day", "week", "month", "year"];

export const TIMES = [
  "9am",
  "10am",
  "2pm",
  "3pm",
  "5pm",
  "8am",
  "11am",
  "12pm",
  "1pm",
  "4pm",
  "6pm",
  "7pm",
  "8pm",
  "9pm",
  "10pm",
  "11pm",
  "5am",
  "6am",
  "7am",
  "1am",
  "2am",
  "3am",
  "4am",
  "12am",
];

export const DIRECTIONS = ["from now", "ago"];

export const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

export const ALIASES: Record<string, string> = {
  // Weekday abbreviations
  mon: "monday",
  mo: "monday",
  tue: "tuesday",
  tu: "tuesday",
  tues: "tuesday",
  wed: "wednesday",
  we: "wednesday",
  weds: "wednesday",
  thu: "thursday",
  th: "thursday",
  thur: "thursday",
  thurs: "thursday",
  fri: "friday",
  fr: "friday",
  sat: "saturday",
  sa: "saturday",
  sun: "sunday",
  su: "sunday",

  // Time abbreviations
  midn: "midnight",
  midnig: "midnight",
  midni: "midnight",
  noo: "noon",

  // Time of day abbreviations
  morn: "morning",
  morni: "morning",
  aft: "afternoon",
  aftern: "afternoon",
  eve: "evening",
  even: "evening",
  eveni: "evening",

  // Day abbreviations
  tom: "tomorrow",
  tomo: "tomorrow",
  tomor: "tomorrow",
  tmrw: "tomorrow",
  tmr: "tomorrow",
  tod: "today",
  yest: "yesterday",
  yester: "yesterday",

  // Unit abbreviations
  wk: "week",
  wks: "weeks",
  yr: "year",
  yrs: "years",
  hr: "hour",
  hrs: "hours",
  min: "minute",
  mins: "minutes",

  // Month abbreviations
  jan: "january",
  feb: "february",
  mar: "march",
  apr: "april",
  jun: "june",
  jul: "july",
  aug: "august",
  sep: "september",
  sept: "september",
  oct: "october",
  nov: "november",
  dec: "december",
};
