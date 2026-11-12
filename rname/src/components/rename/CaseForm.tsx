import type { CaseConfig } from "../../types/rename";
import "./rename-forms.css";

interface CaseFormProps {
  config: CaseConfig;
  onChange: (patch: Partial<CaseConfig>) => void;
}

export function CaseForm({ config, onChange }: CaseFormProps) {
  return (
    <div className="rename-form">
      <div className="form-row">
        <div className="form-group">
          <label>转换方式</label>
          <select
            value={config.mode}
            onChange={(event) =>
              onChange({ mode: event.target.value as CaseConfig["mode"] })
            }
          >
            <option value="uppercase">全部大写</option>
            <option value="lowercase">全部小写</option>
            <option value="title">单词首字母大写</option>
          </select>
        </div>
      </div>
      <p className="form-help">只转换主文件名，扩展名保持不变。</p>
    </div>
  );
}
