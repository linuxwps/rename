import { useEffect, useState } from "react";
import { readLogTail, writeAppLog } from "../utils/renameService";
import "./LogPanel.css";

interface LogPanelProps {
  open: boolean;
  onClose: () => void;
}

export function LogPanel({ open, onClose }: LogPanelProps) {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      setContent(await readLogTail(300));
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : String(loadError);
      setError(message);
      writeAppLog("error", `读取日志失败：${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) void load();
  }, [open]);

  if (!open) return null;

  return (
    <div className="log-panel-backdrop" onMouseDown={onClose}>
      <aside className="log-panel" onMouseDown={(event) => event.stopPropagation()}>
        <header className="log-panel__header">
          <div>
            <h2>操作日志</h2>
            <p>显示应用日志目录中最新文件的最近 300 行</p>
          </div>
          <button className="log-panel__close" onClick={onClose} aria-label="关闭日志">
            ×
          </button>
        </header>
        <div className="log-panel__toolbar">
          <button onClick={() => void load()} disabled={isLoading}>
            {isLoading ? "读取中…" : "刷新"}
          </button>
          <button
            onClick={() => {
              void navigator.clipboard.writeText(content);
            }}
            disabled={!content}
          >
            复制全部
          </button>
        </div>
        {error ? (
          <div className="log-panel__error">{error}</div>
        ) : (
          <pre className="log-panel__content">
            {isLoading ? "正在读取日志…" : content || "暂无日志记录"}
          </pre>
        )}
      </aside>
    </div>
  );
}
