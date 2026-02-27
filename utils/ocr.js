/**
 * OCR utility - extracts raw text from card image using Tesseract.js
 * Uses createWorker (Node-recommended) for reliable buffer handling.
 */

import { createWorker } from 'tesseract.js';

const OCR_LANG = process.env.TESSERACT_LANG || 'eng';

/**
 * Run OCR on an image buffer and return cleaned raw text.
 * @param {Buffer} imageBuffer - Raw image file buffer (jpg/png)
 * @returns {Promise<string>} Extracted and cleaned text
 */
export async function extractTextFromImage(imageBuffer) {
  if (!imageBuffer || !Buffer.isBuffer(imageBuffer)) {
    throw new Error('Invalid image buffer');
  }
  let worker;
  try {
    worker = await createWorker(OCR_LANG, 1, {
      logger: (m) => (process.env.DEBUG_OCR ? console.log(m) : null),
    });
    const { data } = await worker.recognize(imageBuffer);
    const text = data?.text ?? '';
    return cleanRawText(text);
  } catch (err) {
    throw new Error('OCR failed: ' + (err?.message || String(err)));
  } finally {
    if (worker) await worker.terminate();
  }
}

/**
 * Normalize whitespace and trim for downstream parsing.
 */
function cleanRawText(raw) {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/\s+/g, ' ')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n');
}
