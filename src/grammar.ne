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

const makeTitled = (title: string, expression: any): TitledNode => ({
  nodeType: 'titled',
  title: title.trim(),
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
    'eleventh': 11, 'twelfth': 12,
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
titledExpression -> titleText %dash _ expression {% d => makeTitled(d[0], d[3]) %}
                  | titleText %colon _ expression {% d => makeTitled(d[0], d[3]) %}
                  | titleText _ %lparen expression %rparen {% d => makeTitled(d[0], d[3]) %}
                  | titleText _ %lbracket expression %rbracket {% d => makeTitled(d[0], d[3]) %}
                  | titleText _ onConnector _ expression {% d => makeTitled(d[0], d[4]) %}
                  | titleText _ inConnector _ expression {% d => makeTitled(d[0], d[4]) %}
                  | titleText _ forConnector _ expression {% d => makeTitled(d[0], d[4]) %}
                  | titleText _ fromConnector _ expression {% d => makeTitled(d[0], d[4]) %}
                  | titleText _ duringConnector _ expression {% d => makeTitled(d[0], d[4]) %}
                  | titleText _ startingConnector _ expression {% d => makeTitled(d[0], d[4]) %}

# Title text - words that aren't time expressions
titleText -> titleWord {% d => d[0] %}
           | titleText _ titleWord {% d => d[0] + ' ' + d[2] %}

titleWord -> %word {% d => d[0].value %}
           | %integer {% d => d[0].value %}
           | %colon {% d => ':' %}
           | %dash {% d => '-' %}
           | %lparen titleText %rparen {% d => '(' + d[1] + ')' %}
           | %lbracket titleText %rbracket {% d => '[' + d[1] + ']' %}

# Expression types
expression -> range {% first %}
            | span {% first %}
            | relative {% first %}
            | fuzzy {% first %}
            | duration {% first %}
            | date {% first %}

# Range expressions: "jan 5 to jan 19", "from march to april"
range -> date _ toConnector _ date {% d => makeRange(d[0], d[4]) %}
       | fromConnector _ date _ toConnector _ date {% d => makeRange(d[2], d[6]) %}
       | date _ %dash _ date {% d => makeRange(d[0], d[4]) %}
       | betweenConnector _ date _ andConnector _ date {% d => makeRange(d[2], d[6]) %}
       | date _ throughConnector _ date {% d => makeRange(d[0], d[4]) %}
       | date _ untilConnector _ date {% d => makeRange(d[0], d[4]) %}
       | untilConnector _ date {% d => makeRange(makeDate({ special: 'today' }), d[2]) %}
       | fuzzy _ toConnector _ fuzzy {% d => makeRange(d[0], d[4]) %}
       | fromConnector _ fuzzy _ toConnector _ fuzzy {% d => makeRange(d[2], d[6]) %}

# Span expressions: "jan 5 for 2 weeks", "starting march 1 for 10 days"
span -> date _ forConnector _ duration {% d => makeSpan(d[0], d[4]) %}
      | inConnector _ fuzzy _ forConnector _ duration {% d => makeSpan(d[2], d[6]) %}
      | inConnector _ date _ forConnector _ duration {% d => makeSpan(d[2], d[6]) %}
      | startingConnector _ date _ forConnector _ duration {% d => makeSpan(d[2], d[6]) %}
      | startingConnector _ date {% d => makeSpan(d[2]) %}
      | date _ startingConnector _ date {% d => makeSpan(d[4], d[0]) %}
      | duration _ startingConnector _ date {% d => makeSpan(d[4], d[0]) %}
      | duration _ fromConnector _ date {% d => makeSpan(d[4], d[0]) %}
      | duration _ inConnector _ fuzzy {% d => makeSpan(d[4], d[0]) %}

# Relative duration expressions: "last 30 days", "next 2 weeks"
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
          | lastRelative _ unit {% d => makeRelative('past', makeDuration(1, d[2])) %}
          | nextRelative _ unit {% d => makeRelative('future', makeDuration(1, d[2])) %}
          | pastRelative _ unit {% d => makeRelative('past', makeDuration(1, d[2])) %}
          | previousRelative _ unit {% d => makeRelative('past', makeDuration(1, d[2])) %}
          | comingRelative _ unit {% d => makeRelative('future', makeDuration(1, d[2])) %}
          | upcomingRelative _ unit {% d => makeRelative('future', makeDuration(1, d[2])) %}

# Fuzzy period expressions: "Q1", "early march", "end of january"
# Note: month non-terminal already returns a number from parseMonth, so don't call parseMonth again
fuzzy -> quarter {% d => makeFuzzy({ period: 'quarter', quarter: parseQuarter(d[0].value) }) %}
       | quarter _ year {% d => makeFuzzy({ period: 'quarter', quarter: parseQuarter(d[0].value), year: d[2] }) %}
       | half {% d => makeFuzzy({ period: 'half', half: parseHalf(d[0].value) }) %}
       | half _ year {% d => makeFuzzy({ period: 'half', half: parseHalf(d[0].value), year: d[2] }) %}
       | modifier _ month {% d => makeFuzzy({ period: 'month', month: d[2], modifier: d[0] }) %}
       | modifier _ quarter {% d => makeFuzzy({ period: 'quarter', quarter: parseQuarter(d[2].value), modifier: d[0] }) %}
       | modifier _ year {% d => makeFuzzy({ period: 'year', year: d[2], modifier: d[0] }) %}
       | endConnector _ ofConnector _ month {% d => makeFuzzy({ period: 'month', month: d[4], modifier: 'end' }) %}
       | endConnector _ ofConnector _ year {% d => makeFuzzy({ period: 'year', year: d[4], modifier: 'end' }) %}
       | endConnector _ ofConnector _ quarter {% d => makeFuzzy({ period: 'quarter', quarter: parseQuarter(d[4].value), modifier: 'end' }) %}
       | endConnector _ ofConnector _ theConnector _ month {% d => makeFuzzy({ period: 'month', month: d[6], modifier: 'end' }) %}
       | endConnector _ ofConnector _ theConnector _ unit {% d => makeFuzzy({ period: d[6], modifier: 'end' }) %}
       | beginningConnector _ ofConnector _ month {% d => makeFuzzy({ period: 'month', month: d[4], modifier: 'beginning' }) %}
       | beginningConnector _ ofConnector _ year {% d => makeFuzzy({ period: 'year', year: d[4], modifier: 'beginning' }) %}
       | startConnector _ ofConnector _ month {% d => makeFuzzy({ period: 'month', month: d[4], modifier: 'start' }) %}
       | startConnector _ ofConnector _ year {% d => makeFuzzy({ period: 'year', year: d[4], modifier: 'start' }) %}
       | middleConnector _ ofConnector _ month {% d => makeFuzzy({ period: 'month', month: d[4], modifier: 'middle' }) %}
       | middleConnector _ ofConnector _ year {% d => makeFuzzy({ period: 'year', year: d[4], modifier: 'middle' }) %}
       | season {% d => makeFuzzy({ period: 'season', season: d[0] }) %}
       | season _ year {% d => makeFuzzy({ period: 'season', season: d[0], year: d[2] }) %}
       | ordinalWord _ quarter _ year {% d => makeFuzzy({ period: 'quarter', quarter: parseOrdinalWord(d[0]), year: d[4] }) %}
       | ordinalWord _ quarter {% d => makeFuzzy({ period: 'quarter', quarter: parseOrdinalWord(d[0]) }) %}
       | ordinalWord _ half _ year {% d => makeFuzzy({ period: 'half', half: parseOrdinalWord(d[0]), year: d[4] }) %}
       | ordinalWord _ half {% d => makeFuzzy({ period: 'half', half: parseOrdinalWord(d[0]) }) %}
       | aroundConnector _ date {% d => makeFuzzy({ ...d[2], period: 'around' }) %}
       | aboutConnector _ date {% d => makeFuzzy({ ...d[2], period: 'around' }) %}
       | sometimeConnector _ inConnector _ fuzzy {% d => d[4] %}

# Duration expressions: "2 weeks", "30 days", "two hours"
duration -> number _ unit {% d => makeDuration(d[0], d[2]) %}
          | wordNumber _ unit {% d => makeDuration(parseWordNumber(d[0]), d[2]) %}
          | halfWord _ wordNumber _ unit {% d => makeDuration(parseWordNumber(d[2]) + 0.5, d[4]) %}
          | number _ andConnector _ halfWord _ unit {% d => makeDuration(d[0] + 0.5, d[6]) %}
          | halfWord _ unit {% d => makeDuration(0.5, d[2]) %}
          | duration _ andConnector _ duration {% d => ({ ...d[0], combined: [d[0], d[4]] }) %}
          | duration _ duration {% d => ({ ...d[0], combined: [d[0], d[2]] }) %}

# Date expressions
date -> specialDay {% d => makeDate({ special: d[0] }) %}
      | relativeWeekday {% first %}
      | weekday {% d => makeDate({ weekday: d[0] }) %}
      | monthDay {% first %}
      | monthDayYear {% first %}
      | relativePeriod {% first %}
      | dateWithTime {% first %}

# Special days
specialDay -> today {% d => 'today' %}
            | tomorrow {% d => 'tomorrow' %}
            | yesterday {% d => 'yesterday' %}
            | now {% d => 'now' %}

# Relative weekday: "next monday", "last friday"
relativeWeekday -> nextRelative _ weekday {% d => makeDate({ weekday: d[2], relative: 'next' }) %}
                 | lastRelative _ weekday {% d => makeDate({ weekday: d[2], relative: 'last' }) %}
                 | thisRelative _ weekday {% d => makeDate({ weekday: d[2], relative: 'this' }) %}

# Relative periods: "next week", "last month"
relativePeriod -> nextRelative _ unit {% d => makeDate({ relative: 'next', period: d[2] }) %}
                | lastRelative _ unit {% d => makeDate({ relative: 'last', period: d[2] }) %}
                | thisRelative _ unit {% d => makeDate({ relative: 'this', period: d[2] }) %}

# Month + day: "march 15", "15th of march"
monthDay -> month _ dayNumber {% d => makeDate({ month: d[0], day: d[2] }) %}
          | dayNumber _ month {% d => makeDate({ month: d[2], day: d[0] }) %}
          | dayNumber _ ofConnector _ month {% d => makeDate({ month: d[4], day: d[0] }) %}
          | theConnector _ dayNumber _ ofConnector _ month {% d => makeDate({ month: d[6], day: d[2] }) %}

# Month + day + year: "march 15, 2025", "march 15th 2025"
monthDayYear -> monthDay _ year {% d => ({ ...d[0], year: d[2] }) %}
              | monthDay %comma _ year {% d => ({ ...d[0], year: d[3] }) %}

# Date with time
dateWithTime -> date _ atConnector _ time {% d => ({ ...d[0], time: d[4] }) %}
              | date _ atConnector _ timeWord {% d => ({ ...d[0], time: { special: d[4] } }) %}
              | time _ date {% d => ({ ...d[2], time: d[0] }) %}
              | timeWord _ date {% d => ({ ...d[2], time: { special: d[0] } }) %}

# Time expressions
time -> %time {% d => {
  const parts = d[0].value.split(':');
  return { hour: parseInt(parts[0], 10), minute: parseInt(parts[1], 10) };
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

year -> %integer {% d => parseInt(d[0].value, 10) %}

dayNumber -> %integer {% d => parseInt(d[0].value, 10) %}
           | %ordinal {% d => parseOrdinal(d[0].value) %}

month -> %month {% d => parseMonth(d[0].value) %}

weekday -> %weekday {% d => d[0].value %}

quarter -> %quarter {% first %}

half -> %half {% first %}

season -> %season {% d => d[0].value %}

unit -> %unit {% d => d[0].value %}

wordNumber -> %wordNumber {% d => d[0].value %}

ordinalWord -> %ordinalWord {% d => d[0].value %}

modifier -> %modifier {% d => d[0].value %}

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
sometimeConnector -> %kw_sometime {% first %}
endConnector -> %modifier {% d => d[0].value === 'end' ? d[0] : null %}
beginningConnector -> %modifier {% d => d[0].value === 'beginning' ? d[0] : null %}
startConnector -> %modifier {% d => d[0].value === 'start' ? d[0] : null %}
middleConnector -> %modifier {% d => d[0].value === 'middle' ? d[0] : null %}

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
