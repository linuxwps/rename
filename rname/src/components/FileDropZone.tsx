import { FileList } from "./FileList";
import type { FileItem } from "../types/file";
import type { PreviewResult, ExecutionResult } from "../types/rename";
import "./FileDropZone.css";

interface FileDropZoneProps {
  files: FileItem[];
  isDragging: boolean;
  previews: Map<string, PreviewResult>;
  onRemoveFile: (fileId: string) => void;
  onOpenFilePicker: () => void;
  onOpenFolderPicker: () => void;
  executionResults?: Record<string, ExecutionResult>;
  executionErrors?: Record<string, string>;
}

export function FileDropZone({
  files,
  isDragging,
  previews,
  onRemoveFile,
  onOpenFilePicker,
  onOpenFolderPicker,
  executionResults,
  executionErrors,
}: FileDropZoneProps) {
  return (
    <div className={`file-drop-zone ${isDragging ? "dragging" : ""}`}>
      {files.length === 0 ? (
        <div className="drop-zone-empty">
          <p className={`drop-hint ${isDragging ? "active" : ""}`}>
            {isDragging ? "松开鼠标添加文件" : "拖入文件到这里"}
          </p>
          <p className="drop-or">或</p>
          <div className="drop-buttons">
            <button className="picker-button" onClick={onOpenFilePicker}>
              选择文件
            </button>
            <button className="picker-button" onClick={onOpenFolderPicker}>
              选择文件夹
            </button>
          </div>
        </div>
      ) : (
        <FileList
          files={files}
          previews={previews}
          onRemoveFile={onRemoveFile}
          executionResults={executionResults}
          executionErrors={executionErrors}
        />
      )}
    </div>
  );
}
