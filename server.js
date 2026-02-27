/**
 * CardScan - Computer vision server: upload card image, OCR + parse, return JSON.
 */

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { extractTextFromImage } from './utils/ocr.js';
import { parseContactText } from './utils/parser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json());

// Store uploads in memory for OCR (no disk write required)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.originalname) ||
      ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.mimetype);
    if (allowed) cb(null, true);
    else cb(new Error('Only image files (jpg, png, gif, webp) are allowed.'));
  },
});

// Serve static test page
app.use(express.static(path.join(__dirname, 'public')));

/**
 * POST /api/scan
 * Body: multipart/form-data with field "image" (file)
 * Returns: { full_name, job_title, company, email, phone_number, website, address, raw_text }
 */
app.post('/api/scan', (req, res, next) => {
  upload.single('image')(req, res, (multerErr) => {
    if (multerErr) {
      return res.status(400).json({
        error: 'Invalid upload.',
        message: multerErr.message || 'Only image files (jpg, png, gif, webp) are allowed.',
      });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'No image file provided. Send a file in field "image".' });
    }

    const rawText = await extractTextFromImage(req.file.buffer);
    const parsed = parseContactText(rawText);

    return res.json(parsed);
  } catch (err) {
    console.error('Scan error:', err);
    return res.status(500).json({
      error: 'Failed to process image.',
      message: err.message || (process.env.NODE_ENV === 'development' ? String(err) : undefined),
    });
  }
});

// Ensure all errors return JSON (e.g. uncaught in async)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (!res.headersSent) {
    res.status(500).json({ error: 'Server error.', message: err?.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`CardScan server running at http://localhost:${PORT}`);
  console.log('Open http://localhost:3000 in the browser to upload and test card images.');
});
