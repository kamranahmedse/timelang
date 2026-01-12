@preprocessor typescript

@{%
import { lexer } from './lexer.js';

// AST Node types
interface DateNode {
  nodeType: 'date';
  value: string;
  weekday?: string;
  month?: string;
  day?: number;
  year?: number;
  time?: { hour: number; minute: number };
  relative?: 'next' | 'last' | 'this';
  special?: 'today' | 'tomorrow' | 'yesterday' | 'now' | 'noon' | 'midnight';
}

interface DurationNode {
  nodeType: 'duration';
  value: number;
  unit: string;
  combined?: DurationNode[];
}

interface SpanNode {
  nodeType: 'span';
  start: DateNode | DurationNode | FuzzyNode;
  duration?: DurationNode;
  end?: DateNode;
}

interface RangeNode {
  nodeType: 'range';
  start: DateNode | FuzzyNode;
  end: DateNode | FuzzyNode;
}

interface FuzzyNode {
  nodeType: 'fuzzy';
  period: string;
  quarter?: number;
  half?: number;
  year?: number;
  modifier?: 'early' | 'mid' | 'late' | 'beginning' | 'end' | 'start' | 'middle';
  season?: string;
}

interface RelativeNode {
  nodeType: 'relative';
  direction: 'past' | 'future';
  duration: DurationNode;
}

interface TitledNode {
  nodeType: 'titled';
  title: string;
  expression: any;
}

// Helper functions
const first = (d: any[]) => d[0];
const nuller = () => null;

const extractValue = (d: any[]) => d[0]?.value ?? d[0];

const makeDate = (data: Partial<DateNode>): DateNode => ({
  nodeType: 'date',
  value: '',
  ...data,
});

const makeDuration = (value: number, unit: string): DurationNode => ({
  nodeType: 'duration',
  value,
  unit: normalizeUnit(unit),
});

const makeSpan = (start: any, duration?: DurationNode, end?: DateNode): SpanNode => ({
  nodeType: 'span',
  start,
  duration,
  end,
});

const makeRange = (start: any, end: any): RangeNode => ({
  nodeType: 'range',
  start,
  end,
});

const makeFuzzy = (data: Partial<FuzzyNode>): FuzzyNode => ({
  nodeType: 'fuzzy',
  period: '',
  ...data,
});

const makeRelative = (direction: 'past' | 'future', duration: DurationNode): RelativeNode => ({
  nodeType: 'relative',
  direction,
  duration,
});

const makeTitled = (title: string, expression: any, titleStart?: number, titleEnd?: number): TitledNode => ({
  nodeType: 'titled',
  title: title.trim(),
  titleStart,
  titleEnd,
  expression,
});

// Unit normalization
function normalizeUnit(unit: string): string {
  const u = unit.toLowerCase();
  if (['day', 'days', 'd'].includes(u)) return 'day';
  if (['week', 'weeks', 'wk', 'wks', 'w'].includes(u)) return 'week';
  if (['month', 'months', 'mo', 'mos'].includes(u)) return 'month';
  if (['year', 'years', 'yr', 'yrs', 'y'].includes(u)) return 'year';
  if (['hour', 'hours', 'hr', 'hrs', 'h'].includes(u)) return 'hour';
  if (['minute', 'minutes', 'min', 'mins'].includes(u)) return 'minute';
  if (['second', 'seconds', 'sec', 'secs', 's'].includes(u)) return 'second';
  if (['quarter', 'quarters'].includes(u)) return 'quarter';
  return u;
}

// Number parsing
function parseWordNumber(word: string): number {
  const map: Record<string, number> = {
    'a': 1, 'an': 1, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
    'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20,
    'couple': 2,
  };
  return map[word.toLowerCase()] ?? 1;
}

function parseOrdinal(ord: string): number {
  const match = ord.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : parseOrdinalWord(ord);
}

function parseOrdinalWord(word: string): number {
  const map: Record<string, number> = {
    'first': 1, 'second': 2, 'third': 3, 'fourth': 4, 'fifth': 5,
    'sixth': 6, 'seventh': 7, 'eighth': 8, 'ninth': 9, 'tenth': 10,
    'eleventh': 11, 'twelfth': 12, 'thirteenth': 13, 'fourteenth': 14, 'fifteenth': 15,
    'sixteenth': 16, 'seventeenth': 17, 'eighteenth': 18, 'nineteenth': 19, 'twentieth': 20,
    'twenty-first': 21, 'twenty-second': 22, 'twenty-third': 23, 'twenty-fourth': 24,
    'twenty-fifth': 25, 'twenty-sixth': 26, 'twenty-seventh': 27, 'twenty-eighth': 28,
    'twenty-ninth': 29, 'thirtieth': 30, 'thirty-first': 31,
  };
  return map[word.toLowerCase()] ?? 1;
}

function parseMonth(month: string): number {
  const map: Record<string, number> = {
    'january': 1, 'jan': 1, 'february': 2, 'feb': 2, 'march': 3, 'mar': 3,
    'april': 4, 'apr': 4, 'may': 5, 'june': 6, 'jun': 6,
    'july': 7, 'jul': 7, 'august': 8, 'aug': 8, 'september': 9, 'sep': 9, 'sept': 9,
    'october': 10, 'oct': 10, 'november': 11, 'nov': 11, 'december': 12, 'dec': 12,
  };
  return map[month.toLowerCase()] ?? 1;
}

function parseWeekday(weekday: string): number {
  const map: Record<string, number> = {
    'sunday': 0, 'sun': 0, 'monday': 1, 'mon': 1, 'tuesday': 2, 'tue': 2, 'tues': 2,
    'wednesday': 3, 'wed': 3, 'thursday': 4, 'thu': 4, 'thur': 4, 'thurs': 4,
    'friday': 5, 'fri': 5, 'saturday': 6, 'sat': 6,
  };
  return map[weekday.toLowerCase()] ?? 0;
}

function parseMonthDayCompact(input: string): { month: number; day: number } {
  const lower = input.toLowerCase();
  const monthNames = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december',
    'jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'sept', 'oct', 'nov', 'dec',
  ];
  for (const name of monthNames) {
    if (lower.startsWith(name)) {
      const dayStr = lower.slice(name.length);
      return { month: parseMonth(name), day: parseInt(dayStr, 10) };
    }
  }
  return { month: 1, day: 1 };
}

