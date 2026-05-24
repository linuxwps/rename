import { useState, useCallback, useRef } from "react";
import { rename } from "@tauri-apps/plugin-fs";
import type { FileItem } from "../types/file";
import type {
  PreviewResult,
  ExecutionResult,
  ExecutionErrors,
  FileItemUpdate,
} from "../types/rename";
import {
  saveUndoSnapshot,
  loadUndoSnapshot,
  clearUndoSnapshot,
} from "../undo/snapshot";
import type { UndoSnapshotEntry } from "../undo/snapshot";

interface UseRenameExecutorReturn {
  isExecuting: boolean;
  hasExecuted: boolean;
  executionResults: Record<string, ExecutionResult>;
  executionErrors: ExecutionErrors;
  execute: () => Promise<void>;
  undo: () => Promise<void>;
  resetExecution: () => void;
}

/**
 * 预验证文件名是否合法。
 *
 * 检查 newFullName 不含路径分隔符且非空。
 * 返回 fileId → errorMessage 映射，空对象表示全部通过。
 */
function validateNewNames(
  previews: PreviewResult[]
): ExecutionErrors {
  const errors: ExecutionErrors = {};

  for (const p of previews) {
    if (!p.newFullName) {
      errors[p.fileId] = "New filename is empty";
    } else if (p.newFullName.includes("/") || p.newFullName.includes("\\")) {
      errors[p.fileId] = `Filename contains path separator: "${p.newFullName}"`;
    }
  }

  return errors;
}

/**
 * 批量重命名执行器 hook。
 *
 * 核心功能：
 * - 两阶段重命名（原文件 → UUID temp → 最终名），避免中间状态冲突（D-08）
 * - 停止于第一个错误（D-07），已成功的文件保持现状
 * - 撤销时逆两阶段恢复（最终名 → UUID temp → 原文件名）（D-09/D-12）
 * - 撤销快照持久化到文件系统（D-10），单次撤销级别（D-11）
 *
 * @param files - 当前文件列表
 * @param previews - 重命名预览结果
 * @param onFileNamesUpdated - 执行/撤销完成后更新文件列表的回调
 */
export function useRenameExecutor(
  files: FileItem[],
  previews: PreviewResult[],
  onFileNamesUpdated: (updates: Map<string, FileItemUpdate>) => void
): UseRenameExecutorReturn {
  const [isExecuting, setIsExecuting] = useState(false);
  const [hasExecuted, setHasExecuted] = useState(false);
  const [executionResults, setExecutionResults] = useState<
    Record<string, ExecutionResult>
  >({});
  const [executionErrors, setExecutionErrors] = useState<ExecutionErrors>({});

  // 使用 ref 存储最新引用，避免回调闭包问题
  const filesRef = useRef(files);
  filesRef.current = files;
  const previewsRef = useRef(previews);
  previewsRef.current = previews;

  const execute = useCallback(async (): Promise<void> => {
    // 重复点击防护
    if (isExecuting) return;

    const currentFiles = filesRef.current;
    const currentPreviews = previewsRef.current;

    if (currentPreviews.length === 0) return;

    // 预验证所有文件名
    const validationErrors = validateNewNames(currentPreviews);
    if (Object.keys(validationErrors).length > 0) {
      setExecutionErrors(validationErrors);
      return;
    }

    setIsExecuting(true);
    setExecutionErrors({});

    const results: Record<string, ExecutionResult> = {};
    const entries: UndoSnapshotEntry[] = [];
    const updates = new Map<string, FileItemUpdate>();
    let hasError = false;

    for (const preview of currentPreviews) {
      if (hasError) {
        // 已有错误：标记剩余为 pending 不处理
        results[preview.fileId] = "pending";
        continue;
      }

      const file = currentFiles.find((f) => f.id === preview.fileId);
      if (!file) {
        results[preview.fileId] = "fail";
        setExecutionErrors((prev) => ({
          ...prev,
          [preview.fileId]: "File not found in file list",
        }));
        hasError = true;
        continue;
      }

      // 计算路径
      const dirPath = file.path.slice(0, -file.name.length);
      const finalPath = dirPath + preview.newFullName;
      const tempPath = file.path + ".rntmp." + crypto.randomUUID();

      try {
        // Phase 1: 原文件 → UUID 临时名
        await rename(file.path, tempPath);

        // Phase 2: UUID 临时名 → 最终名
        await rename(tempPath, finalPath);

        results[preview.fileId] = "success";

        // 记录撤销快照条目
        entries.push({
          fileId: preview.fileId,
          originalPath: file.path,
          tempPath,
          finalPath,
        });

        // 构造文件更新数据
        updates.set(preview.fileId, {
          path: finalPath,
          name: preview.newFullName,
          extension: preview.newExtension,
        });
      } catch (err) {
        results[preview.fileId] = "fail";
        setExecutionErrors((prev) => ({
          ...prev,
          [preview.fileId]:
            err instanceof Error ? err.message : "Unknown rename error",
        }));
        hasError = true;
        // D-07: 停止继续处理后续文件，已成功的保持现状
      }
    }

    setExecutionResults(results);

    if (entries.length > 0) {
      // 更新文件列表
      onFileNamesUpdated(updates);

      // 持久化撤销快照（D-10）
      await saveUndoSnapshot(entries);

      setHasExecuted(true);
    }

    setIsExecuting(false);
  }, [isExecuting, onFileNamesUpdated]);

  const undo = useCallback(async (): Promise<void> => {
    // 重复点击防护
    if (isExecuting) return;

    setIsExecuting(true);

    try {
      const snapshot = await loadUndoSnapshot();
      if (!snapshot) {
        console.error("No undo snapshot available");
        setIsExecuting(false);
        return;
      }

      const restoreMap = new Map<string, FileItemUpdate>();

      // 逆序恢复避免路径冲突
      const reversedEntries = [...snapshot.files].reverse();

      for (const entry of reversedEntries) {
        try {
          // Phase 1 (reverse): 最终名 → UUID 临时名
          await rename(entry.finalPath, entry.tempPath);

          // Phase 2 (reverse): UUID 临时名 → 原文件名
          await rename(entry.tempPath, entry.originalPath);

          // 从原始路径解析文件名和扩展名
          const origName =
            entry.originalPath.split("/").pop() || entry.originalPath;
          const extMatch = origName.match(/\.([^.]+)$/);
          const origExtension = extMatch ? extMatch[1] : "";

          restoreMap.set(entry.fileId, {
            path: entry.originalPath,
            name: origName,
            extension: origExtension,
          });
        } catch (err) {
          // 继续处理下一个文件，最大化恢复
          console.error(
            `Failed to restore file ${entry.fileId}:`,
            err
          );
        }
      }

      if (restoreMap.size > 0) {
        onFileNamesUpdated(restoreMap);
      }

      await clearUndoSnapshot();

      // 重置状态
      setHasExecuted(false);
      setExecutionResults({});
      setExecutionErrors({});
    } catch (err) {
      console.error("Undo failed:", err);
    }

    setIsExecuting(false);
  }, [isExecuting, onFileNamesUpdated]);

  const resetExecution = useCallback((): void => {
    setHasExecuted(false);
    setExecutionResults({});
    setExecutionErrors({});
    // 不清理快照，快照在 undo 时清除
  }, []);

  return {
    isExecuting,
    hasExecuted,
    executionResults,
    executionErrors,
    execute,
    undo,
    resetExecution,
  };
}
