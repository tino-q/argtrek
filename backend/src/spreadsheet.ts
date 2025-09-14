import { drive_v3, drive } from "@googleapis/drive";
import { sheets_v4, sheets } from "@googleapis/sheets";
import { GoogleAuth } from "google-auth-library";

import credentials from "./clear-canyon-454114-p5-a911fe242f29.json";

function getGoogleAuth() {
  return new GoogleAuth({
    credentials,
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive",
    ],
  });
}

async function getGoogleSheetsApi(): Promise<sheets_v4.Sheets> {
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

class Range {
  private sheets: sheets_v4.Sheets;
  private spreadsheetId: string;
  private sheetTitle: string;
  private startRow: number;
  private startColumn: number;
  private numRows: number;
  private numColumns: number;

  constructor(
    sheets: sheets_v4.Sheets,
    spreadsheetId: string,
    sheetTitle: string,
    startRow: number,
    startColumn: number,
    numRows: number,
    numColumns: number
  ) {
    this.sheets = sheets;
    this.spreadsheetId = spreadsheetId;
    this.sheetTitle = sheetTitle;
    this.startRow = startRow;
    this.startColumn = startColumn;
    this.numRows = numRows;
    this.numColumns = numColumns;
  }

  static columnToLetter(col: number): string {
    let letter = "";
    while (col > 0) {
      const temp = (col - 1) % 26;
      letter = String.fromCharCode(temp + 65) + letter;
      col = Math.floor((col - 1) / 26);
    }
    return letter;
  }

  static toA1Notation(row: number, column: number): string {
    const columnLetter = Range.columnToLetter(column);
    return `${columnLetter}${row}`;
  }

  getA1Notation(): string {
    const startCell = Range.toA1Notation(this.startRow, this.startColumn);
    const endCell = Range.toA1Notation(
      this.startRow + this.numRows - 1,
      this.startColumn + this.numColumns - 1
    );
    return `${this.sheetTitle}!${startCell}:${endCell}`;
  }

  async setValues(values: string[][]): Promise<void> {
    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: this.getA1Notation(),
      valueInputOption: "RAW",
      requestBody: {
        values,
      },
    });
  }

  async getDisplayValues(): Promise<string[][]> {
    const result = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: this.getA1Notation(),
      valueRenderOption: "FORMATTED_VALUE",
      majorDimension: "ROWS",
    });

    return (result.data.values as string[][]) ?? [];
  }

  async getValues(): Promise<string[][]> {
    const result = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: this.getA1Notation(),
    });

    return (result.data.values as string[][]) ?? [];
  }

  async getValue(): Promise<string> {
    const values = await this.getValues();
    return (values[0] || [])[0] ?? "";
  }
}

export class SheetWrapper {
  private sheets: sheets_v4.Sheets;
  private spreadsheetId: string;
  private sheet: sheets_v4.Schema$Sheet;

  constructor(
    sheets: sheets_v4.Sheets,
    spreadsheetId: string,
    sheet: sheets_v4.Schema$Sheet
  ) {
    this.sheets = sheets;
    this.spreadsheetId = spreadsheetId;
    this.sheet = sheet;
  }

  // get properties() {
  //   return this.sheet.properties;
  // }

  // get data() {
  //   return this.sheet.data;
  // }

  // get charts() {
  //   return this.sheet.charts;
  // }

  // get bandedRanges() {
  //   return this.sheet.bandedRanges;
  // }

  // get basicFilter() {
  //   return this.sheet.basicFilter;
  // }

  // get columnGroups() {
  //   return this.sheet.columnGroups;
  // }

  // get conditionalFormats() {
  //   return this.sheet.conditionalFormats;
  // }

  // get developerMetadata() {
  //   return this.sheet.developerMetadata;
  // }

  // get filterViews() {
  //   return this.sheet.filterViews;
  // }

  // get merges() {
  //   return this.sheet.merges;
  // }

  // get protectedRanges() {
  //   return this.sheet.protectedRanges;
  // }

  // get rowGroups() {
  //   return this.sheet.rowGroups;
  // }

  // get slicers() {
  //   return this.sheet.slicers;
  // }