function parseQuarter(q: string): number {
  const match = q.match(/[qQ]([1-4])/);
  return match ? parseInt(match[1], 10) : 1;
}

function parseHalf(h: string): number {
  const match = h.match(/[hH]([1-2])/);
  return match ? parseInt(match[1], 10) : 1;
}
%}

@lexer lexer

# Main entry point - try most specific patterns first
main -> titledExpression {% first %}
      | expression {% first %}

# Titled expressions
# Use titleTextSimple for dash separator to avoid ambiguity with standalone dash
titledExpression -> titleTextSimple _ %dash _ expression {% d => makeTitled(d[0].text, d[4], d[0].start, d[0].end) %}
                  | titleText %colon _ expression {% d => makeTitled(d[0].text, d[3], d[0].start, d[0].end) %}
                  | titleText _ %lparen expression %rparen {% d => makeTitled(d[0].text, d[3], d[0].start, d[0].end) %}
                  | titleText _ %lbracket expression %rbracket {% d => makeTitled(d[0].text, d[3], d[0].start, d[0].end) %}
                  | titleText _ onConnector _ expression {% d => makeTitled(d[0].text, d[4], d[0].start, d[0].end) %}
                  | titleText _ atConnector _ expression {% d => makeTitled(d[0].text, d[4], d[0].start, d[0].end) %}
                  | titleText _ inConnector _ expression {% d => makeTitled(d[0].text, d[4], d[0].start, d[0].end) %}
                  | titleText _ forConnector _ expression {% d => makeTitled(d[0].text, d[4], d[0].start, d[0].end) %}
                  | titleText _ fromConnector _ expression {% d => makeTitled(d[0].text, d[4], d[0].start, d[0].end) %}
                  | titleText _ duringConnector _ expression {% d => makeTitled(d[0].text, d[4], d[0].start, d[0].end) %}
                  | titleText _ startingConnector _ expression {% d => makeTitled(d[0].text, d[4], d[0].start, d[0].end) %}
                  | titleText _ byConnector _ expression {% d => makeTitled(d[0].text, d[4], d[0].start, d[0].end) %}
                  | titleText _ %dash _ byConnector _ expression {% d => makeTitled(d[0].text, d[6], d[0].start, d[0].end) %}
                  | expression _ postTitle {% d => makeTitled(d[2].text, d[0], d[2].start, d[2].end) %}

# Post-expression title (for patterns like "Q1 planning", "monday meeting")
postTitle -> %word {% d => ({ text: d[0].value, start: d[0].offset, end: d[0].offset + d[0].text.length }) %}
           | postTitle _ %word {% d => ({ text: d[0].text + ' ' + d[2].value, start: d[0].start, end: d[2].offset + d[2].text.length }) %}

# Title text - words that aren't time expressions (can include dashes for parenthetical patterns)
# Track offsets: { text, start, end }
titleText -> titleWord {% d => ({ text: d[0].text, start: d[0].start, end: d[0].end }) %}
           | versionNumber {% d => d[0] %}
           | hyphenatedWord {% d => d[0] %}
           | titleText _ titleWord {% d => ({ text: d[0].text + ' ' + d[2].text, start: d[0].start, end: d[2].end }) %}
           | titleText _ versionNumber {% d => ({ text: d[0].text + ' ' + d[2].text, start: d[0].start, end: d[2].end }) %}
           | titleText _ hyphenatedWord {% d => ({ text: d[0].text + ' ' + d[2].text, start: d[0].start, end: d[2].end }) %}
           | titleText _ %dash _ titleWord {% d => ({ text: d[0].text + ' - ' + d[4].text, start: d[0].start, end: d[4].end }) %}
           | titleText _ %dash _ versionNumber {% d => ({ text: d[0].text + ' - ' + d[4].text, start: d[0].start, end: d[4].end }) %}

titleWord -> %word {% d => ({ text: d[0].value, start: d[0].offset, end: d[0].offset + d[0].text.length }) %}
           | %wordNumber {% d => ({ text: d[0].value, start: d[0].offset, end: d[0].offset + d[0].text.length }) %}
           | %integer {% d => ({ text: d[0].value, start: d[0].offset, end: d[0].offset + d[0].text.length }) %}
           | %otherKeyword {% d => ({ text: d[0].value, start: d[0].offset, end: d[0].offset + d[0].text.length }) %}
           | %decimal {% d => ({ text: d[0].value, start: d[0].offset, end: d[0].offset + d[0].text.length }) %}
           | %quarter {% d => ({ text: d[0].value, start: d[0].offset, end: d[0].offset + d[0].text.length }) %}
           | %half {% d => ({ text: d[0].value, start: d[0].offset, end: d[0].offset + d[0].text.length }) %}
           | %lparen titleText %rparen {% d => ({ text: '(' + d[1].text + ')', start: d[0].offset, end: d[2].offset + 1 }) %}
           | %lbracket titleText %rbracket {% d => ({ text: '[' + d[1].text + ']', start: d[0].offset, end: d[2].offset + 1 }) %}
           | %slash {% d => ({ text: '/', start: d[0].offset, end: d[0].offset + 1 }) %}
           | %colon {% d => ({ text: ':', start: d[0].offset, end: d[0].offset + 1 }) %}
           | hashNumber {% d => d[0] %}

# Hyphenated title word like "Team-A" (no spaces around dash)
hyphenatedWord -> %word %dash %word {% d => ({ text: d[0].value + '-' + d[2].value, start: d[0].offset, end: d[2].offset + d[2].text.length }) %}
               | %word %dash %integer {% d => ({ text: d[0].value + '-' + d[2].value, start: d[0].offset, end: d[2].offset + d[2].text.length }) %}

# Hash-prefixed number like "#123"
hashNumber -> %other %integer {% (d, _, reject) => {
  if (d[0].value !== '#') return reject;
  return { text: '#' + d[1].value, start: d[0].offset, end: d[1].offset + d[1].text.length };
} %}

