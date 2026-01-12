import moo from 'moo';

const lexer = moo.compile({
  // Whitespace - capture for potential preservation
  ws: /[ \t]+/,
  newline: { match: /\r?\n/, lineBreaks: true },

  // Time patterns (must come before numbers to match correctly)
  time: /(?:0?[0-9]|1[0-9]|2[0-3]):[0-5][0-9](?::[0-5][0-9])?/,

  // Compact month-day pattern: "July10", "Jan15" (month immediately followed by day number)
  monthDayCompact: {
    match: /(?:[Jj]anuary|[Ff]ebruary|[Mm]arch|[Aa]pril|[Mm]ay|[Jj]une|[Jj]uly|[Aa]ugust|[Ss]eptember|[Oo]ctober|[Nn]ovember|[Dd]ecember|[Jj]an|[Ff]eb|[Mm]ar|[Aa]pr|[Jj]un|[Jj]ul|[Aa]ug|[Ss]ep|[Ss]ept|[Oo]ct|[Nn]ov|[Dd]ec)(?:3[01]|[12]?[0-9])/,
    value: (s: string) => s.toLowerCase(),
  },

  // Quarter notation: Q1, Q2, Q3, Q4 (case insensitive via alternation)
  quarter: { match: /[Qq][1-4]/, value: (s: string) => s.toUpperCase() },

  // Half notation: H1, H2 (case insensitive via alternation)
  half: { match: /[Hh][1-2]/, value: (s: string) => s.toUpperCase() },

  // Ordinal numbers: 1st, 2nd, 3rd, 4th-31st (case insensitive suffixes)
  ordinal: {
    match: /(?:3[01]|[12]?[0-9])(?:[Ss][Tt]|[Nn][Dd]|[Rr][Dd]|[Tt][Hh])/,
    value: (s: string) => s.toLowerCase(),
  },

  // Decimal numbers (must come before integer)
  decimal: /\d+\.\d+/,

  // Abbreviated duration units: 1w, 3d, 2h, 30m (minutes), 5s, 1y, 6m (months)
  // Note: 'm' is ambiguous - we use 'mo' for months and 'm' for minutes in parsing context
  abbreviatedDuration: {
    match: /\d+(?:w|d|h|m|s|y)\b/,
    value: (s: string) => s.toLowerCase(),
  },

  // Integer numbers
  integer: /\d+/,

  // AM/PM (must come before general keywords)
  ampm: { match: /[Aa][Mm]|[Pp][Mm]/, value: (s: string) => s.toLowerCase() },

  // Keywords - match words and normalize to lowercase
  // Using a regex to match any word, then checking against known keywords
  // The transform function in moo.keywords makes matching case-insensitive
  word: {
    match: /[a-zA-Z][a-zA-Z0-9#]*/,
    type: moo.keywords({
      // Time words - each gets its own type for grammar disambiguation
      kw_today: ['today'],
      kw_tomorrow: ['tomorrow'],
      kw_yesterday: ['yesterday'],
      kw_now: ['now'],
      kw_noon: ['noon'],
      kw_midnight: ['midnight'],
      // Relative modifiers - each gets its own type for grammar disambiguation
      kw_next: ['next'],
      kw_last: ['last'],
      kw_this: ['this'],
      kw_previous: ['previous'],
      kw_coming: ['coming'],
      kw_upcoming: ['upcoming'],
      kw_past: ['past'],
      // Period modifiers - each gets its own type for grammar disambiguation
      kw_early: ['early'],
      kw_mid: ['mid'],
      kw_late: ['late'],
      kw_beginning: ['beginning'],
      kw_middle: ['middle'],
      kw_end: ['end'],
      kw_start: ['start'],
      // Periods/units - must come BEFORE ordinalWord so ordinalWord 'second' wins over unit 'second'
      unit: [
        'day', 'days', 'week', 'weeks', 'month', 'months', 'year', 'years',
        'quarter', 'quarters', 'hour', 'hours', 'minute', 'minutes', 'second', 'seconds',
        'hr', 'hrs', 'min', 'mins', 'sec', 'secs', 'wk', 'wks', 'mo', 'mos', 'yr', 'yrs',
      ],
      // Half word
      halfWord: ['half'],
      // Connectors - each gets its own type for grammar disambiguation
      kw_to: ['to'],
      kw_from: ['from'],
      kw_until: ['until', 'til', 'till'],
      kw_through: ['through'],
      kw_between: ['between'],
      kw_and: ['and'],
      kw_for: ['for'],
      kw_in: ['in'],
      kw_on: ['on'],
      kw_at: ['at'],
      kw_of: ['of'],
      kw_the: ['the'],
      kw_within: ['within'],
      kw_over: ['over'],
      kw_during: ['during'],
      kw_starting: ['starting'],
      kw_by: ['by'],
      kw_before: ['before'],
      kw_after: ['after'],
      kw_around: ['around'],
      kw_about: ['about'],
      kw_roughly: ['roughly'],
      kw_approximately: ['approximately'],
      kw_sometime: ['sometime'],
      // Ordinal words - 'second' is handled separately since it's also a unit
      ordinalWord: [
        'first', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth',
        'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth', 'seventeenth',
        'eighteenth', 'nineteenth', 'twentieth', 'twenty-first', 'twenty-second', 'twenty-third',
        'twenty-fourth', 'twenty-fifth', 'twenty-sixth', 'twenty-seventh', 'twenty-eighth',
        'twenty-ninth', 'thirtieth', 'thirty-first',
      ],
      // Seasons
      season: ['spring', 'summer', 'fall', 'autumn', 'winter'],
      // Word numbers
      wordNumber: [
        'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
        'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty',
        'a', 'an', 'couple',
      ],
      // Months - full names
      month: [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december',
        'jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'sept', 'oct', 'nov', 'dec',
      ],
      // Weekdays
      weekday: [
        'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
        'mon', 'tue', 'tues', 'wed', 'thu', 'thur', 'thurs', 'fri', 'sat', 'sun',
      ],
      // Other keywords
      otherKeyword: ['fiscal', 'fy', 'daily', 'weekly', 'monthly', 'yearly', 'annually', 'ago', 'hence', 'later'],
    }), // Keywords are matched against lowercase input
  },

  // Punctuation and separators
  lparen: '(',
  rparen: ')',
  lbracket: '[',
  rbracket: ']',
  lbrace: '{',
  rbrace: '}',
  colon: ':',
  semicolon: ';',
  comma: ',',
  dash: /[-–—]/,  // Regular dash, en-dash, em-dash
  slash: '/',

  // Any other single character
  other: /./,
});

// Helper to tokenize input (case-insensitive)
// We convert to lowercase before tokenizing since moo.keywords doesn't support case-insensitive matching
function tokenize(input: string) {
  lexer.reset(input.toLowerCase());
  return Array.from(lexer);
}

// Tokenize while preserving original case information
// Returns tokens with an additional 'original' property
function tokenizeWithOriginal(input: string) {
  const normalized = input.toLowerCase();
  lexer.reset(normalized);
  const tokens = Array.from(lexer);

  // Map back original text based on positions
  return tokens.map(token => ({
    ...token,
    original: input.slice(token.offset, token.offset + token.text.length),
  }));
}

// Token type constants for use in grammar
const TokenTypes = {
  WS: 'ws',
  NEWLINE: 'newline',
  TIME: 'time',
  MONTH_DAY_COMPACT: 'monthDayCompact',
  QUARTER: 'quarter',
  HALF: 'half',
  ORDINAL: 'ordinal',
  DECIMAL: 'decimal',
  ABBREVIATED_DURATION: 'abbreviatedDuration',
  INTEGER: 'integer',
  AMPM: 'ampm',
  // Time words (individual types)
  KW_TODAY: 'kw_today',
  KW_TOMORROW: 'kw_tomorrow',
  KW_YESTERDAY: 'kw_yesterday',
  KW_NOW: 'kw_now',
  KW_NOON: 'kw_noon',
  KW_MIDNIGHT: 'kw_midnight',
  // Relative modifiers (individual types)
  KW_NEXT: 'kw_next',
  KW_LAST: 'kw_last',
  KW_THIS: 'kw_this',
  KW_PREVIOUS: 'kw_previous',
  KW_COMING: 'kw_coming',
  KW_UPCOMING: 'kw_upcoming',
  KW_PAST: 'kw_past',
  KW_EARLY: 'kw_early',
  KW_MID: 'kw_mid',
  KW_LATE: 'kw_late',
  KW_BEGINNING: 'kw_beginning',
  KW_MIDDLE: 'kw_middle',
  KW_END: 'kw_end',
  KW_START: 'kw_start',
  ORDINAL_WORD: 'ordinalWord',
  HALF_WORD: 'halfWord',
  // Connectors (individual types)
  KW_TO: 'kw_to',
  KW_FROM: 'kw_from',
  KW_UNTIL: 'kw_until',
  KW_THROUGH: 'kw_through',
  KW_BETWEEN: 'kw_between',
  KW_AND: 'kw_and',
  KW_FOR: 'kw_for',
  KW_IN: 'kw_in',
  KW_ON: 'kw_on',
  KW_AT: 'kw_at',
  KW_OF: 'kw_of',
  KW_THE: 'kw_the',
  KW_WITHIN: 'kw_within',
  KW_OVER: 'kw_over',
  KW_DURING: 'kw_during',
  KW_STARTING: 'kw_starting',
  KW_BY: 'kw_by',
  KW_BEFORE: 'kw_before',
  KW_AFTER: 'kw_after',
  KW_AROUND: 'kw_around',
  KW_ABOUT: 'kw_about',
  KW_ROUGHLY: 'kw_roughly',
  KW_APPROXIMATELY: 'kw_approximately',
  KW_SOMETIME: 'kw_sometime',
  UNIT: 'unit',
  SEASON: 'season',
  WORD_NUMBER: 'wordNumber',
  MONTH: 'month',
  WEEKDAY: 'weekday',
  OTHER_KEYWORD: 'otherKeyword',
  WORD: 'word',
  LPAREN: 'lparen',
  RPAREN: 'rparen',
  LBRACKET: 'lbracket',
  RBRACKET: 'rbracket',
  LBRACE: 'lbrace',
  RBRACE: 'rbrace',
  COLON: 'colon',
  SEMICOLON: 'semicolon',
  COMMA: 'comma',
  DASH: 'dash',
  SLASH: 'slash',
  OTHER: 'other',
} as const;

export { lexer, tokenize, tokenizeWithOriginal, TokenTypes };
