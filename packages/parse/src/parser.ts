import nearley from 'nearley';
import grammar from './grammar';
import type { ParseResult, ParseOptions } from './index';
import { convertDateNode } from './converters/date';
import { convertDurationNode } from './converters/duration';
import {
  convertFuzzyNode,
  convertFuzzyNodeWithoutModifier,
} from './converters/fuzzy';
import { MS_PER_WEEK, TIME_OF_DAY_HOURS } from './utils/constants';

export interface RequiredParseOptions {
  referenceDate: Date;
  fiscalYearStart: 'january' | 'april' | 'july' | 'october';
  weekStartsOn: 'sunday' | 'monday';
  dateFormat: 'us' | 'intl' | 'auto';
}

export interface ASTNode {
  nodeType: string;
  [key: string]: unknown;
}

function getDefaultOptions(options?: ParseOptions): RequiredParseOptions {
  return {
    referenceDate: options?.referenceDate ?? new Date(),
    fiscalYearStart: options?.fiscalYearStart ?? 'january',
    weekStartsOn: options?.weekStartsOn ?? 'sunday',
    dateFormat: options?.dateFormat ?? 'intl',
  };
}

function getWeekdayNumber(weekday: string): number {
  const map: Record<string, number> = {
    sunday: 0, sun: 0,
    monday: 1, mon: 1,
    tuesday: 2, tue: 2, tues: 2,
    wednesday: 3, wed: 3,
    thursday: 4, thu: 4, thur: 4, thurs: 4,
    friday: 5, fri: 5,
    saturday: 6, sat: 6,
  };
  return map[weekday] ?? 0;
}

interface HandlerContext {
  opts: RequiredParseOptions;
  title: string | null;
}

function handleDateNode(expression: ASTNode, ctx: HandlerContext): ParseResult {
  const date = convertDateNode(expression, ctx.opts);
  return { type: 'date', date, title: ctx.title };
}

function handleDurationNode(expression: ASTNode, ctx: HandlerContext): ParseResult {
  const duration = convertDurationNode(expression);
  const approximate = expression.approximate === true;
  return { type: 'duration', duration, title: ctx.title, approximate };
}

function handleSpanNode(expression: ASTNode, ctx: HandlerContext): ParseResult {
  let start: Date;
  const startNode = expression.start as ASTNode;

  if (startNode.nodeType === 'date') {
    start = convertDateNode(startNode, ctx.opts);
  } else if (startNode.nodeType === 'fuzzy') {
    const fuzzy = convertFuzzyNode(startNode, ctx.opts);
    if (expression.offsetDirection === 'past') {
      start = fuzzy.end;
    } else {
      start = fuzzy.start;
    }
  } else {
    start = new Date(ctx.opts.referenceDate);
  }

  if (expression.offsetDuration && expression.offsetDirection) {
    const offsetMs = convertDurationNode(expression.offsetDuration as ASTNode);
    if (expression.offsetDirection === 'future') {
      start = new Date(start.getTime() + offsetMs);
    } else {
      start = new Date(start.getTime() - offsetMs);
    }
  }

  let duration = 0;
  if (expression.duration) {
    duration = convertDurationNode(expression.duration as ASTNode);
  }

  const end = new Date(start.getTime() + duration);
  return { type: 'span', start, end, duration, title: ctx.title };
}