# Version number like "v1.2.3" or "2.0"
# "v1.2" tokenizes as: word("v1") + other(".") + integer("2")
# "v2.0.0" tokenizes as: word("v2") + other(".") + decimal("0.0")
versionNumber -> %word %other %integer {% (d, _, reject) => {
  if (d[1].value !== '.') return reject;
  return { text: d[0].value + '.' + d[2].value, start: d[0].offset, end: d[2].offset + d[2].text.length };
} %}
              | %word %other %integer %other %integer {% (d, _, reject) => {
  if (d[1].value !== '.' || d[3].value !== '.') return reject;
  return { text: d[0].value + '.' + d[2].value + '.' + d[4].value, start: d[0].offset, end: d[4].offset + d[4].text.length };
} %}
              | %word %other %integer %other %integer %other %integer {% (d, _, reject) => {
  if (d[1].value !== '.' || d[3].value !== '.' || d[5].value !== '.') return reject;
  return { text: d[0].value + '.' + d[2].value + '.' + d[4].value + '.' + d[6].value, start: d[0].offset, end: d[6].offset + d[6].text.length };
} %}
              | %word %other %decimal {% (d, _, reject) => {
  if (d[1].value !== '.') return reject;
  return { text: d[0].value + '.' + d[2].value, start: d[0].offset, end: d[2].offset + d[2].text.length };
} %}
              | %decimal {% d => ({ text: d[0].value, start: d[0].offset, end: d[0].offset + d[0].text.length }) %}

# Title text that may include hyphenated words
titleTextSimple -> titleWord {% d => d[0] %}
                | hyphenatedWord {% d => d[0] %}
                | versionNumber {% d => d[0] %}
                | titleTextSimple _ titleWord {% d => ({ text: d[0].text + ' ' + d[2].text, start: d[0].start, end: d[2].end }) %}
                | titleTextSimple _ hyphenatedWord {% d => ({ text: d[0].text + ' ' + d[2].text, start: d[0].start, end: d[2].end }) %}
                | titleTextSimple _ versionNumber {% d => ({ text: d[0].text + ' ' + d[2].text, start: d[0].start, end: d[2].end }) %}
                | titleTextSimple %slash titleWord {% d => ({ text: d[0].text + '/' + d[2].text, start: d[0].start, end: d[2].end }) %}
                | titleTextSimple %colon _ titleWord {% d => ({ text: d[0].text + ': ' + d[3].text, start: d[0].start, end: d[3].end }) %}

# Expression types
expression -> range {% first %}
            | span {% first %}
            | relative {% first %}
            | fuzzy {% first %}
            | forDuration {% first %}
            | duration {% first %}
            | date {% first %}

# Duration with "for" prefix: "for 2 weeks", "for a year"
forDuration -> forConnector _ duration {% d => d[2] %}

# Range expressions: "jan 5 to jan 19", "from march to april"
range -> date _ toConnector _ date {% d => makeRange(d[0], d[4]) %}
       | fromConnector _ date _ toConnector _ date {% d => makeRange(d[2], d[6]) %}
       | date _ %dash _ date {% d => makeRange(d[0], d[4]) %}
       | %monthDayCompact %dash %monthDayCompact {% d => {
  const start = parseMonthDayCompact(d[0].value);
  const end = parseMonthDayCompact(d[2].value);
  return makeRange(makeDate({ month: start.month, day: start.day }), makeDate({ month: end.month, day: end.day }));
} %}
       | %monthDayCompact _ %dash _ date {% d => {
  const start = parseMonthDayCompact(d[0].value);
  return makeRange(makeDate({ month: start.month, day: start.day }), d[4]);
} %}
       | date _ %dash _ %monthDayCompact {% d => {
  const end = parseMonthDayCompact(d[4].value);
  return makeRange(d[0], makeDate({ month: end.month, day: end.day }));
} %}
       | specialDay _ time _ toConnector _ time {% d => makeRange(makeDate({ special: d[0], time: d[2] }), makeDate({ special: d[0], time: d[6] })) %}
       | monthDay _ time _ toConnector _ time {% d => makeRange({ ...d[0], time: d[2] }, { ...d[0], time: d[6] }) %}
       | weekday _ time _ toConnector _ time {% d => makeRange(makeDate({ weekday: d[0], time: d[2] }), makeDate({ weekday: d[0], time: d[6] })) %}
       | month _ dayNumber %dash dayNumber {% d => makeRange(makeDate({ month: d[0], day: d[2] }), makeDate({ month: d[0], day: d[4] })) %}
       | dayNumber %dash dayNumber _ month {% d => makeRange(makeDate({ month: d[4], day: d[0] }), makeDate({ month: d[4], day: d[2] })) %}
       | betweenConnector _ date _ andConnector _ date {% d => makeRange(d[2], d[6]) %}
       | date _ throughConnector _ date {% d => makeRange(d[0], d[4]) %}
       | date _ untilConnector _ date {% d => makeRange(d[0], d[4]) %}
       | untilConnector _ date {% d => makeRange(makeDate({ special: 'today' }), d[2]) %}
       | untilConnector _ fuzzy {% d => makeRange(makeDate({ special: 'today' }), d[2]) %}
       | fuzzy _ toConnector _ fuzzy {% d => makeRange(d[0], d[4]) %}
       | fromConnector _ fuzzy _ toConnector _ fuzzy {% d => makeRange(d[2], d[6]) %}
       | betweenConnector _ fuzzy _ andConnector _ fuzzy {% d => makeRange(d[2], d[6]) %}
       | fromConnector _ date _ untilConnector _ date {% d => makeRange(d[2], d[6]) %}
       | fromConnector _ specialDay _ untilConnector _ date {% d => makeRange(makeDate({ special: d[2] }), d[6]) %}

# Span expressions: "jan 5 for 2 weeks", "starting march 1 for 10 days"
span -> date _ forConnector _ duration {% d => makeSpan(d[0], d[4]) %}
      | fuzzy _ forConnector _ duration {% d => makeSpan(d[0], d[4]) %}
      | inConnector _ fuzzy _ forConnector _ duration {% d => makeSpan(d[2], d[6]) %}
      | inConnector _ date _ forConnector _ duration {% d => makeSpan(d[2], d[6]) %}
      | inConnector _ monthForSpan _ forConnector _ duration {% d => makeSpan(d[2], d[6]) %}
      | startingConnector _ date _ forConnector _ duration {% d => makeSpan(d[2], d[6]) %}
      | beginningConnector _ date _ forConnector _ duration {% d => makeSpan(d[2], d[6]) %}
      | startingConnector _ date {% d => makeSpan(d[2]) %}
      | date _ startingConnector _ date {% d => makeSpan(d[4], d[0]) %}
      | duration _ startingConnector _ date {% d => makeSpan(d[4], d[0]) %}
      | duration _ fromConnector _ date {% d => makeSpan(d[4], d[0]) %}
      | duration _ inConnector _ fuzzy {% d => makeSpan(d[4], d[0]) %}
      | duration _ inConnector _ theConnector _ fuzzy {% d => makeSpan(d[6], d[0]) %}

