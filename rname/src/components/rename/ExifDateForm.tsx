import type { ExifDateConfig } from "../../types/rename";
import "./rename-forms.css";

interface ExifDateFormProps {
  config: ExifDateConfig;
  onChange: (patch: Partial<ExifDateConfig>) => void;
}

export function ExifDateForm({ config, onChange }: ExifDateFormProps) {
  return (
    <div className="rename-form">
      <div className="form-row">
        <div className="form-group">
          <label>时间来源</label>
          <select value={config.source} onChange={(event) => onChange({ source: event.target.value as ExifDateConfig["source"] })}>
            <option value="taken">拍摄时间（EXIF）</option>
            <option value="created">文件创建时间</option>
            <option value="modified">文件修改时间</option>
          </select>
        </div>
        <div className="form-group">
          <label>缺失时</label>
          <select value={config.fallback} onChange={(event) => onChange({ fallback: event.target.value as ExifDateConfig["fallback"] })}>
            <option value="next">依次回退到后续时间</option>
            <option value="error">标记错误，阻止执行</option>
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>日期格式</label>
          <select value={config.format} onChange={(event) => onChange({ format: event.target.value as ExifDateConfig["format"] })}>
            <option value="YYYYMMDD">20251112</option>
            <option value="YYYY-MM-DD">2025-11-12</option>
            <option value="YYYYMMDD_HHmmss">20251112_143025</option>
          </select>
        </div>
        <div className="form-group">
          <label>放置位置</label>
          <select value={config.position} onChange={(event) => onChange({ position: event.target.value as ExifDateConfig["position"] })}>
            <option value="before">名前</option>
            <option value="after">名后</option>
            <option value="replace">替换原名</option>
          </select>
        </div>
        {config.position !== "replace" && (
          <div className="form-group">
            <label>分隔符</label>
            <input type="text" value={config.separator} maxLength={16} onChange={(event) => onChange({ separator: event.target.value })} />
          </div>
        )}
      </div>
      <p className="form-help">拍摄时间缺失时可回退到创建时间、修改时间；只改主文件名，扩展名保持不变。</p>
    </div>
  );
}
