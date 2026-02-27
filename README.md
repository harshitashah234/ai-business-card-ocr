# CardScan – Computer vision test

Upload a business card image and get structured contact info (OCR + parser).

## Setup

```bash
npm install
```

## Run

```bash
npm start
```

Then open **http://localhost:3000** in your browser. Use the upload zone to select or drop a card image (jpg/png), then click **Scan card**. Results show extracted name, title, company, email, phone, website, address and raw OCR text. Use **Copy** next to each field to copy to clipboard.

## API

- **POST /api/scan**  
  - Body: `multipart/form-data` with field **image** (file).  
  - Response: JSON with `full_name`, `job_title`, `company`, `email`, `phone_number`, `website`, `address`, `raw_text`.

## Env (optional)

- `PORT` – server port (default 3000)
- `TESSERACT_LANG` – OCR language (default `eng`)
- `DEBUG_OCR` – set to log Tesseract progress
# ai-business-card-ocr
