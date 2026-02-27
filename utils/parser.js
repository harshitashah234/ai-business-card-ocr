/**
 * Parser utility - extracts structured contact fields from OCR raw text
 * using regex and heuristic rules.
 */

// --- Regex patterns ---
const EMAIL_REGEX =
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX =
  /(?:\+?1[-.\s]*)?\(?[0-9]{3}\)?[-.\s]*[0-9]{3}[-.\s]*[0-9]{4}|(?:\+?[0-9]{1,3}[-.\s]*)?[0-9]{2,4}[-.\s]*[0-9]{2,4}[-.\s]*[0-9]{2,4}(?:[-.\s]*[0-9]+)?/g;
const URL_REGEX =
  /(?:https?:\/\/|www\.)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?/gi;

const JOB_TITLE_KEYWORDS = [
  'ceo', 'cfo', 'cto', 'coo', 'founder', 'owner', 'partner',
  'president', 'vp', 'vice president', 'director', 'manager',
  'engineer', 'developer', 'designer', 'consultant', 'analyst',
  'specialist', 'coordinator', 'assistant', 'lead', 'head of',
  'chief', 'senior', 'junior', 'principal', 'architect',
];

/**
 * Parse raw OCR text into structured contact fields.
 * @param {string} rawText - Cleaned text from OCR
 * @returns {Object} Structured contact object
 */
export function parseContactText(rawText) {
  const result = {
    full_name: '',
    job_title: '',
    company: '',
    email: '',
    phone_number: '',
    website: '',
    address: '',
    raw_text: rawText || '',
  };

  if (!rawText || !rawText.trim()) return result;

  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
  const fullText = rawText;

  // --- Extract email (first match) ---
  const emails = fullText.match(EMAIL_REGEX);
  if (emails && emails.length) result.email = emails[0].trim();

  // --- Extract phone (first match, normalized) ---
  const phones = fullText.match(PHONE_REGEX);
  if (phones && phones.length) {
    result.phone_number = normalizePhone(phones[0]);
  }

  // --- Extract URL/website (first match) ---
  const urls = fullText.match(URL_REGEX);
  if (urls && urls.length) {
    result.website = urls[0].trim().replace(/^www\./i, 'https://www.');
    if (!result.website.startsWith('http')) result.website = 'https://' + result.website;
  }

  // --- Remove extracted patterns from lines for name/title/company/address ---
  const usedPatterns = [
    ...(emails || []),
    ...(phones || []),
    ...(urls || []),
  ];
  const isUsedLine = (line) => {
    const lower = line.toLowerCase();
    return usedPatterns.some((p) => lower.includes(String(p).toLowerCase()));
  };

  const candidateLines = lines.filter((line) => !isUsedLine(line));

  // --- Detect job title by keywords ---
  for (const line of candidateLines) {
    const lower = line.toLowerCase();
    const hasKeyword = JOB_TITLE_KEYWORDS.some((kw) => lower.includes(kw));
    if (hasKeyword && line.length < 80) {
      result.job_title = line.trim();
      break;
    }
  }

  // --- Name: first capitalized line that is not email/phone/url and not job title ---
  const jobTitleLower = result.job_title.toLowerCase();
  for (const line of candidateLines) {
    if (line === result.job_title) continue;
    if (looksLikeName(line) && line.length < 60) {
      result.full_name = line.trim();
      break;
    }
  }

  // --- Company: often second line or line with Inc/LLC/Corp/etc. ---
  const companyIndicators = /\b(inc\.?|llc|ltd\.?|corp\.?|co\.?|gmbh|plc)\b/i;
  for (const line of candidateLines) {
    if (line === result.full_name || line === result.job_title) continue;
    if (companyIndicators.test(line) || (line.length >= 2 && line.length <= 50)) {
      result.company = line.trim();
      break;
    }
  }
  if (!result.company && candidateLines.length > 1) {
    const next = candidateLines.find(
      (l) => l !== result.full_name && l !== result.job_title
    );
    if (next) result.company = next.trim();
  }

  // --- Address: lines that look like street/city/state/zip ---
  const addressParts = candidateLines.filter(
    (line) =>
      line !== result.full_name &&
      line !== result.job_title &&
      line !== result.company &&
      (/\d+/.test(line) || /\b(street|st|ave|blvd|road|rd|drive|dr|lane|ln|suite|ste)\b/i.test(line))
  );
  if (addressParts.length) result.address = addressParts.join(', ').trim();

  return result;
}

function normalizePhone(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 10) {
    const rest = digits.slice(-10);
    const area = rest.slice(0, 3);
    const mid = rest.slice(3, 6);
    const last = rest.slice(6);
    return `(${area}) ${mid}-${last}`;
  }
  return phone.trim();
}

function looksLikeName(line) {
  if (!line || line.length > 50) return false;
  const words = line.split(/\s+/).filter(Boolean);
  if (words.length < 1 || words.length > 4) return false;
  const mostlyCapitalized = words.every(
    (w) => w[0] === w[0].toUpperCase() || /^[A-Z]\.?$/.test(w)
  );
  return mostlyCapitalized && /^[A-Za-z\s.-]+$/.test(line);
}
