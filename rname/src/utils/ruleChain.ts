import type {
  CaseConfig,
  ExtensionConfig,
  ExifDateConfig,
  PrefixConfig,
  RegexConfig,
  RenameRule,
  ReplaceConfig,
  SequentialConfig,
  SuffixConfig,
  TabKey,
} from "../types/rename";

export const MAX_RENAME_RULES = 10;

export const RULE_TYPES: TabKey[] = [
  "sequential",
  "regex",
  "prefix",
  "suffix",
  "extension",
  "replace",
  "case",
  "exif",
];

export const RULE_META: Record<TabKey, { label: string }> = {
  sequential: { label: "序号" },
  regex: { label: "正则" },
  prefix: { label: "前缀" },
  suffix: { label: "后缀" },
  extension: { label: "扩展名" },
  replace: { label: "替换" },
  case: { label: "大小写" },
  exif: { label: "照片日期" },
};

let fallbackIdSequence = 0;

export function createRuleId(prefix = "rule"): string {
  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  fallbackIdSequence += 1;
  return `${prefix}-${Date.now()}-${fallbackIdSequence}`;
}

export function isTabKey(value: unknown): value is TabKey {
  return typeof value === "string" && RULE_TYPES.includes(value as TabKey);
}

export function createRule(type: TabKey, id = createRuleId()): RenameRule {
  switch (type) {
    case "sequential":
      return {
        id,
        type,
        enabled: true,
        config: { startAt: 1, digits: 3, position: "after" },
      };
    case "regex":
      return {
        id,
        type,
        enabled: true,
        config: { pattern: "", replacement: "", caseSensitive: false },
      };
    case "prefix":
      return {
        id,
        type,
        enabled: true,
        config: { text: "" },
      };
    case "suffix":
      return {
        id,
        type,
        enabled: true,
        config: { text: "" },
      };
    case "extension":
      return {
        id,
        type,
        enabled: true,
        config: { mode: "change", newExtension: "" },
      };
    case "replace":
      return {
        id,
        type,
        enabled: true,
        config: { findText: "", replaceText: "", caseSensitive: false },
      };
    case "case":
      return {
        id,
        type,
        enabled: true,
        config: { mode: "lowercase" },
      };
    case "exif":
      return {
        id,
        type,
        enabled: true,
        config: { source: "taken", fallback: "next", format: "YYYYMMDD", position: "before", separator: "_" },
      };
  }
}

export function cloneRule(rule: RenameRule, id = createRuleId()): RenameRule {
  return {
    ...rule,
    id,
    config: { ...rule.config },
  } as RenameRule;
}

export function cloneRulesWithFreshIds(
  rules: RenameRule[],
  idFactory: () => string = createRuleId
): RenameRule[] {
  return rules.map((rule) => cloneRule(rule, idFactory()));
}

export function moveRule(
  rules: RenameRule[],
  fromIndex: number,
  toIndex: number
): RenameRule[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= rules.length ||
    toIndex >= rules.length
  ) {
    return rules;
  }

  const next = [...rules];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

export function moveRuleById(
  rules: RenameRule[],
  ruleId: string,
  offset: number
): RenameRule[] {
  const fromIndex = rules.findIndex((rule) => rule.id === ruleId);
  if (fromIndex < 0) return rules;
  return moveRule(rules, fromIndex, fromIndex + offset);
}

export function removeRule(rules: RenameRule[], ruleId: string): RenameRule[] {
  return rules.filter((rule) => rule.id !== ruleId);
}

export function isRuleConfigured(rule: RenameRule): boolean {
  if (!rule.enabled) return false;

  switch (rule.type) {
    case "sequential":
      return true;
    case "regex":
      return rule.config.pattern.trim().length > 0;
    case "prefix":
      return rule.config.text.length > 0;
    case "suffix":
      return rule.config.text.length > 0;
    case "extension":
      return (
        rule.config.mode === "remove" ||
        rule.config.newExtension.replace(/^\./, "").trim().length > 0
      );
    case "replace":
      return rule.config.findText.length > 0;
    case "case":
      return true;
    case "exif":
      return true;
  }
}

export function hasEffectiveRules(rules: RenameRule[]): boolean {
  return rules.some(isRuleConfigured);
}

