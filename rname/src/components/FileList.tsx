import { useFileList } from "../hooks/useFileList";
import { FileListRow } from "./FileListRow";
import "./FileList.css";

export function FileList() {
  const { files, removeFile, clearFiles } = useFileList();

  return (
    <div className="file-list-container">
      <table className="file-table">
        <thead>
          <tr>
            <th>文件名</th>
            <th>扩展名</th>
            <th>大小</th>
            <th>修改日期</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <FileListRow key={file.id} file={file} onRemove={removeFile} />
          ))}
        </tbody>
      </table>
      {files.length > 0 && (
        <button className="clear-button" onClick={clearFiles}>
          清空列表
        </button>
      )}
    </div>
  );
}