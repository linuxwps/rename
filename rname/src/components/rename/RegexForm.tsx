import { useState } from "react";
import type { RegexConfig } from "../../types/rename";
import "./rename-forms.css";

interface RegexFormProps {
  config: RegexConfig;
  onChange: (patch: Partial<RegexConfig>) => void;
}

export function RegexForm({ config, onChange }: RegexFormProps) {
  const [error, setError] = useState<string | null>(null);

  const handlePatternChange = (value: string) => {
    onChange({ pattern: value });
    if (value) {
      try {
        new RegExp(value);
        setError(null);
      } catch {
        setError("正则表达式无效");
      }
    } else {
      setError(null);
    }
  };

  return (
    <div className="rename-form">
      <div className="form-row">
        <div className="form-group">
          <label>查找</label>
          <input
            type="text"
            value={config.pattern}
            placeholder="请输入正则表达式"
            onChange={(e) => handlePatternChange(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>替换为</label>
          <input
            type="text"
            value={config.replacement}
            placeholder="$1, $2 等捕获组"
            onChange={(e) => onChange({ replacement: e.target.value })}
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
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
