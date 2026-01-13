// @ts-nocheck
// Generated automatically by nearley, version 2.20.1
// http://github.com/Hardmath123/nearley
// Bypasses TS6133. Allow declared but unused functions.
// @ts-ignore
function id(d: any[]): any { return d[0]; }
declare var dash: any;
declare var colon: any;
declare var lparen: any;
declare var rparen: any;
declare var lbracket: any;
declare var rbracket: any;
declare var word: any;
declare var wordNumber: any;
declare var integer: any;
declare var otherKeyword: any;
declare var decimal: any;
declare var quarter: any;
declare var half: any;
declare var slash: any;
declare var other: any;
declare var monthDayCompact: any;
declare var comma: any;
declare var abbreviatedDuration: any;
declare var unit: any;
declare var time: any;
declare var ampm: any;
declare var ordinal: any;
declare var month: any;
declare var weekday: any;
declare var season: any;
declare var ordinalWord: any;
declare var halfWord: any;
declare var kw_to: any;
declare var kw_from: any;
declare var kw_for: any;
declare var kw_in: any;
declare var kw_on: any;
declare var kw_at: any;
declare var kw_of: any;
declare var kw_the: any;
declare var kw_and: any;
declare var kw_between: any;
declare var kw_through: any;
declare var kw_until: any;
declare var kw_within: any;
declare var kw_over: any;
declare var kw_during: any;
declare var kw_starting: any;
declare var kw_by: any;
declare var kw_around: any;
declare var kw_about: any;
declare var kw_roughly: any;
declare var kw_approximately: any;
declare var kw_sometime: any;
declare var kw_after: any;
declare var kw_before: any;
declare var kw_end: any;
declare var kw_beginning: any;
declare var kw_start: any;
declare var kw_middle: any;
declare var kw_early: any;
declare var kw_mid: any;
declare var kw_late: any;
declare var kw_next: any;
declare var kw_last: any;
declare var kw_this: any;
declare var kw_previous: any;
declare var kw_coming: any;
declare var kw_upcoming: any;
declare var kw_past: any;
declare var kw_today: any;
declare var kw_tomorrow: any;
declare var kw_yesterday: any;
declare var kw_now: any;
declare var kw_noon: any;
declare var kw_midnight: any;
declare var kw_ago: any;
declare var ws: any;

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

