import { useMemo } from "react";
import { diffWords } from "diff";
import type { FileItem } from "../types/file";
import type {
  RenameModeStates,
  PreviewResult,
  DiffSegment,
} from "../types/rename";
import { applyRenamePipeline } from "../utils/renamePipeline";

/**
 * 检测预览结果中的重名冲突。
 *
 * 使用 Map<newFullName.toLowerCase(), number[]> 分组检测。
 * 对 APFS（macOS 默认，大小写不敏感），统一使用小写作为 key，
 * 避免因大小写差异漏检冲突。
 *
 * @param results - 预览结果数组（会被原地修改）
 */
function detectConflicts(results: PreviewResult[]): void {
  const seen = new Map<string, number[]>();

  results.forEach((r, idx) => {
    // APFS 大小写不敏感，使用小写作为冲突检测 key
    const key = r.newFullName.toLowerCase();
    if (seen.has(key)) {
      seen.get(key)!.push(idx);
    } else {
      seen.set(key, [idx]);
    }
  });

  for (const [, indices] of seen) {
    if (indices.length > 1) {
      for (const idx of indices) {
        results[idx].hasConflict = true;
        results[idx].conflictWith = indices
          .filter((i) => i !== idx)
          .map((i) => results[i].newFullName);
      }
    }
  }
}

/**
 * 重命名预览计算 hook。
 *
 * 接收文件列表和重命名模式配置，计算所有文件的预览结果。
 * 所有计算在 useMemo 中完成，依赖 files 和 modes 变化时自动重算。
 * 预览是派生数据，不使用 useState 管理。
 *
 * @param files - 文件列表
 * @param modes - 6 种重命名模式的配置状态
 * @returns 预览结果数组和冲突总数
 */
export function useRenameEngine(
  files: FileItem[],
  modes: RenameModeStates
): {
  previews: PreviewResult[];
  totalConflicts: number;
} {
  // 稳定依赖：用排序后的文件 ID 拼接字符串代替完整 files 数组引用
  const fileIdsKey = useMemo(() => files.map((f) => f.id).sort().join(","), [files]);

  return useMemo(() => {
    // 对文件按修改时间升序排序（副本排序，不修改原数组）
    const sorted = [...files].sort(
      (a, b) => (a.modifiedAt ?? 0) - (b.modifiedAt ?? 0)
    );

    const previews: PreviewResult[] = sorted.map((file, index) => {
      const extDot = file.extension ? `.${file.extension}` : "";
      const lastDotIdx = extDot ? file.name.lastIndexOf(extDot) : -1;
      const oldBaseName = lastDotIdx > 0 ? file.name.slice(0, lastDotIdx) : file.name;
      const oldExtension = file.extension;

      const { newBaseName, newExtension } = applyRenamePipeline(
        file,
        modes,
        index,
        files.length
      );

      const newFullName = newExtension
        ? `${newBaseName}.${newExtension}`
        : newBaseName;

      // 对 baseName 部分进行词级 diff（仅在有变化时计算）
      let diffBaseName: DiffSegment[];
      if (oldBaseName === newBaseName) {
        diffBaseName = [{ value: oldBaseName, type: "unchanged" }];
      } else {
        const baseNameDiff = diffWords(oldBaseName, newBaseName);
        diffBaseName = baseNameDiff.map((part) => ({
          value: part.value,
          type: part.added ? "added" : part.removed ? "removed" : "unchanged",
        }));
      }

      // 对 extension 部分进行 diff（仅在有变化时计算）
      let diffExtension: DiffSegment[];
      if (oldExtension === newExtension) {
        diffExtension = [{ value: oldExtension ? `.${oldExtension}` : "", type: "unchanged" }];
      } else {
        const extensionDiff = diffWords(
          oldExtension ? `.${oldExtension}` : "",
          newExtension ? `.${newExtension}` : ""
        );
        diffExtension = extensionDiff.map((part) => ({
          value: part.value,
          type: part.added ? "added" : part.removed ? "removed" : "unchanged",
        }));
      }

      return {
        fileId: file.id,
        oldBaseName,
        oldExtension,
        newBaseName,
        newExtension,
        newFullName,
        diffBaseName,
        diffExtension,
        hasConflict: false,
        conflictWith: [],
      };
    });

    // 冲突检测
    detectConflicts(previews);

    const totalConflicts = previews.filter((p) => p.hasConflict).length;
    return { previews, totalConflicts };
  }, [fileIdsKey, modes]);
}
