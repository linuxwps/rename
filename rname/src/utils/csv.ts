const PATH_HEADERS = new Set([
  "path",
  "file_path",
  "filepath",
  "路径",
  "文件路径",
  "原路径",
]);

const NAME_HEADERS = new Set([
  "new_name",
  "newname",
  "target_name",
  "新文件名",
  "新名称",
  "目标文件名",
  "目标名称",
]);

export function toCsv(rows: string[][]): string {
  return rows
    .map((row) =>
      row
        .map((value) => {
          const text = String(value ?? "");
          return /[",\r\n]/.test(text)
            ? `"${text.replace(/"/g, '""')}"`
            : text;
        })
        .join(",")
    )
    .join("\r\n");
}

export function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];
    if (quoted) {
      if (character === '"' && content[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        value += character;
      }
      continue;
    }

    if (character === '"' && value.length === 0) {
      quoted = true;
    } else if (character === ",") {
      row.push(value);
      value = "";
    } else if (character === "\n") {
      row.push(value.replace(/\r$/, ""));
      if (row.some((cell) => cell.trim().length > 0)) rows.push(row);
      row = [];
      value = "";
    } else {
      value += character;
    }
  }

  row.push(value.replace(/\r$/, ""));
  if (row.some((cell) => cell.trim().length > 0)) rows.push(row);
  return rows;
}

export function extractCsvPaths(content: string): string[] {
  return parseCsvPathMappings(content).paths;
}

export function parseCsvPathMappings(content: string): {
  paths: string[];
  targetNames: Map<string, string>;
} {
  const rows = parseCsv(content.replace(/^\uFEFF/, ""));
  if (rows.length === 0) return { paths: [], targetNames: new Map() };

  const header = rows[0].map((cell) => cell.trim().toLowerCase());
  const pathIndex = header.findIndex((cell) => PATH_HEADERS.has(cell));
  const nameIndex = header.findIndex((cell) => NAME_HEADERS.has(cell));
  const hasHeader = pathIndex >= 0;
  const selectedIndex = hasHeader ? pathIndex : 0;
  const selectedNameIndex = hasHeader ? nameIndex : 1;
  const dataRows = hasHeader ? rows.slice(1) : rows;

  const paths = new Set<string>();
  const targetNames = new Map<string, string>();
  for (const row of dataRows) {
    const path = row[selectedIndex]?.trim();
    if (!path || path.startsWith("#")) continue;
    paths.add(path);
    const targetName = selectedNameIndex >= 0 ? row[selectedNameIndex]?.trim() : "";
    if (targetName) targetNames.set(path, targetName);
  }
  return { paths: Array.from(paths), targetNames };
}
