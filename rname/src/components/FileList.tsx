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

function measureText(text: string, bold: boolean = true): number {
  const el = document.createElement("span");
  el.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;font-size:13px;font-weight:${bold ? 600 : 400};padding:0 8px`;
  el.textContent = text || "-";
  document.body.appendChild(el);
  const w = el.offsetWidth;
  document.body.removeChild(el);
  return w;
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
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const { key, startX, startW, minW, maxW } = dragRef.current;
      const diff = e.clientX - startX;
      const newW = Math.max(minW, Math.min(maxW, startW + diff));
      document.querySelectorAll(`[data-col="${key}"]`).forEach((el) => {
        (el as HTMLElement).style.width = `${newW}px`;
        (el as HTMLElement).style.maxWidth = `${newW}px`;
      });
    };
    const handleMouseUp = () => {
      if (!dragRef.current) return;
      const { key, minW, maxW } = dragRef.current;
      const th = document.querySelector(`th[data-col="${key}"]`) as HTMLElement;
      if (th) {
        const finalW = Math.max(minW, Math.min(maxW, th.offsetWidth));
        setColWidths((prev) => ({ ...prev, [key]: finalW }));
        document.querySelectorAll(`[data-col="${key}"]`).forEach((el) => {
          (el as HTMLElement).style.width = `${finalW}px`;
          (el as HTMLElement).style.maxWidth = `${finalW}px`;
        });
      }
      dragRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
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