  getRange(
    row: number,
    column: number,
    numRows: number = 1,
    numColumns: number = 1
  ): Range {
    if (!this.sheet?.properties?.title) {
      throw new Error("Sheet title not found");
    }

    return new Range(
      this.sheets,
      this.spreadsheetId,
      this.sheet.properties.title,
      row,
      column,
      numRows,
      numColumns
    );
  }

  async getLastColumn(row: number): Promise<number> {
    if (!this.sheet?.properties?.title) {
      throw new Error("Sheet title not found");
    }

    const sheetTitle = this.sheet.properties.title;

    const result = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: `${sheetTitle}!${row}:${row}`,
    });

    const firstRow = result.data.values?.[0] ?? [];

    // Count non-empty cells — you can also return .length to count all cells including empty ones
    return firstRow.length;
  }

  async getLastRow(): Promise<number> {
    if (!this.sheet?.properties?.title) {
      throw new Error("Sheet title not found");
    }

    const result = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: `${this.sheet.properties.title}!A:A`,
    });

    return result.data.values?.length ?? 0;
  }

  async getDataRange(): Promise<Range> {
    if (!this.sheet?.properties?.title) {
      throw new Error("Sheet title not found");
    }

    const result = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: this.sheet.properties.title,
    });

    const values = (result.data.values as string[][]) ?? [];
    const numRows = values.length;
    const numColumns = values[0]?.length ?? 0;

    return this.getRange(1, 1, numRows, numColumns);
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

class SpreadsheetWrapper {
  private sheets: sheets_v4.Sheets;
  private spreadsheetId: string;
  private _spreadsheet: sheets_v4.Schema$Spreadsheet | null = null;

  private async getSpreadsheet(): Promise<sheets_v4.Schema$Spreadsheet> {
    if (!this._spreadsheet) {
      this._spreadsheet = await loadSpreadsheet(
        this.sheets,
        this.spreadsheetId
      );
    }
    return this._spreadsheet;
  }

  constructor(spreadsheetId: string, sheets: sheets_v4.Sheets) {
    this.sheets = sheets;
    this.spreadsheetId = spreadsheetId;
  }

  // get data(): sheets_v4.Schema$Spreadsheet {
  //   return this.spreadsheet;
  // }

  async findSheetByName(name: string): Promise<SheetWrapper | null> {
    const sheet = (await this.getSpreadsheet()).sheets?.find(
      (sheet) => sheet.properties?.title === name
    );

    if (!sheet) {
      return null;
    }

    return new SheetWrapper(this.sheets, this.spreadsheetId, sheet);
  }

  async getSheetByName(name: string): Promise<SheetWrapper> {
    const sheet = await this.findSheetByName(name);

    if (!sheet) {
      throw new Error(`Sheet with name "${name}" not found`);
    }

    return sheet;
  }

  async insertSheet(name: string): Promise<SheetWrapper> {
    const existingSheet = await this.findSheetByName(name);
    if (existingSheet) {
      throw new Error(`Sheet with name "${name}" already exists`);
    }

    await this.sheets.spreadsheets.batchUpdate({
      spreadsheetId: this.spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: name,
              },
            },
          },
        ],
      },
    });

    this._spreadsheet = null;

    return this.getSheetByName(name);
  }

  async getOrCreateSheet(name: string): Promise<SheetWrapper> {
    const existingSheet = await this.findSheetByName(name);
    if (existingSheet) {
      return existingSheet;
    }
    return this.insertSheet(name);
  }
}

export async function getSpreadsheet(): Promise<SpreadsheetWrapper> {
  const sheetUrl = `https://docs.google.com/spreadsheets/d/10NVZzsGNeVwkJDNk5SiOaCbo-ZtjDInvX-I_PpwoQwE/edit?gid=0#gid=0`;
  const spreadsheetId = extractSpreadsheetId(sheetUrl);
  const sheets = await getGoogleSheetsApi();
  return new SpreadsheetWrapper(spreadsheetId, sheets);
}

// async function test() {
//   const spreadsheet = await getSpreadsheet();
//   const sheet = await spreadsheet.getSheetByName("Trip Registrations");
//   const range = await sheet.getRange(58, 2);
//   const value = await range.getValue();
//   console.log(value);
// }

// test().catch(console.error);
