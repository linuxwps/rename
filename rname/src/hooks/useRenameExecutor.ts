import { useState, useCallback, useRef } from "react";
import { platform } from "@tauri-apps/plugin-os";
import { readDir } from "@tauri-apps/plugin-fs";
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
  markUndoEntryState,
} from "../undo/snapshot";
import type { UndoSnapshotEntry } from "../undo/snapshot";
import {
  exclusiveRename,
  preflightRename,
  clearUndoSnapshotFile,
  writeAppLog,
} from "../utils/renameService";
import {
  dirname,
  basename,
  joinPath,
  planRenameOperation,
  splitFileName,
  type FileSystemPlatform,
  type RenameItem,
} from "../utils/rename";

interface UseRenameExecutorReturn {
  isExecuting: boolean;
  hasExecuted: boolean;
  executionResults: Record<string, ExecutionResult>;
  executionErrors: ExecutionErrors;
  execute: () => Promise<void>;
  undo: () => Promise<void>;
  resetExecution: () => void;
}

function currentPlatform(os: string): FileSystemPlatform {
  if (os === "macos" || os === "windows" || os === "linux") {
    return os;
  }
  return "other";
}

function reportError(message: string, error: unknown): void {
  const detail = error instanceof Error ? error.message : String(error);
  console.error(message, error);
  writeAppLog("error", `${message}：${detail}`);
}

async function pathExistsWithExactCase(filePath: string): Promise<boolean> {
  try {
    const entries = await readDir(dirname(filePath));
    return entries.some((entry) => entry.name === basename(filePath));
  } catch {
    return false;
  }
}