# Month as a fuzzy span starting point (for "in january for 2 days")
monthForSpan -> month {% d => makeFuzzy({ period: 'month', month: d[0] }) %}

# Relative duration expressions: "last 30 days", "next 2 weeks" (must have a NUMBER)
relative -> lastRelative _ number _ unit {% d => makeRelative('past', makeDuration(d[2], d[4])) %}
          | pastRelative _ number _ unit {% d => makeRelative('past', makeDuration(d[2], d[4])) %}
          | previousRelative _ number _ unit {% d => makeRelative('past', makeDuration(d[2], d[4])) %}
          | nextRelative _ number _ unit {% d => makeRelative('future', makeDuration(d[2], d[4])) %}
          | comingRelative _ number _ unit {% d => makeRelative('future', makeDuration(d[2], d[4])) %}
          | upcomingRelative _ number _ unit {% d => makeRelative('future', makeDuration(d[2], d[4])) %}
          | withinConnector _ duration {% d => makeRelative('future', d[2]) %}
          | withinConnector _ theConnector _ nextRelative _ duration {% d => makeRelative('future', d[6]) %}
          | withinConnector _ theConnector _ lastRelative _ duration {% d => makeRelative('past', d[6]) %}
          | withinConnector _ theConnector _ pastRelative _ duration {% d => makeRelative('past', d[6]) %}
          | overConnector _ theConnector _ nextRelative _ duration {% d => makeRelative('future', d[6]) %}
          | overConnector _ theConnector _ lastRelative _ duration {% d => makeRelative('past', d[6]) %}
          | overConnector _ theConnector _ pastRelative _ duration {% d => makeRelative('past', d[6]) %}
          | overConnector _ theConnector _ comingRelative _ duration {% d => makeRelative('future', d[6]) %}
          | inConnector _ theConnector _ lastRelative _ duration {% d => makeRelative('past', d[6]) %}
          | inConnector _ theConnector _ nextRelative _ duration {% d => makeRelative('future', d[6]) %}
          | inConnector _ theConnector _ pastRelative _ duration {% d => makeRelative('past', d[6]) %}
          | inConnector _ theConnector _ comingRelative _ duration {% d => makeRelative('future', d[6]) %}
          | lastRelative _ wordNumber _ unit {% d => makeRelative('past', makeDuration(parseWordNumber(d[2]), d[4])) %}
          | nextRelative _ wordNumber _ unit {% d => makeRelative('future', makeDuration(parseWordNumber(d[2]), d[4])) %}
          | pastRelative _ wordNumber _ unit {% d => makeRelative('past', makeDuration(parseWordNumber(d[2]), d[4])) %}
          | previousRelative _ wordNumber _ unit {% d => makeRelative('past', makeDuration(parseWordNumber(d[2]), d[4])) %}
          | comingRelative _ wordNumber _ unit {% d => makeRelative('future', makeDuration(parseWordNumber(d[2]), d[4])) %}
          | upcomingRelative _ wordNumber _ unit {% d => makeRelative('future', makeDuration(parseWordNumber(d[2]), d[4])) %}
          | pastRelative _ unit {% d => makeRelative('past', makeDuration(1, d[2])) %}
          | previousRelative _ unit {% d => makeRelative('past', makeDuration(1, d[2])) %}
          | upcomingRelative _ unit {% d => makeRelative('future', makeDuration(1, d[2])) %}
          | withinConnector _ theConnector _ nextRelative _ unit {% d => makeRelative('future', makeDuration(1, d[6])) %}
          | withinConnector _ theConnector _ pastRelative _ unit {% d => makeRelative('past', makeDuration(1, d[6])) %}
          | overConnector _ theConnector _ lastRelative _ unit {% d => makeRelative('past', makeDuration(1, d[6])) %}
          | overConnector _ theConnector _ comingRelative _ unit {% d => makeRelative('future', makeDuration(1, d[6])) %}
          | overConnector _ theConnector _ upcomingRelative _ unit {% d => makeRelative('future', makeDuration(1, d[6])) %}
          | inConnector _ theConnector _ pastRelative _ unit {% d => makeRelative('past', makeDuration(1, d[6])) %}
          | inConnector _ theConnector _ comingRelative _ unit {% d => makeRelative('future', makeDuration(1, d[6])) %}
          | inConnector _ theConnector _ upcomingRelative _ unit {% d => makeRelative('future', makeDuration(1, d[6])) %}

