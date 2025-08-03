import * as xlsx from 'xlsx';

export interface Recipient {
  Name: string;
  Email: string;
  Company: string;
  Role: string;
}

export function readExcel(filePath: string): Recipient[] {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const raw: (string | number | undefined)[][] = xlsx.utils.sheet_to_json(sheet, { header: 1 });

  const headers = raw[0].map((header) =>
    header
      ?.toString()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
  );

  const data: Recipient[] = raw.slice(1).map((row) => {
    const obj: any = {};
    row.forEach((cell, index) => {
      const key = headers[index];
      if (key) {
        obj[key] = typeof cell === 'string' ? cell.trim() : cell;
      }
    });
    return obj;
  });

  return data.filter((row) => row.Email);
}
  