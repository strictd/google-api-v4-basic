import { GoogleRequests } from './google-requests';

export class GoogleShreadsheets {
  constructor(private googleRequests: GoogleRequests) {}

  public batchGetRange(token: string, sheetid: string, range: string[], majorDimension = 'ROWS'): Promise<any> {
    const ranges = range.map(r => `ranges=${encodeURIComponent(r)}`).join('&');
    const url = `/v4/spreadsheets/${encodeURIComponent(sheetid)}/values:batchGet?majorDimension=${encodeURIComponent(majorDimension)}&${ranges}`;
    return this.googleRequests.getRequest(token, 'sheets.googleapis.com', url);
  }

  public getRange(token: string, sheetid: string, range: string, majorDimension = 'ROWS'): Promise<any> {
    const url = `/v4/spreadsheets/${encodeURIComponent(sheetid)}/values/${encodeURIComponent(range)}?majorDimension=${encodeURIComponent(majorDimension)}`;
    return this.googleRequests.getRequest(token, 'sheets.googleapis.com', url);
  }

  public appendRow(token: string, sheetid: string, range: string, values: any) {
    const url = `/v4/spreadsheets/${encodeURIComponent(sheetid)}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
    return this.googleRequests.postRequest(token, 'sheets.googleapis.com', url, values);
  }
}
