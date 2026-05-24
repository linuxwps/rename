import type { FileItem } from "../types/file";
import type { PreviewResult } from "../types/rename";
import { FileListRow } from "./FileListRow";
import "./FileList.css";

interface FileListProps {
  files: FileItem[];
  previews: Map<string, PreviewResult>;
  onRemoveFile: (fileId: string) => void;
  onClearFiles: () => void;
}

export function FileList({ files, previews, onRemoveFile, onClearFiles }: FileListProps) {
  return (
    <div className="file-list-container">
      <table className="file-table">
        <thead>
          <tr>
            <th>文件名</th>
            <th className="new-name-column">新文件名</th>
            <th>扩展名</th>
            <th>大小</th>
            <th>修改日期</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <FileListRow
              key={file.id}
              file={file}
              previewResult={previews.get(file.id)}
              onRemove={onRemoveFile}
            />
          ))}
        </tbody>
      </table>
      {files.length > 0 && (
        <button className="clear-button" onClick={onClearFiles}>
          清空列表
        </button>
      )}
    </div>
  );
}
