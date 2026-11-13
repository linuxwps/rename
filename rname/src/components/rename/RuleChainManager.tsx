import { useState } from "react";
import type { RenameRule } from "../../types/rename";
import {
  describeRule,
  MAX_RENAME_RULES,
  RULE_META,
} from "../../utils/ruleChain";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  DotsSixVertical,
  X,
} from "@phosphor-icons/react";
import { RuleIcon } from "./RuleIcon";
import "./RuleChainManager.css";

type Dragged = { id: string; index: number };

interface RuleChainManagerProps {
  rules: RenameRule[];
  selectedRuleId: string | null;
  onSelectRule: (id: string | null) => void;
  onToggleRule: (id: string) => void;
  onRemoveRule: (id: string) => void;
  onDuplicateRule: (id: string) => void;
  onClearRules: () => void;
  onMoveRule: (id: string, offset: number) => void;
  onMoveRuleTo: (fromIndex: number, toIndex: number) => void;
}

function enabledCount(rules: RenameRule[]): number {
  return rules.filter((rule) => rule.enabled).length;
}

export function RuleChainManager({
  rules,
  selectedRuleId,
  onSelectRule,
  onToggleRule,
  onRemoveRule,
  onDuplicateRule,
  onClearRules,
  onMoveRule,
  onMoveRuleTo,
}: RuleChainManagerProps) {
  const [dragging, setDragging] = useState<Dragged | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  return (
    <div className="rule-chain-manager">
      <div className="rule-chain-manager__header">
        <span className="rule-chain-manager__title">规则链</span>
        <span className="rule-chain-manager__summary">
          {rules.length} 条规则
          {enabledCount(rules) > 0 && (
            <>
              {" · "}
              {enabledCount(rules)} 条启用
            </>
          )}
        </span>
        <button
          className="rule-chain-manager__clear"
          onClick={() => {
            if (window.confirm(`确定清空全部 ${rules.length} 条规则吗？`)) {
              onClearRules();
            }
          }}
          disabled={rules.length === 0}
        >
          清空
        </button>
      </div>

      {rules.length === 0 ? (
        <div className="rule-chain-manager__empty">
          点击上方“添加规则”开始构建规则链
        </div>
      ) : (
        <ul
          className="rule-chain-manager__list"
          onDragOver={(event) => {
            event.preventDefault();
          }}
        >
          {rules.map((rule, index) => {
            const meta = RULE_META[rule.type];
            const selected = selectedRuleId === rule.id;
            const isFirst = index === 0;
            const isLast = index === rules.length - 1;

            return (
              <li
                key={rule.id}
                className={
                  "rule-chain-item" +
                  (selected ? " rule-chain-item--selected" : "") +
                  (!rule.enabled ? " rule-chain-item--disabled" : "") +
                  (dropIndex === index && dragging ? " rule-chain-item--drop-target" : "")
                }
                draggable
                onDragStart={(event) => {
                  setDragging({ id: rule.id, index });
                  setDropIndex(index);
                  event.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDropIndex(index);
                }}
                onDragLeave={() => {
                  setDropIndex((current) => (current === index ? null : current));
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  if (dragging && dragging.id !== rule.id) {
                    onMoveRuleTo(dragging.index, index);
                  }
                  setDragging(null);
                  setDropIndex(null);
                }}
                onDragEnd={() => {
                  setDragging(null);
                  setDropIndex(null);
                }}
              >
                <button
                  className="rule-chain-item__drag"
                  aria-label="拖拽排序"
                  disabled={rules.length < 2}
                >
                  <DotsSixVertical
                    className="button-icon"
                    size={15}
                    weight="bold"
                    aria-hidden="true"
                  />
                </button>
                <button
                  className="rule-chain-item__toggle"
                  onClick={() => onToggleRule(rule.id)}
                  title={rule.enabled ? "停用此规则" : "启用此规则"}
                >
                  <span
                    className={
                      "rule-chain-item__switch" +
                      (rule.enabled ? " is-on" : "")
                    }
                  />
                </button>
                <button
                  className="rule-chain-item__main"
                  onClick={() =>
                    onSelectRule(selected ? null : rule.id)
                  }
                >
                  <span className="rule-chain-item__index">
                    {index + 1}
                  </span>
                  <RuleIcon type={rule.type} size={16} />
                  <span className="rule-chain-item__meta">
                    <span className="rule-chain-item__name">
                      {meta.label}
                    </span>
                    <span className="rule-chain-item__desc">
                      {describeRule(rule)}
                    </span>
                  </span>
                </button>
                <div className="rule-chain-item__actions">
                  <button
                    className="rule-chain-item__btn"
                    onClick={() => onMoveRule(rule.id, -1)}
                    disabled={isFirst}
                    title="上移"
                  >
                    <ArrowUp className="button-icon" size={13} aria-hidden="true" />
                  </button>
                  <button
                    className="rule-chain-item__btn"
                    onClick={() => onMoveRule(rule.id, 1)}
                    disabled={isLast}
                    title="下移"
                  >
                    <ArrowDown className="button-icon" size={13} aria-hidden="true" />
                  </button>
                  <button
                    className="rule-chain-item__btn"
                    onClick={() => onDuplicateRule(rule.id)}
                    disabled={rules.length >= MAX_RENAME_RULES}
                    title="复制"
                  >
                    <Copy className="button-icon" size={13} aria-hidden="true" />
                  </button>
                  <button
                    className="rule-chain-item__btn rule-chain-item__remove"
                    onClick={() => {
                      if (selected && rule.id === selectedRuleId) {
                        onSelectRule(null);
                      }
                      onRemoveRule(rule.id);
                    }}
                    title="删除"
                  >
                    <X className="button-icon" size={14} aria-hidden="true" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
