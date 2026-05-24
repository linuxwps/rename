import type { ReplaceConfig } from "../../types/rename";
import "./rename-forms.css";

interface ReplaceFormProps {
  config: ReplaceConfig;
  onChange: (patch: Partial<ReplaceConfig>) => void;
}

export function ReplaceForm({ config, onChange }: ReplaceFormProps) {
  return (
    <div className="rename-form">
      <div className="form-row">
        <div className="form-group">
          <label>查找文本</label>
          <input
            type="text"
            value={config.findText}
            placeholder="输入要替换的文字"
            onChange={(e) => onChange({ findText: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>替换为</label>
          <input
            type="text"
            value={config.replaceText}
            placeholder="输入替换后的文字"
            onChange={(e) => onChange({ replaceText: e.target.value })}
          />
        </div>
        <div className="form-group form-group--checkbox">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={config.caseSensitive}
              onChange={(e) => onChange({ caseSensitive: e.target.checked })}
            />
            区分大小写
          </label>
        </div>
      </div>
    </div>
  );
}
