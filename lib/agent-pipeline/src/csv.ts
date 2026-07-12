/**
 * Minimal RFC 4180-style CSV line parser: handles double-quoted fields that
 * may contain commas and escaped ("") quotes. Sufficient for the CSVs this
 * pipeline itself produces in process.ts.
 */
export function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
}

export function parseCsv(csv: string): { header: string[]; rows: string[][] } {
  const lines = csv.split("\n").filter((line) => line.trim().length > 0);
  const [headerLine, ...rest] = lines;
  return {
    header: headerLine ? parseCsvLine(headerLine) : [],
    rows: rest.map(parseCsvLine),
  };
}
