import type { RenamePreset, RenameRule } from "../types/rename";
import {
  cloneRulesWithFreshIds,
  createRuleId,
  MAX_RENAME_RULES,
  sanitizeRules,
} from "./ruleChain";

export const RENAME_PRESET_STORAGE_KEY =
  "rname" + ".rename-presets.v1";
export const MAX_RENAME_PRESETS = 50;

type StorageLike = Pick<Storage, "getItem" | "setItem">;

function getStorage(storage?: StorageLike): StorageLike | undefined {
  if (storage) return storage;
  return typeof window === "undefined" ? undefined : window.localStorage;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function sanitizePresets(value: unknown): RenamePreset[] {
  if (!Array.isArray(value)) return [];

  const presets: RenamePreset[] = [];
  const ids = new Set<string>();

  for (const candidate of value.slice(0, MAX_RENAME_PRESETS)) {
    if (!isRecord(candidate)) continue;

    const name = typeof candidate.name === "string" ? candidate.name.trim() : "";
    if (!name) continue;

    const candidateId =
      typeof candidate.id === "string" && candidate.id.length > 0
        ? candidate.id
        : createRuleId("preset");
    const id = ids.has(candidateId) ? createRuleId("preset") : candidateId;
    ids.add(id);

    const rules = sanitizeRules(candidate.rules).slice(0, MAX_RENAME_RULES);
    if (rules.length === 0) continue;

    const createdAt =
      typeof candidate.createdAt === "number" &&
      Number.isFinite(candidate.createdAt)
        ? candidate.createdAt
        : Date.now();
    const updatedAt =
      typeof candidate.updatedAt === "number" &&
      Number.isFinite(candidate.updatedAt)
        ? candidate.updatedAt
        : createdAt;

    presets.push({ id, name, rules, createdAt, updatedAt });
  }

  return presets.sort((left, right) => right.updatedAt - left.updatedAt);
}

export function loadRenamePresets(storage?: StorageLike): RenamePreset[] {
  try {
    const value = getStorage(storage)?.getItem(RENAME_PRESET_STORAGE_KEY);
    return value ? sanitizePresets(JSON.parse(value)) : [];
  } catch {
    return [];
  }
}

export function saveRenamePresets(
  presets: RenamePreset[],
  storage?: StorageLike
): void {
  const target = getStorage(storage);
  if (!target) return;
  target.setItem(
    RENAME_PRESET_STORAGE_KEY,
    JSON.stringify(sanitizePresets(presets))
  );
}

export function upsertRenamePreset(
  presets: RenamePreset[],
  name: string,
  rules: RenameRule[],
  options: {
    now?: number;
    idFactory?: () => string;
  } = {}
): { presets: RenamePreset[]; preset: RenamePreset; created: boolean } {
  const normalizedName = name.trim();
  if (!normalizedName) {
    throw new Error("请输入预设名称");
  }
  if (rules.length === 0) {
    throw new Error("规则链为空，无法保存预设");
  }

  const now = options.now ?? Date.now();
  const idFactory = options.idFactory ?? (() => createRuleId("preset"));
  const existing = presets.find(
    (preset) => preset.name.toLocaleLowerCase() === normalizedName.toLocaleLowerCase()
  );

  if (existing) {
    const preset: RenamePreset = {
      ...existing,
      name: normalizedName,
      rules: sanitizeRules(rules),
      updatedAt: now,
    };
    return {
      presets: presets
        .map((item) => (item.id === existing.id ? preset : item))
        .sort((left, right) => right.updatedAt - left.updatedAt),
      preset,
      created: false,
    };
  }

  if (presets.length >= MAX_RENAME_PRESETS) {
    throw new Error(`最多只能保存 ${MAX_RENAME_PRESETS} 个预设`);
  }

  const preset: RenamePreset = {
    id: idFactory(),
    name: normalizedName,
    rules: sanitizeRules(rules),
    createdAt: now,
    updatedAt: now,
  };

  return {
    presets: [preset, ...presets],
    preset,
    created: true,
  };
}

export function applyRenamePreset(
  preset: RenamePreset,
  idFactory: () => string = createRuleId
): RenameRule[] {
  return cloneRulesWithFreshIds(sanitizeRules(preset.rules), idFactory);
}

export function removeRenamePreset(
  presets: RenamePreset[],
  presetId: string
): RenamePreset[] {
  return presets.filter((preset) => preset.id !== presetId);
}
