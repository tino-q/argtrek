import { drive_v3, drive } from "@googleapis/drive";
import { sheets_v4, sheets } from "@googleapis/sheets";
import { GoogleAuth } from "google-auth-library";

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

async function loadSpreadsheet(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string
): Promise<sheets_v4.Schema$Spreadsheet> {
  const response = await sheets.spreadsheets.get({
    spreadsheetId,
  });

  if (!response.data) {
    throw new Error("Failed to fetch spreadsheet data");
  }

  return response.data;
}

function extractSpreadsheetId(urlString: string): string {
  const match = urlString.match(/\/spreadsheets\/d\/([^/]+)/);
  if (!match) {
    throw new Error("Unable to extract spreadsheet ID from URL");
  }
  return match[1] || "";
}

export class SheetWrapper {
  private sheets: sheets_v4.Sheets;
  private spreadsheetId: string;
  private sheet: sheets_v4.Schema$Sheet;
  private _values: string[][] | undefined;

  constructor(
    sheets: sheets_v4.Sheets,
    spreadsheetId: string,
    sheet: sheets_v4.Schema$Sheet,
    values?: string[][]
  ) {
    this.sheets = sheets;
    this.spreadsheetId = spreadsheetId;
    this.sheet = sheet;
    this._values = values;
  }

  async getRows(): Promise<string[][]> {
    if (!this.sheet?.properties?.title) {
      throw new Error("Sheet title not found");
    }

    if (this._values) {
      console.log(
        "Returning cached values for sheet",
        this.sheet.properties.title
      );
      return this._values;
    }

    console.log("Loading values for sheet", this.sheet.properties.title);
    const result = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: this.sheet.properties.title,
      valueRenderOption: "FORMATTED_VALUE",
      majorDimension: "ROWS",
    });

    this._values =
      result.data.values?.map((row) => row.map((cell) => cell.toString())) ??
      [];

    return this._values;
  }

  async appendRow(values: (string | number)[]): Promise<void> {
    if (!this.sheet?.properties?.title) {
      throw new Error("Sheet title not found");
    }

    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: this.sheet.properties.title,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [values],
      },
    });
  }
}

export class SpreadsheetWrapper {
  private sheets: sheets_v4.Sheets;
  private _spreadsheetId: string;
  private _spreadsheet: sheets_v4.Schema$Spreadsheet | null = null;
  private _cachedSheets: Record<
    "RSVP" | "Trip Registrations" | "PASSPORTS" | "Luggage" | "CHOICES",
    string[][]
  > | null = null;

  public get spreadsheetId(): string {
    return this._spreadsheetId;
  }

  private async getSpreadsheet(): Promise<sheets_v4.Schema$Spreadsheet> {
    if (!this._spreadsheet) {
      console.log("Loading spreadsheet", this.spreadsheetId);
      this._spreadsheet = await loadSpreadsheet(
        this.sheets,
        this.spreadsheetId
      );
    }
    console.log("Returning cached spreadsheet", this.spreadsheetId);
    return this._spreadsheet;
  }

  constructor(spreadsheetId: string, sheets: sheets_v4.Sheets) {
    this.sheets = sheets;
    this._spreadsheetId = spreadsheetId;
  }

  async findSheetByName(
    name: "RSVP" | "Trip Registrations" | "PASSPORTS" | "Luggage" | "CHOICES"
  ): Promise<SheetWrapper | null> {
    const sheet = (await this.getSpreadsheet()).sheets?.find(
      (sheet) => sheet.properties?.title === name
    );

    if (!sheet) {
      return null;
    }

    const cache = this._cachedSheets?.[name];

    if (cache) {
      return new SheetWrapper(this.sheets, this.spreadsheetId, sheet, cache);
    }

    return new SheetWrapper(this.sheets, this.spreadsheetId, sheet);
  }

  async getSheetByName(
    name: "RSVP" | "Trip Registrations" | "PASSPORTS" | "Luggage" | "CHOICES"
  ): Promise<SheetWrapper> {
    const sheet = await this.findSheetByName(name);

    if (!sheet) {
      throw new Error(`Sheet with name "${name}" not found`);
    }

    return sheet;
  }

  async cacheAllSheets(): Promise<void> {
    const sheets = await getGoogleSheetsApi();
    const spreadsheet = await getSpreadsheet();

    const sheetNames = [
      "RSVP",
      "Trip Registrations",
      "PASSPORTS",
      "Luggage",
      "CHOICES",
    ];

    const ranges = sheetNames.map((name) => name);

    // 3. Batch read all sheets
    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: spreadsheet.spreadsheetId,
      ranges,
    });

    if (!response.data.valueRanges) {
      throw new Error("No value ranges found in batch get all sheets");
    }

    // 4. Process results
    this._cachedSheets = response.data.valueRanges?.reduce(
      (
        acc: Record<
          "RSVP" | "Trip Registrations" | "PASSPORTS" | "Luggage" | "CHOICES",
          string[][]
        >,
        sheet
      ) => {
        if (sheet.range?.includes("RSVP")) {
          acc.RSVP = sheet.values ?? [];
        } else if (sheet.range?.includes("Trip Registrations")) {
          acc["Trip Registrations"] = sheet.values ?? [];
        } else if (sheet.range?.includes("PASSPORTS")) {
          acc.PASSPORTS = sheet.values ?? [];
        } else if (sheet.range?.includes("Luggage")) {
          acc.Luggage = sheet.values ?? [];
        } else if (sheet.range?.includes("CHOICES")) {
          acc.CHOICES = sheet.values ?? [];
        }
        return acc;
      },
      {
        RSVP: [],
        ["Trip Registrations"]: [],
        PASSPORTS: [],
        Luggage: [],
        CHOICES: [],
      }
    );
  }
}

export async function getSpreadsheet(): Promise<SpreadsheetWrapper> {
  const sheetUrl = `https://docs.google.com/spreadsheets/d/10NVZzsGNeVwkJDNk5SiOaCbo-ZtjDInvX-I_PpwoQwE/edit?gid=0#gid=0`;
  const spreadsheetId = extractSpreadsheetId(sheetUrl);
  const sheets = await getGoogleSheetsApi();
  return new SpreadsheetWrapper(spreadsheetId, sheets);
}