function handleRangeNode(expression: ASTNode, ctx: HandlerContext): ParseResult {
  let start: Date;
  let end: Date;
  const startNode = expression.start as ASTNode;
  const endNode = expression.end as ASTNode;

  if (startNode.nodeType === 'date') {
    start = convertDateNode(startNode, ctx.opts);
  } else if (startNode.nodeType === 'fuzzy') {
    const fuzzy = convertFuzzyNode(startNode, ctx.opts);
    start = fuzzy.start;
  } else {
    start = new Date(ctx.opts.referenceDate);
  }

  if (endNode.nodeType === 'date') {
    end = convertDateNode(endNode, ctx.opts);
    if (endNode.monthOnly) {
      const month = typeof endNode.month === 'number' ? endNode.month - 1 : 0;
      const year = (endNode.year as number) ?? ctx.opts.referenceDate.getUTCFullYear();
      end = new Date(Date.UTC(year, month + 1, 0));
    }
    if (endNode.yearOnly) {
      const year = (endNode.year as number) ?? ctx.opts.referenceDate.getUTCFullYear();
      end = new Date(Date.UTC(year, 11, 31));
    }
  } else if (endNode.nodeType === 'fuzzy') {
    const fuzzy = convertFuzzyNode(endNode, ctx.opts);
    end = fuzzy.end;
  } else {
    end = new Date(ctx.opts.referenceDate);
  }

  if (end < start) {
    const isWeekdayBased = endNode.weekday !== undefined;
    if (isWeekdayBased) {
      end = new Date(end.getTime() + MS_PER_WEEK);
    } else {
      end = new Date(
        Date.UTC(
          end.getUTCFullYear() + 1,
          end.getUTCMonth(),
          end.getUTCDate(),
          end.getUTCHours(),
          end.getUTCMinutes()
        )
      );
    }
  }

  const duration = end.getTime() - start.getTime();
  return { type: 'span', start, end, duration, title: ctx.title };
}

function handleFuzzyNode(expression: ASTNode, ctx: HandlerContext): ParseResult {
  const { start, end } = convertFuzzyNode(expression, ctx.opts);
  const mod = expression.modifier as string | undefined;
  const period = expression.period as string;

  if (mod === 'start' || mod === 'beginning') {
    const periodDates = convertFuzzyNodeWithoutModifier(expression, ctx.opts);
    return { type: 'date', date: periodDates.start, title: ctx.title };
  }

  if (mod === 'end') {
    const periodDates = convertFuzzyNodeWithoutModifier(expression, ctx.opts);
    const endDate = periodDates.end;
    // For "end of week" etc., return the start of the last day, not 23:59:59
    const normalizedEnd = new Date(
      Date.UTC(
        endDate.getUTCFullYear(),
        endDate.getUTCMonth(),
        endDate.getUTCDate()
      )
    );
    return { type: 'date', date: normalizedEnd, title: ctx.title };
  }

  if (period === 'weekend' || period === 'night' || period === 'tonight' || period === 'fortnight' || period === 'weekNumber' || period === 'weekOf') {
    const duration = end.getTime() - start.getTime();
    return { type: 'span', start, end, duration, title: ctx.title };
  }

  return { type: 'fuzzy', start, end, approximate: true, title: ctx.title };
}

function handleRelativeNode(expression: ASTNode, ctx: HandlerContext): ParseResult {
  const duration = convertDurationNode(expression.duration as ASTNode);
  const ref = ctx.opts.referenceDate;

  let start: Date;
  let end: Date;

  if (expression.direction === 'past') {
    end = new Date(ref);
    start = new Date(ref.getTime() - duration);
  } else {
    start = new Date(ref);
    end = new Date(ref.getTime() + duration);
  }

  return { type: 'span', start, end, duration, title: ctx.title };
}