# Fuzzy period expressions: "Q1", "early march", "end of january"
# Note: month non-terminal already returns a number from parseMonth, so don't call parseMonth again
fuzzy -> quarter {% d => makeFuzzy({ period: 'quarter', quarter: parseQuarter(d[0].value) }) %}
       | quarter _ year {% d => makeFuzzy({ period: 'quarter', quarter: parseQuarter(d[0].value), year: d[2] }) %}
       | half {% d => makeFuzzy({ period: 'half', half: parseHalf(d[0].value) }) %}
       | half _ year {% d => makeFuzzy({ period: 'half', half: parseHalf(d[0].value), year: d[2] }) %}
       | earlyModifier _ month {% d => makeFuzzy({ period: 'month', month: d[2], modifier: 'early' }) %}
       | midModifier _ month {% d => makeFuzzy({ period: 'month', month: d[2], modifier: 'mid' }) %}
       | lateModifier _ month {% d => makeFuzzy({ period: 'month', month: d[2], modifier: 'late' }) %}
       | earlyModifier _ quarter {% d => makeFuzzy({ period: 'quarter', quarter: parseQuarter(d[2].value), modifier: 'early' }) %}
       | midModifier _ quarter {% d => makeFuzzy({ period: 'quarter', quarter: parseQuarter(d[2].value), modifier: 'mid' }) %}
       | lateModifier _ quarter {% d => makeFuzzy({ period: 'quarter', quarter: parseQuarter(d[2].value), modifier: 'late' }) %}
       | earlyModifier _ year {% d => makeFuzzy({ period: 'year', year: d[2], modifier: 'early' }) %}
       | midModifier _ year {% d => makeFuzzy({ period: 'year', year: d[2], modifier: 'mid' }) %}
       | lateModifier _ year {% d => makeFuzzy({ period: 'year', year: d[2], modifier: 'late' }) %}
       | earlyModifier _ yearUnit {% d => makeFuzzy({ period: 'year', modifier: 'early' }) %}
       | midModifier _ yearUnit {% d => makeFuzzy({ period: 'year', modifier: 'mid' }) %}
       | lateModifier _ yearUnit {% d => makeFuzzy({ period: 'year', modifier: 'late' }) %}
       | endConnector _ ofConnector _ month {% d => makeFuzzy({ period: 'month', month: d[4], modifier: 'end' }) %}
       | endConnector _ ofConnector _ year {% d => makeFuzzy({ period: 'year', year: d[4], modifier: 'end' }) %}
       | endConnector _ ofConnector _ quarter {% d => makeFuzzy({ period: 'quarter', quarter: parseQuarter(d[4].value), modifier: 'end' }) %}
       | startConnector _ ofConnector _ quarter {% d => makeFuzzy({ period: 'quarter', quarter: parseQuarter(d[4].value), modifier: 'start' }) %}
       | beginningConnector _ ofConnector _ quarter {% d => makeFuzzy({ period: 'quarter', quarter: parseQuarter(d[4].value), modifier: 'beginning' }) %}
       | middleConnector _ ofConnector _ quarter {% d => makeFuzzy({ period: 'quarter', quarter: parseQuarter(d[4].value), modifier: 'middle' }) %}
       | endConnector _ ofConnector _ theConnector _ month {% d => makeFuzzy({ period: 'month', month: d[6], modifier: 'end' }) %}
       | endConnector _ ofConnector _ theConnector _ unit {% d => makeFuzzy({ period: d[6], modifier: 'end' }) %}
       | endConnector _ ofConnector _ unit {% d => makeFuzzy({ period: d[4], modifier: 'end' }) %}
       | beginningConnector _ ofConnector _ unit {% d => makeFuzzy({ period: d[4], modifier: 'beginning' }) %}
       | startConnector _ ofConnector _ unit {% d => makeFuzzy({ period: d[4], modifier: 'start' }) %}
       | middleConnector _ ofConnector _ unit {% d => makeFuzzy({ period: d[4], modifier: 'middle' }) %}
       | beginningConnector _ ofConnector _ month {% d => makeFuzzy({ period: 'month', month: d[4], modifier: 'beginning' }) %}
       | beginningConnector _ ofConnector _ year {% d => makeFuzzy({ period: 'year', year: d[4], modifier: 'beginning' }) %}
       | startConnector _ ofConnector _ month {% d => makeFuzzy({ period: 'month', month: d[4], modifier: 'start' }) %}
       | startConnector _ ofConnector _ year {% d => makeFuzzy({ period: 'year', year: d[4], modifier: 'start' }) %}
       | middleConnector _ ofConnector _ month {% d => makeFuzzy({ period: 'month', month: d[4], modifier: 'middle' }) %}
       | middleConnector _ ofConnector _ year {% d => makeFuzzy({ period: 'year', year: d[4], modifier: 'middle' }) %}
       | season {% d => makeFuzzy({ period: 'season', season: d[0] }) %}
       | season _ year {% d => makeFuzzy({ period: 'season', season: d[0], year: d[2] }) %}
       | earlyModifier _ season {% d => makeFuzzy({ period: 'season', season: d[2], modifier: 'early' }) %}
       | midModifier _ season {% d => makeFuzzy({ period: 'season', season: d[2], modifier: 'mid' }) %}
       | lateModifier _ season {% d => makeFuzzy({ period: 'season', season: d[2], modifier: 'late' }) %}
       | nextRelative _ season {% d => makeFuzzy({ period: 'season', season: d[2], relative: 'next' }) %}
       | lastRelative _ season {% d => makeFuzzy({ period: 'season', season: d[2], relative: 'last' }) %}
       | thisRelative _ season {% d => makeFuzzy({ period: 'season', season: d[2], relative: 'this' }) %}
       | ordinalWord _ quarter _ year {% d => makeFuzzy({ period: 'quarter', quarter: parseOrdinalWord(d[0]), year: d[4] }) %}
       | ordinalWord _ quarter {% d => makeFuzzy({ period: 'quarter', quarter: parseOrdinalWord(d[0]) }) %}
       | ordinalWord _ half _ year {% d => makeFuzzy({ period: 'half', half: parseOrdinalWord(d[0]), year: d[4] }) %}
       | ordinalWord _ half {% d => makeFuzzy({ period: 'half', half: parseOrdinalWord(d[0]) }) %}
       | aroundConnector _ date {% d => makeFuzzy({ ...d[2], period: 'around' }) %}
       | aboutConnector _ date {% d => makeFuzzy({ ...d[2], period: 'around' }) %}
       | roughlyConnector _ date {% d => makeFuzzy({ ...d[2], period: 'around' }) %}
       | approximatelyConnector _ date {% d => makeFuzzy({ ...d[2], period: 'around' }) %}
       | aroundConnector _ fuzzy {% d => d[2] %}
       | aboutConnector _ fuzzy {% d => d[2] %}
       | roughlyConnector _ fuzzy {% d => d[2] %}
       | approximatelyConnector _ fuzzy {% d => d[2] %}
       | sometimeConnector _ inConnector _ fuzzy {% d => d[4] %}
       | sometimeConnector _ inConnector _ month {% d => makeFuzzy({ period: 'month', month: d[4] }) %}
       | sometimeConnector _ nextRelative _ unit {% d => makeFuzzy({ period: d[4], relative: 'next' }) %}
       | sometimeConnector _ lastRelative _ unit {% d => makeFuzzy({ period: d[4], relative: 'last' }) %}
       | sometimeConnector _ thisRelative _ unit {% d => makeFuzzy({ period: d[4], relative: 'this' }) %}
       | theConnector _ lastRelative _ unit _ ofConnector _ month {% d => makeFuzzy({ period: 'month', month: d[8], modifier: 'late' }) %}
       | theConnector _ ordinalWord _ unit _ ofConnector _ month {% (d, _, reject) => {
  const ord = d[2].toLowerCase();
  if (ord === 'first') return makeFuzzy({ period: 'month', month: d[8], modifier: 'early' });
  return reject;
} %}
       | ordinalWord _ quarterUnit {% d => makeFuzzy({ period: 'quarter', quarter: parseOrdinalWord(d[0]) }) %}
       | ordinal _ quarterUnit {% d => makeFuzzy({ period: 'quarter', quarter: parseOrdinal(d[0]) }) %}
       | ordinalWord _ quarterUnit _ year {% d => makeFuzzy({ period: 'quarter', quarter: parseOrdinalWord(d[0]), year: d[4] }) %}
       | ordinalWord _ quarterUnit _ ofConnector _ year {% d => makeFuzzy({ period: 'quarter', quarter: parseOrdinalWord(d[0]), year: d[6] }) %}
       | quarter _ ofConnector _ year {% d => makeFuzzy({ period: 'quarter', quarter: parseQuarter(d[0].value), year: d[4] }) %}
       | ordinalWord _ halfWord _ ofConnector _ year {% d => makeFuzzy({ period: 'half', half: parseOrdinalWord(d[0]), year: d[6] }) %}
       | earlyModifier _ nextRelative _ unit {% d => makeFuzzy({ period: d[4], modifier: 'early', relative: 'next' }) %}
       | midModifier _ nextRelative _ unit {% d => makeFuzzy({ period: d[4], modifier: 'mid', relative: 'next' }) %}
       | lateModifier _ nextRelative _ unit {% d => makeFuzzy({ period: d[4], modifier: 'late', relative: 'next' }) %}
       | earlyModifier _ lastRelative _ unit {% d => makeFuzzy({ period: d[4], modifier: 'early', relative: 'last' }) %}
       | midModifier _ lastRelative _ unit {% d => makeFuzzy({ period: d[4], modifier: 'mid', relative: 'last' }) %}
       | lateModifier _ lastRelative _ unit {% d => makeFuzzy({ period: d[4], modifier: 'late', relative: 'last' }) %}
       | earlyModifier _ thisRelative _ unit {% d => makeFuzzy({ period: d[4], modifier: 'early', relative: 'this' }) %}
       | midModifier _ thisRelative _ unit {% d => makeFuzzy({ period: d[4], modifier: 'mid', relative: 'this' }) %}
       | lateModifier _ thisRelative _ unit {% d => makeFuzzy({ period: d[4], modifier: 'late', relative: 'this' }) %}
       | beginningConnector _ ofConnector _ theConnector _ unit {% d => makeFuzzy({ period: d[6], modifier: 'beginning' }) %}
       | middleConnector _ ofConnector _ theConnector _ unit {% d => makeFuzzy({ period: d[6], modifier: 'middle' }) %}
       | lastRelative _ unit _ ofConnector _ month {% d => makeFuzzy({ period: 'month', month: d[6], modifier: 'late' }) %}
       | ordinalWord _ unit _ ofConnector _ month {% d => makeFuzzy({ period: 'month', month: d[6], modifier: parseOrdinalWord(d[0]) <= 2 ? 'early' : (parseOrdinalWord(d[0]) >= 4 ? 'late' : 'mid') }) %}

