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
declare var integer: any;
declare var comma: any;
declare var time: any;
declare var ampm: any;
declare var decimal: any;
declare var ordinal: any;
declare var month: any;
declare var weekday: any;
declare var quarter: any;
declare var half: any;
declare var season: any;
declare var unit: any;
declare var wordNumber: any;
declare var ordinalWord: any;
declare var modifier: any;
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
declare var kw_sometime: any;
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
    {"name": "titledExpression", "symbols": ["titleText", (lexer.has("dash") ? {type: "dash"} : dash), "_", "expression"], "postprocess": d => makeTitled(d[0], d[3])},
    {"name": "titledExpression", "symbols": ["titleText", (lexer.has("colon") ? {type: "colon"} : colon), "_", "expression"], "postprocess": d => makeTitled(d[0], d[3])},
    {"name": "titledExpression", "symbols": ["titleText", "_", (lexer.has("lparen") ? {type: "lparen"} : lparen), "expression", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": d => makeTitled(d[0], d[3])},
    {"name": "titledExpression", "symbols": ["titleText", "_", (lexer.has("lbracket") ? {type: "lbracket"} : lbracket), "expression", (lexer.has("rbracket") ? {type: "rbracket"} : rbracket)], "postprocess": d => makeTitled(d[0], d[3])},
    {"name": "titledExpression", "symbols": ["titleText", "_", "onConnector", "_", "expression"], "postprocess": d => makeTitled(d[0], d[4])},
    {"name": "titledExpression", "symbols": ["titleText", "_", "inConnector", "_", "expression"], "postprocess": d => makeTitled(d[0], d[4])},
    {"name": "titledExpression", "symbols": ["titleText", "_", "forConnector", "_", "expression"], "postprocess": d => makeTitled(d[0], d[4])},
    {"name": "titledExpression", "symbols": ["titleText", "_", "fromConnector", "_", "expression"], "postprocess": d => makeTitled(d[0], d[4])},
    {"name": "titledExpression", "symbols": ["titleText", "_", "duringConnector", "_", "expression"], "postprocess": d => makeTitled(d[0], d[4])},
    {"name": "titledExpression", "symbols": ["titleText", "_", "startingConnector", "_", "expression"], "postprocess": d => makeTitled(d[0], d[4])},
    {"name": "titleText", "symbols": ["titleWord"], "postprocess": d => d[0]},
    {"name": "titleText", "symbols": ["titleText", "_", "titleWord"], "postprocess": d => d[0] + ' ' + d[2]},
    {"name": "titleWord", "symbols": [(lexer.has("word") ? {type: "word"} : word)], "postprocess": d => d[0].value},
    {"name": "titleWord", "symbols": [(lexer.has("integer") ? {type: "integer"} : integer)], "postprocess": d => d[0].value},
    {"name": "titleWord", "symbols": [(lexer.has("colon") ? {type: "colon"} : colon)], "postprocess": d => ':'},
    {"name": "titleWord", "symbols": [(lexer.has("dash") ? {type: "dash"} : dash)], "postprocess": d => '-'},
    {"name": "titleWord", "symbols": [(lexer.has("lparen") ? {type: "lparen"} : lparen), "titleText", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": d => '(' + d[1] + ')'},
    {"name": "titleWord", "symbols": [(lexer.has("lbracket") ? {type: "lbracket"} : lbracket), "titleText", (lexer.has("rbracket") ? {type: "rbracket"} : rbracket)], "postprocess": d => '[' + d[1] + ']'},
    {"name": "expression", "symbols": ["range"], "postprocess": first},
    {"name": "expression", "symbols": ["span"], "postprocess": first},
    {"name": "expression", "symbols": ["relative"], "postprocess": first},
    {"name": "expression", "symbols": ["fuzzy"], "postprocess": first},
    {"name": "expression", "symbols": ["duration"], "postprocess": first},
    {"name": "expression", "symbols": ["date"], "postprocess": first},
    {"name": "range", "symbols": ["date", "_", "toConnector", "_", "date"], "postprocess": d => makeRange(d[0], d[4])},
    {"name": "range", "symbols": ["fromConnector", "_", "date", "_", "toConnector", "_", "date"], "postprocess": d => makeRange(d[2], d[6])},
    {"name": "range", "symbols": ["date", "_", (lexer.has("dash") ? {type: "dash"} : dash), "_", "date"], "postprocess": d => makeRange(d[0], d[4])},
    {"name": "range", "symbols": ["betweenConnector", "_", "date", "_", "andConnector", "_", "date"], "postprocess": d => makeRange(d[2], d[6])},
    {"name": "range", "symbols": ["date", "_", "throughConnector", "_", "date"], "postprocess": d => makeRange(d[0], d[4])},
    {"name": "range", "symbols": ["date", "_", "untilConnector", "_", "date"], "postprocess": d => makeRange(d[0], d[4])},
    {"name": "range", "symbols": ["untilConnector", "_", "date"], "postprocess": d => makeRange(makeDate({ special: 'today' }), d[2])},
    {"name": "range", "symbols": ["fuzzy", "_", "toConnector", "_", "fuzzy"], "postprocess": d => makeRange(d[0], d[4])},
    {"name": "range", "symbols": ["fromConnector", "_", "fuzzy", "_", "toConnector", "_", "fuzzy"], "postprocess": d => makeRange(d[2], d[6])},
    {"name": "span", "symbols": ["date", "_", "forConnector", "_", "duration"], "postprocess": d => makeSpan(d[0], d[4])},
    {"name": "span", "symbols": ["inConnector", "_", "fuzzy", "_", "forConnector", "_", "duration"], "postprocess": d => makeSpan(d[2], d[6])},
    {"name": "span", "symbols": ["inConnector", "_", "date", "_", "forConnector", "_", "duration"], "postprocess": d => makeSpan(d[2], d[6])},
    {"name": "span", "symbols": ["startingConnector", "_", "date", "_", "forConnector", "_", "duration"], "postprocess": d => makeSpan(d[2], d[6])},
    {"name": "span", "symbols": ["startingConnector", "_", "date"], "postprocess": d => makeSpan(d[2])},
    {"name": "span", "symbols": ["date", "_", "startingConnector", "_", "date"], "postprocess": d => makeSpan(d[4], d[0])},
    {"name": "span", "symbols": ["duration", "_", "startingConnector", "_", "date"], "postprocess": d => makeSpan(d[4], d[0])},
    {"name": "span", "symbols": ["duration", "_", "fromConnector", "_", "date"], "postprocess": d => makeSpan(d[4], d[0])},
    {"name": "span", "symbols": ["duration", "_", "inConnector", "_", "fuzzy"], "postprocess": d => makeSpan(d[4], d[0])},
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
    {"name": "relative", "symbols": ["lastRelative", "_", "unit"], "postprocess": d => makeRelative('past', makeDuration(1, d[2]))},
    {"name": "relative", "symbols": ["nextRelative", "_", "unit"], "postprocess": d => makeRelative('future', makeDuration(1, d[2]))},
    {"name": "relative", "symbols": ["pastRelative", "_", "unit"], "postprocess": d => makeRelative('past', makeDuration(1, d[2]))},
    {"name": "relative", "symbols": ["previousRelative", "_", "unit"], "postprocess": d => makeRelative('past', makeDuration(1, d[2]))},
    {"name": "relative", "symbols": ["comingRelative", "_", "unit"], "postprocess": d => makeRelative('future', makeDuration(1, d[2]))},
    {"name": "relative", "symbols": ["upcomingRelative", "_", "unit"], "postprocess": d => makeRelative('future', makeDuration(1, d[2]))},
    {"name": "fuzzy", "symbols": ["quarter"], "postprocess": d => makeFuzzy({ period: 'quarter', quarter: parseQuarter(d[0].value) })},
    {"name": "fuzzy", "symbols": ["quarter", "_", "year"], "postprocess": d => makeFuzzy({ period: 'quarter', quarter: parseQuarter(d[0].value), year: d[2] })},
    {"name": "fuzzy", "symbols": ["half"], "postprocess": d => makeFuzzy({ period: 'half', half: parseHalf(d[0].value) })},
    {"name": "fuzzy", "symbols": ["half", "_", "year"], "postprocess": d => makeFuzzy({ period: 'half', half: parseHalf(d[0].value), year: d[2] })},
    {"name": "fuzzy", "symbols": ["modifier", "_", "month"], "postprocess": d => makeFuzzy({ period: 'month', month: d[2], modifier: d[0] })},
    {"name": "fuzzy", "symbols": ["modifier", "_", "quarter"], "postprocess": d => makeFuzzy({ period: 'quarter', quarter: parseQuarter(d[2].value), modifier: d[0] })},
    {"name": "fuzzy", "symbols": ["modifier", "_", "year"], "postprocess": d => makeFuzzy({ period: 'year', year: d[2], modifier: d[0] })},
    {"name": "fuzzy", "symbols": ["endConnector", "_", "ofConnector", "_", "month"], "postprocess": d => makeFuzzy({ period: 'month', month: d[4], modifier: 'end' })},
    {"name": "fuzzy", "symbols": ["endConnector", "_", "ofConnector", "_", "year"], "postprocess": d => makeFuzzy({ period: 'year', year: d[4], modifier: 'end' })},
    {"name": "fuzzy", "symbols": ["endConnector", "_", "ofConnector", "_", "quarter"], "postprocess": d => makeFuzzy({ period: 'quarter', quarter: parseQuarter(d[4].value), modifier: 'end' })},
    {"name": "fuzzy", "symbols": ["endConnector", "_", "ofConnector", "_", "theConnector", "_", "month"], "postprocess": d => makeFuzzy({ period: 'month', month: d[6], modifier: 'end' })},
    {"name": "fuzzy", "symbols": ["endConnector", "_", "ofConnector", "_", "theConnector", "_", "unit"], "postprocess": d => makeFuzzy({ period: d[6], modifier: 'end' })},
    {"name": "fuzzy", "symbols": ["beginningConnector", "_", "ofConnector", "_", "month"], "postprocess": d => makeFuzzy({ period: 'month', month: d[4], modifier: 'beginning' })},
    {"name": "fuzzy", "symbols": ["beginningConnector", "_", "ofConnector", "_", "year"], "postprocess": d => makeFuzzy({ period: 'year', year: d[4], modifier: 'beginning' })},
    {"name": "fuzzy", "symbols": ["startConnector", "_", "ofConnector", "_", "month"], "postprocess": d => makeFuzzy({ period: 'month', month: d[4], modifier: 'start' })},
    {"name": "fuzzy", "symbols": ["startConnector", "_", "ofConnector", "_", "year"], "postprocess": d => makeFuzzy({ period: 'year', year: d[4], modifier: 'start' })},
    {"name": "fuzzy", "symbols": ["middleConnector", "_", "ofConnector", "_", "month"], "postprocess": d => makeFuzzy({ period: 'month', month: d[4], modifier: 'middle' })},
    {"name": "fuzzy", "symbols": ["middleConnector", "_", "ofConnector", "_", "year"], "postprocess": d => makeFuzzy({ period: 'year', year: d[4], modifier: 'middle' })},
    {"name": "fuzzy", "symbols": ["season"], "postprocess": d => makeFuzzy({ period: 'season', season: d[0] })},
    {"name": "fuzzy", "symbols": ["season", "_", "year"], "postprocess": d => makeFuzzy({ period: 'season', season: d[0], year: d[2] })},
    {"name": "fuzzy", "symbols": ["ordinalWord", "_", "quarter", "_", "year"], "postprocess": d => makeFuzzy({ period: 'quarter', quarter: parseOrdinalWord(d[0]), year: d[4] })},
    {"name": "fuzzy", "symbols": ["ordinalWord", "_", "quarter"], "postprocess": d => makeFuzzy({ period: 'quarter', quarter: parseOrdinalWord(d[0]) })},
    {"name": "fuzzy", "symbols": ["ordinalWord", "_", "half", "_", "year"], "postprocess": d => makeFuzzy({ period: 'half', half: parseOrdinalWord(d[0]), year: d[4] })},
    {"name": "fuzzy", "symbols": ["ordinalWord", "_", "half"], "postprocess": d => makeFuzzy({ period: 'half', half: parseOrdinalWord(d[0]) })},
    {"name": "fuzzy", "symbols": ["aroundConnector", "_", "date"], "postprocess": d => makeFuzzy({ ...d[2], period: 'around' })},
    {"name": "fuzzy", "symbols": ["aboutConnector", "_", "date"], "postprocess": d => makeFuzzy({ ...d[2], period: 'around' })},
    {"name": "fuzzy", "symbols": ["sometimeConnector", "_", "inConnector", "_", "fuzzy"], "postprocess": d => d[4]},
    {"name": "duration", "symbols": ["number", "_", "unit"], "postprocess": d => makeDuration(d[0], d[2])},
    {"name": "duration", "symbols": ["wordNumber", "_", "unit"], "postprocess": d => makeDuration(parseWordNumber(d[0]), d[2])},
    {"name": "duration", "symbols": ["halfWord", "_", "wordNumber", "_", "unit"], "postprocess": d => makeDuration(parseWordNumber(d[2]) + 0.5, d[4])},
    {"name": "duration", "symbols": ["number", "_", "andConnector", "_", "halfWord", "_", "unit"], "postprocess": d => makeDuration(d[0] + 0.5, d[6])},
    {"name": "duration", "symbols": ["halfWord", "_", "unit"], "postprocess": d => makeDuration(0.5, d[2])},
    {"name": "duration", "symbols": ["duration", "_", "andConnector", "_", "duration"], "postprocess": d => ({ ...d[0], combined: [d[0], d[4]] })},
    {"name": "duration", "symbols": ["duration", "_", "duration"], "postprocess": d => ({ ...d[0], combined: [d[0], d[2]] })},
    {"name": "date", "symbols": ["specialDay"], "postprocess": d => makeDate({ special: d[0] })},
    {"name": "date", "symbols": ["relativeWeekday"], "postprocess": first},
    {"name": "date", "symbols": ["weekday"], "postprocess": d => makeDate({ weekday: d[0] })},
    {"name": "date", "symbols": ["monthDay"], "postprocess": first},
    {"name": "date", "symbols": ["monthDayYear"], "postprocess": first},
    {"name": "date", "symbols": ["relativePeriod"], "postprocess": first},
    {"name": "date", "symbols": ["dateWithTime"], "postprocess": first},
    {"name": "specialDay", "symbols": ["today"], "postprocess": d => 'today'},
    {"name": "specialDay", "symbols": ["tomorrow"], "postprocess": d => 'tomorrow'},
    {"name": "specialDay", "symbols": ["yesterday"], "postprocess": d => 'yesterday'},
    {"name": "specialDay", "symbols": ["now"], "postprocess": d => 'now'},
    {"name": "relativeWeekday", "symbols": ["nextRelative", "_", "weekday"], "postprocess": d => makeDate({ weekday: d[2], relative: 'next' })},
    {"name": "relativeWeekday", "symbols": ["lastRelative", "_", "weekday"], "postprocess": d => makeDate({ weekday: d[2], relative: 'last' })},
    {"name": "relativeWeekday", "symbols": ["thisRelative", "_", "weekday"], "postprocess": d => makeDate({ weekday: d[2], relative: 'this' })},
    {"name": "relativePeriod", "symbols": ["nextRelative", "_", "unit"], "postprocess": d => makeDate({ relative: 'next', period: d[2] })},
    {"name": "relativePeriod", "symbols": ["lastRelative", "_", "unit"], "postprocess": d => makeDate({ relative: 'last', period: d[2] })},
    {"name": "relativePeriod", "symbols": ["thisRelative", "_", "unit"], "postprocess": d => makeDate({ relative: 'this', period: d[2] })},
    {"name": "monthDay", "symbols": ["month", "_", "dayNumber"], "postprocess": d => makeDate({ month: d[0], day: d[2] })},
    {"name": "monthDay", "symbols": ["dayNumber", "_", "month"], "postprocess": d => makeDate({ month: d[2], day: d[0] })},
    {"name": "monthDay", "symbols": ["dayNumber", "_", "ofConnector", "_", "month"], "postprocess": d => makeDate({ month: d[4], day: d[0] })},
    {"name": "monthDay", "symbols": ["theConnector", "_", "dayNumber", "_", "ofConnector", "_", "month"], "postprocess": d => makeDate({ month: d[6], day: d[2] })},
    {"name": "monthDayYear", "symbols": ["monthDay", "_", "year"], "postprocess": d => ({ ...d[0], year: d[2] })},
    {"name": "monthDayYear", "symbols": ["monthDay", (lexer.has("comma") ? {type: "comma"} : comma), "_", "year"], "postprocess": d => ({ ...d[0], year: d[3] })},
    {"name": "dateWithTime", "symbols": ["date", "_", "atConnector", "_", "time"], "postprocess": d => ({ ...d[0], time: d[4] })},
    {"name": "dateWithTime", "symbols": ["date", "_", "atConnector", "_", "timeWord"], "postprocess": d => ({ ...d[0], time: { special: d[4] } })},
    {"name": "dateWithTime", "symbols": ["time", "_", "date"], "postprocess": d => ({ ...d[2], time: d[0] })},
    {"name": "dateWithTime", "symbols": ["timeWord", "_", "date"], "postprocess": d => ({ ...d[2], time: { special: d[0] } })},
    {"name": "time", "symbols": [(lexer.has("time") ? {type: "time"} : time)], "postprocess":  d => {
          const parts = d[0].value.split(':');
          return { hour: parseInt(parts[0], 10), minute: parseInt(parts[1], 10) };
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
    {"name": "year", "symbols": [(lexer.has("integer") ? {type: "integer"} : integer)], "postprocess": d => parseInt(d[0].value, 10)},
    {"name": "dayNumber", "symbols": [(lexer.has("integer") ? {type: "integer"} : integer)], "postprocess": d => parseInt(d[0].value, 10)},
    {"name": "dayNumber", "symbols": [(lexer.has("ordinal") ? {type: "ordinal"} : ordinal)], "postprocess": d => parseOrdinal(d[0].value)},
    {"name": "month", "symbols": [(lexer.has("month") ? {type: "month"} : month)], "postprocess": d => parseMonth(d[0].value)},
    {"name": "weekday", "symbols": [(lexer.has("weekday") ? {type: "weekday"} : weekday)], "postprocess": d => d[0].value},
    {"name": "quarter", "symbols": [(lexer.has("quarter") ? {type: "quarter"} : quarter)], "postprocess": first},
    {"name": "half", "symbols": [(lexer.has("half") ? {type: "half"} : half)], "postprocess": first},
    {"name": "season", "symbols": [(lexer.has("season") ? {type: "season"} : season)], "postprocess": d => d[0].value},
    {"name": "unit", "symbols": [(lexer.has("unit") ? {type: "unit"} : unit)], "postprocess": d => d[0].value},
    {"name": "wordNumber", "symbols": [(lexer.has("wordNumber") ? {type: "wordNumber"} : wordNumber)], "postprocess": d => d[0].value},
    {"name": "ordinalWord", "symbols": [(lexer.has("ordinalWord") ? {type: "ordinalWord"} : ordinalWord)], "postprocess": d => d[0].value},
    {"name": "modifier", "symbols": [(lexer.has("modifier") ? {type: "modifier"} : modifier)], "postprocess": d => d[0].value},
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
    {"name": "sometimeConnector", "symbols": [(lexer.has("kw_sometime") ? {type: "kw_sometime"} : kw_sometime)], "postprocess": first},
    {"name": "endConnector", "symbols": [(lexer.has("modifier") ? {type: "modifier"} : modifier)], "postprocess": d => d[0].value === 'end' ? d[0] : null},
    {"name": "beginningConnector", "symbols": [(lexer.has("modifier") ? {type: "modifier"} : modifier)], "postprocess": d => d[0].value === 'beginning' ? d[0] : null},
    {"name": "startConnector", "symbols": [(lexer.has("modifier") ? {type: "modifier"} : modifier)], "postprocess": d => d[0].value === 'start' ? d[0] : null},
    {"name": "middleConnector", "symbols": [(lexer.has("modifier") ? {type: "modifier"} : modifier)], "postprocess": d => d[0].value === 'middle' ? d[0] : null},
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
