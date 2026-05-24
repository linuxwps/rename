import type { SequentialConfig } from "../../types/rename";
import "./rename-forms.css";

interface SequentialFormProps {
  config: SequentialConfig;
  onChange: (patch: Partial<SequentialConfig>) => void;
}

export function SequentialForm({ config, onChange }: SequentialFormProps) {
  return (
    <div className="rename-form">
      <div className="form-row">
        <div className="form-group">
          <label>起始值</label>
          <input
            type="number"
            min={1}
            max={9999}
            value={config.startAt}
            onChange={(e) => onChange({ startAt: Number(e.target.value) })}
          />
        </div>
        <div className="form-group">
          <label>位数</label>
          <input
            type="number"
            min={1}
            max={6}
            value={config.digits}
            onChange={(e) => onChange({ digits: Number(e.target.value) })}
          />
        </div>
        <div className="form-group">
          <label>位置</label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                name="sequential-position"
                checked={config.position === "before"}
                onChange={() => onChange({ position: "before" })}
              />
              名前
            </label>
            <label>
              <input
                type="radio"
                name="sequential-position"
                checked={config.position === "after"}
                onChange={() => onChange({ position: "after" })}
              />
              名后
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
