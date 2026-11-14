import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import type { FileItem } from "../types/file";
import type { PreviewResult, ExecutionResult } from "../types/rename";
import { FileListRow } from "./FileListRow";
import { computeVisibleRange } from "../utils/listWindow";
import { formatFileSize } from "../utils/formatFileSize";
import { formatDate } from "../utils/formatDate";
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
  size: 88,
  date: 112,
  actions: 56,
};
const SIZE_COLUMN_EXTRA_WIDTH = 12;
const RESIZABLE_COLUMN_KEYS = COLUMNS.filter(
  (column) => column.label && column.key !== "actions"
).map((column) => column.key);
const FIXED_COLUMN_WIDTH =
  MIN_COLUMN_WIDTHS.select + MIN_COLUMN_WIDTHS.actions;

function rebalanceRightColumns(
  baseWidths: Record<string, number>,
  key: string,
  requestedWidth: number,
  minimums: Record<string, number>
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
      const minimum = minimums[rightKey];
      const available = Math.max(0, next[rightKey] - minimum);
      const absorbed = Math.min(available, remaining);
      next[rightKey] -= absorbed;
      remaining -= absorbed;
    }
  } else if (delta < 0) {
    let remaining = -delta;
    for (const rightKey of rightKeys) {
      if (remaining === 0) break;
      next[rightKey] += remaining;
      remaining = 0;
    }
  }

  return next;
}

function measureColumnWidths(
  files: FileItem[],
  previews: Map<string, PreviewResult>,
  manualSort: boolean,
  table: HTMLTableElement | null
): Record<string, number> {
  const widths = { ...MIN_COLUMN_WIDTHS };
  if (!table) return widths;

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return widths;

  const row = table.querySelector<HTMLElement>(".file-row");
  const cell = row?.querySelector<HTMLElement>(".file-name");
  const cellStyle = getComputedStyle(cell ?? table);
  const previewStyle = getComputedStyle(
    row?.querySelector<HTMLElement>(".new-name-column") ?? table
  );
  const stepButton = row?.querySelector<HTMLElement>(".rule-steps-toggle");
  const stepStyle = getComputedStyle(stepButton ?? table);
  const diffAdded = row?.querySelector<HTMLElement>(".diff-added");
  const diffRemoved = row?.querySelector<HTMLElement>(".diff-removed");
  const diffAddedStyle = diffAdded ? getComputedStyle(diffAdded) : null;
  const diffRemovedStyle = diffRemoved ? getComputedStyle(diffRemoved) : null;
  const padding = (style: CSSStyleDeclaration) =>
    parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
  const textWidth = (text: string, font: string) => {
    context.font = font;
    return context.measureText(text).width;
  };
  const rowFont = cellStyle.font;
  const previewFont = previewStyle.font;
  const stepFont = stepStyle.font;

  for (const file of files) {
    widths.fileName = Math.max(
      widths.fileName,
      Math.ceil(textWidth(file.name, rowFont) + padding(cellStyle) + (manualSort ? 19 : 0) + 2)
    );
    widths.extension = Math.max(
      widths.extension,
      Math.ceil(textWidth(file.extension || "-", previewFont) + padding(previewStyle) + 2)
    );
    widths.size = Math.max(
      widths.size,
      Math.ceil(
        textWidth(formatFileSize(file.size), previewFont) +
        padding(previewStyle) +
        SIZE_COLUMN_EXTRA_WIDTH
      )
    );
    widths.date = Math.max(
      widths.date,
      Math.ceil(textWidth(formatDate(file.modifiedAt), previewFont) + padding(previewStyle) + 2)
    );

    const preview = previews.get(file.id);
    if (!preview) continue;
    const segments = [...preview.diffBaseName, ...preview.diffExtension];
    const previewTextWidth = segments.reduce((total, segment) => {
      const highlight = segment.type === "added" ? diffAddedStyle
        : segment.type === "removed" ? diffRemovedStyle : null;
      return total + textWidth(segment.value, previewFont) + (highlight ? padding(highlight) : segment.type === "unchanged" ? 0 : 4);
    }, 0);
    const changedSteps = preview.ruleSteps.filter((step) => step.changed).length;
    const stepWidth = preview.ruleSteps.length > 0
      ? textWidth(`${changedSteps} 处变化 · ${preview.ruleSteps.length} 步`, stepFont) + padding(stepStyle) + 8
      : 0;
    const conflictWidth = preview.hasConflict ? 26 : 0;
    widths.newName = Math.max(
      widths.newName,
      Math.ceil(previewTextWidth + stepWidth + (stepWidth ? 8 : 0) + conflictWidth + padding(previewStyle) + 2)
    );
  }

  return widths;
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
  const [userWidths, setUserWidths] = useState<Record<string, number>>({});
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(400);
  const [viewportWidth, setViewportWidth] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const dragRef = useRef<{
    key: string;
    startX: number;
    startW: number;
    baseWidths: Record<string, number>;
    latestWidths: Record<string, number>;
  } | null>(null);
  const [contentWidths, setContentWidths] = useState<Record<string, number>>(MIN_COLUMN_WIDTHS);
  const colWidths = useMemo(() => {
    const next = { ...contentWidths };
    for (const key of RESIZABLE_COLUMN_KEYS) {
      next[key] = Math.max(contentWidths[key], userWidths[key] ?? 0);
    }
    return next;
  }, [contentWidths, userWidths]);

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
    const measure = () => setContentWidths(
      measureColumnWidths(files, previews, manualSort, tableRef.current)
    );
    measure();
    document.fonts?.ready.then(measure);
  }, [files, previews, manualSort]);

  const handleResizeStart = useCallback(
    (key: string, e: React.PointerEvent<HTMLSpanElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const base = { ...colWidths };
      const startW = base[key];
      setUserWidths(base);
      dragRef.current = {
        key,
        startX: e.clientX,
        startW,
        baseWidths: base,
        latestWidths: base,
      };
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [colWidths]
  );

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!dragRef.current) return;
      const { key, startX, startW } = dragRef.current;
      const diff = e.clientX - startX;
      const newW = Math.max(contentWidths[key], startW + diff);
      const nextWidths = rebalanceRightColumns(
        dragRef.current.baseWidths,
        key,
        newW,
        contentWidths
      );
      dragRef.current.latestWidths = nextWidths;
      setUserWidths(nextWidths);
    };
    const finishResize = () => {
      if (!dragRef.current) return;
      setUserWidths(dragRef.current.latestWidths);
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
  }, [contentWidths]);

  const getColStyle = useCallback(
    (key: string) => {
      const w = colWidths[key];
      return { width: `${w}px`, minWidth: `${w}px`, maxWidth: `${w}px` };
    },
    [colWidths]
  );

  const tableWidth = useMemo(() => {
    const columnTotal =
      FIXED_COLUMN_WIDTH +
      RESIZABLE_COLUMN_KEYS.reduce(
        (total, key) => total + colWidths[key],
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
        ref={tableRef}
        className="file-table"
        style={{ width: `${tableWidth}px` }}
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
