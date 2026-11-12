import { memo } from "react";
import type { FileItem } from "../../types/file";
import type {
  RenamePreset,
  RenameRule,
  RenameRuleConfigMap,
  TabKey,
} from "../../types/rename";
import type { ReactNode } from "react";
import { ConflictBanner } from "./ConflictBanner";
import { RenameTabBar } from "./RenameTabBar";
import { ActionBar } from "./ActionBar";
import { RuleChainManager } from "./RuleChainManager";
import { PresetManager } from "./PresetManager";
import { hasEffectiveRules } from "../../utils/ruleChain";
import "./RenamePanel.css";

interface RenamePanelProps {
  files: FileItem[];
  rules: RenameRule[];
  onAddRule: (type: TabKey) => void;
  onToggleRule: (ruleId: string) => void;
  onUpdateRuleConfig: <K extends TabKey>(
    ruleId: string,
    type: K,
    patch: Partial<RenameRuleConfigMap[K]>
  ) => void;
  selectedRuleId: string | null;
  onSelectRule: (ruleId: string | null) => void;
  onRemoveRule: (ruleId: string) => void;
  onDuplicateRule: (ruleId: string) => void;
  onClearRules: () => void;
  onMoveRule: (ruleId: string, offset: number) => void;
  onMoveRuleTo: (fromIndex: number, toIndex: number) => void;
  totalConflicts: number;
  activeFormComponent?: ReactNode;
  presets: RenamePreset[];
  activePresetId: string | null;
  onSavePreset: (name: string) => void;
  onLoadPreset: (presetId: string) => void;
  onDeletePreset: (presetId: string) => void;
  isPreviewPending: boolean;
  isExecuting: boolean;
  hasExecuted: boolean;
  onExecute: () => void;
  onUndo: () => void;
  onClearFiles: () => void;
  selectedCount: number;
  onExportCsv: () => void;
  onImportCsv: () => void;
  onShowLogs: () => void;
  hasCsvTargets: boolean;
}

export const RenamePanel = memo(function RenamePanel({
  files,
  rules,
  onAddRule,
  onToggleRule,
  selectedRuleId,
  onSelectRule,
  onRemoveRule,
  onDuplicateRule,
  onClearRules,
  onMoveRule,
  onMoveRuleTo,
  totalConflicts,
  activeFormComponent,
  presets,
  activePresetId,
  onSavePreset,
  onLoadPreset,
  onDeletePreset,
  isPreviewPending,
  isExecuting,
  hasExecuted,
  onExecute,
  onUndo,
  onClearFiles,
  selectedCount,
  onExportCsv,
  onImportCsv,
  onShowLogs,
  hasCsvTargets,
}: RenamePanelProps) {
  return (
    <div className="rename-panel">
      <ConflictBanner totalConflicts={totalConflicts} />
      <div className="rename-workspace-heading">
        <div>
          <h2>命名规则</h2>
        </div>
        <p>从左到右组合规则，预览会同步更新。</p>
      </div>
      <RenameTabBar
        rules={rules}
        onAddRule={onAddRule}
      />
      <div className="rename-form-area">
        <div className="rename-rule-column"><RuleChainManager
          rules={rules}
          selectedRuleId={selectedRuleId}
          onSelectRule={onSelectRule}
          onToggleRule={onToggleRule}
          onRemoveRule={onRemoveRule}
          onDuplicateRule={onDuplicateRule}
          onClearRules={onClearRules}
          onMoveRule={onMoveRule}
          onMoveRuleTo={onMoveRuleTo}
        /></div>
        {activeFormComponent && (
          <div className="rename-selected-editor">{activeFormComponent}</div>
        )}
        {rules.length > 0 && !activeFormComponent && (
          <div className="rename-selected-editor rename-editor-placeholder"><p className="rename-form-hint">选择一条规则编辑参数</p></div>
        )}
        <div className="rename-preset-column"><PresetManager
          presets={presets}
          rules={rules}
          activePresetId={activePresetId}
          onSavePreset={onSavePreset}
          onLoadPreset={onLoadPreset}
          onDeletePreset={onDeletePreset}
          canSave={hasEffectiveRules(rules)}
        /></div>
      </div>
      {files.length > 0 && (
        <ActionBar
          totalConflicts={totalConflicts}
          hasRules={hasEffectiveRules(rules) || hasCsvTargets}
          isPreviewPending={isPreviewPending}
          isExecuting={isExecuting}
          hasExecuted={hasExecuted}
          onExecute={onExecute}
          onUndo={onUndo}
          onClearFiles={onClearFiles}
          hasFiles={files.length > 0}
          selectedCount={selectedCount}
          onExportCsv={onExportCsv}
          onImportCsv={onImportCsv}
          onShowLogs={onShowLogs}
        />
      )}
    </div>
  );
});
