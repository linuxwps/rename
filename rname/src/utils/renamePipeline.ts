import type { FileItem } from "../types/file";
import type {
  RenameModeStates,
  SequentialConfig,
  RegexConfig,
  ReplaceConfig,
  PrefixConfig,
  SuffixConfig,
  ExtensionConfig,
} from "../types/rename";

/**
 * 6 种重命名模式的应用顺序（按 D-14 规定）：
 * 时间 → 正则 → 替换 → 前缀 → 后缀 → 扩展名
 */
export const MODE_ORDER: Array<keyof RenameModeStates> = [
  "sequential",
  "regex",
  "replace",
  "prefix",
  "suffix",
  "extension",
];

/**
 * 应用重命名流水线。
 *
 * 根据 modes 中启用的模式，按 MODE_ORDER 顺序依次对文件名进行变换。
 * 所有操作均为纯函数、无副作用。
 *
 * @param file - 原始文件信息
 * @param modes - 6 种重命名模式的配置状态
 * @param index - 文件在排序列表中的索引（用于 sequential 编号）
 * @param totalFiles - 文件总数
 * @returns 变换后的新 baseName 和 extension
 */
export function applyRenamePipeline(
  file: FileItem,
  modes: RenameModeStates,
  index: number,
  _totalFiles: number
): { newBaseName: string; newExtension: string } {
  // 从文件名中分离 baseName 和 extension
  let baseName = file.name.replace(`.${file.extension}`, "");
  let newExtension = file.extension;

  for (const mode of MODE_ORDER) {
    const config = modes[mode];
    if (!config.enabled) continue;

    switch (mode) {
      case "sequential": {
        const seq = config as SequentialConfig;
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
        const r = config as RegexConfig;
        const flags = r.caseSensitive ? "g" : "gi";
        try {
          baseName = baseName.replace(new RegExp(r.pattern, flags), r.replacement);
        } catch {
          // 无效正则表达式，跳过该步骤
        }
        break;
      }

      case "replace": {
        const r = config as ReplaceConfig;
        const flags = r.caseSensitive ? "g" : "gi";
        // 对 findText 做正则转义，确保按字面匹配
        const escaped = r.findText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        baseName = baseName.replace(new RegExp(escaped, flags), r.replaceText);
        break;
      }

      case "prefix": {
        const p = config as PrefixConfig;
        baseName = `${p.text}${baseName}`;
        break;
      }

      case "suffix": {
        const s = config as SuffixConfig;
        baseName = `${baseName}${s.text}`;
        break;
      }

      case "extension": {
        const ext = config as ExtensionConfig;
        if (ext.mode === "change" && ext.newExtension) {
          newExtension = ext.newExtension;
        } else if (ext.mode === "remove") {
          newExtension = "";
        } else if (ext.mode === "add" && !newExtension) {
          newExtension = ext.newExtension;
        }
        break;
      }
    }
  }

  return { newBaseName: baseName, newExtension };
}
