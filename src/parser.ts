import nearley from 'nearley';
import grammar from './grammar';
import type { ParseResult, ParseOptions } from './index';
import { convertDateNode } from './converters/date';
import { convertDurationNode } from './converters/duration';
import {
  convertFuzzyNode,
  convertFuzzyNodeWithoutModifier,
} from './converters/fuzzy';
import { MS_PER_WEEK } from './utils/constants';

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

  switch (expression.nodeType) {
    case 'date': {
      const date = convertDateNode(expression, opts);
      return { type: 'date', date, title };
    }

    case 'duration': {
      const duration = convertDurationNode(expression);
      return { type: 'duration', duration, title };
    }

    case 'span': {
      let start: Date;
      const startNode = expression.start as ASTNode;

      if (startNode.nodeType === 'date') {
        start = convertDateNode(startNode, opts);
      } else if (startNode.nodeType === 'fuzzy') {
        const fuzzy = convertFuzzyNode(startNode, opts);
        start = fuzzy.start;
      } else {
        start = new Date(opts.referenceDate);
      }

      let duration = 0;
      if (expression.duration) {
        duration = convertDurationNode(expression.duration as ASTNode);
      }

      const end = new Date(start.getTime() + duration);

      return { type: 'span', start, end, duration, title };
    }

    case 'range': {
      let start: Date;
      let end: Date;
      const startNode = expression.start as ASTNode;
      const endNode = expression.end as ASTNode;

      if (startNode.nodeType === 'date') {
        start = convertDateNode(startNode, opts);
      } else if (startNode.nodeType === 'fuzzy') {
        const fuzzy = convertFuzzyNode(startNode, opts);
        start = fuzzy.start;
      } else {
        start = new Date(opts.referenceDate);
      }

      if (endNode.nodeType === 'date') {
        end = convertDateNode(endNode, opts);
        if (endNode.monthOnly) {
          const month =
            typeof endNode.month === 'number' ? endNode.month - 1 : 0;
          const year =
            (endNode.year as number) ?? opts.referenceDate.getUTCFullYear();
          end = new Date(Date.UTC(year, month + 1, 0));
        }
        if (endNode.yearOnly) {
          const year =
            (endNode.year as number) ?? opts.referenceDate.getUTCFullYear();
          end = new Date(Date.UTC(year, 11, 31));
        }
      } else if (endNode.nodeType === 'fuzzy') {
        const fuzzy = convertFuzzyNode(endNode, opts);
        end = fuzzy.end;
      } else {
        end = new Date(opts.referenceDate);
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

      return { type: 'span', start, end, duration, title };
    }

    case 'fuzzy': {
      const { start, end } = convertFuzzyNode(expression, opts);
      const mod = expression.modifier as string | undefined;

      if (mod === 'start' || mod === 'beginning') {
        const periodDates = convertFuzzyNodeWithoutModifier(expression, opts);
        return { type: 'date', date: periodDates.start, title };
      }

      if (mod === 'end') {
        const periodDates = convertFuzzyNodeWithoutModifier(expression, opts);
        return { type: 'date', date: periodDates.end, title };
      }

      return { type: 'fuzzy', start, end, approximate: true, title };
    }

    case 'relative': {
      const duration = convertDurationNode(expression.duration as ASTNode);
      const ref = opts.referenceDate;

      let start: Date;
      let end: Date;

      if (expression.direction === 'past') {
        end = new Date(ref);
        start = new Date(ref.getTime() - duration);
      } else {
        start = new Date(ref);
        end = new Date(ref.getTime() + duration);
      }

      return { type: 'span', start, end, duration, title };
    }

    default:
      return null;
  }
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

export function extractInternal(
  input: string,
  options?: ParseOptions
): ParseResult[] {
  if (!input || typeof input !== 'string') {
    return [];
  }

  const segments = input
    .split(/[,;\n]|\s+and\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const results: ParseResult[] = [];

  for (const segment of segments) {
    const result = parseInternal(segment, options);
    if (result) {
      results.push(result);
    }
  }

  return results;
}
