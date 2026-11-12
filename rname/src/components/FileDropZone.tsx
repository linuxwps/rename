import { useEffect, useRef, useState } from "react";
import { FileList } from "./FileList";
import {
  CaretDown,
  FileCsv,
  FilePlus,
  FolderOpen,
  Plus,
} from "@phosphor-icons/react";
import type { FileItem } from "../types/file";
import type {
  PreviewResult,
  ExecutionResult,
  FileSortMode,
} from "../types/rename";
import "./FileDropZone.css";

interface FileDropZoneProps {
  files: FileItem[];
  isDragging: boolean;
  previews: Map<string, PreviewResult>;
  onRemoveFile: (fileId: string) => void;
  onOpenFilePicker: () => void;
  onOpenFolderPicker: () => void;
  onImportCsv: () => void;
  onShowLogs: () => void;
  executionResults?: Record<string, ExecutionResult>;
  executionErrors?: Record<string, string>;
  sortMode: FileSortMode;
  onSortModeChange: (mode: FileSortMode) => void;
  selectedIds: Set<string>;
  onToggleSelected: (fileId: string) => void;
  onToggleAll: () => void;
  onReorder?: (fromId: string, toId: string) => void;
}

export function FileDropZone({
  files,
  isDragging,
  previews,
  onRemoveFile,
  onOpenFilePicker,
  onOpenFolderPicker,
  onImportCsv,
  onShowLogs,
  executionResults,
  executionErrors,
  sortMode,
  onSortModeChange,
  selectedIds,
  onToggleSelected,
  onToggleAll,
  onReorder,
}: FileDropZoneProps) {
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!addMenuOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!addMenuRef.current?.contains(event.target as Node)) setAddMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAddMenuOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [addMenuOpen]);

  return (
    <div className={`file-drop-zone ${isDragging ? "dragging" : ""}`}>
      <div className="file-workspace-header">
        <div>
          <h1>文件与预览</h1>
          <p>先确认目标文件名，再执行批量重命名。</p>
        </div>
        <div className="file-workspace-actions">
          <button className="workspace-button" onClick={onImportCsv}>
            <FileCsv className="button-icon" size={15} aria-hidden="true" />
            导入 CSV
          </button>
          <button className="workspace-button" onClick={onOpenFolderPicker}>
            <FolderOpen className="button-icon" size={15} aria-hidden="true" />
            添加文件夹
          </button>
          <button className="workspace-button workspace-button--primary" onClick={onOpenFilePicker}>
            <FilePlus className="button-icon" size={15} weight="bold" aria-hidden="true" />
            添加文件
          </button>
        </div>
      </div>
      {files.length === 0 ? (
        <div className="drop-zone-empty">
          <div className="drop-zone-add" ref={addMenuRef}>
            <button
              type="button"
              className="drop-zone-mark"
              aria-label="添加文件或文件夹"
              aria-expanded={addMenuOpen}
              aria-haspopup="menu"
              onClick={() => setAddMenuOpen((open) => !open)}
            >
              <Plus size={23} weight="light" aria-hidden="true" />
            </button>
            {addMenuOpen && (
              <div className="drop-zone-add-menu" role="menu" aria-label="选择添加内容">
                <button type="button" role="menuitem" onClick={() => { setAddMenuOpen(false); onOpenFilePicker(); }}>
                  <FilePlus size={16} aria-hidden="true" />添加文件
                </button>
                <button type="button" role="menuitem" onClick={() => { setAddMenuOpen(false); onOpenFolderPicker(); }}>
                  <FolderOpen size={16} aria-hidden="true" />添加文件夹
                </button>
              </div>
            )}
          </div>
          <p className={`drop-hint ${isDragging ? "active" : ""}`}>
            {isDragging ? "松开以添加文件" : "从文件开始"}
          </p>
          <p className="drop-or">将文件或文件夹拖到这里，也可以从上方添加。</p>
          <div className="drop-buttons">
            <button className="picker-button picker-button--secondary" onClick={onImportCsv}>
              <FileCsv className="button-icon" size={15} aria-hidden="true" />
              从 CSV 导入路径
            </button>
            <button className="picker-button picker-button--secondary" onClick={onShowLogs}>
              操作日志
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="file-list-toolbar">
            <span className="file-list-toolbar__count"><strong>{files.length}</strong> 个文件 <span>·</span> 已选择 {selectedIds.size}</span>
            <label>
              排序
              <span className="file-sort-select">
                <select
                  value={sortMode}
                  onChange={(event) =>
                    onSortModeChange(event.target.value as FileSortMode)
                  }
                >
                  <option value="added">添加顺序</option>
                  <option value="manual">手动排序</option>
                  <option value="ascending">名称升序</option>
                  <option value="descending">名称降序</option>
                </select>
                <CaretDown className="file-sort-select__icon" size={10} weight="bold" aria-hidden="true" />
              </span>
            </label>
          </div>
          <FileList
            files={files}
            previews={previews}
            onRemoveFile={onRemoveFile}
            executionResults={executionResults}
            executionErrors={executionErrors}
            selectedIds={selectedIds}
            onToggleSelected={onToggleSelected}
            onToggleAll={onToggleAll}
            manualSort={sortMode === "manual"}
            onReorder={onReorder}
          />
        </>
      )}
    </div>
  );
}
