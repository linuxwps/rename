import { useState } from "react";
import type { RenamePreset, RenameRule } from "../../types/rename";
import { MAX_RENAME_PRESETS } from "../../utils/presets";
import "./PresetManager.css";

interface PresetManagerProps {
  presets: RenamePreset[];
  rules: RenameRule[];
  activePresetId: string | null;
  onSavePreset: (name: string) => void;
  onLoadPreset: (presetId: string) => void;
  onDeletePreset: (presetId: string) => void;
  canSave: boolean;
}

function presetChanged(
  preset: RenamePreset | undefined,
  rulesSource: RenameRule[],
  activePresetId: string | null
): boolean {
  if (!preset || activePresetId !== preset.id) return false;
  const ruleKey = (rule: RenameRule) =>
    `${rule.type}:${rule.enabled ? 1 : 0}:${JSON.stringify(rule.config)}`;
  return (
    JSON.stringify(preset.rules.map(ruleKey)) !==
    JSON.stringify(rulesSource.map(ruleKey))
  );
}

export function PresetManager({
  presets,
  rules,
  activePresetId,
  onSavePreset,
  onLoadPreset,
  onDeletePreset,
  canSave,
}: PresetManagerProps) {
  const [presetName, setPresetName] = useState("");

  const activePreset = presets.find((preset) => preset.id === activePresetId);

  const handleSave = () => {
    const name = presetName.trim() || activePreset?.name || "";
    onSavePreset(name);
    setPresetName("");
  };

  return (
    <div className="preset-manager">
      <div className="preset-manager__header">
        <span className="preset-manager__title">预设</span>
        <span className="preset-manager__count">
          {presets.length}/{MAX_RENAME_PRESETS}
        </span>
      </div>

      <div className="preset-manager__save-row">
        <input
          type="text"
          value={presetName}
          placeholder={activePreset ? `覆盖“${activePreset.name}”` : "输入新预设名称"}
          onChange={(event) => setPresetName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") handleSave();
          }}
        />
        <button onClick={handleSave} disabled={!canSave}>
          {activePresetId ? "更新" : "保存"}
        </button>
      </div>

      {presets.length === 0 ? (
        <p className="preset-manager__empty">还没有保存的预设</p>
      ) : (
        <ul className="preset-manager__list">
          {presets.map((preset) => {
            const isActive = preset.id === activePresetId;
            const dirty =
              activePresetId === preset.id &&
              presetChanged(preset, rules, activePresetId);

            return (
              <li key={preset.id}>
                <button
                  className={
                    "preset-manager__item" + (isActive ? " is-active" : "")
                  }
                  onClick={() => onLoadPreset(preset.id)}
                  title={preset.rules.map((rule) => rule.type).join(" → ")}
                >
                  <span className="preset-manager__name">
                    {preset.name}
                    {dirty && <span className="preset-manager__dirty">已修改</span>}
                  </span>
                  <span className="preset-manager__meta">
                    {preset.rules.length} 条规则
                  </span>
                </button>
                <button
                  className="preset-manager__delete"
                  onClick={() => {
                    if (
                      window.confirm(`确定删除预设“${preset.name}”吗？`)
                    ) {
                      onDeletePreset(preset.id);
                    }
                  }}
                  title={`删除预设“${preset.name}”`}
                >
                  ✕
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {canSave && (
        <p className="preset-manager__hint">
          至少启用一条规则后即可保存当前规则链为预设
        </p>
      )}
    </div>
  );
}
