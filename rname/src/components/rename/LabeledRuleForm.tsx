import type { ReactNode } from "react";
import { RULE_META } from "../../utils/ruleChain";
import { X } from "@phosphor-icons/react";
import type { TabKey } from "../../types/rename";
import { RuleIcon } from "./RuleIcon";
import "./LabeledRuleForm.css";

interface LabeledRuleFormProps {
  type: string;
  onRemove?: () => void;
  children: ReactNode;
}

export function LabeledRuleForm({
  type,
  onRemove,
  children,
}: LabeledRuleFormProps) {
  const meta = RULE_META[type as keyof typeof RULE_META];

  return (
    <div className="labeled-rule-form">
      <div className="labeled-rule-form__header">
        <span className="labeled-rule-form__title">
          {meta && <RuleIcon type={type as TabKey} size={16} />}
          {meta?.label ?? "规则"}配置
        </span>
        {onRemove && (
          <button
            className="labeled-rule-form__remove"
            onClick={onRemove}
            title="删除此规则"
          >
            <X className="button-icon" size={13} aria-hidden="true" />
            删除规则
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