# Duration expressions: "2 weeks", "30 days", "two hours", "1w 3d"
duration -> number _ unit {% d => makeDuration(d[0], d[2]) %}
          | wordNumber _ unit {% d => makeDuration(parseWordNumber(d[0]), d[2]) %}
          | abbreviatedDuration {% d => d[0] %}
          | halfWord _ wordNumber _ unit {% d => {
  const word = d[2].toLowerCase();
  // "half a day" = 0.5 days, "half two days" = 2.5 days
  if (word === 'a' || word === 'an') {
    return makeDuration(0.5, d[4]);
  }
  return makeDuration(parseWordNumber(d[2]) + 0.5, d[4]);
} %}
          | number _ andConnector _ halfWord _ unit {% d => makeDuration(d[0] + 0.5, d[6]) %}
          | wordNumber _ andConnector _ halfWord _ unit {% d => makeDuration(parseWordNumber(d[0]) + 0.5, d[6]) %}
          | wordNumber _ andConnector _ wordNumber _ halfWord _ unit {% d => makeDuration(parseWordNumber(d[0]) + 0.5, d[8]) %}
          | wordNumber _ unit _ andConnector _ wordNumber _ halfWord {% d => makeDuration(parseWordNumber(d[0]) + 0.5, d[2]) %}
          | halfWord _ unit {% d => makeDuration(0.5, d[2]) %}
          | duration _ andConnector _ duration {% d => ({ ...d[0], combined: [d[0], d[4]] }) %}
          | duration _ %comma _ duration {% d => ({ ...d[0], combined: [d[0], d[4]] }) %}
          | duration _ %comma _ andConnector _ duration {% d => ({ ...d[0], combined: [d[0], d[6]] }) %}
          | duration _ duration {% d => ({ ...d[0], combined: [d[0], d[2]] }) %}

# Abbreviated duration: "1w", "3d", "2h", "30m" (m=month), "1y"
abbreviatedDuration -> %abbreviatedDuration {% d => {
  const match = d[0].value.match(/^(\d+)([wdhsmy])$/);
  if (!match) return null;
  const value = parseInt(match[1], 10);
  // Note: 'm' is month (as per test expectations), not minute
  const unitMap: Record<string, string> = { w: 'week', d: 'day', h: 'hour', m: 'month', s: 'second', y: 'year' };
  return makeDuration(value, unitMap[match[2]]);
} %}

# Date expressions
date -> specialDay {% d => makeDate({ special: d[0] }) %}
      | relativeWeekday {% first %}
      | weekday {% d => makeDate({ weekday: d[0] }) %}
      | monthDayYear {% first %}
      | monthDay {% first %}
      | monthDayCompact {% first %}
      | monthYear {% first %}
      | dateFormat {% first %}
      | relativePeriod {% first %}
      | complexDate {% first %}
      | dateWithTime {% first %}
      | relativeMonth {% first %}
      | monthOnly {% first %}
      | yearOnly {% first %}
      | timeOnly {% first %}

