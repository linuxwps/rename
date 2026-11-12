import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import type { FileItem } from "../types/file";
import type { PreviewResult, ExecutionResult } from "../types/rename";
import { FileListRow } from "./FileListRow";
import { computeVisibleRange } from "../utils/listWindow";
import "./FileList.css";

const ROW_HEIGHT = 34;
const HEADER_HEIGHT = 34;
const OVERSCAN = 6;

const COLUMNS = [
  { key: "select", label: "" },
  { key: "fileName", label: "文件名" },
  { key: "newName", label: "新文件名" },
  { key: "extension", label: "扩展名" },
  { key: "size", label: "大小" },
  { key: "date", label: "修改日期" },
  { key: "actions", label: "删除" },
];

const MIN_COLUMN_WIDTHS: Record<string, number> = {
  fileName: 150,
  newName: 180,
  extension: 80,
  size: 76,
  date: 112,
};
const MAX_COLUMN_WIDTH = 640;

interface FileListProps {
  files: FileItem[];
  previews: Map<string, PreviewResult>;
  onRemoveFile: (fileId: string) => void;
  executionResults?: Record<string, ExecutionResult>;
  executionErrors?: Record<string, string>;
  selectedIds: Set<string>;
  onToggleSelected: (fileId: string) => void;
  onToggleAll: () => void;
  manualSort: boolean;
  onReorder?: (fromId: string, toId: string) => void;
}

export function FileList({ files, previews, onRemoveFile, executionResults, executionErrors, selectedIds, onToggleSelected, onToggleAll, manualSort, onReorder }: FileListProps) {
  const [expandedFileId, setExpandedFileId] = useState<string | null>(null);
  const [colWidths, setColWidths] = useState<Record<string, number>>({});
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(400);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    key: string;
    startX: number;
    startW: number;
    minW: number;
    maxW: number;
    latestW: number;
  } | null>(null);

  const [colBounds, setColBounds] = useState<Record<string, { min: number; max: number }>>({});

  const rowOffsets = useMemo(() => {
    const offsets = new Array<number>(files.length + 1);
    offsets[0] = 0;
    for (let index = 0; index < files.length; index += 1) {
      const preview = previews.get(files[index].id);
      const detailHeight =
        expandedFileId === files[index].id && preview
          ? 16 + preview.ruleSteps.length * 24
          : 0;
      offsets[index + 1] = offsets[index] + ROW_HEIGHT + detailHeight;
    }
    return offsets;
  }, [expandedFileId, files, previews]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const observer = new ResizeObserver(() => {
      setViewportHeight(element.clientHeight);
    });
    observer.observe(element);
    setViewportHeight(element.clientHeight);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (expandedFileId && !files.some((file) => file.id === expandedFileId)) {
      setExpandedFileId(null);
    }
  }, [expandedFileId, files]);

  const visibleRange = useMemo(() => {
    return computeVisibleRange(
      rowOffsets,
      scrollTop,
      viewportHeight,
      HEADER_HEIGHT,
      OVERSCAN
    );
  }, [files.length, rowOffsets, scrollTop, viewportHeight]);

  useEffect(() => {
    const bounds: Record<string, { min: number; max: number }> = {};
    for (const col of COLUMNS) {
      if (!col.label || col.key === "select" || col.key === "actions") continue;
      bounds[col.key] = {
        min: MIN_COLUMN_WIDTHS[col.key] ?? 80,
        max: MAX_COLUMN_WIDTH,
      };
    }
    setColBounds(bounds);
  }, []);

  const handleResizeStart = useCallback(
    (key: string, e: React.PointerEvent<HTMLSpanElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const base = { ...colWidths };
      for (const col of COLUMNS) {
        if (!col.label || col.key === "select" || col.key === "actions" || base[col.key]) continue;
        const header = document.querySelector(
          `th[data-col="${col.key}"]`
        ) as HTMLElement | null;
        if (header) base[col.key] = header.offsetWidth;
      }
      const bounds = colBounds[key] || { min: 100, max: MAX_COLUMN_WIDTH };
      const startW = base[key] ?? bounds.min;
      setColWidths(base);
      dragRef.current = {
        key,
        startX: e.clientX,
        startW,
        minW: Math.min(bounds.min, startW),
        maxW: bounds.max,
        latestW: startW,
      };
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [colBounds, colWidths]
  );

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!dragRef.current) return;
      const { key, startX, startW, minW, maxW } = dragRef.current;
      const diff = e.clientX - startX;
      const newW = Math.max(minW, Math.min(maxW, startW + diff));
      dragRef.current.latestW = newW;
      setColWidths((prev) => ({ ...prev, [key]: newW }));
    };
    const finishResize = () => {
      if (!dragRef.current) return;
      const { key, latestW } = dragRef.current;
      setColWidths((prev) => ({ ...prev, [key]: latestW }));
      dragRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", finishResize);
    window.addEventListener("pointercancel", finishResize);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", finishResize);
      window.removeEventListener("pointercancel", finishResize);
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
      <div
        className="file-list-scroll"
        ref={scrollRef}
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
      >
      <table className="file-table">
        <thead>
          <tr>
            {COLUMNS.map((col) => (
              <th key={col.key} data-col={col.key} style={getColStyle(col.key)}>
                {col.key === "select" ? (
                  <input
                    type="checkbox"
                    className="file-select-all"
                    checked={files.length > 0 && selectedIds.size === files.length}
                    onChange={onToggleAll}
                    aria-label="全选"
                    title="全选"
                  />
                ) : (
                  col.label
                )}
                {col.label && col.key !== "actions" && (
                  <span
                    className="col-resize-handle"
                    onPointerDown={(e) => handleResizeStart(col.key, e)}
                    role="separator"
                    aria-label={`调整${col.label}列宽`}
                    aria-orientation="vertical"
                    title={`拖动调整“${col.label}”列宽`}
                  />
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visibleRange.start > 0 && (
            <tr className="virtual-spacer" aria-hidden="true">
              <td colSpan={COLUMNS.length} style={{ height: `${rowOffsets[visibleRange.start]}px` }} />
            </tr>
          )}
          {files.slice(visibleRange.start, visibleRange.end).map((file) => (
            <FileListRow
              key={file.id}
              file={file}
              colWidths={colWidths}
              previewResult={previews.get(file.id)}
              onRemove={onRemoveFile}
              executionResult={executionResults?.[file.id]}
              executionError={executionErrors?.[file.id]}
              selected={selectedIds.has(file.id)}
              onToggleSelected={onToggleSelected}
              manualSort={manualSort}
              onReorder={onReorder}
              stepsExpanded={expandedFileId === file.id}
              onToggleSteps={(fileId) =>
                setExpandedFileId((current) => (current === fileId ? null : fileId))
              }
            />
          ))}
          {visibleRange.end < files.length && (
            <tr className="virtual-spacer" aria-hidden="true">
              <td
                colSpan={COLUMNS.length}
                style={{
                  height: `${rowOffsets[files.length] - rowOffsets[visibleRange.end]}px`,
                }}
              />
            </tr>
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
}
