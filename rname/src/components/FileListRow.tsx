import type { FileItem } from "../types/file";
import { formatFileSize } from "../utils/formatFileSize";
import "./FileList.css";

interface FileListRowProps {
  file: FileItem;
  onRemove: (fileId: string) => void;
}

export function FileListRow({ file, onRemove }: FileListRowProps) {
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
    <tr className="file-row">
      <td className="file-name" title={file.path}>
        {file.name}
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