/**
 * 批量重命名执行器 hook。
 *
 * 核心功能：
 * - 两阶段重命名（原文件 → UUID temp → 最终名），避免中间状态冲突（D-08）
 * - 执行前检查批次内及目录中的既有目标，原生排他重命名禁止覆盖
 * - 中途失败时逆序回滚已完成项
 * - 撤销快照先写入磁盘并逐项记录状态，可在重启后继续恢复
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

  // 使用 ref 做同步锁，避免双击重复执行
  const executingRef = useRef(false);

  const execute = useCallback(async (): Promise<void> => {
    // 重复点击防护（同步检查）
    if (executingRef.current) return;
    executingRef.current = true;
    setIsExecuting(true);
    setExecutionErrors({});
    setExecutionResults({});

    const results: Record<string, ExecutionResult> = {};
    const updates = new Map<string, FileItemUpdate>();
    const completedEntries: UndoSnapshotEntry[] = [];

    try {
      const currentFiles = filesRef.current;
      const currentPreviews = previewsRef.current;

      if (currentPreviews.length === 0) return;

      const fileMap = new Map(currentFiles.map((file) => [file.id, file]));
      const renameItems = currentPreviews.flatMap<RenameItem>((preview) => {
        const file = fileMap.get(preview.fileId);
        return file
          ? [{
              fileId: preview.fileId,
              originalPath: file.path,
              finalPath: joinPath(dirname(file.path), preview.newFullName),
            }]
          : [];
      });

      if (renameItems.length !== currentPreviews.length) {
        throw new Error("文件列表与预览结果不一致，请重新添加文件");
      }

      const platformName = currentPlatform(await platform());
      const existingPaths = new Set(currentFiles.map((file) => file.path));
      const directories = Array.from(
        new Set(renameItems.map((entry) => dirname(entry.finalPath)))
      );

      for (const directory of directories) {
        const entries = await readDir(directory);
        for (const entry of entries) {
          existingPaths.add(joinPath(directory, entry.name));
        }
      }

      const fallbackPlan = planRenameOperation(
        renameItems,
        existingPaths,
        platformName
      );
      const backendPlan = await preflightRename(renameItems);
      const issues = [...fallbackPlan.issues, ...backendPlan.issues];
      const issueMap: ExecutionErrors = {};
      for (const issue of issues) {
        issueMap[issue.fileId] ??= issue.message;
      }

      if (Object.keys(issueMap).length > 0) {
        setExecutionErrors(issueMap);
        return;
      }

      const mutatingItems = renameItems.filter(
        (entry) => entry.originalPath !== entry.finalPath
      );
      if (mutatingItems.length === 0) {
        setExecutionErrors({
          [renameItems[0]?.fileId ?? "rename"]: "没有需要应用的新文件名",
        });
        return;
      }

      const snapshotEntries: UndoSnapshotEntry[] = mutatingItems.map((entry) => ({
        ...entry,
        tempPath: joinPath(
          dirname(entry.originalPath),
          `.rname-${crypto.randomUUID()}.tmp`
        ),
        state: "planned",
      }));
      const snapshotMap = new Map(
        snapshotEntries.map((entry) => [entry.fileId, entry])
      );

      // 先把完整计划写入应用数据目录。写入失败时绝不开始重命名。
      await saveUndoSnapshot(snapshotEntries);

      const rollbackCompleted = async (): Promise<boolean> => {
        let rollbackFailed = false;
        for (const entry of [...completedEntries].reverse()) {
          try {
            await exclusiveRename(entry.finalPath, entry.tempPath);
            await exclusiveRename(entry.tempPath, entry.originalPath);
            entry.state = "rolledBack";
            await markUndoEntryState(entry.fileId, "rolledBack").catch(
              (error) =>
                reportError("保存回滚状态失败", error)
            );
            updates.delete(entry.fileId);
            results[entry.fileId] = "pending";
          } catch {
            rollbackFailed = true;
          }
        }
        return !rollbackFailed;
      };

      let hasError = false;
      for (const index of backendPlan.renameOrder) {
        const item = renameItems[index];
        const snapshotEntry = snapshotMap.get(item.fileId);
        if (!snapshotEntry) {
          results[item.fileId] = "success";
          continue;
        }

        if (hasError) {
          results[item.fileId] = "pending";
          snapshotEntry.state = "pending";
          continue;
        }

        try {
          await exclusiveRename(item.originalPath, snapshotEntry.tempPath);
          snapshotEntry.state = "pending";
          await markUndoEntryState(item.fileId, "pending").catch((error) =>
            reportError("保存待处理撤销状态失败", error)
          );

          await exclusiveRename(snapshotEntry.tempPath, item.finalPath);
          snapshotEntry.state = "completed";
          await markUndoEntryState(item.fileId, "completed").catch((error) =>
            reportError("保存完成撤销状态失败", error)
          );

          const preview = currentPreviews.find(
            (candidate) => candidate.fileId === item.fileId
          );
          if (!preview) {
            throw new Error("预览结果已失效，请重新执行");
          }

          results[item.fileId] = "success";
          completedEntries.push(snapshotEntry);
          updates.set(item.fileId, {
            path: item.finalPath,
            name: preview.newFullName,
            extension: preview.newExtension,
          });
        } catch (error) {
          try {
            await exclusiveRename(snapshotEntry.tempPath, item.originalPath);
          } catch {
            // 阶段一失败时文件通常仍在原路径，无需恢复。
          }
          snapshotEntry.state = "failed";
          results[item.fileId] = "fail";
          setExecutionErrors((prev) => ({
            ...prev,
            [item.fileId]:
              error instanceof Error ? error.message : "重命名失败",
          }));
          hasError = true;
        }
      }

      if (hasError) {
        // 如果本批次已经改动文件，则立即按逆序恢复，避免停在半批状态。
        const rollbackSucceeded = await rollbackCompleted();
        if (rollbackSucceeded) {
          await clearUndoSnapshotFile().catch((error) => {
            reportError("清理已回滚的撤销快照失败", error);
            setExecutionErrors((prev) => ({
              ...prev,
              snapshot: "文件已回滚，但撤销记录清理失败",
            }));
          });
          completedEntries.length = 0;
        } else {
          await saveUndoSnapshot(snapshotEntries).catch((error) => {
            reportError("保存未完成回滚的快照失败", error);
            setExecutionErrors((prev) => ({
              ...prev,
              snapshot: "部分文件回滚失败，且撤销记录更新失败",
            }));
          });
        }
      } else {
        try {
          await saveUndoSnapshot(snapshotEntries);
        } catch (error) {
          const rollbackSucceeded = await rollbackCompleted();
          if (rollbackSucceeded) {
            await clearUndoSnapshotFile();
            completedEntries.length = 0;
          }
          setExecutionErrors((prev) => ({
            ...prev,
            snapshot:
              error instanceof Error
                ? `撤销记录保存失败：${error.message}`
                : "撤销记录保存失败",
          }));
          return;
        }
      }

      setExecutionResults(results);

      if (completedEntries.length > 0) {
        onFileNamesUpdated(updates);
        setHasExecuted(true);
      } else {
        setHasExecuted(false);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "重命名准备失败";
      const errors = Object.fromEntries(
        previewsRef.current.map((preview) => [preview.fileId, message])
      );
      setExecutionErrors(errors);
    } finally {
      setIsExecuting(false);
      executingRef.current = false;
    }
  }, [onFileNamesUpdated]);

  const undo = useCallback(async (): Promise<void> => {
    // 重复点击防护
    if (executingRef.current) return;
    executingRef.current = true;
    setIsExecuting(true);

    try {
      const snapshot = (await loadUndoSnapshot()).filter(
        (entry) => entry.state !== "rolledBack"
      );
      if (snapshot.length === 0) {
        setExecutionErrors({
          rename: "没有可撤销的已完成重命名记录",
        });
        return;
      }

      const restoreMap = new Map<string, FileItemUpdate>();
      const undoErrors: ExecutionErrors = {};

      // 逆序恢复避免路径冲突
      const reversedEntries = [...snapshot].reverse();

      for (const entry of reversedEntries) {
        try {
          const origName = entry.originalPath.slice(
            dirname(entry.originalPath).length
          );
          const parts = splitFileName(origName);

          const [finalExists, tempExists, originalExists] = await Promise.all([
            pathExistsWithExactCase(entry.finalPath),
            pathExistsWithExactCase(entry.tempPath),
            pathExistsWithExactCase(entry.originalPath),
          ]);

          if (originalExists && !tempExists && !finalExists) {
            await markUndoEntryState(entry.fileId, "rolledBack").catch(
              (error) =>
                reportError("保存已恢复状态失败", error)
            );
            restoreMap.set(entry.fileId, {
              path: entry.originalPath,
              name: origName,
              extension: parts.extension,
            });
            continue;
          }

          if (
            (finalExists && (tempExists || originalExists)) ||
            (!finalExists && !tempExists)
          ) {
            throw new Error("文件状态不明确，已停止自动撤销");
          }

          await markUndoEntryState(entry.fileId, "rollingBack").catch(
            (error) =>
              reportError("保存回滚中状态失败", error)
          );
          if (finalExists) {
            // Phase 1 (reverse): 最终名 → UUID 临时名
            await exclusiveRename(entry.finalPath, entry.tempPath);
          }

          // Phase 2 (reverse): UUID 临时名 → 原文件名
          await exclusiveRename(entry.tempPath, entry.originalPath);
          await markUndoEntryState(entry.fileId, "rolledBack").catch(
            (error) =>
              reportError("保存撤销完成状态失败", error)
          );
          restoreMap.set(entry.fileId, {
            path: entry.originalPath,
            name: origName,
            extension: parts.extension,
          });
        } catch (err) {
          reportError("撤销时恢复文件失败", err);
          undoErrors[entry.fileId] =
            err instanceof Error ? err.message : "撤销失败";
        }
      }

      if (restoreMap.size > 0) {
        onFileNamesUpdated(restoreMap);
      }

      if (Object.keys(undoErrors).length === 0) {
        await clearUndoSnapshotFile();
      } else {
        setExecutionErrors((prev) => ({ ...prev, ...undoErrors }));
      }

      // 只有全部恢复成功才退出撤销状态，失败项可以继续重试。
      setHasExecuted(Object.keys(undoErrors).length > 0);
      setExecutionResults({});
    } catch (err) {
      reportError("撤销失败", err);
      setExecutionErrors({
        undo: err instanceof Error ? err.message : "撤销失败",
      });
      setHasExecuted(true);
    }

    setIsExecuting(false);
    executingRef.current = false;
  }, [onFileNamesUpdated]);

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
