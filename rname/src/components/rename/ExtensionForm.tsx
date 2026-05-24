import type { ExtensionConfig } from "../../types/rename";

interface ExtensionFormProps {
  config: ExtensionConfig;
  onChange: (patch: Partial<ExtensionConfig>) => void;
}

export function ExtensionForm({ config, onChange }: ExtensionFormProps) {
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const stripped = e.target.value.replace(/^\./, "");
    if (stripped !== e.target.value) {
      onChange({ newExtension: stripped });
    }
  };

  return (
    <div className="rename-form">
      <div className="form-group">
        <label>操作</label>
        <select
          value={config.mode}
          onChange={(e) =>
            onChange({ mode: e.target.value as "change" | "remove" | "add" })
          }
        >
          <option value="change">修改</option>
          <option value="remove">移除</option>
          <option value="add">添加</option>
        </select>
      </div>
      {(config.mode === "change" || config.mode === "add") && (
        <div className="form-group">
          <label>新扩展名</label>
          <input
            type="text"
            value={config.newExtension}
            placeholder="输入扩展名(不含.)"
            onChange={(e) => onChange({ newExtension: e.target.value })}
            onBlur={handleBlur}
          />
        </div>
      )}
    </div>
  );
}
