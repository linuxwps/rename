import { useFileList } from "../hooks/useFileList";
import { FileList } from "./FileList";
import "./FileDropZone.css";

export function FileDropZone() {
  const { files, isDragging, openFilePicker, openFolderPicker } = useFileList();

  return (
    <div className={`file-drop-zone ${isDragging ? "dragging" : ""}`}>
      {files.length === 0 ? (
        <div className="drop-zone-empty">
          <p className={`drop-hint ${isDragging ? "active" : ""}`}>
            {isDragging ? "松开鼠标添加文件" : "拖入文件到这里"}
          </p>
          <p className="drop-or">或</p>
          <div className="drop-buttons">
            <button className="picker-button" onClick={openFilePicker}>
              选择文件
            </button>
            <button className="picker-button" onClick={openFolderPicker}>
              选择文件夹
            </button>
          </div>
        </div>
      ) : (
        <FileList />
      )}
    </div>
  );
}