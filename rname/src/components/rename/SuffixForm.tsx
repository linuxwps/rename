import type { SuffixConfig } from "../../types/rename";

interface SuffixFormProps {
  config: SuffixConfig;
  onChange: (patch: Partial<SuffixConfig>) => void;
}

export function SuffixForm({ config, onChange }: SuffixFormProps) {
  return (
    <div className="rename-form">
      <div className="form-group">
        <label>后缀文本</label>
        <input
          type="text"
          value={config.text}
          placeholder="输入后缀文字"
          onChange={(e) => onChange({ text: e.target.value })}
        />
      </div>
    </div>
  );
}
