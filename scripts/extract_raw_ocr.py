import os
import csv

import pytesseract
from PIL import Image

# 1️⃣ Folder containing your images
image_folder = os.path.join(os.path.dirname(__file__), "..", "cards")

# 2️⃣ Output CSV file
output_csv = os.path.join(os.path.dirname(__file__), "..", "raw_ocr_dataset.csv")

rows = []

# 3️⃣ Loop through all images
for filename in sorted(os.listdir(image_folder)):
    if filename.lower().endswith((".jpg", ".png", ".jpeg")):
        image_path = os.path.join(image_folder, filename)

        # image_id = filename without extension
        image_id = os.path.splitext(filename)[0]

        # Run Tesseract OCR (convert to RGB for pytesseract compatibility)
        image = Image.open(image_path).convert("RGB")
        raw_text = pytesseract.image_to_string(image, config="--psm 6")

        rows.append([image_id, raw_text])

# 4️⃣ Save results to CSV
with open(output_csv, "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["image_id", "raw_ocr_text"])
    writer.writerows(rows)

print(f"✅ Done! CSV saved as {output_csv}")
