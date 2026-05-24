import { appLocalDataDir } from "@tauri-apps/api/path";
import { writeTextFile, readTextFile, remove } from "@tauri-apps/plugin-fs";

/** 撤销快照条目 - 记录单个文件重命名的三阶段路径 */
export interface UndoSnapshotEntry {
  fileId: string;
  originalPath: string; // 执行前的完整路径
  tempPath: string;     // 两阶段重命名的中间 UUID 路径
  finalPath: string;    // 执行后的完整路径
}

/** 撤销快照 - 包含所有文件的状态和时间戳 */
export interface UndoSnapshot {
  files: UndoSnapshotEntry[];
  timestamp: string; // ISO 8601
}

const SNAPSHOT_FILENAME = "rname-undo-snapshot.json";

/**
 * 获取快照文件的完整路径。
 * 在 appLocalDataDir 下创建 rname-undo-snapshot.json。
 */
async function getSnapshotPath(): Promise<string> {
  const dataDir = await appLocalDataDir();
  return `${dataDir}${SNAPSHOT_FILENAME}`;
}

/**
 * 保存撤销快照。
 *
 * 持久化 UndoSnapshot 到文件系统，包含时间戳。
 * 使用 appLocalDataDir 下的 rname-undo-snapshot.json 文件。
 * 每次覆盖写入（单次撤销级别：D-11）。
 */
export async function saveUndoSnapshot(
  entries: UndoSnapshotEntry[]
): Promise<void> {
  try {
    const snapshotPath = await getSnapshotPath();
    const snapshot: UndoSnapshot = {
      files: entries,
      timestamp: new Date().toISOString(),
    };
    await writeTextFile(snapshotPath, JSON.stringify(snapshot));
  } catch (err) {
    console.error("Failed to save undo snapshot:", err);
  }
}

/**
 * 加载撤销快照。
 *
 * 从文件系统读取并解析 UndoSnapshot。
 * 如果文件不存在或 JSON 解析失败，返回 null。
 */
export async function loadUndoSnapshot(): Promise<UndoSnapshot | null> {
  try {
    const snapshotPath = await getSnapshotPath();
    const content = await readTextFile(snapshotPath);
    const parsed: UndoSnapshot = JSON.parse(content);

    // 验证基本结构
    if (!parsed.files || !Array.isArray(parsed.files) || !parsed.timestamp) {
      console.error("Invalid undo snapshot format");
      return null;
    }

    return parsed;
  } catch (err) {
    // 文件不存在或格式损坏，返回 null
    console.error("Failed to load undo snapshot:", err);
    return null;
  }
}

/**
 * 清除撤销快照。
 *
 * 删除快照文件。如果文件不存在，静默忽略。
 */
export async function clearUndoSnapshot(): Promise<void> {
  try {
    const snapshotPath = await getSnapshotPath();
    await remove(snapshotPath);
  } catch (err) {
    console.error("Failed to clear undo snapshot:", err);
  }
}
