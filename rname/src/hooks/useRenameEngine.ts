import { useMemo } from "react";
import { diffWords } from "diff";
import type { FileItem } from "../types/file";
import type {
  RenameRule,
  PreviewResult,
  DiffSegment,
} from "../types/rename";
import { applyRenamePipeline } from "../utils/renamePipeline";
import { joinFileName, splitFileName } from "../utils/rename";

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
 * 接收文件列表和有序规则链，计算所有文件的预览结果。
 * 所有计算在 useMemo 中完成，依赖 files 和 rules 变化时自动重算。
 * 预览是派生数据，不使用 useState 管理。
 *
 * @param files - 文件列表
 * @param rules - 有序规则链
 * @returns 预览结果数组和冲突总数
 */
export function useRenameEngine(
  files: FileItem[],
  rules: RenameRule[],
  targetNames?: ReadonlyMap<string, string>
): {
  previews: PreviewResult[];
  totalConflicts: number;
} {
  // 文件名或路径变化后必须重新计算预览。
  const filesKey = useMemo(
    () =>
      files
        .map((file) =>
          `${file.id}\0${file.path}\0${file.name}\0${file.createdAt}\0${file.modifiedAt}\0${file.exifTakenAt ?? ""}`
        )
        .join("\u001f"),
    [files]
  );

  return useMemo(() => {
    // 编号与用户看到的添加顺序保持一致。
    const previews: PreviewResult[] = files.map((file, index) => {
      const parts = splitFileName(file.name);
      const oldBaseName = parts.baseName;
      const oldExtension = parts.extension;

      const pipeline = applyRenamePipeline(
        file,
        rules,
        index,
        files.length
      );
      const targetName = targetNames?.get(file.path);
      const override = targetName ? splitFileName(targetName) : null;
      const newBaseName = override?.baseName ?? pipeline.newBaseName;
      const newExtension = override?.extension ?? pipeline.newExtension;
      const error = override ? undefined : pipeline.error;
      const steps = pipeline.steps;

      const newFullName = joinFileName(newBaseName, newExtension);

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
        validationError: error,
        ruleSteps: steps,
      };
    });

    for (const preview of previews) {
      if (preview.validationError) {
        preview.hasConflict = true;
        preview.conflictWith = [preview.validationError];
      }
    }

    // 冲突检测
    detectConflicts(previews);

    const totalConflicts = previews.filter((p) => p.hasConflict).length;
    return { previews, totalConflicts };
  }, [filesKey, rules, targetNames]);
}
