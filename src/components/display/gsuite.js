/* eslint-env node */
import fs from "fs";
import process from "node:process";
import path from "path";
import { fileURLToPath } from "url";

import { sheets } from "@googleapis/sheets";
import { GoogleAuth } from "google-auth-library";
import { PDFDocument } from "pdf-lib";
import puppeteer from "puppeteer";

import { generatePdfPuppeteer } from "./generatePdfPuppeteer.js";

async function getProcessedArray(__dirname, spreadsheetId) {
  /// read from cache
  if (fs.existsSync(path.resolve(__dirname, "cache.json"))) {
    return JSON.parse(fs.readFileSync(path.resolve(__dirname, "cache.json")));
  }

  const keyFile = path.resolve(
    __dirname,
    "clear-canyon-454114-p5-a911fe242f29.json"
  );

  const auth = new GoogleAuth({
    keyFile,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheetsApi = sheets({ version: "v4", auth });

  // Get headers (row 1)
  const headerRange = `${sheetName}!1:1`;
  const headerRes = await sheetsApi.spreadsheets.values.get({
    spreadsheetId,
    range: headerRange,
  });
  const headers = headerRes.data.values?.[0] ?? [];

  // Get all data rows (starting from row 2) - using wider range to capture all columns
  const dataRange = `${sheetName}!A2:BE`;
  const res = await sheetsApi.spreadsheets.values.get({
    spreadsheetId,
    range: dataRange,
  });

  const dataRows = res.data.values ?? [];

  // Convert rows to objects
  const jsonArray = dataRows.map((row) => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] || "";
    });
    return obj;
  });

  // Postprocess each object to group fields by prefix
  const processedArray = jsonArray.map((row) => {
    const processed = {};

    Object.entries(row).forEach(([key, value]) => {
      if (value.toString().toLowerCase() === "true") {
        value = true;
      } else if (value.toString().toLowerCase() === "false") {
        value = false;
      }

      if (key.startsWith("formData.")) {
        if (!processed.formData) {
          processed.formData = {};
        }
        processed.formData[key.replace("formData.", "")] = value;
      } else if (key.startsWith("pricing.")) {
        if (!processed.pricing) {
          processed.pricing = {};
        }
        processed.pricing[key.replace("pricing.", "")] = value;
      } else if (key.startsWith("rsvpData.")) {
        if (!processed.rsvpData) {
          processed.rsvpData = {};
        }
        processed.rsvpData[key.replace("rsvpData.", "")] = value;
      } else {
        // Keep other fields at top level
        processed[key] = value;
      }
    });

    return processed;
  });

  fs.writeFileSync(
    path.resolve(__dirname, "cache.json"),
    JSON.stringify(processedArray)
  );

  return processedArray;
}

async function mergePDFs(paths, outputPath) {
  const mergedPdf = await PDFDocument.create();

  for (const pdfPath of paths) {
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdf = await PDFDocument.load(pdfBytes);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  const mergedPdfBytes = await mergedPdf.save();
  fs.writeFileSync(outputPath, mergedPdfBytes);
}

// Input provided
const sheetUrl = `https://docs.google.com/spreadsheets/d/10NVZzsGNeVwkJDNk5SiOaCbo-ZtjDInvX-I_PpwoQwE/edit?gid=0#gid=0`;
const sheetName = "Trip Registrations";

function extractSpreadsheetId(urlString) {
  const match = urlString.match(/\/spreadsheets\/d\/([^/]+)/);
  if (!match) {
    throw new Error("Unable to extract spreadsheet ID from URL");
  }
  return match[1];
}

async function processAllDataRows() {
  const spreadsheetId = extractSpreadsheetId(sheetUrl);

  // Resolve key file relative to this module so it works regardless of cwd
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Create output directory
  const outputDir = path.resolve(__dirname, "output");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const processedArray = await getProcessedArray(__dirname, spreadsheetId);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  for (const row of processedArray) {
    if (row.ID.toString() !== "35") {
      // continue;
    }

    const pdfs = await generatePdfPuppeteer(browser, row).then((pdfs) =>
      pdfs.map((pdf, i) => [
        pdf,
        path.resolve(__dirname, `generated-pdf-${i}.pdf`),
      ])
    );

    for (const [pdf, pdfPath] of pdfs) {
      fs.writeFileSync(pdfPath, pdf);
    }

    await mergePDFs(
      pdfs.map(([, pdfPath]) => pdfPath),
      path.resolve(outputDir, `arg-trip-voucher-${row.ID}.pdf`)
    );

    for (const [, pdfPath] of pdfs) {
      fs.unlinkSync(pdfPath);
    }

    console.log(
      `Merged PDF saved to ${path.resolve(outputDir, `merged-pdf-${row.ID}.pdf`)}`
    );
  }

  await browser.close();
}

processAllDataRows().catch((err) => {
  console.error("Failed to process data rows:", err?.response?.data || err);
  process.exit(1);
});
