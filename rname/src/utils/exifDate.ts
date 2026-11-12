import type { FileItem } from "../types/file";
import type { ExifDateConfig } from "../types/rename";

const SOURCES = ["taken", "created", "modified"] as const;

export function selectDate(file: FileItem, config: ExifDateConfig): number | null {
  const dates = {
    taken: file.exifTakenAt,
    created: file.createdAt,
    modified: file.modifiedAt,
  };
  const candidates = config.fallback === "next"
    ? SOURCES.slice(SOURCES.indexOf(config.source))
    : [config.source];
  for (const source of candidates) {
    const value = dates[source];
    if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  }
  return null;
}

export function formatDate(timestamp: number, format: ExifDateConfig["format"]): string {
  const date = new Date(timestamp);
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  if (format === "YYYY-MM-DD") return `${year}-${month}-${day}`;
  const compact = `${year}${month}${day}`;
  if (format === "YYYYMMDD_HHmmss") {
    return `${compact}_${String(date.getHours()).padStart(2, "0")}${String(date.getMinutes()).padStart(2, "0")}${String(date.getSeconds()).padStart(2, "0")}`;
  }
  return compact;
}
