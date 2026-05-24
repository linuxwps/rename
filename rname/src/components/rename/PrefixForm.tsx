import type { PrefixConfig } from "../../types/rename";

interface PrefixFormProps {
  config: PrefixConfig;
  onChange: (patch: Partial<PrefixConfig>) => void;
}

export function PrefixForm({ config, onChange }: PrefixFormProps) {
  return (
    <div className="rename-form">
      <div className="form-group">
        <label>前缀文本</label>
        <input
          type="text"
          value={config.text}
          placeholder="输入前缀文字"
          onChange={(e) => onChange({ text: e.target.value })}
        />
      </div>
    </div>
  );
}