function handleRelativeDateNode(expression: ASTNode, ctx: HandlerContext): ParseResult {
  const durationNode = expression.duration as ASTNode;
  const baseNode = expression.baseDate as ASTNode | undefined;
  const baseFuzzyNode = expression.baseFuzzy as ASTNode | undefined;
  const timeSpec = expression.time as
    | { hour: number; minute: number }
    | { special: string }
    | undefined;

  let baseDate: Date;
  if (baseFuzzyNode) {
    const fuzzy = convertFuzzyNode(baseFuzzyNode, ctx.opts);
    if (expression.direction === 'past') {
      baseDate = fuzzy.end;
    } else {
      baseDate = fuzzy.start;
    }
  } else if (baseNode) {
    baseDate = convertDateNode(baseNode, ctx.opts);
  } else {
    baseDate = new Date(ctx.opts.referenceDate);
  }

  const durationValue = durationNode.value as number;
  const durationUnit = durationNode.unit as string;
  const direction = expression.direction === 'past' ? -1 : 1;

  let resultDate: Date;

  if (durationUnit === 'month') {
    resultDate = new Date(
      Date.UTC(
        baseDate.getUTCFullYear(),
        baseDate.getUTCMonth() + direction * durationValue,
        baseDate.getUTCDate(),
        baseDate.getUTCHours(),
        baseDate.getUTCMinutes()
      )
    );
  } else if (durationUnit === 'year') {
    resultDate = new Date(
      Date.UTC(
        baseDate.getUTCFullYear() + direction * durationValue,
        baseDate.getUTCMonth(),
        baseDate.getUTCDate(),
        baseDate.getUTCHours(),
        baseDate.getUTCMinutes()
      )
    );
  } else if (durationUnit === 'businessDay' || durationUnit === 'businessday') {
    resultDate = new Date(Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), baseDate.getUTCDate()));
    let daysToAdd = durationValue;
    while (daysToAdd > 0) {
      resultDate.setUTCDate(resultDate.getUTCDate() + direction);
      const dayOfWeek = resultDate.getUTCDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        daysToAdd--;
      }
    }
  } else if (durationUnit === 'weekdayoccurrence') {
    const weekdayStr = (expression.weekday as string).toLowerCase().replace(/s$/, '');
    const targetDay = getWeekdayNumber(weekdayStr);
    resultDate = new Date(Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), baseDate.getUTCDate()));
    let occurrences = durationValue;
    while (occurrences > 0) {
      resultDate.setUTCDate(resultDate.getUTCDate() + direction);
      if (resultDate.getUTCDay() === targetDay) {
        occurrences--;
      }
    }
  } else {
    const durationMs = convertDurationNode(durationNode);
    resultDate = new Date(baseDate.getTime() + direction * durationMs);
  }

  if (timeSpec) {
    if ('special' in timeSpec) {
      const hour = TIME_OF_DAY_HOURS[timeSpec.special] ?? 0;
      resultDate = new Date(
        Date.UTC(
          resultDate.getUTCFullYear(),
          resultDate.getUTCMonth(),
          resultDate.getUTCDate(),
          hour,
          0
        )
      );
    } else {
      resultDate = new Date(
        Date.UTC(
          resultDate.getUTCFullYear(),
          resultDate.getUTCMonth(),
          resultDate.getUTCDate(),
          timeSpec.hour,
          timeSpec.minute
        )
      );
    }
  }

  return { type: 'date', date: resultDate, title: ctx.title };
}

const nodeHandlers: Record<string, (expression: ASTNode, ctx: HandlerContext) => ParseResult | null> = {
  date: handleDateNode,
  duration: handleDurationNode,
  span: handleSpanNode,
  range: handleRangeNode,
  fuzzy: handleFuzzyNode,
  relative: handleRelativeNode,
  relativeDate: handleRelativeDateNode,
};

function convertASTToResult(
  ast: ASTNode,
  opts: RequiredParseOptions,
  originalInput?: string
): ParseResult | null {
  if (!ast || !ast.nodeType) {
    return null;
  }

  let title: string | null = null;
  let expression = ast;

  if (ast.nodeType === 'titled') {
    if (
      originalInput &&
      ast.titleStart !== undefined &&
      ast.titleEnd !== undefined
    ) {
      title = originalInput
        .slice(ast.titleStart as number, ast.titleEnd as number)
        .trim();
    } else {
      title = ast.title as string;
    }
    expression = ast.expression as ASTNode;
  }

  const handler = nodeHandlers[expression.nodeType];
  if (handler) {
    return handler(expression, { opts, title });
  }

  return null;
}

interface StrippedInput {
  stripped: string;
  originalPreserved: string;
}

