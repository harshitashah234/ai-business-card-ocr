#!/usr/bin/env node
/**
 * Test the computer vision pipeline (OCR + parser) from the command line.
 * No server or frontend required.
 *
 * Usage:
 *   node scripts/scan-image.js <path-to-image>
 *   npm run scan -- path/to/card.png
 *
 * Example:
 *   node scripts/scan-image.js ./my-card.jpg
 */

import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { extractTextFromImage } from '../utils/ocr.js';
import { parseContactText } from '../utils/parser.js';

const imagePath = process.argv[2];
if (!imagePath) {
  console.error('Usage: node scripts/scan-image.js <path-to-image>');
  console.error('Example: node scripts/scan-image.js ./card.png');
  process.exit(1);
}

const resolved = resolve(process.cwd(), imagePath);
console.error('Reading:', resolved);

let buffer;
try {
  buffer = await readFile(resolved);
} catch (e) {
  console.error('Error reading file:', e.message);
  process.exit(1);
}

console.error('Running OCR...');
const rawText = await extractTextFromImage(buffer);
console.error('Parsing...');
const result = parseContactText(rawText);

console.log(JSON.stringify(result, null, 2));