# Compact month-day: "July10", "Jan15"
monthDayCompact -> %monthDayCompact {% d => {
  const parsed = parseMonthDayCompact(d[0].value);
  return makeDate({ month: parsed.month, day: parsed.day });
} %}

# Month only: "march", "january" (interpreted as start of month, with flag for range end handling)
monthOnly -> month {% d => makeDate({ month: d[0], day: 1, monthOnly: true }) %}

# Relative month: "last december", "next january"
relativeMonth -> nextRelative _ month {% d => makeDate({ month: d[2], day: 1, monthOnly: true, relativeMonth: 'next' }) %}
              | lastRelative _ month {% d => makeDate({ month: d[2], day: 1, monthOnly: true, relativeMonth: 'last' }) %}
              | thisRelative _ month {% d => makeDate({ month: d[2], day: 1, monthOnly: true, relativeMonth: 'this' }) %}

# Month with year: "december 2024", "january 2025"
monthYear -> month _ year {% d => makeDate({ month: d[0], year: d[2], day: 1, monthOnly: true }) %}

# Year only: "2024" (interpreted as start of year, only valid for reasonable year ranges)
yearOnly -> year {% (d, _, reject) => {
  const year = d[0];
  // Only accept 4-digit years in reasonable range (1900-2100)
  if (year < 1900 || year > 2100) return reject;
  return makeDate({ year, month: 1, day: 1, yearOnly: true });
} %}

# Time only: "9am", "5pm" (for time ranges on same day)
timeOnly -> time {% d => makeDate({ time: d[0], timeOnly: true }) %}
          | timeWord {% d => makeDate({ time: { special: d[0] }, timeOnly: true }) %}

# Special days
specialDay -> today {% d => 'today' %}
            | tomorrow {% d => 'tomorrow' %}
            | yesterday {% d => 'yesterday' %}
            | now {% d => 'now' %}
            | theConnector _ dayUnit _ afterConnector _ tomorrow {% d => 'dayAfterTomorrow' %}
            | dayUnit _ afterConnector _ tomorrow {% d => 'dayAfterTomorrow' %}
            | theConnector _ dayUnit _ beforeConnector _ yesterday {% d => 'dayBeforeYesterday' %}
            | dayUnit _ beforeConnector _ yesterday {% d => 'dayBeforeYesterday' %}

dayUnit -> %unit {% d => d[0].value === 'day' ? d[0] : null %}

# Relative weekday: "next monday", "last friday", "coming monday", "previous friday"
relativeWeekday -> nextRelative _ weekday {% d => makeDate({ weekday: d[2], relative: 'next' }) %}
                 | lastRelative _ weekday {% d => makeDate({ weekday: d[2], relative: 'last' }) %}
                 | thisRelative _ weekday {% d => makeDate({ weekday: d[2], relative: 'this' }) %}
                 | comingRelative _ weekday {% d => makeDate({ weekday: d[2], relative: 'next' }) %}
                 | previousRelative _ weekday {% d => makeDate({ weekday: d[2], relative: 'last' }) %}

# Relative periods: "next week", "last month"
relativePeriod -> nextRelative _ unit {% d => makeDate({ relative: 'next', period: d[2] }) %}
                | lastRelative _ unit {% d => makeDate({ relative: 'last', period: d[2] }) %}
                | thisRelative _ unit {% d => makeDate({ relative: 'this', period: d[2] }) %}

# Month + day: "march 15", "15th of march", "march fifteenth", "march the 15th"
monthDay -> month _ dayNumber {% d => makeDate({ month: d[0], day: d[2] }) %}
          | dayNumber _ month {% d => makeDate({ month: d[2], day: d[0] }) %}
          | dayNumber _ ofConnector _ month {% d => makeDate({ month: d[4], day: d[0] }) %}
          | theConnector _ dayNumber _ ofConnector _ month {% d => makeDate({ month: d[6], day: d[2] }) %}
          | month _ ordinalWord {% d => makeDate({ month: d[0], day: parseOrdinalWord(d[2]) }) %}
          | month _ theConnector _ dayNumber {% d => makeDate({ month: d[0], day: d[4] }) %}

# Month + day + year: "march 15, 2025", "march 15th 2025"
monthDayYear -> monthDay _ year {% d => ({ ...d[0], year: d[2] }) %}
              | monthDay %comma _ year {% d => ({ ...d[0], year: d[3] }) %}

# Date formats: "2025-03-15" (ISO), "03/15/2025" (US), "15/03/2025" (intl)
# We return raw parts and let the parser interpret based on dateFormat option
dateFormat -> %integer %dash %integer %dash %integer {% d => {
  const parts = [parseInt(d[0].value, 10), parseInt(d[2].value, 10), parseInt(d[4].value, 10)];
  // ISO format: YYYY-MM-DD
  if (parts[0] > 1000) {
    return makeDate({ year: parts[0], month: parts[1], day: parts[2] });
  }
  // Otherwise, could be MM-DD-YYYY or DD-MM-YYYY - store raw parts
  return makeDate({ formatParts: parts, separator: '-' });
} %}
            | %integer %slash %integer %slash %integer {% d => {
  const parts = [parseInt(d[0].value, 10), parseInt(d[2].value, 10), parseInt(d[4].value, 10)];
  // ISO-like format: YYYY/MM/DD
  if (parts[0] > 1000) {
    return makeDate({ year: parts[0], month: parts[1], day: parts[2] });
  }
  // Could be MM/DD/YYYY (US) or DD/MM/YYYY (intl) - store raw parts
  return makeDate({ formatParts: parts, separator: '/' });
} %}

# Date with time
dateWithTime -> date _ atConnector _ time {% d => ({ ...d[0], time: d[4] }) %}
              | date _ atConnector _ timeWord {% d => ({ ...d[0], time: { special: d[4] } }) %}
              | time _ date {% d => ({ ...d[2], time: d[0] }) %}
              | timeWord _ date {% d => ({ ...d[2], time: { special: d[0] } }) %}
              | date _ time {% d => ({ ...d[0], time: d[2] }) %}