function stripUnmatchedPunctuation(input: string): StrippedInput {
  let result = input;
  const originalPreserved = input;

  let openParens = (result.match(/\(/g) || []).length;
  let closeParens = (result.match(/\)/g) || []).length;
  let openBrackets = (result.match(/\[/g) || []).length;
  let closeBrackets = (result.match(/]/g) || []).length;

  while (closeParens > openParens && result.endsWith(')')) {
    result = result.slice(0, -1).trimEnd();
    closeParens--;
  }

  while (closeBrackets > openBrackets && result.endsWith(']')) {
    result = result.slice(0, -1).trimEnd();
    closeBrackets--;
  }

  openParens = (result.match(/\(/g) || []).length;
  closeParens = (result.match(/\)/g) || []).length;
  while (openParens > closeParens) {
    result = result.replace(/\(/, '');
    openParens--;
  }

  openBrackets = (result.match(/\[/g) || []).length;
  closeBrackets = (result.match(/]/g) || []).length;
  while (openBrackets > closeBrackets) {
    result = result.replace(/\[/, '');
    openBrackets--;
  }

  return {
    stripped: result.replace(/\s+/g, ' ').trim(),
    originalPreserved,
  };
}

export function parseInternal(
  input: string,
  options?: ParseOptions
): ParseResult | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  const trimmedInput = input.trim();
  const { stripped, originalPreserved } = stripUnmatchedPunctuation(trimmedInput);
  const normalized = stripped.toLowerCase();

  if (!normalized) {
    return null;
  }

  const opts = getDefaultOptions(options);

  try {
    const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
    parser.feed(normalized);

    if (parser.results.length === 0) {
      return null;
    }

    const ast = parser.results[0];
    return convertASTToResult(ast, opts, originalPreserved);
  } catch {
    return null;
  }
}

export interface ScanMatch {
  result: NonNullable<ParseResult>;
  match: string;
  start: number;
  end: number;
}

const ANCHOR_PATTERNS = [
  // Keywords that start date expressions
  /\b(today|tomorrow|yesterday|now|noon|midnight|morning|afternoon|evening|tonight)\b/gi,
  // Relative modifiers
  /\b(next|last|this|previous|coming|upcoming|past)\b/gi,
  // Period modifiers
  /\b(early|mid|late|beginning|middle|end|start)\b/gi,
  // Weekdays
  /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)\b/gi,
  // Months
  /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\b/gi,
  // Quarters and halves
  /\b(q[1-4]|h[1-2])\b/gi,
  // Seasons
  /\b(spring|summer|fall|autumn|winter)\b/gi,
  // Time patterns (HH:MM format)
  /\b(\d{1,2}:\d{2}(?::\d{2})?)\b/g,
  // Time patterns (am/pm format)
  /\b(\d{1,2}(?:am|pm))\b/gi,
  // Number + unit patterns (e.g., "2 weeks", "3 days")
  /\b(\d+\s*(?:day|days|week|weeks|month|months|year|years|hour|hours|minute|minutes|second|seconds|hr|hrs|min|mins|sec|secs|wk|wks|mo|mos|yr|yrs))\b/gi,
  // Hyphenated number-unit patterns (e.g., "52-week", "30-day")
  /\b(\d+-(?:day|week|month|year|hour|minute|second))\b/gi,
  // Abbreviated durations (e.g., "2w", "3d")
  /\b(\d+(?:mo|w|d|h|m|s|y))\b/gi,
  // Ordinals
  /\b(\d{1,2}(?:st|nd|rd|th))\b/gi,
  // "in" followed by number (e.g., "in 2 hours")
  /\b(in\s+\d)/gi,
  // "from" for ranges
  /\b(from\s+)/gi,
  // "within" for spans
  /\b(within\s+)/gi,
  // "between" for ranges
  /\b(between\s+)/gi,
  // EOD/COB
  /\b(eod|cob)\b/gi,
  // YTD
  /\b(ytd)\b/gi,
  // ISO dates
  /\b(\d{4}-\d{2}-\d{2})\b/g,
  // Standalone 4-digit years (1900-2099)
  /\b(19\d{2}|20\d{2})\b/g,
  // Word numbers that start durations (e.g., "five years", "ten weeks")
  /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred)\b/gi,
  // "a" or "an" before units (e.g., "a week", "an hour", "a couple")
  /\b(a|an)\s+(week|month|year|day|hour|minute|second|couple)\b/gi,
];