export function describeRule(rule: RenameRule): string {
  switch (rule.type) {
    case "sequential": {
      const position = rule.config.position === "before" ? "名前" : "名后";
      return `从 ${rule.config.startAt} 开始 · ${rule.config.digits} 位 · ${position}`;
    }
    case "regex":
      return rule.config.pattern
        ? `/${rule.config.pattern}/ → ${rule.config.replacement || "（空）"}`
        : "尚未填写正则表达式";
    case "prefix":
      return rule.config.text ? `添加“${rule.config.text}”` : "尚未填写前缀";
    case "suffix":
      return rule.config.text ? `添加“${rule.config.text}”` : "尚未填写后缀";
    case "extension": {
      const action =
        rule.config.mode === "change"
          ? "改为"
          : rule.config.mode === "remove"
            ? "移除"
            : "添加";
      return rule.config.mode === "remove"
        ? "移除扩展名"
        : `${action} .${rule.config.newExtension || "…"}`;
    }
    case "replace":
      return rule.config.findText
        ? `“${rule.config.findText}” → “${rule.config.replaceText}”`
        : "尚未填写查找文本";
    case "case": {
      const mode =
        rule.config.mode === "uppercase"
          ? "全部大写"
          : rule.config.mode === "title"
            ? "单词首字母大写"
            : "全部小写";
      return mode;
    }
    case "exif": {
      const source = { taken: "拍摄时间", created: "创建时间", modified: "修改时间" }[rule.config.source];
      const position = { before: "名前", after: "名后", replace: "替换原名" }[rule.config.position];
      return `${source} · ${rule.config.format} · ${position}`;
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function numberValue(
  value: unknown,
  fallback: number,
  minimum: number,
  maximum: number
): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(minimum, Math.min(maximum, Math.trunc(value)))
    : fallback;
}

function booleanValue(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function sanitizeConfig(
  type: TabKey,
  value: unknown
): RenameRule["config"] {
  const config = isRecord(value) ? value : {};

  switch (type) {
    case "sequential":
      return {
        startAt: numberValue(config.startAt, 1, 1, 9999),
        digits: numberValue(config.digits, 3, 1, 6),
        position: config.position === "before" ? "before" : "after",
      } satisfies SequentialConfig;
    case "regex":
      return {
        pattern: stringValue(config.pattern, ""),
        replacement: stringValue(config.replacement, ""),
        caseSensitive: booleanValue(config.caseSensitive, false),
      } satisfies RegexConfig;
    case "prefix":
      return { text: stringValue(config.text, "") } satisfies PrefixConfig;
    case "suffix":
      return { text: stringValue(config.text, "") } satisfies SuffixConfig;
    case "extension": {
      const mode =
        config.mode === "remove" || config.mode === "add"
          ? config.mode
          : "change";
      return {
        mode,
        newExtension: stringValue(config.newExtension, "").replace(/^\./, ""),
      } satisfies ExtensionConfig;
    }
    case "replace":
      return {
        findText: stringValue(config.findText, ""),
        replaceText: stringValue(config.replaceText, ""),
        caseSensitive: booleanValue(config.caseSensitive, false),
      } satisfies ReplaceConfig;
    case "case":
      return {
        mode:
          config.mode === "uppercase" || config.mode === "title"
            ? config.mode
            : "lowercase",
      } satisfies CaseConfig;
    case "exif":
      return {
        source: config.source === "created" || config.source === "modified" ? config.source : "taken",
        fallback: config.fallback === "error" ? "error" : "next",
        format: config.format === "YYYY-MM-DD" || config.format === "YYYYMMDD_HHmmss" ? config.format : "YYYYMMDD",
        position: config.position === "after" || config.position === "replace" ? config.position : "before",
        separator: stringValue(config.separator, "_").slice(0, 16),
      } satisfies ExifDateConfig;
  }
}

export function sanitizeRules(
  value: unknown,
  idFactory: () => string = createRuleId
): RenameRule[] {
  if (!Array.isArray(value)) return [];

  const result: RenameRule[] = [];
  const ids = new Set<string>();

  for (const candidate of value.slice(0, MAX_RENAME_RULES)) {
    if (!isRecord(candidate) || !isTabKey(candidate.type)) continue;

    const candidateId =
      typeof candidate.id === "string" && candidate.id.length > 0
        ? candidate.id
        : idFactory();
    const id = ids.has(candidateId) ? idFactory() : candidateId;
    ids.add(id);

    const defaults = createRule(candidate.type, id);
    result.push({
      ...defaults,
      enabled: booleanValue(candidate.enabled, true),
      config: sanitizeConfig(candidate.type, candidate.config),
    } as RenameRule);
  }

  return result;
}
