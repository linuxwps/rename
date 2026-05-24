import type { FileItem } from "../types/file";
import type { PreviewResult } from "../types/rename";
import { DiffCell } from "./rename/DiffCell";
import { formatFileSize } from "../utils/formatFileSize";
import "./FileList.css";

interface FileListRowProps {
  file: FileItem;
  previewResult?: PreviewResult;
  onRemove: (fileId: string) => void;
}

export function FileListRow({ file, previewResult, onRemove }: FileListRowProps) {
  const formatDate = (timestamp: number): string => {
    if (!timestamp) return "-";
    const date = new Date(timestamp);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <tr className={"file-row" + (previewResult?.hasConflict ? " conflict-row" : "")}>
      <td className="file-name" title={file.path}>
        {file.name}
      </td>
      <td className="new-name-column">
        {previewResult ? (
          <DiffCell
            baseNameSegments={previewResult.diffBaseName}
            extensionSegments={previewResult.diffExtension}
            hasConflict={previewResult.hasConflict}
          />
        ) : (
          <span className="preview-placeholder">—</span>
        )}
      </td>
      <td className="file-extension">{file.extension || "-"}</td>
      <td className="file-size">{formatFileSize(file.size)}</td>
      <td className="file-date">{formatDate(file.modifiedAt)}</td>
      <td className="file-actions">
        <button
          className="remove-button"
          onClick={() => onRemove(file.id)}
          title="移除"
        >
          ✕
        </button>
      </td>
    </tr>
  );
}
