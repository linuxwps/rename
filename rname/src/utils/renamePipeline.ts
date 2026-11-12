import type { FileItem } from "../types/file";
import type {
  RenameRule,
  RulePreviewStep,
} from "../types/rename";
import { joinFileName, splitFileName } from "./rename";
import { formatDate, selectDate } from "./exifDate";

function applyCaseMode(value: string, mode: "uppercase" | "lowercase" | "title"): string {
  switch (mode) {
    case "uppercase":
      return value.toUpperCase();
    case "lowercase":
      return value.toLowerCase();
    case "title":
      return value
        .toLowerCase()
        .replace(
          /(^|[\s_-]+)(\p{L})/gu,
          (_match, prefix: string, letter: string) =>
            `${prefix}${letter.toUpperCase()}`
        );
  }
}

/**
 * 应用重命名流水线。
 *
 * 按规则数组的实际顺序依次对文件名进行变换。
 * 所有操作均为纯函数、无副作用。
 *
 * @param file - 原始文件信息
 * @param rules - 有序规则链
 * @param index - 文件在排序列表中的索引（用于 sequential 编号）
 * @param totalFiles - 文件总数
 * @returns 变换后的新 baseName、extension 和每条规则的中间结果
 */
export function applyRenamePipeline(
  file: FileItem,
  rules: RenameRule[],
  index: number,
  _totalFiles: number
): {
  newBaseName: string;
  newExtension: string;
  error?: string;
  steps: RulePreviewStep[];
} {
  const parts = splitFileName(file.name);
  let baseName = parts.baseName;
  let newExtension = parts.extension;
  const steps: RulePreviewStep[] = [];

  for (const rule of rules) {
    if (!rule.enabled) continue;

    const beforeFullName = joinFileName(baseName, newExtension);

    switch (rule.type) {
      case "sequential": {
        const seq = rule.config;
        const numStr = (seq.startAt + index)
          .toString()
          .padStart(seq.digits, "0");
        if (seq.position === "after") {
          baseName = `${baseName}_${numStr}`;
        } else {
          baseName = `${numStr}_${baseName}`;
        }
        break;
      }

      case "regex": {
        const r = rule.config;
        if (!r.pattern) break;
        const flags = r.caseSensitive ? "g" : "gi";
        try {
          baseName = baseName.replace(new RegExp(r.pattern, flags), r.replacement);
        } catch {
          const afterFullName = joinFileName(baseName, newExtension);
          steps.push({
            ruleId: rule.id,
            ruleType: rule.type,
            beforeFullName,
            afterFullName,
            changed: beforeFullName !== afterFullName,
          });
          return {
            newBaseName: baseName,
            newExtension,
            error: `正则表达式无效：${r.pattern}`,
            steps,
          };
        }
        break;
      }

      case "replace": {
        const r = rule.config;
        if (!r.findText) break;
        const flags = r.caseSensitive ? "g" : "gi";
        // 对 findText 做正则转义，确保按字面匹配
        const escaped = r.findText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        baseName = baseName.replace(new RegExp(escaped, flags), r.replaceText);
        break;
      }

      case "case": {
        baseName = applyCaseMode(baseName, rule.config.mode);
        break;
      }

      case "exif": {
        const timestamp = selectDate(file, rule.config);
        if (timestamp === null) {
          steps.push({ ruleId: rule.id, ruleType: rule.type, beforeFullName, afterFullName: beforeFullName, changed: false });
          return { newBaseName: baseName, newExtension, error: "所选日期来源缺失，无法生成文件名", steps };
        }
        const date = formatDate(timestamp, rule.config.format);
        const separator = rule.config.separator;
        baseName = rule.config.position === "replace"
          ? date
          : rule.config.position === "after"
            ? `${baseName}${separator}${date}`
            : `${date}${separator}${baseName}`;
        break;
      }

      case "prefix": {
        const p = rule.config;
        baseName = `${p.text}${baseName}`;
        break;
      }

      case "suffix": {
        const s = rule.config;
        baseName = `${baseName}${s.text}`;
        break;
      }

      case "extension": {
        const ext = rule.config;
        const normalizedExtension = ext.newExtension.replace(/^\./, "");
        if (ext.mode === "change" && normalizedExtension) {
          newExtension = normalizedExtension;
        } else if (ext.mode === "remove") {
          newExtension = "";
        } else if (
          ext.mode === "add" &&
          !newExtension &&
          normalizedExtension
        ) {
          newExtension = normalizedExtension;
        }
        break;
      }
    }

    const afterFullName = joinFileName(baseName, newExtension);
    steps.push({
      ruleId: rule.id,
      ruleType: rule.type,
      beforeFullName,
      afterFullName,
      changed: beforeFullName !== afterFullName,
    });
  }

  return { newBaseName: baseName, newExtension, steps };
}
