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
  select: 34,
  fileName: 150,
  newName: 180,
  extension: 80,
  size: 76,
  date: 112,
  actions: 56,
};
const MAX_COLUMN_WIDTH = 640;
const RESIZABLE_COLUMN_KEYS = COLUMNS.filter(
  (column) => column.label && column.key !== "actions"
).map((column) => column.key);
const FIXED_COLUMN_WIDTH =
  MIN_COLUMN_WIDTHS.select + MIN_COLUMN_WIDTHS.actions;

function rebalanceRightColumns(
  baseWidths: Record<string, number>,
  key: string,
  requestedWidth: number
) {
  const next = { ...baseWidths };
  const delta = requestedWidth - baseWidths[key];
  next[key] = requestedWidth;

  const resizedIndex = RESIZABLE_COLUMN_KEYS.indexOf(key);
  const rightKeys = RESIZABLE_COLUMN_KEYS.slice(resizedIndex + 1);

  if (delta > 0) {
    let remaining = delta;
    for (const rightKey of rightKeys) {
      if (remaining === 0) break;
      const minimum = MIN_COLUMN_WIDTHS[rightKey];
      const available = Math.max(0, next[rightKey] - minimum);
      const absorbed = Math.min(available, remaining);
      next[rightKey] -= absorbed;
      remaining -= absorbed;
    }
  } else if (delta < 0) {
    let remaining = -delta;
    for (const rightKey of rightKeys) {
      if (remaining === 0) break;
      const available = Math.max(
        0,
        MAX_COLUMN_WIDTH - next[rightKey]
      );
      const absorbed = Math.min(available, remaining);
      next[rightKey] += absorbed;
      remaining -= absorbed;
    }
  }

  return next;
}

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
  const [viewportWidth, setViewportWidth] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    key: string;
    startX: number;
    startW: number;
    minW: number;
    maxW: number;
    baseWidths: Record<string, number>;
    latestWidths: Record<string, number>;
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
      setViewportWidth(element.clientWidth);
    });
    observer.observe(element);
    setViewportHeight(element.clientHeight);
    setViewportWidth(element.clientWidth);
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
      const base: Record<string, number> = {};
      for (const key of RESIZABLE_COLUMN_KEYS) {
        const header = document.querySelector(
          `th[data-col="${key}"]`
        ) as HTMLElement | null;
        base[key] = header
          ? Math.round(header.getBoundingClientRect().width)
          : (colWidths[key] ?? MIN_COLUMN_WIDTHS[key]);
      }
      const bounds = colBounds[key] || { min: 100, max: MAX_COLUMN_WIDTH };
      const startW = base[key] ?? bounds.min;
      setColWidths(base);
      dragRef.current = {
        key,
        startX: e.clientX,
        startW,
        minW: bounds.min,
        maxW: bounds.max,
        baseWidths: base,
        latestWidths: base,
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
      const nextWidths = rebalanceRightColumns(
        dragRef.current.baseWidths,
        key,
        newW
      );
      dragRef.current.latestWidths = nextWidths;
      setColWidths(nextWidths);
    };
    const finishResize = () => {
      if (!dragRef.current) return;
      setColWidths(dragRef.current.latestWidths);
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
      const minimum = MIN_COLUMN_WIDTHS[key];
      if (w) {
        return {
          width: `${w}px`,
          minWidth: `${minimum}px`,
          maxWidth: `${w}px`,
        };
      }
      if (minimum) return { minWidth: `${minimum}px` };
      return undefined;
    },
    [colWidths]
  );

  const tableWidth = useMemo(() => {
    if (Object.keys(colWidths).length === 0) return undefined;
    const columnTotal =
      FIXED_COLUMN_WIDTH +
      RESIZABLE_COLUMN_KEYS.reduce(
        (total, key) => total + (colWidths[key] ?? MIN_COLUMN_WIDTHS[key]),
        0
      );
    return Math.max(viewportWidth, columnTotal);
  }, [colWidths, viewportWidth]);

  return (
    <div className="file-list-container">
      <div
        className="file-list-scroll"
        ref={scrollRef}
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
      >
      <table
        className="file-table"
        style={tableWidth ? { width: `${tableWidth}px` } : undefined}
      >
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