// Words that are ambiguous and need context to be dates
const AMBIGUOUS_STANDALONE = new Set([
  'may', 'march', 'spring', 'fall', 'second',
]);

// Common verbs that follow modal "may" - indicates non-date usage
const MODAL_MAY_VERBS = new Set([
  'be', 'have', 'call', 'want', 'need', 'take', 'get', 'come', 'go', 'see',
  'know', 'think', 'make', 'find', 'give', 'tell', 'ask', 'use', 'try', 'leave',
  'work', 'seem', 'feel', 'become', 'keep', 'let', 'begin', 'help', 'show', 'hear',
  'play', 'run', 'move', 'live', 'believe', 'hold', 'bring', 'happen', 'write',
  'provide', 'sit', 'stand', 'lose', 'pay', 'meet', 'include', 'continue', 'set',
  'learn', 'change', 'lead', 'understand', 'watch', 'follow', 'stop', 'create',
  'speak', 'read', 'allow', 'add', 'spend', 'grow', 'open', 'walk', 'win', 'offer',
  'remember', 'love', 'consider', 'appear', 'buy', 'wait', 'serve', 'die', 'send',
  'expect', 'build', 'stay', 'fall', 'cut', 'reach', 'kill', 'remain', 'suggest',
  'raise', 'pass', 'sell', 'require', 'report', 'decide', 'pull', 'develop', 'i',
  'we', 'you', 'he', 'she', 'they', 'it', 'not',
]);

function findAnchorPositions(input: string): number[] {
  const positions = new Set<number>();

  for (const pattern of ANCHOR_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(input)) !== null) {
      positions.add(match.index);
    }
  }

  return Array.from(positions).sort((a, b) => a - b);
}

function isWordBoundary(char: string | undefined): boolean {
  if (char === undefined) {
    return true;
  }
  return /[\s\p{P}]/u.test(char);
}

function stripTrailingPunctuation(text: string): string {
  return text.replace(/[)\]}"'.,;:!?]+$/, '');
}

function tryParseFromPosition(
  input: string,
  startPos: number,
  options?: ParseOptions
): ScanMatch | null {
  const remainingText = input.slice(startPos);
  // Split into words, keeping track of word boundaries
  const tokens = remainingText.split(/(\s+|[)\]}"',;:!?]+)/);

  let bestMatch: ScanMatch | null = null;
  let lastSuccessfulResult: ParseResult | null = null;
  let currentText = '';
  let wordCount = 0;
  let consecutiveWordFailures = 0;

  for (const token of tokens) {
    // Skip empty tokens
    if (!token) {
      continue;
    }

    // If we hit punctuation that typically ends a phrase, try what we have and stop
    if (/^[)\]}"',;:!?]+$/.test(token)) {
      break;
    }

    // Skip whitespace-only tokens (just add to currentText without trying to parse)
    if (/^\s+$/.test(token)) {
      currentText += token;
      continue;
    }

    currentText += token;
    wordCount++;

    const trimmed = stripTrailingPunctuation(currentText.trim());
    if (!trimmed) {
      continue;
    }

    const result = parseInternal(trimmed, options);
    if (result) {
      // Check for ambiguous words
      const lowerTrimmed = trimmed.toLowerCase();
      const words = lowerTrimmed.split(/\s+/);
      const firstWord = words[0];

      // Check if "may" is being used as a modal verb (followed by a verb)
      if (firstWord === 'may' && words.length >= 2) {
        const nextWord = words[1] ?? '';
        if (MODAL_MAY_VERBS.has(nextWord)) {
          consecutiveWordFailures++;
          continue;
        }
      }

      // Check for ambiguous standalone words that need preceding context
      if (AMBIGUOUS_STANDALONE.has(lowerTrimmed)) {
        const beforeStart = input.slice(Math.max(0, startPos - 10), startPos).toLowerCase();
        const hasContext = /\b(in|by|on|at|for|the)\s*$/i.test(beforeStart);

        if (!hasContext) {
          consecutiveWordFailures++;
          continue;
        }
      }

      // Check if the result is "better" than the previous one
      // A result is better if it has more specific information (e.g., includes time)
      const lastMatchText = bestMatch ? bestMatch.match : undefined;
      const isBetterResult = !lastSuccessfulResult ||
        resultScore(result, trimmed) > resultScore(lastSuccessfulResult, lastMatchText);

      if (isBetterResult) {
        const matchEnd = startPos + trimmed.length;
        bestMatch = {
          result,
          match: trimmed,
          start: startPos,
          end: matchEnd,
        };
        lastSuccessfulResult = result;
        consecutiveWordFailures = 0;
      }
    } else {
      consecutiveWordFailures++;
      // If we've had multiple consecutive word failures after a success, stop trying
      if (bestMatch && consecutiveWordFailures >= 3) {
        break;
      }
    }

    // Stop after trying a reasonable number of words
    if (wordCount > 12) {
      break;
    }
  }

  return bestMatch;
}

