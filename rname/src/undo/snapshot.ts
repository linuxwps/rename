import {
  saveUndoSnapshotFile,
  readUndoSnapshotFile,
  markUndoEntry,
} from "../utils/renameService";

export type UndoState =
  | "planned"
  | "pending"
  | "completed"
  | "failed"
  | "rollingBack"
  | "rolledBack";

/** 撤销快照条目 - 记录单个文件重命名的三阶段路径 */
export interface UndoSnapshotEntry {
  fileId: string;
  originalPath: string;
  tempPath: string;
  finalPath: string;
  state: UndoState;
}

export async function saveUndoSnapshot(
  entries: UndoSnapshotEntry[]
): Promise<void> {
  await saveUndoSnapshotFile(entries);
}

export async function loadUndoSnapshot(): Promise<UndoSnapshotEntry[]> {
  try {
    const entries = await readUndoSnapshotFile();
    return entries.flatMap<UndoSnapshotEntry>((entry) => {
      if (
        !entry.fileId ||
        !entry.originalPath ||
        !entry.finalPath ||
        !entry.tempPath
      ) {
        return [];
      }

      return [{
        fileId: entry.fileId,
        originalPath: entry.originalPath,
        finalPath: entry.finalPath,
        tempPath: entry.tempPath,
        state: (entry.state ?? "completed") as UndoState,
      }];
    });
  } catch {
    return [];
  }
}

export async function markUndoEntryState(
  fileId: string,
  state: UndoState
): Promise<void> {
  await markUndoEntry(fileId, state);
}
