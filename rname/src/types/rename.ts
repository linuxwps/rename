/** Sequential 模式配置 */
export interface SequentialConfig {
  enabled: boolean;
  startAt: number;       // default: 1
  digits: number;        // default: 3
  position: "before" | "after";  // default: "after"
}

/** Regex 正则替换模式配置 */
export interface RegexConfig {
  enabled: boolean;
  pattern: string;
  replacement: string;
  caseSensitive: boolean;  // default: false
}

/** Prefix 前缀模式配置 */
export interface PrefixConfig {
  enabled: boolean;
  text: string;
}

/** Suffix 后缀模式配置 */
export interface SuffixConfig {
  enabled: boolean;
  text: string;
}

/** Extension 扩展名模式配置 */
export interface ExtensionConfig {
  enabled: boolean;
  mode: "change" | "remove" | "add";  // default: "change"
  newExtension: string;
}

/** Replace 文本替换模式配置 */
export interface ReplaceConfig {
  enabled: boolean;
  findText: string;
  replaceText: string;
  caseSensitive: boolean;  // default: false
}

/** 6 种重命名模式的状态集合 */
export interface RenameModeStates {
  sequential: SequentialConfig;
  regex: RegexConfig;
  prefix: PrefixConfig;
  suffix: SuffixConfig;
  extension: ExtensionConfig;
  replace: ReplaceConfig;
}

/** Diff 分段，用于文件名变化高亮 */
export interface DiffSegment {
  value: string;
  type: "added" | "removed" | "unchanged";
}

/** 单个文件的预览结果 */
export interface PreviewResult {
  fileId: string;
  oldBaseName: string;
  oldExtension: string;
  newBaseName: string;
  newExtension: string;
  newFullName: string;
  diffBaseName: DiffSegment[];
  diffExtension: DiffSegment[];
  hasConflict: boolean;
  conflictWith: string[];
}

/** 单个文件的执行状态 */
export type ExecutionResult = "pending" | "success" | "fail";

/** 执行错误映射 fileId → errorMessage */
export type ExecutionErrors = Record<string, string>;

/** 执行后文件更新数据 */
export interface FileItemUpdate {
  path: string;
  name: string;
  extension: string;
}
