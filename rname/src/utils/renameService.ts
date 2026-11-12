import { invoke } from "@tauri-apps/api/core";
import type { RenameItem, PreflightResult } from "./rename";

export interface SnapshotRenameItem extends RenameItem {
  tempPath?: string;
  state?: string;
}

export interface ImportedCsvFile {
  path: string;
  content: string;
}

export function exportCsvFile(content: string): Promise<string | null> {
  return invoke("export_csv_file", { content });
}

export function importCsvFile(): Promise<ImportedCsvFile | null> {
  return invoke("import_csv_file");
}

export function writeAppLog(level: string, message: string): void {
  void invoke("log_message", { level, message }).catch(() => undefined);
}

export function readLogTail(limit = 300): Promise<string> {
  return invoke("read_log_tail", { limit });
}

export function readExifDatetime(path: string): Promise<number | null> {
  return invoke("read_exif_datetime", { path });
}

export function preflightRename(
  entries: RenameItem[]
): Promise<PreflightResult> {
  return invoke("preflight_rename", { request: { entries } });
}

export function exclusiveRename(
  source: string,
  destination: string
): Promise<void> {
  return invoke("exclusive_rename_path", { source, destination });
}

export function saveUndoSnapshotFile(
  entries: SnapshotRenameItem[]
): Promise<void> {
  return invoke("save_undo_snapshot", {
    entries: entries.map((entry) => ({
      fileId: entry.fileId,
      originalPath: entry.originalPath,
      finalPath: entry.finalPath,
      tempPath: entry.tempPath,
      state: entry.state,
    })),
  });
}

export function readUndoSnapshotFile(): Promise<SnapshotRenameItem[]> {
  return invoke("read_undo_snapshot");
}

export function markUndoEntry(
  fileId: string,
  state: string
): Promise<void> {
  return invoke("mark_undo_entry", { fileId, state });
}

export function finishUndoSnapshotFile(): Promise<boolean> {
  return invoke("finish_undo_snapshot");
}

export function clearUndoSnapshotFile(): Promise<void> {
  return invoke("clear_undo_snapshot");
}
