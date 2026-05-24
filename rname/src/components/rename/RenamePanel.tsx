import type { FileItem } from "../../types/file";
import type { RenameModeStates } from "../../types/rename";
import { ConflictBanner } from "./ConflictBanner";
import { RenameTabBar } from "./RenameTabBar";
import { ActionBar } from "./ActionBar";
import "./RenamePanel.css";

type TabKey = "sequential" | "regex" | "prefix" | "suffix" | "extension" | "replace";

interface RenamePanelProps {
  files: FileItem[];
  modeStates: RenameModeStates;
  onToggleMode: (mode: TabKey) => void;
  onUpdateModeConfig: <K extends TabKey>(mode: K, patch: Partial<RenameModeStates[K]>) => void;
  activeTabForm: TabKey | null;
  onSetActiveTabForm: (tab: TabKey | null) => void;
  totalConflicts: number;
  activeFormComponent?: React.ReactNode;
  isExecuting: boolean;
  hasExecuted: boolean;
  onExecute: () => void;
  onUndo: () => void;
  onClearFiles: () => void;
}

export function RenamePanel({
  files,
  modeStates,
  onToggleMode,
  activeTabForm,
  onSetActiveTabForm,
  totalConflicts,
  activeFormComponent,
  isExecuting,
  hasExecuted,
  onExecute,
  onUndo,
  onClearFiles,
}: RenamePanelProps) {
  if (files.length === 0) {
    return (
      <div className="rename-panel-empty">
        请先在上方添加文件
      </div>
    );
  }

  return (
    <div className="rename-panel">
      <ConflictBanner totalConflicts={totalConflicts} />
      <RenameTabBar
        modeStates={modeStates}
        onToggleMode={onToggleMode}
        activeTabForm={activeTabForm}
        onSetActiveTabForm={onSetActiveTabForm}
        hasFiles={files.length > 0}
      />
      <div className="rename-form-area">
        {activeFormComponent || (
          <p className="rename-form-hint">选择一个模式开始重命名</p>
        )}
      </div>
      {files.length > 0 && (
        <ActionBar
          totalConflicts={totalConflicts}
          isExecuting={isExecuting}
          hasExecuted={hasExecuted}
          onExecute={onExecute}
          onUndo={onUndo}
          onClearFiles={onClearFiles}
          hasFiles={files.length > 0}
        />
      )}
    </div>
  );
}
