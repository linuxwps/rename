import {
  ArrowCounterClockwise,
  CheckCircle,
  DownloadSimple,
  FileCsv,
  List,
  Trash,
  WarningCircle,
} from "@phosphor-icons/react";
import "./ActionBar.css";

interface ActionBarProps {
  totalConflicts: number;
  hasRules: boolean;
  isPreviewPending: boolean;
  isExecuting: boolean;
  hasExecuted: boolean;
  onExecute: () => void;
  onUndo: () => void;
  onClearFiles?: () => void;
  hasFiles: boolean;
  selectedCount: number;
  onExportCsv: () => void;
  onImportCsv: () => void;
  onShowLogs: () => void;
}

export function ActionBar({
  totalConflicts,
  hasRules,
  isPreviewPending,
  isExecuting,
  hasExecuted,
  onExecute,
  onUndo,
  onClearFiles,
  hasFiles,
  selectedCount,
  onExportCsv,
  onImportCsv,
  onShowLogs,
}: ActionBarProps) {
  if (hasExecuted) {
    return (
      <div className="action-bar">
        <div className="action-bar__left">
          <span className="action-bar__status action-bar__status--success">
            <CheckCircle size={16} weight="fill" aria-hidden="true" />
            重命名完成
          </span>
        </div>
        <div className="action-bar__actions">
          <button className="toolbar-btn" onClick={onExportCsv} disabled={selectedCount === 0}>
            <DownloadSimple className="button-icon" size={14} aria-hidden="true" />
            导出 CSV
          </button>
          <button className="toolbar-btn" onClick={onShowLogs}>
            <List className="button-icon" size={14} aria-hidden="true" />
            日志
          </button>
          <button className="undo-btn" onClick={onUndo} disabled={isExecuting}>
            <ArrowCounterClockwise className="button-icon" size={15} aria-hidden="true" />
            {isExecuting ? "撤销中..." : "撤销重命名"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="action-bar">
      <div className="action-bar__left">
        <span className="action-bar__selection">已选择 {selectedCount} 个文件</span>
        {totalConflicts > 0 && (
          <span className="action-bar__conflicts">
            <WarningCircle size={15} weight="fill" aria-hidden="true" />
            发现 {totalConflicts} 个冲突
          </span>
        )}
        {hasFiles && onClearFiles && (
          <button className="clear-bar-btn" onClick={onClearFiles}>
            <Trash className="button-icon" size={14} aria-hidden="true" />
            清空列表
          </button>
        )}
        <button className="toolbar-btn" onClick={onImportCsv}>
          <FileCsv className="button-icon" size={14} aria-hidden="true" />
          导入 CSV
        </button>
        <button className="toolbar-btn" onClick={onExportCsv} disabled={selectedCount === 0}>
          <DownloadSimple className="button-icon" size={14} aria-hidden="true" />
          导出 CSV
        </button>
        <button className="toolbar-btn" onClick={onShowLogs}>
          <List className="button-icon" size={14} aria-hidden="true" />
          日志
        </button>
      </div>
      <div className="action-bar__actions">
        <button
          className={`exec-btn${isExecuting ? " exec-btn--loading" : ""}`}
          disabled={
            selectedCount === 0 ||
            isExecuting ||
            isPreviewPending ||
            !hasRules ||
            totalConflicts > 0
          }
          onClick={onExecute}
          title={
            selectedCount === 0
              ? "请至少选择一个文件"
              : !hasRules
              ? "请先添加并填写至少一条有效规则"
              : isPreviewPending
                ? "正在生成最新预览"
                : undefined
          }
        >
          {isPreviewPending ? (
            "生成预览中..."
          ) : isExecuting ? (
            <>
              <span className="spinner" />
              重命名中...
            </>
          ) : (
            "执行重命名"
          )}
        </button>
      </div>
    </div>
  );
}
