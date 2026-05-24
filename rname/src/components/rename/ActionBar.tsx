import "./ActionBar.css";

interface ActionBarProps {
  totalConflicts: number;
  isExecuting: boolean;
  hasExecuted: boolean;
  onExecute: () => void;
  onUndo: () => void;
  onClearFiles?: () => void;
  hasFiles: boolean;
}

export function ActionBar({
  totalConflicts,
  isExecuting,
  hasExecuted,
  onExecute,
  onUndo,
  onClearFiles,
  hasFiles,
}: ActionBarProps) {
  if (hasExecuted) {
    return (
      <div className="action-bar">
        <div className="action-bar__left">
          <span className="action-bar__status action-bar__status--success">
            ✓ 重命名完成
          </span>
        </div>
        <div className="action-bar__actions">
          <button className="undo-btn" onClick={onUndo} disabled={isExecuting}>
            {isExecuting ? "撤销中..." : "撤销重命名"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="action-bar">
      <div className="action-bar__left">
        {totalConflicts > 0 && (
          <span className="action-bar__conflicts">
            ⚠ 发现 {totalConflicts} 个冲突
          </span>
        )}
        {hasFiles && onClearFiles && (
          <button className="clear-bar-btn" onClick={onClearFiles}>
            清空列表
          </button>
        )}
      </div>
      <div className="action-bar__actions">
        <button
          className={`exec-btn${isExecuting ? " exec-btn--loading" : ""}`}
          disabled={isExecuting || totalConflicts > 0}
          onClick={onExecute}
        >
          {isExecuting ? (
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
