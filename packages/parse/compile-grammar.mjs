#!/usr/bin/env node
import nearley from 'nearley';
import compile from 'nearley/lib/compile.js';
import generate from 'nearley/lib/generate.js';
import nearleyGrammar from 'nearley/lib/nearley-language-bootstrapped.js';
import { readFileSync, writeFileSync } from 'fs';

const grammarPath = process.argv[2] || 'src/grammar.ne';
const outputPath = process.argv[3] || 'src/grammar.ts';

try {
  const grammar = readFileSync(grammarPath, 'utf8');
  const parser = new nearley.Parser(nearley.Grammar.fromCompiled(nearleyGrammar));
  parser.feed(grammar);

  if (parser.results.length === 0) {
    console.error('No parse results');
    process.exit(1);
  }

  const c = compile(parser.results[0], {});
  let output = generate(c, 'grammar');

  // Add TypeScript nocheck directive
  output = '// @ts-nocheck\n' + output;

  writeFileSync(outputPath, output);
  console.log(`Successfully compiled ${grammarPath} to ${outputPath}`);
} catch (err) {
  console.error('Error compiling grammar:', err.message);
  process.exit(1);
}
