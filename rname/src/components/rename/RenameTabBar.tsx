import type { RenameRule, TabKey } from "../../types/rename";
import {
  MAX_RENAME_RULES,
  RULE_META,
  RULE_TYPES,
} from "../../utils/ruleChain";
import { RuleIcon } from "./RuleIcon";
import "./RenameTabBar.css";

interface RenameTabBarProps {
  rules: RenameRule[];
  onAddRule: (type: TabKey) => void;
}

export function RenameTabBar({
  rules,
  onAddRule,
}: RenameTabBarProps) {
  const limitReached = rules.length >= MAX_RENAME_RULES;
  const counts = rules.reduce<Partial<Record<TabKey, number>>>(
    (result, rule) => {
      result[rule.type] = (result[rule.type] ?? 0) + 1;
      return result;
    },
    {}
  );

  return (
    <div className="rename-tab-bar">
      <span className="rename-tab-bar__label">添加规则</span>
      {RULE_TYPES.map((type) => {
        const meta = RULE_META[type];
        const count = counts[type] ?? 0;
        const disabled = limitReached;

        return (
          <button
            key={type}
            className={
              "rename-tab" +
              (count > 0 ? " tab-active" : "") +
              (disabled ? " tab-disabled" : "")
            }
            disabled={disabled}
            onClick={() => onAddRule(type)}
            title={limitReached ? `最多只能添加 ${MAX_RENAME_RULES} 条规则` : `添加${meta.label}规则`}
          >
            <RuleIcon type={type} size={15} />
            <span>{meta.label}</span>
            {count > 0 && <span className="rename-tab__count">{count}</span>}
          </button>
        );
      })}
      <span className="rename-tab-bar__limit">
        {rules.length}/{MAX_RENAME_RULES}
      </span>
    </div>
  );
}
