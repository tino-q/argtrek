import { drive_v3, drive } from "@googleapis/drive";
import { sheets_v4, sheets } from "@googleapis/sheets";
import { GoogleAuth } from "google-auth-library";
import { getItem, setItem, deleteItem } from "./ddb";

import credentials1 from "./clear-canyon-454114-p5-a911fe242f29.json";
import credentials2 from "./fluent-justice-472015-p1-256d7c9ae0ca.json";

const allCreds = [credentials1, credentials2];

function getGoogleAuth() {
  // pick random credentials
  const credentials = allCreds[Math.floor(Math.random() * allCreds.length)]!;

  return new GoogleAuth({
    credentials,
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive",
    ],
  });
}

export async function getGoogleSheetsApi(): Promise<sheets_v4.Sheets> {
  return sheets({ version: "v4", auth: getGoogleAuth() });
}

export async function getGoogleDriveApi(): Promise<drive_v3.Drive> {
  return drive({ version: "v3", auth: getGoogleAuth() });
}

function extractSpreadsheetId(urlString: string): string {
  const match = urlString.match(/\/spreadsheets\/d\/([^/]+)/);
  if (!match) {
    throw new Error("Unable to extract spreadsheet ID from URL");
  }
  return match[1] || "";
}

export class SpreadsheetWrapper {
  private sheets: sheets_v4.Sheets;
  private _spreadsheetId: string;
  private _sheetToValues: Record<string, string[][] | undefined> = {};

  public get spreadsheetId(): string {
    return this._spreadsheetId;
  }

  constructor(spreadsheetId: string, sheets: sheets_v4.Sheets) {
    this.sheets = sheets;
    this._spreadsheetId = spreadsheetId;
  }

  private getCacheKey(name: string): string {
    return `sheet_${this.spreadsheetId}_${name}`;
  }

  private async getRows(sheetName: string): Promise<string[][]> {
    // check in-memory cache
    if (this._sheetToValues[sheetName]) {
      return this._sheetToValues[sheetName];
    }

    // check ddb cache
    const cacheKey = this.getCacheKey(sheetName);
    const cachedData = await getItem(cacheKey);

    if (cachedData) {
      console.log("Returning DynamoDB cached values for sheet: ", sheetName);
      // set in-memory cache
      this._sheetToValues[sheetName] = JSON.parse(cachedData) as string[][];
      return this._sheetToValues[sheetName];
    }

    console.log("Returning spreadsheet values for sheet: ", sheetName);

    // get rows from spreadsheet
    const result = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: sheetName,
      valueRenderOption: "FORMATTED_VALUE",
      majorDimension: "ROWS",
    });

    const rows =
      result.data.values?.map((row) => row.map((cell) => cell.toString())) ??
      [];

    // set in-memory cache
    this._sheetToValues[sheetName] = rows;

    // set ddb cache
    await setItem(cacheKey, JSON.stringify(rows));

    return rows;
  }

  async getRowsWithHeaders(
    sheetName: string
  ): Promise<{ headers: string[]; rows: string[][] }> {
    const rows = await this.getRows(sheetName);
    const headers = rows[0];
    if (!headers) {
      throw new Error("No headers found in sheet: " + sheetName);
    }
    return { headers, rows: rows.slice(1) };
  }

  async appendRow(
    sheetName: string,
    values: (string | number)[]
  ): Promise<void> {
    // clear ddb cache
    await deleteItem(this.getCacheKey(sheetName));

    // clear in-memory cache
    this._sheetToValues[sheetName] = undefined;

    // append row
    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: sheetName,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [values],
      },
    });
  }
}

export async function buildSpreadsheetWrapper(): Promise<SpreadsheetWrapper> {
  const sheetUrl = `https://docs.google.com/spreadsheets/d/10NVZzsGNeVwkJDNk5SiOaCbo-ZtjDInvX-I_PpwoQwE/edit?gid=0#gid=0`;
  const spreadsheetId = extractSpreadsheetId(sheetUrl);
  const sheets = await getGoogleSheetsApi();
  return new SpreadsheetWrapper(spreadsheetId, sheets);
}