interface RelativeDateNode {
  nodeType: 'relativeDate';
  direction: 'past' | 'future';
  duration: DurationNode;
  baseDate?: DateNode;
  time?: { hour: number; minute: number } | { special: string };
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

const makeRelativeDate = (direction: 'past' | 'future', duration: DurationNode, baseDate?: DateNode, time?: any): RelativeDateNode => ({
  nodeType: 'relativeDate',
  direction,
  duration,
  baseDate,
  time,
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

interface NearleyToken {
  value: any;
  [key: string]: any;
};

interface NearleyLexer {
  reset: (chunk: string, info: any) => void;
  next: () => NearleyToken | undefined;
  save: () => any;
  formatError: (token: never) => string;
  has: (tokenType: string) => boolean;
};

interface NearleyRule {
  name: string;
  symbols: NearleySymbol[];
  postprocess?: (d: any[], loc?: number, reject?: {}) => any;
};

type NearleySymbol = string | { literal: any } | { test: (token: any) => boolean };

interface Grammar {
  Lexer: NearleyLexer | undefined;
  ParserRules: NearleyRule[];
  ParserStart: string;
};

const grammar: Grammar = {
  Lexer: lexer,
  ParserRules: [
    {"name": "main", "symbols": ["titledExpression"], "postprocess": first},
    {"name": "main", "symbols": ["expression"], "postprocess": first},
    {"name": "titledExpression", "symbols": ["titleTextSimple", "_", (lexer.has("dash") ? {type: "dash"} : dash), "_", "expression"], "postprocess": d => makeTitled(d[0].text, d[4], d[0].start, d[0].end)},
    {"name": "titledExpression", "symbols": ["titleText", (lexer.has("colon") ? {type: "colon"} : colon), "_", "expression"], "postprocess": d => makeTitled(d[0].text, d[3], d[0].start, d[0].end)},
    {"name": "titledExpression", "symbols": ["titleText", "_", (lexer.has("lparen") ? {type: "lparen"} : lparen), "expression", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": d => makeTitled(d[0].text, d[3], d[0].start, d[0].end)},
    {"name": "titledExpression", "symbols": ["titleText", "_", (lexer.has("lbracket") ? {type: "lbracket"} : lbracket), "expression", (lexer.has("rbracket") ? {type: "rbracket"} : rbracket)], "postprocess": d => makeTitled(d[0].text, d[3], d[0].start, d[0].end)},
    {"name": "titledExpression", "symbols": ["titleText", "_", "onConnector", "_", "expression"], "postprocess": d => makeTitled(d[0].text, d[4], d[0].start, d[0].end)},
    {"name": "titledExpression", "symbols": ["titleText", "_", "atConnector", "_", "expression"], "postprocess": d => makeTitled(d[0].text, d[4], d[0].start, d[0].end)},
    {"name": "titledExpression", "symbols": ["titleText", "_", "inConnector", "_", "expression"], "postprocess": d => makeTitled(d[0].text, d[4], d[0].start, d[0].end)},
    {"name": "titledExpression", "symbols": ["titleText", "_", "forConnector", "_", "expression"], "postprocess": d => makeTitled(d[0].text, d[4], d[0].start, d[0].end)},
    {"name": "titledExpression", "symbols": ["titleText", "_", "fromConnector", "_", "expression"], "postprocess": d => makeTitled(d[0].text, d[4], d[0].start, d[0].end)},
    {"name": "titledExpression", "symbols": ["titleText", "_", "duringConnector", "_", "expression"], "postprocess": d => makeTitled(d[0].text, d[4], d[0].start, d[0].end)},
    {"name": "titledExpression", "symbols": ["titleText", "_", "startingConnector", "_", "expression"], "postprocess": d => makeTitled(d[0].text, d[4], d[0].start, d[0].end)},
    {"name": "titledExpression", "symbols": ["titleText", "_", "byConnector", "_", "expression"], "postprocess": d => makeTitled(d[0].text, d[4], d[0].start, d[0].end)},
    {"name": "titledExpression", "symbols": ["titleText", "_", (lexer.has("dash") ? {type: "dash"} : dash), "_", "byConnector", "_", "expression"], "postprocess": d => makeTitled(d[0].text, d[6], d[0].start, d[0].end)},
    {"name": "titledExpression", "symbols": ["expression", "_", "postTitle"], "postprocess": d => makeTitled(d[2].text, d[0], d[2].start, d[2].end)},
    {"name": "postTitle", "symbols": [(lexer.has("word") ? {type: "word"} : word)], "postprocess": d => ({ text: d[0].value, start: d[0].offset, end: d[0].offset + d[0].text.length })},
    {"name": "postTitle", "symbols": ["postTitle", "_", (lexer.has("word") ? {type: "word"} : word)], "postprocess": d => ({ text: d[0].text + ' ' + d[2].value, start: d[0].start, end: d[2].offset + d[2].text.length })},
    {"name": "titleText", "symbols": ["titleWord"], "postprocess": d => ({ text: d[0].text, start: d[0].start, end: d[0].end })},
    {"name": "titleText", "symbols": ["versionNumber"], "postprocess": d => d[0]},
    {"name": "titleText", "symbols": ["hyphenatedWord"], "postprocess": d => d[0]},
    {"name": "titleText", "symbols": ["titleText", "_", "titleWord"], "postprocess": d => ({ text: d[0].text + ' ' + d[2].text, start: d[0].start, end: d[2].end })},
    {"name": "titleText", "symbols": ["titleText", "_", "versionNumber"], "postprocess": d => ({ text: d[0].text + ' ' + d[2].text, start: d[0].start, end: d[2].end })},
    {"name": "titleText", "symbols": ["titleText", "_", "hyphenatedWord"], "postprocess": d => ({ text: d[0].text + ' ' + d[2].text, start: d[0].start, end: d[2].end })},
    {"name": "titleText", "symbols": ["titleText", "_", (lexer.has("dash") ? {type: "dash"} : dash), "_", "titleWord"], "postprocess": d => ({ text: d[0].text + ' - ' + d[4].text, start: d[0].start, end: d[4].end })},
    {"name": "titleText", "symbols": ["titleText", "_", (lexer.has("dash") ? {type: "dash"} : dash), "_", "versionNumber"], "postprocess": d => ({ text: d[0].text + ' - ' + d[4].text, start: d[0].start, end: d[4].end })},
    {"name": "titleWord", "symbols": [(lexer.has("word") ? {type: "word"} : word)], "postprocess": d => ({ text: d[0].value, start: d[0].offset, end: d[0].offset + d[0].text.length })},
    {"name": "titleWord", "symbols": [(lexer.has("wordNumber") ? {type: "wordNumber"} : wordNumber)], "postprocess": d => ({ text: d[0].value, start: d[0].offset, end: d[0].offset + d[0].text.length })},
    {"name": "titleWord", "symbols": [(lexer.has("integer") ? {type: "integer"} : integer)], "postprocess": d => ({ text: d[0].value, start: d[0].offset, end: d[0].offset + d[0].text.length })},
    {"name": "titleWord", "symbols": [(lexer.has("otherKeyword") ? {type: "otherKeyword"} : otherKeyword)], "postprocess": d => ({ text: d[0].value, start: d[0].offset, end: d[0].offset + d[0].text.length })},
    {"name": "titleWord", "symbols": [(lexer.has("decimal") ? {type: "decimal"} : decimal)], "postprocess": d => ({ text: d[0].value, start: d[0].offset, end: d[0].offset + d[0].text.length })},
    {"name": "titleWord", "symbols": [(lexer.has("quarter") ? {type: "quarter"} : quarter)], "postprocess": d => ({ text: d[0].value, start: d[0].offset, end: d[0].offset + d[0].text.length })},
    {"name": "titleWord", "symbols": [(lexer.has("half") ? {type: "half"} : half)], "postprocess": d => ({ text: d[0].value, start: d[0].offset, end: d[0].offset + d[0].text.length })},
    {"name": "titleWord", "symbols": [(lexer.has("lparen") ? {type: "lparen"} : lparen), "titleText", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": d => ({ text: '(' + d[1].text + ')', start: d[0].offset, end: d[2].offset + 1 })},
    {"name": "titleWord", "symbols": [(lexer.has("lbracket") ? {type: "lbracket"} : lbracket), "titleText", (lexer.has("rbracket") ? {type: "rbracket"} : rbracket)], "postprocess": d => ({ text: '[' + d[1].text + ']', start: d[0].offset, end: d[2].offset + 1 })},
    {"name": "titleWord", "symbols": [(lexer.has("slash") ? {type: "slash"} : slash)], "postprocess": d => ({ text: '/', start: d[0].offset, end: d[0].offset + 1 })},
    {"name": "titleWord", "symbols": [(lexer.has("colon") ? {type: "colon"} : colon)], "postprocess": d => ({ text: ':', start: d[0].offset, end: d[0].offset + 1 })},
    {"name": "titleWord", "symbols": ["hashNumber"], "postprocess": d => d[0]},
    {"name": "hyphenatedWord", "symbols": [(lexer.has("word") ? {type: "word"} : word), (lexer.has("dash") ? {type: "dash"} : dash), (lexer.has("word") ? {type: "word"} : word)], "postprocess": d => ({ text: d[0].value + '-' + d[2].value, start: d[0].offset, end: d[2].offset + d[2].text.length })},
    {"name": "hyphenatedWord", "symbols": [(lexer.has("word") ? {type: "word"} : word), (lexer.has("dash") ? {type: "dash"} : dash), (lexer.has("integer") ? {type: "integer"} : integer)], "postprocess": d => ({ text: d[0].value + '-' + d[2].value, start: d[0].offset, end: d[2].offset + d[2].text.length })},
    {"name": "hashNumber", "symbols": [(lexer.has("other") ? {type: "other"} : other), (lexer.has("integer") ? {type: "integer"} : integer)], "postprocess":  (d, _, reject) => {
          if (d[0].value !== '#') return reject;
          return { text: '#' + d[1].value, start: d[0].offset, end: d[1].offset + d[1].text.length };
        } },
    {"name": "versionNumber", "symbols": [(lexer.has("word") ? {type: "word"} : word), (lexer.has("other") ? {type: "other"} : other), (lexer.has("integer") ? {type: "integer"} : integer)], "postprocess":  (d, _, reject) => {
          if (d[1].value !== '.') return reject;
          return { text: d[0].value + '.' + d[2].value, start: d[0].offset, end: d[2].offset + d[2].text.length };
        } },
    {"name": "versionNumber", "symbols": [(lexer.has("word") ? {type: "word"} : word), (lexer.has("other") ? {type: "other"} : other), (lexer.has("integer") ? {type: "integer"} : integer), (lexer.has("other") ? {type: "other"} : other), (lexer.has("integer") ? {type: "integer"} : integer)], "postprocess":  (d, _, reject) => {
          if (d[1].value !== '.' || d[3].value !== '.') return reject;
          return { text: d[0].value + '.' + d[2].value + '.' + d[4].value, start: d[0].offset, end: d[4].offset + d[4].text.length };
        } },
    {"name": "versionNumber", "symbols": [(lexer.has("word") ? {type: "word"} : word), (lexer.has("other") ? {type: "other"} : other), (lexer.has("integer") ? {type: "integer"} : integer), (lexer.has("other") ? {type: "other"} : other), (lexer.has("integer") ? {type: "integer"} : integer), (lexer.has("other") ? {type: "other"} : other), (lexer.has("integer") ? {type: "integer"} : integer)], "postprocess":  (d, _, reject) => {
          if (d[1].value !== '.' || d[3].value !== '.' || d[5].value !== '.') return reject;
          return { text: d[0].value + '.' + d[2].value + '.' + d[4].value + '.' + d[6].value, start: d[0].offset, end: d[6].offset + d[6].text.length };
        } },
    {"name": "versionNumber", "symbols": [(lexer.has("word") ? {type: "word"} : word), (lexer.has("other") ? {type: "other"} : other), (lexer.has("decimal") ? {type: "decimal"} : decimal)], "postprocess":  (d, _, reject) => {
          if (d[1].value !== '.') return reject;
          return { text: d[0].value + '.' + d[2].value, start: d[0].offset, end: d[2].offset + d[2].text.length };
        } },
    {"name": "versionNumber", "symbols": [(lexer.has("decimal") ? {type: "decimal"} : decimal)], "postprocess": d => ({ text: d[0].value, start: d[0].offset, end: d[0].offset + d[0].text.length })},
    {"name": "titleTextSimple", "symbols": ["titleWord"], "postprocess": d => d[0]},
    {"name": "titleTextSimple", "symbols": ["hyphenatedWord"], "postprocess": d => d[0]},
    {"name": "titleTextSimple", "symbols": ["versionNumber"], "postprocess": d => d[0]},
    {"name": "titleTextSimple", "symbols": ["titleTextSimple", "_", "titleWord"], "postprocess": d => ({ text: d[0].text + ' ' + d[2].text, start: d[0].start, end: d[2].end })},
    {"name": "titleTextSimple", "symbols": ["titleTextSimple", "_", "hyphenatedWord"], "postprocess": d => ({ text: d[0].text + ' ' + d[2].text, start: d[0].start, end: d[2].end })},
    {"name": "titleTextSimple", "symbols": ["titleTextSimple", "_", "versionNumber"], "postprocess": d => ({ text: d[0].text + ' ' + d[2].text, start: d[0].start, end: d[2].end })},
    {"name": "titleTextSimple", "symbols": ["titleTextSimple", (lexer.has("slash") ? {type: "slash"} : slash), "titleWord"], "postprocess": d => ({ text: d[0].text + '/' + d[2].text, start: d[0].start, end: d[2].end })},
    {"name": "titleTextSimple", "symbols": ["titleTextSimple", (lexer.has("colon") ? {type: "colon"} : colon), "_", "titleWord"], "postprocess": d => ({ text: d[0].text + ': ' + d[3].text, start: d[0].start, end: d[3].end })},
    {"name": "expression", "symbols": ["range"], "postprocess": first},
    {"name": "expression", "symbols": ["span"], "postprocess": first},
    {"name": "expression", "symbols": ["relativeDate"], "postprocess": first},
    {"name": "expression", "symbols": ["relative"], "postprocess": first},
    {"name": "expression", "symbols": ["fuzzy"], "postprocess": first},
    {"name": "expression", "symbols": ["forDuration"], "postprocess": first},
    {"name": "expression", "symbols": ["duration"], "postprocess": first},
    {"name": "expression", "symbols": ["date"], "postprocess": first},
    {"name": "forDuration", "symbols": ["forConnector", "_", "duration"], "postprocess": d => d[2]},
    {"name": "relativeDate", "symbols": ["duration", "_", "agoConnector"], "postprocess": d => makeRelativeDate('past', d[0])},
    {"name": "relativeDate", "symbols": ["wordNumber", "_", "unit", "_", "agoConnector"], "postprocess": d => makeRelativeDate('past', makeDuration(parseWordNumber(d[0]), d[2]))},
    {"name": "relativeDate", "symbols": ["duration", "_", "agoConnector", "_", "atConnector", "_", "time"], "postprocess": d => makeRelativeDate('past', d[0], undefined, d[6])},
    {"name": "relativeDate", "symbols": ["duration", "_", "agoConnector", "_", "atConnector", "_", "timeWord"], "postprocess": d => makeRelativeDate('past', d[0], undefined, { special: d[6] })},
    {"name": "relativeDate", "symbols": ["inConnector", "_", "duration"], "postprocess": d => makeRelativeDate('future', d[2])},
    {"name": "relativeDate", "symbols": ["inConnector", "_", "wordNumber", "_", "unit"], "postprocess": d => makeRelativeDate('future', makeDuration(parseWordNumber(d[2]), d[4]))},
    {"name": "relativeDate", "symbols": ["inConnector", "_", "duration", "_", "atConnector", "_", "time"], "postprocess": d => makeRelativeDate('future', d[2], undefined, d[6])},
    {"name": "relativeDate", "symbols": ["inConnector", "_", "duration", "_", "atConnector", "_", "timeWord"], "postprocess": d => makeRelativeDate('future', d[2], undefined, { special: d[6] })},
    {"name": "relativeDate", "symbols": ["duration", "_", "fromConnector", "_", "now"], "postprocess": d => makeRelativeDate('future', d[0], makeDate({ special: 'now' }))},
    {"name": "relativeDate", "symbols": ["duration", "_", "fromConnector", "_", "today"], "postprocess": d => makeRelativeDate('future', d[0], makeDate({ special: 'today' }))},
    {"name": "relativeDate", "symbols": ["duration", "_", "fromConnector", "_", "tomorrow"], "postprocess": d => makeRelativeDate('future', d[0], makeDate({ special: 'tomorrow' }))},
    {"name": "relativeDate", "symbols": ["duration", "_", "fromConnector", "_", "yesterday"], "postprocess": d => makeRelativeDate('future', d[0], makeDate({ special: 'yesterday' }))},
    {"name": "relativeDate", "symbols": ["wordNumber", "_", "unit", "_", "fromConnector", "_", "now"], "postprocess": d => makeRelativeDate('future', makeDuration(parseWordNumber(d[0]), d[2]), makeDate({ special: 'now' }))},
    {"name": "relativeDate", "symbols": ["wordNumber", "_", "unit", "_", "fromConnector", "_", "today"], "postprocess": d => makeRelativeDate('future', makeDuration(parseWordNumber(d[0]), d[2]), makeDate({ special: 'today' }))},
    {"name": "relativeDate", "symbols": ["wordNumber", "_", "unit", "_", "fromConnector", "_", "tomorrow"], "postprocess": d => makeRelativeDate('future', makeDuration(parseWordNumber(d[0]), d[2]), makeDate({ special: 'tomorrow' }))},
    {"name": "relativeDate", "symbols": ["wordNumber", "_", "unit", "_", "fromConnector", "_", "yesterday"], "postprocess": d => makeRelativeDate('future', makeDuration(parseWordNumber(d[0]), d[2]), makeDate({ special: 'yesterday' }))},
    {"name": "relativeDate", "symbols": ["duration", "_", "fromConnector", "_", "now", "_", "atConnector", "_", "time"], "postprocess": d => makeRelativeDate('future', d[0], makeDate({ special: 'now' }), d[8])},
    {"name": "relativeDate", "symbols": ["duration", "_", "fromConnector", "_", "now", "_", "atConnector", "_", "timeWord"], "postprocess": d => makeRelativeDate('future', d[0], makeDate({ special: 'now' }), { special: d[8] })},
    {"name": "relativeDate", "symbols": ["duration", "_", "fromConnector", "_", "today", "_", "atConnector", "_", "time"], "postprocess": d => makeRelativeDate('future', d[0], makeDate({ special: 'today' }), d[8])},
    {"name": "relativeDate", "symbols": ["duration", "_", "fromConnector", "_", "tomorrow", "_", "atConnector", "_", "time"], "postprocess": d => makeRelativeDate('future', d[0], makeDate({ special: 'tomorrow' }), d[8])},
    {"name": "relativeDate", "symbols": ["duration", "_", "fromConnector", "_", "yesterday", "_", "atConnector", "_", "time"], "postprocess": d => makeRelativeDate('future', d[0], makeDate({ special: 'yesterday' }), d[8])},
    {"name": "agoConnector", "symbols": [(lexer.has("kw_ago") ? {type: "kw_ago"} : kw_ago)], "postprocess": first},
    {"name": "range", "symbols": ["date", "_", "toConnector", "_", "date"], "postprocess": d => makeRange(d[0], d[4])},
    {"name": "range", "symbols": ["fromConnector", "_", "date", "_", "toConnector", "_", "date"], "postprocess": d => makeRange(d[2], d[6])},
    {"name": "range", "symbols": ["date", "_", (lexer.has("dash") ? {type: "dash"} : dash), "_", "date"], "postprocess": d => makeRange(d[0], d[4])},
    {"name": "range", "symbols": [(lexer.has("monthDayCompact") ? {type: "monthDayCompact"} : monthDayCompact), (lexer.has("dash") ? {type: "dash"} : dash), (lexer.has("monthDayCompact") ? {type: "monthDayCompact"} : monthDayCompact)], "postprocess":  d => {
          const start = parseMonthDayCompact(d[0].value);
          const end = parseMonthDayCompact(d[2].value);
          return makeRange(makeDate({ month: start.month, day: start.day }), makeDate({ month: end.month, day: end.day }));
        } },
    {"name": "range", "symbols": [(lexer.has("monthDayCompact") ? {type: "monthDayCompact"} : monthDayCompact), "_", (lexer.has("dash") ? {type: "dash"} : dash), "_", "date"], "postprocess":  d => {
          const start = parseMonthDayCompact(d[0].value);
          return makeRange(makeDate({ month: start.month, day: start.day }), d[4]);
        } },
    {"name": "range", "symbols": ["date", "_", (lexer.has("dash") ? {type: "dash"} : dash), "_", (lexer.has("monthDayCompact") ? {type: "monthDayCompact"} : monthDayCompact)], "postprocess":  d => {
          const end = parseMonthDayCompact(d[4].value);
          return makeRange(d[0], makeDate({ month: end.month, day: end.day }));
        } },
    {"name": "range", "symbols": ["specialDay", "_", "time", "_", "toConnector", "_", "time"], "postprocess": d => makeRange(makeDate({ special: d[0], time: d[2] }), makeDate({ special: d[0], time: d[6] }))},
    {"name": "range", "symbols": ["monthDay", "_", "time", "_", "toConnector", "_", "time"], "postprocess": d => makeRange({ ...d[0], time: d[2] }, { ...d[0], time: d[6] })},
    {"name": "range", "symbols": ["weekday", "_", "time", "_", "toConnector", "_", "time"], "postprocess": d => makeRange(makeDate({ weekday: d[0], time: d[2] }), makeDate({ weekday: d[0], time: d[6] }))},
    {"name": "range", "symbols": ["month", "_", "dayNumber", (lexer.has("dash") ? {type: "dash"} : dash), "dayNumber"], "postprocess": d => makeRange(makeDate({ month: d[0], day: d[2] }), makeDate({ month: d[0], day: d[4] }))},
    {"name": "range", "symbols": ["dayNumber", (lexer.has("dash") ? {type: "dash"} : dash), "dayNumber", "_", "month"], "postprocess": d => makeRange(makeDate({ month: d[4], day: d[0] }), makeDate({ month: d[4], day: d[2] }))},
    {"name": "range", "symbols": ["betweenConnector", "_", "date", "_", "andConnector", "_", "date"], "postprocess": d => makeRange(d[2], d[6])},
    {"name": "range", "symbols": ["date", "_", "throughConnector", "_", "date"], "postprocess": d => makeRange(d[0], d[4])},
    {"name": "range", "symbols": ["date", "_", "untilConnector", "_", "date"], "postprocess": d => makeRange(d[0], d[4])},
    {"name": "range", "symbols": ["untilConnector", "_", "date"], "postprocess": d => makeRange(makeDate({ special: 'today' }), d[2])},
    {"name": "range", "symbols": ["untilConnector", "_", "fuzzy"], "postprocess": d => makeRange(makeDate({ special: 'today' }), d[2])},
    {"name": "range", "symbols": ["fuzzy", "_", "toConnector", "_", "fuzzy"], "postprocess": d => makeRange(d[0], d[4])},
    {"name": "range", "symbols": ["fromConnector", "_", "fuzzy", "_", "toConnector", "_", "fuzzy"], "postprocess": d => makeRange(d[2], d[6])},
    {"name": "range", "symbols": ["betweenConnector", "_", "fuzzy", "_", "andConnector", "_", "fuzzy"], "postprocess": d => makeRange(d[2], d[6])},
    {"name": "range", "symbols": ["fromConnector", "_", "date", "_", "untilConnector", "_", "date"], "postprocess": d => makeRange(d[2], d[6])},
    {"name": "range", "symbols": ["fromConnector", "_", "specialDay", "_", "untilConnector", "_", "date"], "postprocess": d => makeRange(makeDate({ special: d[2] }), d[6])},
    {"name": "span", "symbols": ["date", "_", "forConnector", "_", "duration"], "postprocess": d => makeSpan(d[0], d[4])},
    {"name": "span", "symbols": ["fuzzy", "_", "forConnector", "_", "duration"], "postprocess": d => makeSpan(d[0], d[4])},
    {"name": "span", "symbols": ["inConnector", "_", "fuzzy", "_", "forConnector", "_", "duration"], "postprocess": d => makeSpan(d[2], d[6])},
    {"name": "span", "symbols": ["inConnector", "_", "date", "_", "forConnector", "_", "duration"], "postprocess": d => makeSpan(d[2], d[6])},
    {"name": "span", "symbols": ["inConnector", "_", "monthForSpan", "_", "forConnector", "_", "duration"], "postprocess": d => makeSpan(d[2], d[6])},
    {"name": "span", "symbols": ["startingConnector", "_", "date", "_", "forConnector", "_", "duration"], "postprocess": d => makeSpan(d[2], d[6])},
    {"name": "span", "symbols": ["beginningConnector", "_", "date", "_", "forConnector", "_", "duration"], "postprocess": d => makeSpan(d[2], d[6])},
    {"name": "span", "symbols": ["startingConnector", "_", "date"], "postprocess": d => makeSpan(d[2])},
    {"name": "span", "symbols": ["date", "_", "startingConnector", "_", "date"], "postprocess": d => makeSpan(d[4], d[0])},
    {"name": "span", "symbols": ["duration", "_", "startingConnector", "_", "date"], "postprocess": d => makeSpan(d[4], d[0])},
    {"name": "span", "symbols": ["duration", "_", "fromConnector", "_", "date"], "postprocess": d => makeSpan(d[4], d[0])},
    {"name": "span", "symbols": ["duration", "_", "inConnector", "_", "fuzzy"], "postprocess": d => makeSpan(d[4], d[0])},
    {"name": "span", "symbols": ["duration", "_", "inConnector", "_", "theConnector", "_", "fuzzy"], "postprocess": d => makeSpan(d[6], d[0])},
    {"name": "monthForSpan", "symbols": ["month"], "postprocess": d => makeFuzzy({ period: 'month', month: d[0] })},
    {"name": "relative", "symbols": ["lastRelative", "_", "number", "_", "unit"], "postprocess": d => makeRelative('past', makeDuration(d[2], d[4]))},
    {"name": "relative", "symbols": ["pastRelative", "_", "number", "_", "unit"], "postprocess": d => makeRelative('past', makeDuration(d[2], d[4]))},
    {"name": "relative", "symbols": ["previousRelative", "_", "number", "_", "unit"], "postprocess": d => makeRelative('past', makeDuration(d[2], d[4]))},
    {"name": "relative", "symbols": ["nextRelative", "_", "number", "_", "unit"], "postprocess": d => makeRelative('future', makeDuration(d[2], d[4]))},
    {"name": "relative", "symbols": ["comingRelative", "_", "number", "_", "unit"], "postprocess": d => makeRelative('future', makeDuration(d[2], d[4]))},
    {"name": "relative", "symbols": ["upcomingRelative", "_", "number", "_", "unit"], "postprocess": d => makeRelative('future', makeDuration(d[2], d[4]))},
    {"name": "relative", "symbols": ["withinConnector", "_", "duration"], "postprocess": d => makeRelative('future', d[2])},
    {"name": "relative", "symbols": ["withinConnector", "_", "theConnector", "_", "nextRelative", "_", "duration"], "postprocess": d => makeRelative('future', d[6])},
    {"name": "relative", "symbols": ["withinConnector", "_", "theConnector", "_", "lastRelative", "_", "duration"], "postprocess": d => makeRelative('past', d[6])},
    {"name": "relative", "symbols": ["withinConnector", "_", "theConnector", "_", "pastRelative", "_", "duration"], "postprocess": d => makeRelative('past', d[6])},
    {"name": "relative", "symbols": ["overConnector", "_", "theConnector", "_", "nextRelative", "_", "duration"], "postprocess": d => makeRelative('future', d[6])},
    {"name": "relative", "symbols": ["overConnector", "_", "theConnector", "_", "lastRelative", "_", "duration"], "postprocess": d => makeRelative('past', d[6])},
    {"name": "relative", "symbols": ["overConnector", "_", "theConnector", "_", "pastRelative", "_", "duration"], "postprocess": d => makeRelative('past', d[6])},
    {"name": "relative", "symbols": ["overConnector", "_", "theConnector", "_", "comingRelative", "_", "duration"], "postprocess": d => makeRelative('future', d[6])},
    {"name": "relative", "symbols": ["inConnector", "_", "theConnector", "_", "lastRelative", "_", "duration"], "postprocess": d => makeRelative('past', d[6])},
    {"name": "relative", "symbols": ["inConnector", "_", "theConnector", "_", "nextRelative", "_", "duration"], "postprocess": d => makeRelative('future', d[6])},
    {"name": "relative", "symbols": ["inConnector", "_", "theConnector", "_", "pastRelative", "_", "duration"], "postprocess": d => makeRelative('past', d[6])},
    {"name": "relative", "symbols": ["inConnector", "_", "theConnector", "_", "comingRelative", "_", "duration"], "postprocess": d => makeRelative('future', d[6])},
    {"name": "relative", "symbols": ["lastRelative", "_", "wordNumber", "_", "unit"], "postprocess": d => makeRelative('past', makeDuration(parseWordNumber(d[2]), d[4]))},
    {"name": "relative", "symbols": ["nextRelative", "_", "wordNumber", "_", "unit"], "postprocess": d => makeRelative('future', makeDuration(parseWordNumber(d[2]), d[4]))},
    {"name": "relative", "symbols": ["pastRelative", "_", "wordNumber", "_", "unit"], "postprocess": d => makeRelative('past', makeDuration(parseWordNumber(d[2]), d[4]))},
    {"name": "relative", "symbols": ["previousRelative", "_", "wordNumber", "_", "unit"], "postprocess": d => makeRelative('past', makeDuration(parseWordNumber(d[2]), d[4]))},
    {"name": "relative", "symbols": ["comingRelative", "_", "wordNumber", "_", "unit"], "postprocess": d => makeRelative('future', makeDuration(parseWordNumber(d[2]), d[4]))},
    {"name": "relative", "symbols": ["upcomingRelative", "_", "wordNumber", "_", "unit"], "postprocess": d => makeRelative('future', makeDuration(parseWordNumber(d[2]), d[4]))},
    {"name": "relative", "symbols": ["pastRelative", "_", "unit"], "postprocess": d => makeRelative('past', makeDuration(1, d[2]))},
    {"name": "relative", "symbols": ["previousRelative", "_", "unit"], "postprocess": d => makeRelative('past', makeDuration(1, d[2]))},
    {"name": "relative", "symbols": ["upcomingRelative", "_", "unit"], "postprocess": d => makeRelative('future', makeDuration(1, d[2]))},
    {"name": "relative", "symbols": ["withinConnector", "_", "theConnector", "_", "nextRelative", "_", "unit"], "postprocess": d => makeRelative('future', makeDuration(1, d[6]))},
    {"name": "relative", "symbols": ["withinConnector", "_", "theConnector", "_", "pastRelative", "_", "unit"], "postprocess": d => makeRelative('past', makeDuration(1, d[6]))},
    {"name": "relative", "symbols": ["overConnector", "_", "theConnector", "_", "lastRelative", "_", "unit"], "postprocess": d => makeRelative('past', makeDuration(1, d[6]))},
    {"name": "relative", "symbols": ["overConnector", "_", "theConnector", "_", "comingRelative", "_", "unit"], "postprocess": d => makeRelative('future', makeDuration(1, d[6]))},
    {"name": "relative", "symbols": ["overConnector", "_", "theConnector", "_", "upcomingRelative", "_", "unit"], "postprocess": d => makeRelative('future', makeDuration(1, d[6]))},
    {"name": "relative", "symbols": ["inConnector", "_", "theConnector", "_", "pastRelative", "_", "unit"], "postprocess": d => makeRelative('past', makeDuration(1, d[6]))},
    {"name": "relative", "symbols": ["inConnector", "_", "theConnector", "_", "comingRelative", "_", "unit"], "postprocess": d => makeRelative('future', makeDuration(1, d[6]))},
    {"name": "relative", "symbols": ["inConnector", "_", "theConnector", "_", "upcomingRelative", "_", "unit"], "postprocess": d => makeRelative('future', makeDuration(1, d[6]))},
    {"name": "fuzzy", "symbols": ["quarter"], "postprocess": d => makeFuzzy({ period: 'quarter', quarter: parseQuarter(d[0].value) })},
    {"name": "fuzzy", "symbols": ["quarter", "_", "year"], "postprocess": d => makeFuzzy({ period: 'quarter', quarter: parseQuarter(d[0].value), year: d[2] })},
    {"name": "fuzzy", "symbols": ["half"], "postprocess": d => makeFuzzy({ period: 'half', half: parseHalf(d[0].value) })},
    {"name": "fuzzy", "symbols": ["half", "_", "year"], "postprocess": d => makeFuzzy({ period: 'half', half: parseHalf(d[0].value), year: d[2] })},
    {"name": "fuzzy", "symbols": ["earlyModifier", "_", "month"], "postprocess": d => makeFuzzy({ period: 'month', month: d[2], modifier: 'early' })},
    {"name": "fuzzy", "symbols": ["midModifier", "_", "month"], "postprocess": d => makeFuzzy({ period: 'month', month: d[2], modifier: 'mid' })},
    {"name": "fuzzy", "symbols": ["lateModifier", "_", "month"], "postprocess": d => makeFuzzy({ period: 'month', month: d[2], modifier: 'late' })},
    {"name": "fuzzy", "symbols": ["earlyModifier", "_", "quarter"], "postprocess": d => makeFuzzy({ period: 'quarter', quarter: parseQuarter(d[2].value), modifier: 'early' })},
    {"name": "fuzzy", "symbols": ["midModifier", "_", "quarter"], "postprocess": d => makeFuzzy({ period: 'quarter', quarter: parseQuarter(d[2].value), modifier: 'mid' })},
    {"name": "fuzzy", "symbols": ["lateModifier", "_", "quarter"], "postprocess": d => makeFuzzy({ period: 'quarter', quarter: parseQuarter(d[2].value), modifier: 'late' })},
    {"name": "fuzzy", "symbols": ["earlyModifier", "_", "year"], "postprocess": d => makeFuzzy({ period: 'year', year: d[2], modifier: 'early' })},
    {"name": "fuzzy", "symbols": ["midModifier", "_", "year"], "postprocess": d => makeFuzzy({ period: 'year', year: d[2], modifier: 'mid' })},
    {"name": "fuzzy", "symbols": ["lateModifier", "_", "year"], "postprocess": d => makeFuzzy({ period: 'year', year: d[2], modifier: 'late' })},
    {"name": "fuzzy", "symbols": ["earlyModifier", "_", "yearUnit"], "postprocess": d => makeFuzzy({ period: 'year', modifier: 'early' })},
    {"name": "fuzzy", "symbols": ["midModifier", "_", "yearUnit"], "postprocess": d => makeFuzzy({ period: 'year', modifier: 'mid' })},
    {"name": "fuzzy", "symbols": ["lateModifier", "_", "yearUnit"], "postprocess": d => makeFuzzy({ period: 'year', modifier: 'late' })},
    {"name": "fuzzy", "symbols": ["endConnector", "_", "ofConnector", "_", "month"], "postprocess": d => makeFuzzy({ period: 'month', month: d[4], modifier: 'end' })},
    {"name": "fuzzy", "symbols": ["endConnector", "_", "ofConnector", "_", "year"], "postprocess": d => makeFuzzy({ period: 'year', year: d[4], modifier: 'end' })},
    {"name": "fuzzy", "symbols": ["endConnector", "_", "ofConnector", "_", "quarter"], "postprocess": d => makeFuzzy({ period: 'quarter', quarter: parseQuarter(d[4].value), modifier: 'end' })},
    {"name": "fuzzy", "symbols": ["startConnector", "_", "ofConnector", "_", "quarter"], "postprocess": d => makeFuzzy({ period: 'quarter', quarter: parseQuarter(d[4].value), modifier: 'start' })},
    {"name": "fuzzy", "symbols": ["beginningConnector", "_", "ofConnector", "_", "quarter"], "postprocess": d => makeFuzzy({ period: 'quarter', quarter: parseQuarter(d[4].value), modifier: 'beginning' })},
    {"name": "fuzzy", "symbols": ["middleConnector", "_", "ofConnector", "_", "quarter"], "postprocess": d => makeFuzzy({ period: 'quarter', quarter: parseQuarter(d[4].value), modifier: 'middle' })},
    {"name": "fuzzy", "symbols": ["endConnector", "_", "ofConnector", "_", "theConnector", "_", "month"], "postprocess": d => makeFuzzy({ period: 'month', month: d[6], modifier: 'end' })},
    {"name": "fuzzy", "symbols": ["endConnector", "_", "ofConnector", "_", "theConnector", "_", "unit"], "postprocess": d => makeFuzzy({ period: d[6], modifier: 'end' })},
    {"name": "fuzzy", "symbols": ["endConnector", "_", "ofConnector", "_", "unit"], "postprocess": d => makeFuzzy({ period: d[4], modifier: 'end' })},
    {"name": "fuzzy", "symbols": ["beginningConnector", "_", "ofConnector", "_", "unit"], "postprocess": d => makeFuzzy({ period: d[4], modifier: 'beginning' })},
    {"name": "fuzzy", "symbols": ["startConnector", "_", "ofConnector", "_", "unit"], "postprocess": d => makeFuzzy({ period: d[4], modifier: 'start' })},
    {"name": "fuzzy", "symbols": ["middleConnector", "_", "ofConnector", "_", "unit"], "postprocess": d => makeFuzzy({ period: d[4], modifier: 'middle' })},
    {"name": "fuzzy", "symbols": ["beginningConnector", "_", "ofConnector", "_", "month"], "postprocess": d => makeFuzzy({ period: 'month', month: d[4], modifier: 'beginning' })},
    {"name": "fuzzy", "symbols": ["beginningConnector", "_", "ofConnector", "_", "year"], "postprocess": d => makeFuzzy({ period: 'year', year: d[4], modifier: 'beginning' })},
    {"name": "fuzzy", "symbols": ["startConnector", "_", "ofConnector", "_", "month"], "postprocess": d => makeFuzzy({ period: 'month', month: d[4], modifier: 'start' })},
    {"name": "fuzzy", "symbols": ["startConnector", "_", "ofConnector", "_", "year"], "postprocess": d => makeFuzzy({ period: 'year', year: d[4], modifier: 'start' })},
    {"name": "fuzzy", "symbols": ["middleConnector", "_", "ofConnector", "_", "month"], "postprocess": d => makeFuzzy({ period: 'month', month: d[4], modifier: 'middle' })},
    {"name": "fuzzy", "symbols": ["middleConnector", "_", "ofConnector", "_", "year"], "postprocess": d => makeFuzzy({ period: 'year', year: d[4], modifier: 'middle' })},
    {"name": "fuzzy", "symbols": ["season"], "postprocess": d => makeFuzzy({ period: 'season', season: d[0] })},
    {"name": "fuzzy", "symbols": ["season", "_", "year"], "postprocess": d => makeFuzzy({ period: 'season', season: d[0], year: d[2] })},
    {"name": "fuzzy", "symbols": ["earlyModifier", "_", "season"], "postprocess": d => makeFuzzy({ period: 'season', season: d[2], modifier: 'early' })},
    {"name": "fuzzy", "symbols": ["midModifier", "_", "season"], "postprocess": d => makeFuzzy({ period: 'season', season: d[2], modifier: 'mid' })},
    {"name": "fuzzy", "symbols": ["lateModifier", "_", "season"], "postprocess": d => makeFuzzy({ period: 'season', season: d[2], modifier: 'late' })},
    {"name": "fuzzy", "symbols": ["nextRelative", "_", "season"], "postprocess": d => makeFuzzy({ period: 'season', season: d[2], relative: 'next' })},
    {"name": "fuzzy", "symbols": ["lastRelative", "_", "season"], "postprocess": d => makeFuzzy({ period: 'season', season: d[2], relative: 'last' })},
    {"name": "fuzzy", "symbols": ["thisRelative", "_", "season"], "postprocess": d => makeFuzzy({ period: 'season', season: d[2], relative: 'this' })},
    {"name": "fuzzy", "symbols": ["ordinalWord", "_", "quarter", "_", "year"], "postprocess": d => makeFuzzy({ period: 'quarter', quarter: parseOrdinalWord(d[0]), year: d[4] })},
    {"name": "fuzzy", "symbols": ["ordinalWord", "_", "quarter"], "postprocess": d => makeFuzzy({ period: 'quarter', quarter: parseOrdinalWord(d[0]) })},
    {"name": "fuzzy", "symbols": ["ordinalWord", "_", "half", "_", "year"], "postprocess": d => makeFuzzy({ period: 'half', half: parseOrdinalWord(d[0]), year: d[4] })},
    {"name": "fuzzy", "symbols": ["ordinalWord", "_", "half"], "postprocess": d => makeFuzzy({ period: 'half', half: parseOrdinalWord(d[0]) })},
    {"name": "fuzzy", "symbols": ["aroundConnector", "_", "date"], "postprocess": d => makeFuzzy({ ...d[2], period: 'around' })},
    {"name": "fuzzy", "symbols": ["aboutConnector", "_", "date"], "postprocess": d => makeFuzzy({ ...d[2], period: 'around' })},
    {"name": "fuzzy", "symbols": ["roughlyConnector", "_", "date"], "postprocess": d => makeFuzzy({ ...d[2], period: 'around' })},
    {"name": "fuzzy", "symbols": ["approximatelyConnector", "_", "date"], "postprocess": d => makeFuzzy({ ...d[2], period: 'around' })},
    {"name": "fuzzy", "symbols": ["aroundConnector", "_", "fuzzy"], "postprocess": d => d[2]},
    {"name": "fuzzy", "symbols": ["aboutConnector", "_", "fuzzy"], "postprocess": d => d[2]},
    {"name": "fuzzy", "symbols": ["roughlyConnector", "_", "fuzzy"], "postprocess": d => d[2]},
    {"name": "fuzzy", "symbols": ["approximatelyConnector", "_", "fuzzy"], "postprocess": d => d[2]},
    {"name": "fuzzy", "symbols": ["sometimeConnector", "_", "inConnector", "_", "fuzzy"], "postprocess": d => d[4]},
    {"name": "fuzzy", "symbols": ["sometimeConnector", "_", "inConnector", "_", "month"], "postprocess": d => makeFuzzy({ period: 'month', month: d[4] })},
    {"name": "fuzzy", "symbols": ["sometimeConnector", "_", "nextRelative", "_", "unit"], "postprocess": d => makeFuzzy({ period: d[4], relative: 'next' })},
    {"name": "fuzzy", "symbols": ["sometimeConnector", "_", "lastRelative", "_", "unit"], "postprocess": d => makeFuzzy({ period: d[4], relative: 'last' })},
    {"name": "fuzzy", "symbols": ["sometimeConnector", "_", "thisRelative", "_", "unit"], "postprocess": d => makeFuzzy({ period: d[4], relative: 'this' })},
    {"name": "fuzzy", "symbols": ["theConnector", "_", "lastRelative", "_", "unit", "_", "ofConnector", "_", "month"], "postprocess": d => makeFuzzy({ period: 'month', month: d[8], modifier: 'late' })},
    {"name": "fuzzy", "symbols": ["theConnector", "_", "ordinalWord", "_", "unit", "_", "ofConnector", "_", "month"], "postprocess":  (d, _, reject) => {
          const ord = d[2].toLowerCase();
          if (ord === 'first') return makeFuzzy({ period: 'month', month: d[8], modifier: 'early' });
          return reject;
        } },
    {"name": "fuzzy", "symbols": ["ordinalWord", "_", "quarterUnit"], "postprocess": d => makeFuzzy({ period: 'quarter', quarter: parseOrdinalWord(d[0]) })},
    {"name": "fuzzy", "symbols": ["ordinal", "_", "quarterUnit"], "postprocess": d => makeFuzzy({ period: 'quarter', quarter: parseOrdinal(d[0]) })},
    {"name": "fuzzy", "symbols": ["ordinalWord", "_", "quarterUnit", "_", "year"], "postprocess": d => makeFuzzy({ period: 'quarter', quarter: parseOrdinalWord(d[0]), year: d[4] })},
    {"name": "fuzzy", "symbols": ["ordinalWord", "_", "quarterUnit", "_", "ofConnector", "_", "year"], "postprocess": d => makeFuzzy({ period: 'quarter', quarter: parseOrdinalWord(d[0]), year: d[6] })},
    {"name": "fuzzy", "symbols": ["quarter", "_", "ofConnector", "_", "year"], "postprocess": d => makeFuzzy({ period: 'quarter', quarter: parseQuarter(d[0].value), year: d[4] })},
    {"name": "fuzzy", "symbols": ["ordinalWord", "_", "halfWord", "_", "ofConnector", "_", "year"], "postprocess": d => makeFuzzy({ period: 'half', half: parseOrdinalWord(d[0]), year: d[6] })},
    {"name": "fuzzy", "symbols": ["earlyModifier", "_", "nextRelative", "_", "unit"], "postprocess": d => makeFuzzy({ period: d[4], modifier: 'early', relative: 'next' })},
    {"name": "fuzzy", "symbols": ["midModifier", "_", "nextRelative", "_", "unit"], "postprocess": d => makeFuzzy({ period: d[4], modifier: 'mid', relative: 'next' })},
    {"name": "fuzzy", "symbols": ["lateModifier", "_", "nextRelative", "_", "unit"], "postprocess": d => makeFuzzy({ period: d[4], modifier: 'late', relative: 'next' })},
    {"name": "fuzzy", "symbols": ["earlyModifier", "_", "lastRelative", "_", "unit"], "postprocess": d => makeFuzzy({ period: d[4], modifier: 'early', relative: 'last' })},
    {"name": "fuzzy", "symbols": ["midModifier", "_", "lastRelative", "_", "unit"], "postprocess": d => makeFuzzy({ period: d[4], modifier: 'mid', relative: 'last' })},
    {"name": "fuzzy", "symbols": ["lateModifier", "_", "lastRelative", "_", "unit"], "postprocess": d => makeFuzzy({ period: d[4], modifier: 'late', relative: 'last' })},
    {"name": "fuzzy", "symbols": ["earlyModifier", "_", "thisRelative", "_", "unit"], "postprocess": d => makeFuzzy({ period: d[4], modifier: 'early', relative: 'this' })},
    {"name": "fuzzy", "symbols": ["midModifier", "_", "thisRelative", "_", "unit"], "postprocess": d => makeFuzzy({ period: d[4], modifier: 'mid', relative: 'this' })},
    {"name": "fuzzy", "symbols": ["lateModifier", "_", "thisRelative", "_", "unit"], "postprocess": d => makeFuzzy({ period: d[4], modifier: 'late', relative: 'this' })},
    {"name": "fuzzy", "symbols": ["beginningConnector", "_", "ofConnector", "_", "theConnector", "_", "unit"], "postprocess": d => makeFuzzy({ period: d[6], modifier: 'beginning' })},
    {"name": "fuzzy", "symbols": ["middleConnector", "_", "ofConnector", "_", "theConnector", "_", "unit"], "postprocess": d => makeFuzzy({ period: d[6], modifier: 'middle' })},
    {"name": "fuzzy", "symbols": ["lastRelative", "_", "unit", "_", "ofConnector", "_", "month"], "postprocess": d => makeFuzzy({ period: 'month', month: d[6], modifier: 'late' })},
    {"name": "fuzzy", "symbols": ["ordinalWord", "_", "unit", "_", "ofConnector", "_", "month"], "postprocess": d => makeFuzzy({ period: 'month', month: d[6], modifier: parseOrdinalWord(d[0]) <= 2 ? 'early' : (parseOrdinalWord(d[0]) >= 4 ? 'late' : 'mid') })},
    {"name": "duration", "symbols": ["number", "_", "unit"], "postprocess": d => makeDuration(d[0], d[2])},
    {"name": "duration", "symbols": ["wordNumber", "_", "unit"], "postprocess": d => makeDuration(parseWordNumber(d[0]), d[2])},
    {"name": "duration", "symbols": ["abbreviatedDuration"], "postprocess": d => d[0]},
    {"name": "duration", "symbols": ["halfWord", "_", "wordNumber", "_", "unit"], "postprocess":  d => {
          const word = d[2].toLowerCase();
          // "half a day" = 0.5 days, "half two days" = 2.5 days
          if (word === 'a' || word === 'an') {
            return makeDuration(0.5, d[4]);
          }
          return makeDuration(parseWordNumber(d[2]) + 0.5, d[4]);
        } },
    {"name": "duration", "symbols": ["number", "_", "andConnector", "_", "halfWord", "_", "unit"], "postprocess": d => makeDuration(d[0] + 0.5, d[6])},
    {"name": "duration", "symbols": ["wordNumber", "_", "andConnector", "_", "halfWord", "_", "unit"], "postprocess": d => makeDuration(parseWordNumber(d[0]) + 0.5, d[6])},
    {"name": "duration", "symbols": ["wordNumber", "_", "andConnector", "_", "wordNumber", "_", "halfWord", "_", "unit"], "postprocess": d => makeDuration(parseWordNumber(d[0]) + 0.5, d[8])},
    {"name": "duration", "symbols": ["wordNumber", "_", "unit", "_", "andConnector", "_", "wordNumber", "_", "halfWord"], "postprocess": d => makeDuration(parseWordNumber(d[0]) + 0.5, d[2])},
    {"name": "duration", "symbols": ["halfWord", "_", "unit"], "postprocess": d => makeDuration(0.5, d[2])},
    {"name": "duration", "symbols": ["duration", "_", "andConnector", "_", "duration"], "postprocess": d => ({ ...d[0], combined: [d[0], d[4]] })},
    {"name": "duration", "symbols": ["duration", "_", (lexer.has("comma") ? {type: "comma"} : comma), "_", "duration"], "postprocess": d => ({ ...d[0], combined: [d[0], d[4]] })},
    {"name": "duration", "symbols": ["duration", "_", (lexer.has("comma") ? {type: "comma"} : comma), "_", "andConnector", "_", "duration"], "postprocess": d => ({ ...d[0], combined: [d[0], d[6]] })},
    {"name": "duration", "symbols": ["duration", "_", "duration"], "postprocess": d => ({ ...d[0], combined: [d[0], d[2]] })},
    {"name": "abbreviatedDuration", "symbols": [(lexer.has("abbreviatedDuration") ? {type: "abbreviatedDuration"} : abbreviatedDuration)], "postprocess":  d => {
          const match = d[0].value.match(/^(\d+)(mo|w|d|h|m|s|y)$/);
          if (!match) return null;
          const value = parseInt(match[1], 10);
          // 'm' = minute, 'mo' = month
          const unitMap: Record<string, string> = { w: 'week', d: 'day', h: 'hour', m: 'minute', mo: 'month', s: 'second', y: 'year' };
          return makeDuration(value, unitMap[match[2]]);
        } },
    {"name": "date", "symbols": ["specialDay"], "postprocess": d => makeDate({ special: d[0] })},
    {"name": "date", "symbols": ["relativeWeekday"], "postprocess": first},
    {"name": "date", "symbols": ["weekday"], "postprocess": d => makeDate({ weekday: d[0] })},
    {"name": "date", "symbols": ["monthDayYear"], "postprocess": first},
    {"name": "date", "symbols": ["monthDay"], "postprocess": first},
    {"name": "date", "symbols": ["monthDayCompact"], "postprocess": first},
    {"name": "date", "symbols": ["monthYear"], "postprocess": first},
    {"name": "date", "symbols": ["dateFormat"], "postprocess": first},
    {"name": "date", "symbols": ["relativePeriod"], "postprocess": first},
    {"name": "date", "symbols": ["complexDate"], "postprocess": first},
    {"name": "date", "symbols": ["dateWithTime"], "postprocess": first},
    {"name": "date", "symbols": ["relativeMonth"], "postprocess": first},
    {"name": "date", "symbols": ["monthOnly"], "postprocess": first},
    {"name": "date", "symbols": ["yearOnly"], "postprocess": first},
    {"name": "date", "symbols": ["timeOnly"], "postprocess": first},
    {"name": "monthDayCompact", "symbols": [(lexer.has("monthDayCompact") ? {type: "monthDayCompact"} : monthDayCompact)], "postprocess":  d => {
          const parsed = parseMonthDayCompact(d[0].value);
          return makeDate({ month: parsed.month, day: parsed.day });
        } },
    {"name": "monthOnly", "symbols": ["month"], "postprocess": d => makeDate({ month: d[0], day: 1, monthOnly: true })},
    {"name": "relativeMonth", "symbols": ["nextRelative", "_", "month"], "postprocess": d => makeDate({ month: d[2], day: 1, monthOnly: true, relativeMonth: 'next' })},
    {"name": "relativeMonth", "symbols": ["lastRelative", "_", "month"], "postprocess": d => makeDate({ month: d[2], day: 1, monthOnly: true, relativeMonth: 'last' })},
    {"name": "relativeMonth", "symbols": ["thisRelative", "_", "month"], "postprocess": d => makeDate({ month: d[2], day: 1, monthOnly: true, relativeMonth: 'this' })},
    {"name": "monthYear", "symbols": ["month", "_", "year"], "postprocess": d => makeDate({ month: d[0], year: d[2], day: 1, monthOnly: true })},
    {"name": "yearOnly", "symbols": ["year"], "postprocess":  (d, _, reject) => {
          const year = d[0];
          // Only accept 4-digit years in reasonable range (1900-2100)
          if (year < 1900 || year > 2100) return reject;
          return makeDate({ year, month: 1, day: 1, yearOnly: true });
        } },
    {"name": "timeOnly", "symbols": ["time"], "postprocess": d => makeDate({ time: d[0], timeOnly: true })},
    {"name": "timeOnly", "symbols": ["timeWord"], "postprocess": d => makeDate({ time: { special: d[0] }, timeOnly: true })},
    {"name": "specialDay", "symbols": ["today"], "postprocess": d => 'today'},
    {"name": "specialDay", "symbols": ["tomorrow"], "postprocess": d => 'tomorrow'},
    {"name": "specialDay", "symbols": ["yesterday"], "postprocess": d => 'yesterday'},
    {"name": "specialDay", "symbols": ["now"], "postprocess": d => 'now'},
    {"name": "specialDay", "symbols": ["theConnector", "_", "dayUnit", "_", "afterConnector", "_", "tomorrow"], "postprocess": d => 'dayAfterTomorrow'},
    {"name": "specialDay", "symbols": ["dayUnit", "_", "afterConnector", "_", "tomorrow"], "postprocess": d => 'dayAfterTomorrow'},
    {"name": "specialDay", "symbols": ["theConnector", "_", "dayUnit", "_", "beforeConnector", "_", "yesterday"], "postprocess": d => 'dayBeforeYesterday'},
    {"name": "specialDay", "symbols": ["dayUnit", "_", "beforeConnector", "_", "yesterday"], "postprocess": d => 'dayBeforeYesterday'},
    {"name": "dayUnit", "symbols": [(lexer.has("unit") ? {type: "unit"} : unit)], "postprocess": d => d[0].value === 'day' ? d[0] : null},
    {"name": "relativeWeekday", "symbols": ["nextRelative", "_", "weekday"], "postprocess": d => makeDate({ weekday: d[2], relative: 'next' })},
    {"name": "relativeWeekday", "symbols": ["lastRelative", "_", "weekday"], "postprocess": d => makeDate({ weekday: d[2], relative: 'last' })},
    {"name": "relativeWeekday", "symbols": ["thisRelative", "_", "weekday"], "postprocess": d => makeDate({ weekday: d[2], relative: 'this' })},
    {"name": "relativeWeekday", "symbols": ["comingRelative", "_", "weekday"], "postprocess": d => makeDate({ weekday: d[2], relative: 'next' })},
    {"name": "relativeWeekday", "symbols": ["previousRelative", "_", "weekday"], "postprocess": d => makeDate({ weekday: d[2], relative: 'last' })},
    {"name": "relativePeriod", "symbols": ["nextRelative", "_", "unit"], "postprocess": d => makeDate({ relative: 'next', period: d[2] })},
    {"name": "relativePeriod", "symbols": ["lastRelative", "_", "unit"], "postprocess": d => makeDate({ relative: 'last', period: d[2] })},
    {"name": "relativePeriod", "symbols": ["thisRelative", "_", "unit"], "postprocess": d => makeDate({ relative: 'this', period: d[2] })},
    {"name": "monthDay", "symbols": ["month", "_", "dayNumber"], "postprocess": d => makeDate({ month: d[0], day: d[2] })},
    {"name": "monthDay", "symbols": ["dayNumber", "_", "month"], "postprocess": d => makeDate({ month: d[2], day: d[0] })},
    {"name": "monthDay", "symbols": ["dayNumber", "_", "ofConnector", "_", "month"], "postprocess": d => makeDate({ month: d[4], day: d[0] })},
    {"name": "monthDay", "symbols": ["theConnector", "_", "dayNumber", "_", "ofConnector", "_", "month"], "postprocess": d => makeDate({ month: d[6], day: d[2] })},
    {"name": "monthDay", "symbols": ["month", "_", "ordinalWord"], "postprocess": d => makeDate({ month: d[0], day: parseOrdinalWord(d[2]) })},
    {"name": "monthDay", "symbols": ["month", "_", "theConnector", "_", "dayNumber"], "postprocess": d => makeDate({ month: d[0], day: d[4] })},
    {"name": "monthDayYear", "symbols": ["monthDay", "_", "year"], "postprocess": d => ({ ...d[0], year: d[2] })},
    {"name": "monthDayYear", "symbols": ["monthDay", (lexer.has("comma") ? {type: "comma"} : comma), "_", "year"], "postprocess": d => ({ ...d[0], year: d[3] })},
    {"name": "dateFormat", "symbols": [(lexer.has("integer") ? {type: "integer"} : integer), (lexer.has("dash") ? {type: "dash"} : dash), (lexer.has("integer") ? {type: "integer"} : integer), (lexer.has("dash") ? {type: "dash"} : dash), (lexer.has("integer") ? {type: "integer"} : integer)], "postprocess":  d => {
          const parts = [parseInt(d[0].value, 10), parseInt(d[2].value, 10), parseInt(d[4].value, 10)];
          // ISO format: YYYY-MM-DD
          if (parts[0] > 1000) {
            return makeDate({ year: parts[0], month: parts[1], day: parts[2] });
          }
          // Otherwise, could be MM-DD-YYYY or DD-MM-YYYY - store raw parts
          return makeDate({ formatParts: parts, separator: '-' });
        } },
    {"name": "dateFormat", "symbols": [(lexer.has("integer") ? {type: "integer"} : integer), (lexer.has("slash") ? {type: "slash"} : slash), (lexer.has("integer") ? {type: "integer"} : integer), (lexer.has("slash") ? {type: "slash"} : slash), (lexer.has("integer") ? {type: "integer"} : integer)], "postprocess":  d => {
          const parts = [parseInt(d[0].value, 10), parseInt(d[2].value, 10), parseInt(d[4].value, 10)];
          // ISO-like format: YYYY/MM/DD
          if (parts[0] > 1000) {
            return makeDate({ year: parts[0], month: parts[1], day: parts[2] });
          }
          // Could be MM/DD/YYYY (US) or DD/MM/YYYY (intl) - store raw parts
          return makeDate({ formatParts: parts, separator: '/' });
        } },
    {"name": "dateWithTime", "symbols": ["date", "_", "atConnector", "_", "time"], "postprocess": d => ({ ...d[0], time: d[4] })},
    {"name": "dateWithTime", "symbols": ["date", "_", "atConnector", "_", "timeWord"], "postprocess": d => ({ ...d[0], time: { special: d[4] } })},
    {"name": "dateWithTime", "symbols": ["time", "_", "date"], "postprocess": d => ({ ...d[2], time: d[0] })},
    {"name": "dateWithTime", "symbols": ["timeWord", "_", "date"], "postprocess": d => ({ ...d[2], time: { special: d[0] } })},
    {"name": "dateWithTime", "symbols": ["date", "_", "time"], "postprocess": d => ({ ...d[0], time: d[2] })},
    {"name": "complexDate", "symbols": ["nextRelative", "_", "unit", "_", "weekday", "_", "time"], "postprocess": d => makeDate({ relative: 'next', period: d[2], weekday: d[4], time: d[6] })},
    {"name": "complexDate", "symbols": ["nextRelative", "_", "unit", "_", "weekday"], "postprocess": d => makeDate({ relative: 'next', period: d[2], weekday: d[4] })},
    {"name": "complexDate", "symbols": ["lastRelative", "_", "unit", "_", "weekday", "_", "time"], "postprocess": d => makeDate({ relative: 'last', period: d[2], weekday: d[4], time: d[6] })},
    {"name": "complexDate", "symbols": ["lastRelative", "_", "unit", "_", "weekday"], "postprocess": d => makeDate({ relative: 'last', period: d[2], weekday: d[4] })},
    {"name": "complexDate", "symbols": ["thisRelative", "_", "unit", "_", "weekday", "_", "time"], "postprocess": d => makeDate({ relative: 'this', period: d[2], weekday: d[4], time: d[6] })},
    {"name": "complexDate", "symbols": ["thisRelative", "_", "unit", "_", "weekday"], "postprocess": d => makeDate({ relative: 'this', period: d[2], weekday: d[4] })},
    {"name": "time", "symbols": [(lexer.has("time") ? {type: "time"} : time)], "postprocess":  d => {
          const parts = d[0].value.split(':');
          return { hour: parseInt(parts[0], 10), minute: parseInt(parts[1], 10) };
        } },
    {"name": "time", "symbols": [(lexer.has("time") ? {type: "time"} : time), "_", (lexer.has("ampm") ? {type: "ampm"} : ampm)], "postprocess":  d => {
          const parts = d[0].value.split(':');
          let hour = parseInt(parts[0], 10);
          if (d[2].value === 'pm' && hour !== 12) hour += 12;
          if (d[2].value === 'am' && hour === 12) hour = 0;
          return { hour, minute: parseInt(parts[1], 10) };
        } },
    {"name": "time", "symbols": [(lexer.has("time") ? {type: "time"} : time), (lexer.has("ampm") ? {type: "ampm"} : ampm)], "postprocess":  d => {
          const parts = d[0].value.split(':');
          let hour = parseInt(parts[0], 10);
          if (d[1].value === 'pm' && hour !== 12) hour += 12;
          if (d[1].value === 'am' && hour === 12) hour = 0;
          return { hour, minute: parseInt(parts[1], 10) };
        } },
    {"name": "time", "symbols": [(lexer.has("integer") ? {type: "integer"} : integer), "_", (lexer.has("ampm") ? {type: "ampm"} : ampm)], "postprocess":  d => {
          let hour = parseInt(d[0].value, 10);
          if (d[2].value === 'pm' && hour !== 12) hour += 12;
          if (d[2].value === 'am' && hour === 12) hour = 0;
          return { hour, minute: 0 };
        } },
    {"name": "time", "symbols": [(lexer.has("integer") ? {type: "integer"} : integer), (lexer.has("ampm") ? {type: "ampm"} : ampm)], "postprocess":  d => {
          let hour = parseInt(d[0].value, 10);
          if (d[1].value === 'pm' && hour !== 12) hour += 12;
          if (d[1].value === 'am' && hour === 12) hour = 0;
          return { hour, minute: 0 };
        } },
    {"name": "timeWord", "symbols": ["noon"], "postprocess": d => 'noon'},
    {"name": "timeWord", "symbols": ["midnight"], "postprocess": d => 'midnight'},
    {"name": "number", "symbols": [(lexer.has("integer") ? {type: "integer"} : integer)], "postprocess": d => parseInt(d[0].value, 10)},
    {"name": "number", "symbols": [(lexer.has("decimal") ? {type: "decimal"} : decimal)], "postprocess": d => parseFloat(d[0].value)},
    {"name": "year", "symbols": [(lexer.has("integer") ? {type: "integer"} : integer)], "postprocess":  (d, _, reject) => {
          const val = parseInt(d[0].value, 10);
          // Only accept 4-digit years (1900-2100) to avoid ambiguity with day numbers
          if (val >= 1900 && val <= 2100) return val;
          return reject;
        } },
    {"name": "dayNumber", "symbols": [(lexer.has("integer") ? {type: "integer"} : integer)], "postprocess":  (d, _, reject) => {
          const val = parseInt(d[0].value, 10);
          if (val < 1 || val > 31) return reject;
          return val;
        } },
    {"name": "dayNumber", "symbols": [(lexer.has("ordinal") ? {type: "ordinal"} : ordinal)], "postprocess": d => parseOrdinal(d[0].value)},
    {"name": "month", "symbols": [(lexer.has("month") ? {type: "month"} : month)], "postprocess": d => parseMonth(d[0].value)},
    {"name": "weekday", "symbols": [(lexer.has("weekday") ? {type: "weekday"} : weekday)], "postprocess": d => d[0].value},
    {"name": "quarter", "symbols": [(lexer.has("quarter") ? {type: "quarter"} : quarter)], "postprocess": first},
    {"name": "half", "symbols": [(lexer.has("half") ? {type: "half"} : half)], "postprocess": first},
    {"name": "season", "symbols": [(lexer.has("season") ? {type: "season"} : season)], "postprocess": d => d[0].value},
    {"name": "unit", "symbols": [(lexer.has("unit") ? {type: "unit"} : unit)], "postprocess": d => d[0].value},
    {"name": "quarterUnit", "symbols": [(lexer.has("unit") ? {type: "unit"} : unit)], "postprocess":  (d, _, reject) => {
          const val = d[0].value.toLowerCase();
          if (val === 'quarter' || val === 'quarters') return val;
          return reject;
        } },
    {"name": "halfUnit", "symbols": [(lexer.has("unit") ? {type: "unit"} : unit)], "postprocess":  (d, _, reject) => {
          const val = d[0].value.toLowerCase();
          if (val === 'half') return val;
          return reject;
        } },
    {"name": "yearUnit", "symbols": [(lexer.has("unit") ? {type: "unit"} : unit)], "postprocess":  (d, _, reject) => {
          const val = d[0].value.toLowerCase();
          if (val === 'year' || val === 'years' || val === 'yr' || val === 'yrs') return val;
          return reject;
        } },
    {"name": "wordNumber", "symbols": [(lexer.has("wordNumber") ? {type: "wordNumber"} : wordNumber)], "postprocess": d => d[0].value},
    {"name": "ordinalWord", "symbols": [(lexer.has("ordinalWord") ? {type: "ordinalWord"} : ordinalWord)], "postprocess": d => d[0].value},
    {"name": "ordinalWord", "symbols": [(lexer.has("unit") ? {type: "unit"} : unit)], "postprocess":  (d, _, reject) => {
          if (d[0].value === 'second') return 'second';
          return reject;
        } },
    {"name": "ordinal", "symbols": [(lexer.has("ordinal") ? {type: "ordinal"} : ordinal)], "postprocess": d => d[0].value},
    {"name": "halfWord", "symbols": [(lexer.has("halfWord") ? {type: "halfWord"} : halfWord)], "postprocess": d => d[0].value},
    {"name": "toConnector", "symbols": [(lexer.has("kw_to") ? {type: "kw_to"} : kw_to)], "postprocess": first},
    {"name": "fromConnector", "symbols": [(lexer.has("kw_from") ? {type: "kw_from"} : kw_from)], "postprocess": first},
    {"name": "forConnector", "symbols": [(lexer.has("kw_for") ? {type: "kw_for"} : kw_for)], "postprocess": first},
    {"name": "inConnector", "symbols": [(lexer.has("kw_in") ? {type: "kw_in"} : kw_in)], "postprocess": first},
    {"name": "onConnector", "symbols": [(lexer.has("kw_on") ? {type: "kw_on"} : kw_on)], "postprocess": first},
    {"name": "atConnector", "symbols": [(lexer.has("kw_at") ? {type: "kw_at"} : kw_at)], "postprocess": first},
    {"name": "ofConnector", "symbols": [(lexer.has("kw_of") ? {type: "kw_of"} : kw_of)], "postprocess": first},
    {"name": "theConnector", "symbols": [(lexer.has("kw_the") ? {type: "kw_the"} : kw_the)], "postprocess": first},
    {"name": "andConnector", "symbols": [(lexer.has("kw_and") ? {type: "kw_and"} : kw_and)], "postprocess": first},
    {"name": "betweenConnector", "symbols": [(lexer.has("kw_between") ? {type: "kw_between"} : kw_between)], "postprocess": first},
    {"name": "throughConnector", "symbols": [(lexer.has("kw_through") ? {type: "kw_through"} : kw_through)], "postprocess": first},
    {"name": "untilConnector", "symbols": [(lexer.has("kw_until") ? {type: "kw_until"} : kw_until)], "postprocess": first},
    {"name": "withinConnector", "symbols": [(lexer.has("kw_within") ? {type: "kw_within"} : kw_within)], "postprocess": first},
    {"name": "overConnector", "symbols": [(lexer.has("kw_over") ? {type: "kw_over"} : kw_over)], "postprocess": first},
    {"name": "duringConnector", "symbols": [(lexer.has("kw_during") ? {type: "kw_during"} : kw_during)], "postprocess": first},
    {"name": "startingConnector", "symbols": [(lexer.has("kw_starting") ? {type: "kw_starting"} : kw_starting)], "postprocess": first},
    {"name": "byConnector", "symbols": [(lexer.has("kw_by") ? {type: "kw_by"} : kw_by)], "postprocess": first},
    {"name": "aroundConnector", "symbols": [(lexer.has("kw_around") ? {type: "kw_around"} : kw_around)], "postprocess": first},
    {"name": "aboutConnector", "symbols": [(lexer.has("kw_about") ? {type: "kw_about"} : kw_about)], "postprocess": first},
    {"name": "roughlyConnector", "symbols": [(lexer.has("kw_roughly") ? {type: "kw_roughly"} : kw_roughly)], "postprocess": first},
    {"name": "approximatelyConnector", "symbols": [(lexer.has("kw_approximately") ? {type: "kw_approximately"} : kw_approximately)], "postprocess": first},
    {"name": "sometimeConnector", "symbols": [(lexer.has("kw_sometime") ? {type: "kw_sometime"} : kw_sometime)], "postprocess": first},
    {"name": "afterConnector", "symbols": [(lexer.has("kw_after") ? {type: "kw_after"} : kw_after)], "postprocess": first},
    {"name": "beforeConnector", "symbols": [(lexer.has("kw_before") ? {type: "kw_before"} : kw_before)], "postprocess": first},
    {"name": "endConnector", "symbols": [(lexer.has("kw_end") ? {type: "kw_end"} : kw_end)], "postprocess": first},
    {"name": "beginningConnector", "symbols": [(lexer.has("kw_beginning") ? {type: "kw_beginning"} : kw_beginning)], "postprocess": first},
    {"name": "startConnector", "symbols": [(lexer.has("kw_start") ? {type: "kw_start"} : kw_start)], "postprocess": first},
    {"name": "middleConnector", "symbols": [(lexer.has("kw_middle") ? {type: "kw_middle"} : kw_middle)], "postprocess": first},
    {"name": "earlyModifier", "symbols": [(lexer.has("kw_early") ? {type: "kw_early"} : kw_early)], "postprocess": first},
    {"name": "midModifier", "symbols": [(lexer.has("kw_mid") ? {type: "kw_mid"} : kw_mid)], "postprocess": first},
    {"name": "lateModifier", "symbols": [(lexer.has("kw_late") ? {type: "kw_late"} : kw_late)], "postprocess": first},
    {"name": "nextRelative", "symbols": [(lexer.has("kw_next") ? {type: "kw_next"} : kw_next)], "postprocess": first},
    {"name": "lastRelative", "symbols": [(lexer.has("kw_last") ? {type: "kw_last"} : kw_last)], "postprocess": first},
    {"name": "thisRelative", "symbols": [(lexer.has("kw_this") ? {type: "kw_this"} : kw_this)], "postprocess": first},
    {"name": "previousRelative", "symbols": [(lexer.has("kw_previous") ? {type: "kw_previous"} : kw_previous)], "postprocess": first},
    {"name": "comingRelative", "symbols": [(lexer.has("kw_coming") ? {type: "kw_coming"} : kw_coming)], "postprocess": first},
    {"name": "upcomingRelative", "symbols": [(lexer.has("kw_upcoming") ? {type: "kw_upcoming"} : kw_upcoming)], "postprocess": first},
    {"name": "pastRelative", "symbols": [(lexer.has("kw_past") ? {type: "kw_past"} : kw_past)], "postprocess": first},
    {"name": "today", "symbols": [(lexer.has("kw_today") ? {type: "kw_today"} : kw_today)], "postprocess": first},
    {"name": "tomorrow", "symbols": [(lexer.has("kw_tomorrow") ? {type: "kw_tomorrow"} : kw_tomorrow)], "postprocess": first},
    {"name": "yesterday", "symbols": [(lexer.has("kw_yesterday") ? {type: "kw_yesterday"} : kw_yesterday)], "postprocess": first},
    {"name": "now", "symbols": [(lexer.has("kw_now") ? {type: "kw_now"} : kw_now)], "postprocess": first},
    {"name": "noon", "symbols": [(lexer.has("kw_noon") ? {type: "kw_noon"} : kw_noon)], "postprocess": first},
    {"name": "midnight", "symbols": [(lexer.has("kw_midnight") ? {type: "kw_midnight"} : kw_midnight)], "postprocess": first},
    {"name": "_$ebnf$1", "symbols": []},
    {"name": "_$ebnf$1", "symbols": ["_$ebnf$1", (lexer.has("ws") ? {type: "ws"} : ws)], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "_", "symbols": ["_$ebnf$1"], "postprocess": nuller}
  ],
  ParserStart: "main",
};

export default grammar;
