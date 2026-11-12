/** Tab 键名 - 所有重命名模式的 key */
export type TabKey =
  | "sequential"
  | "regex"
  | "prefix"
  | "suffix"
  | "extension"
  | "replace"
  | "case"
  | "exif";

/** Sequential 模式配置 */
export interface SequentialConfig {
  startAt: number;       // default: 1
  digits: number;        // default: 3
  position: "before" | "after";  // default: "after"
}

/** Regex 正则替换模式配置 */
export interface RegexConfig {
  pattern: string;
  replacement: string;
  caseSensitive: boolean;  // default: false
}

/** Prefix 前缀模式配置 */
export interface PrefixConfig {
  text: string;
}

/** Suffix 后缀模式配置 */
export interface SuffixConfig {
  text: string;
}

/** Extension 扩展名模式配置 */
export interface ExtensionConfig {
  mode: "change" | "remove" | "add";  // default: "change"
  newExtension: string;
}

/** Replace 文本替换模式配置 */
export interface ReplaceConfig {
  findText: string;
  replaceText: string;
  caseSensitive: boolean;  // default: false
}

/** 大小写转换模式配置 */
export interface CaseConfig {
  mode: "uppercase" | "lowercase" | "title";
}

export interface ExifDateConfig {
  source: "taken" | "created" | "modified";
  fallback: "next" | "error";
  format: "YYYYMMDD" | "YYYY-MM-DD" | "YYYYMMDD_HHmmss";
  position: "before" | "after" | "replace";
  separator: string;
}

/** 按规则类型建立配置映射 */
export interface RenameRuleConfigMap {
  sequential: SequentialConfig;
  regex: RegexConfig;
  prefix: PrefixConfig;
  suffix: SuffixConfig;
  extension: ExtensionConfig;
  replace: ReplaceConfig;
  case: CaseConfig;
  exif: ExifDateConfig;
}

export type RenameRuleConfig = RenameRuleConfigMap[TabKey];

/** 规则链中的单条规则，数组顺序就是执行顺序 */
export type RenameRule = {
  [K in TabKey]: {
    id: string;
    type: K;
    enabled: boolean;
    config: RenameRuleConfigMap[K];
  };
}[TabKey];

/** 单条规则处理后的中间文件名 */
export interface RulePreviewStep {
  ruleId: string;
  ruleType: TabKey;
  beforeFullName: string;
  afterFullName: string;
  changed: boolean;
}

/** 可保存到本地存储的规则预设 */
export interface RenamePreset {
  id: string;
  name: string;
  rules: RenameRule[];
  createdAt: number;
  updatedAt: number;
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
  validationError?: string;
  ruleSteps: RulePreviewStep[];
}

export type FileSystemPlatform = "macos" | "windows" | "linux" | "other";

/** 文件列表排序方式 */
export type FileSortMode = "added" | "manual" | "ascending" | "descending";

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
