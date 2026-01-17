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

  // Abbreviated duration units: 1w, 3d, 2h, 30m (minutes), 5s, 1y, 6mo (months)
  // 'm' = minutes, 'mo' = months
  abbreviatedDuration: {
    match: /\d+(?:mo|w|d|h|m|s|y)\b/,
    value: (s: string) => s.toLowerCase(),
  },

  // Integer numbers
  integer: /\d+/,

  // AM/PM (must come before general keywords)
  ampm: { match: /[Aa][Mm]|[Pp][Mm]/, value: (s: string) => s.toLowerCase() },

  // Keywords - match words and normalize to lowercase
  // Using a regex to match any word, then checking against known keywords
  // The transform function in moo.keywords makes matching case-insensitive
  // Include hyphen for compound words like "twenty-four"
  word: {
    match: /[a-zA-Z][a-zA-Z0-9#-]*/,
    type: moo.keywords({
      // Time words - each gets its own type for grammar disambiguation
      kw_today: ['today'],
      kw_tomorrow: ['tomorrow'],
      kw_yesterday: ['yesterday'],
      kw_now: ['now'],
      kw_noon: ['noon'],
      kw_midnight: ['midnight'],
      kw_morning: ['morning'],
      kw_afternoon: ['afternoon'],
      kw_evening: ['evening'],
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
      kw_whole: ['whole'],
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
        'twenty-one', 'twenty-two', 'twenty-three', 'twenty-four', 'twenty-five',
        'twenty-six', 'twenty-seven', 'twenty-eight', 'twenty-nine',
        'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety', 'hundred',
        'a', 'an', 'couple',
      ],
      // Months - full names
      month: [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december',
        'jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'sept', 'oct', 'nov', 'dec',
      ],
      // Weekdays (including plurals for patterns like "3 fridays ago")
      weekday: [
        'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
        'mondays', 'tuesdays', 'wednesdays', 'thursdays', 'fridays', 'saturdays', 'sundays',
        'mon', 'tue', 'tues', 'wed', 'thu', 'thur', 'thurs', 'fri', 'sat', 'sun',
      ],
      // Ago keyword for relative dates
      kw_ago: ['ago'],
      // Weekend and night keywords
      kw_weekend: ['weekend'],
      kw_tonight: ['tonight'],
      kw_night: ['night'],
      kw_fortnight: ['fortnight', 'fortnights'],
      // Other keywords
      otherKeyword: ['fiscal', 'fy', 'daily', 'weekly', 'monthly', 'yearly', 'annually', 'hence', 'later', 'earlier'],
      // Business keywords
      kw_business: ['business'],
      // EOD/COB keywords
      kw_eod: ['eod'],
      kw_cob: ['cob'],
      kw_close: ['close'],
      // Year-to-date
      kw_ytd: ['ytd'],
    }), // Keywords are matched against lowercase input
  },

  // Punctuation and separators
  lparen: '(',
  rparen: ')',
  lbracket: '[',
  rbracket: ']',
  colon: ':',
  semicolon: ';',
  comma: ',',
  dash: /[-–—]/,  // Regular dash, en-dash, em-dash
  slash: '/',

  // Any other single character
  other: /./,
});

export { lexer };