# Complex date expressions: "next week monday 10am"
complexDate -> nextRelative _ unit _ weekday _ time {% d => makeDate({ relative: 'next', period: d[2], weekday: d[4], time: d[6] }) %}
             | nextRelative _ unit _ weekday {% d => makeDate({ relative: 'next', period: d[2], weekday: d[4] }) %}
             | lastRelative _ unit _ weekday _ time {% d => makeDate({ relative: 'last', period: d[2], weekday: d[4], time: d[6] }) %}
             | lastRelative _ unit _ weekday {% d => makeDate({ relative: 'last', period: d[2], weekday: d[4] }) %}
             | thisRelative _ unit _ weekday _ time {% d => makeDate({ relative: 'this', period: d[2], weekday: d[4], time: d[6] }) %}
             | thisRelative _ unit _ weekday {% d => makeDate({ relative: 'this', period: d[2], weekday: d[4] }) %}

# Time expressions
time -> %time {% d => {
  const parts = d[0].value.split(':');
  return { hour: parseInt(parts[0], 10), minute: parseInt(parts[1], 10) };
} %}
      | %time _ %ampm {% d => {
  const parts = d[0].value.split(':');
  let hour = parseInt(parts[0], 10);
  if (d[2].value === 'pm' && hour !== 12) hour += 12;
  if (d[2].value === 'am' && hour === 12) hour = 0;
  return { hour, minute: parseInt(parts[1], 10) };
} %}
      | %time %ampm {% d => {
  const parts = d[0].value.split(':');
  let hour = parseInt(parts[0], 10);
  if (d[1].value === 'pm' && hour !== 12) hour += 12;
  if (d[1].value === 'am' && hour === 12) hour = 0;
  return { hour, minute: parseInt(parts[1], 10) };
} %}
      | %integer _ %ampm {% d => {
  let hour = parseInt(d[0].value, 10);
  if (d[2].value === 'pm' && hour !== 12) hour += 12;
  if (d[2].value === 'am' && hour === 12) hour = 0;
  return { hour, minute: 0 };
} %}
      | %integer %ampm {% d => {
  let hour = parseInt(d[0].value, 10);
  if (d[1].value === 'pm' && hour !== 12) hour += 12;
  if (d[1].value === 'am' && hour === 12) hour = 0;
  return { hour, minute: 0 };
} %}

# Time words
timeWord -> noon {% d => 'noon' %}
          | midnight {% d => 'midnight' %}

# Terminal helpers
number -> %integer {% d => parseInt(d[0].value, 10) %}
        | %decimal {% d => parseFloat(d[0].value) %}

year -> %integer {% (d, _, reject) => {
  const val = parseInt(d[0].value, 10);
  // Only accept 4-digit years (1900-2100) to avoid ambiguity with day numbers
  if (val >= 1900 && val <= 2100) return val;
  return reject;
} %}

dayNumber -> %integer {% (d, _, reject) => {
  const val = parseInt(d[0].value, 10);
  if (val < 1 || val > 31) return reject;
  return val;
} %}
           | %ordinal {% d => parseOrdinal(d[0].value) %}

month -> %month {% d => parseMonth(d[0].value) %}

weekday -> %weekday {% d => d[0].value %}

quarter -> %quarter {% first %}

half -> %half {% first %}

season -> %season {% d => d[0].value %}

unit -> %unit {% d => d[0].value %}

# Specific unit matchers for quarter/half as words (not Q1/H1 notation)
quarterUnit -> %unit {% (d, _, reject) => {
  const val = d[0].value.toLowerCase();
  if (val === 'quarter' || val === 'quarters') return val;
  return reject;
} %}

halfUnit -> %unit {% (d, _, reject) => {
  const val = d[0].value.toLowerCase();
  if (val === 'half') return val;
  return reject;
} %}

yearUnit -> %unit {% (d, _, reject) => {
  const val = d[0].value.toLowerCase();
  if (val === 'year' || val === 'years' || val === 'yr' || val === 'yrs') return val;
  return reject;
} %}

wordNumber -> %wordNumber {% d => d[0].value %}

ordinalWord -> %ordinalWord {% d => d[0].value %}
            | %unit {% (d, _, reject) => {
  if (d[0].value === 'second') return 'second';
  return reject;
} %}

ordinal -> %ordinal {% d => d[0].value %}

halfWord -> %halfWord {% d => d[0].value %}

# Connectors - each has its own token type from the lexer
toConnector -> %kw_to {% first %}
fromConnector -> %kw_from {% first %}
forConnector -> %kw_for {% first %}
inConnector -> %kw_in {% first %}
onConnector -> %kw_on {% first %}
atConnector -> %kw_at {% first %}
ofConnector -> %kw_of {% first %}
theConnector -> %kw_the {% first %}
andConnector -> %kw_and {% first %}
betweenConnector -> %kw_between {% first %}
throughConnector -> %kw_through {% first %}
untilConnector -> %kw_until {% first %}
withinConnector -> %kw_within {% first %}
overConnector -> %kw_over {% first %}
duringConnector -> %kw_during {% first %}
startingConnector -> %kw_starting {% first %}
byConnector -> %kw_by {% first %}
aroundConnector -> %kw_around {% first %}
aboutConnector -> %kw_about {% first %}
roughlyConnector -> %kw_roughly {% first %}
approximatelyConnector -> %kw_approximately {% first %}
sometimeConnector -> %kw_sometime {% first %}
afterConnector -> %kw_after {% first %}
beforeConnector -> %kw_before {% first %}
endConnector -> %kw_end {% first %}
beginningConnector -> %kw_beginning {% first %}
startConnector -> %kw_start {% first %}
middleConnector -> %kw_middle {% first %}

# Modifier tokens for fuzzy periods
earlyModifier -> %kw_early {% first %}
midModifier -> %kw_mid {% first %}
lateModifier -> %kw_late {% first %}

# Relative keywords - each has its own token type from the lexer
nextRelative -> %kw_next {% first %}
lastRelative -> %kw_last {% first %}
thisRelative -> %kw_this {% first %}
previousRelative -> %kw_previous {% first %}
comingRelative -> %kw_coming {% first %}
upcomingRelative -> %kw_upcoming {% first %}
pastRelative -> %kw_past {% first %}

# Time words - each has its own token type from the lexer
today -> %kw_today {% first %}
tomorrow -> %kw_tomorrow {% first %}
yesterday -> %kw_yesterday {% first %}
now -> %kw_now {% first %}
noon -> %kw_noon {% first %}
midnight -> %kw_midnight {% first %}

# Optional whitespace
_ -> %ws:* {% nuller %}