function resultScore(result: ParseResult, matchText?: string): number {
  if (!result) {
    return 0;
  }

  let score = 1;

  if (result.type === 'date') {
    const date = result.date;
    // Higher score if time is specified (not midnight)
    if (date.getUTCHours() !== 0 || date.getUTCMinutes() !== 0) {
      score += 2;
    }
  } else if (result.type === 'span') {
    // Spans are more specific than single dates, give them higher score
    score += 3;
  } else if (result.type === 'fuzzy') {
    score += 0.5;
  }

  // In scan mode, titles that don't have explicit separators are likely
  // false positives from over-matching. Penalize them unless the original
  // text contains a title separator.
  if (result.title && matchText) {
    const hasTitleSeparator = /[-–—:]/.test(matchText) || /\(.*\)/.test(matchText) || /\[.*\]/.test(matchText);
    if (!hasTitleSeparator) {
      // This is likely a false title from over-matching, heavily penalize
      score -= 5;
    }
  }

  // Small bonus for longer matches when no problematic title
  // This helps prefer "jan 5 to jan 10" over "jan 5 to jan"
  if (matchText && !result.title) {
    score += matchText.length * 0.001;
  }

  return score;
}

function removeOverlappingMatches(matches: ScanMatch[]): ScanMatch[] {
  if (matches.length <= 1) {
    return matches;
  }

  // Sort by start position, then by length (longer first)
  const sorted = [...matches].sort((a, b) => {
    if (a.start !== b.start) {
      return a.start - b.start;
    }
    return (b.end - b.start) - (a.end - a.start);
  });

  const result: ScanMatch[] = [];
  let lastEnd = -1;

  for (const match of sorted) {
    if (match.start >= lastEnd) {
      result.push(match);
      lastEnd = match.end;
    } else {
      const lastMatch = result[result.length - 1];
      if (lastMatch) {
        const currentLength = match.end - match.start;
        const lastLength = lastMatch.end - lastMatch.start;
        // If this match is longer and overlaps at the same start, replace the previous one
        if (currentLength > lastLength && match.start === lastMatch.start) {
          result[result.length - 1] = match;
          lastEnd = match.end;
        }
      }
    }
  }

  return result;
}

export function scanInternal(
  input: string,
  options?: ParseOptions
): ScanMatch[] {
  if (!input || typeof input !== 'string') {
    return [];
  }

  const trimmedInput = input.trim();
  if (!trimmedInput) {
    return [];
  }

  const anchorPositions = findAnchorPositions(trimmedInput);
  const matches: ScanMatch[] = [];

  for (const pos of anchorPositions) {
    // Verify we're at a word boundary
    if (pos > 0 && !isWordBoundary(trimmedInput[pos - 1])) {
      continue;
    }

    const match = tryParseFromPosition(trimmedInput, pos, options);
    if (match) {
      matches.push(match);
    }
  }

  return removeOverlappingMatches(matches);
}
