import { useState, useRef, useCallback, useEffect } from "react";
import type { FileItem } from "../types/file";
import type { PreviewResult, ExecutionResult } from "../types/rename";
import { FileListRow } from "./FileListRow";
import "./FileList.css";

const COLUMNS = [
  { key: "fileName", label: "文件名" },
  { key: "newName", label: "新文件名" },
  { key: "extension", label: "扩展名" },
  { key: "size", label: "大小" },
  { key: "date", label: "修改日期" },
  { key: "actions", label: "" },
];

let cachedCtx: CanvasRenderingContext2D | null = null;

function measureText(text: string, bold: boolean = true): number {
  if (!cachedCtx) {
    const canvas = document.createElement("canvas");
    cachedCtx = canvas.getContext("2d")!;
  }
  cachedCtx.font = `${bold ? 600 : 400} 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  return cachedCtx.measureText(text || "-").width + 16; // +16 for padding
}

interface FileListProps {
  files: FileItem[];
  previews: Map<string, PreviewResult>;
  onRemoveFile: (fileId: string) => void;
  executionResults?: Record<string, ExecutionResult>;
  executionErrors?: Record<string, string>;
}

export function FileList({ files, previews, onRemoveFile, executionResults, executionErrors }: FileListProps) {
  const [colWidths, setColWidths] = useState<Record<string, number>>({});
  const dragRef = useRef<{
    key: string;
    startX: number;
    startW: number;
    minW: number;
    maxW: number;
  } | null>(null);

  const [colBounds, setColBounds] = useState<Record<string, { min: number; max: number }>>({});

  useEffect(() => {
    const bounds: Record<string, { min: number; max: number }> = {};
    for (const col of COLUMNS) {
      if (!col.label) continue;
      const headerW = measureText(col.label, true);
      let maxW = headerW;
      if (col.key === "fileName") {
        for (const f of files) {
          maxW = Math.max(maxW, measureText(f.name, false));
        }
      } else if (col.key === "extension") {
        for (const f of files) {
          maxW = Math.max(maxW, measureText(f.extension || "-", false));
        }
      } else if (col.key === "size") {
        for (const f of files) {
          const sizeLabel = f.size >= 1024 * 1024
            ? `${(f.size / (1024 * 1024)).toFixed(1)} MB`
            : f.size >= 1024
              ? `${(f.size / 1024).toFixed(1)} KB`
              : `${f.size} B`;
          maxW = Math.max(maxW, measureText(sizeLabel, false));
        }
      } else if (col.key === "date") {
        for (const f of files) {
          const d = f.modifiedAt ? new Date(f.modifiedAt).toLocaleDateString("zh-CN") : "-";
          maxW = Math.max(maxW, measureText(d, false));
        }
      } else if (col.key === "newName") {
        for (const [, p] of previews) {
          maxW = Math.max(maxW, measureText(p.newFullName || p.oldBaseName + "." + p.oldExtension, false));
        }
      }
      bounds[col.key] = { min: headerW, max: maxW };
    }
    setColBounds(bounds);
  }, [files, previews]);

  const handleMouseDown = useCallback(
    (key: string, e: React.MouseEvent) => {
      e.preventDefault();
      const bounds = colBounds[key] || { min: 100, max: 400 };
      const currentW = colWidths[key];
      if (currentW) {
        dragRef.current = {
          key,
          startX: e.clientX,
          startW: currentW,
          minW: bounds.min,
          maxW: bounds.max,
        };
      } else {
        const th = document.querySelector(`th[data-col="${key}"]`) as HTMLElement;
        const actualW = th ? th.offsetWidth : bounds.min;
        dragRef.current = {
          key,
          startX: e.clientX,
          startW: actualW,
          minW: bounds.min,
          maxW: bounds.max,
        };
      }
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [colBounds, colWidths]
  );

  useEffect(() => {
    let animFrameId: number | null = null;
    let pendingW: number | null = null;
    let pendingKey: string = "";

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const { key, startX, startW, minW, maxW } = dragRef.current;
      const diff = e.clientX - startX;
      const newW = Math.max(minW, Math.min(maxW, startW + diff));
      pendingW = newW;
      pendingKey = key;
      if (animFrameId === null) {
        animFrameId = requestAnimationFrame(() => {
          if (pendingKey && pendingW !== null) {
            const w = pendingW;
            setColWidths((prev) => ({ ...prev, [pendingKey]: w }));
          }
          animFrameId = null;
          pendingW = null;
          pendingKey = "";
        });
      }
    };
    const handleMouseUp = () => {
      if (!dragRef.current) return;
      const { key, minW, maxW } = dragRef.current;
      if (animFrameId !== null) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
      }
      const finalW = pendingW ? Math.max(minW, Math.min(maxW, pendingW)) : minW;
      setColWidths((prev) => ({ ...prev, [key]: finalW }));
      dragRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      if (animFrameId !== null) cancelAnimationFrame(animFrameId);
    };
  }, []);

  const getColStyle = useCallback(
    (key: string) => {
      const w = colWidths[key];
      if (w) return { width: `${w}px`, maxWidth: `${w}px` };
      return undefined;
    },
    [colWidths]
  );

  return (
    <div className="file-list-container">
      <table className="file-table">
        <thead>
          <tr>
            {COLUMNS.map((col) => (
              <th key={col.key} data-col={col.key} style={getColStyle(col.key)}>
                {col.label}
                {col.label && (
                  <span
                    className="col-resize-handle"
                    onMouseDown={(e) => handleMouseDown(col.key, e)}
                  />
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <FileListRow
              key={file.id}
              file={file}
              colWidths={colWidths}
              previewResult={previews.get(file.id)}
              onRemove={onRemoveFile}
              executionResult={executionResults?.[file.id]}
              executionError={executionErrors?.[file.id]}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
