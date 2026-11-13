import { useEffect, useRef, useState } from "react";
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
type DragSession = Dragged & {
  pointerId: number;
  targetIndex: number;
};

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
  const dragRef = useRef<DragSession | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const session = dragRef.current;
      if (!session || event.pointerId !== session.pointerId) return;

      event.preventDefault();
      const items = Array.from(
        listRef.current?.querySelectorAll<HTMLElement>(".rule-chain-item") ?? []
      );
      if (items.length === 0) return;

      let targetIndex = items.length - 1;
      for (let index = 0; index < items.length; index += 1) {
        const bounds = items[index].getBoundingClientRect();
        if (event.clientY < bounds.top + bounds.height / 2) {
          targetIndex = index;
          break;
        }
      }

      session.targetIndex = targetIndex;
      setDropIndex(targetIndex);
    };

    const finishDrag = (event: PointerEvent) => {
      const session = dragRef.current;
      if (!session || event.pointerId !== session.pointerId) return;

      dragRef.current = null;
      setDragging(null);
      setDropIndex(null);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";

      if (session.targetIndex !== session.index) {
        onMoveRuleTo(session.index, session.targetIndex);
      }
    };

    const cancelDrag = (event: PointerEvent) => {
      const session = dragRef.current;
      if (!session || event.pointerId !== session.pointerId) return;
      dragRef.current = null;
      setDragging(null);
      setDropIndex(null);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("pointermove", handlePointerMove, {
      passive: false,
    });
    window.addEventListener("pointerup", finishDrag);
    window.addEventListener("pointercancel", cancelDrag);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", finishDrag);
      window.removeEventListener("pointercancel", cancelDrag);
    };
  }, [onMoveRuleTo]);

  const beginDrag = (
    event: React.PointerEvent<HTMLElement>,
    rule: RenameRule,
    index: number
  ) => {
    if (event.button !== 0 || rules.length < 2) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      id: rule.id,
      index,
      pointerId: event.pointerId,
      targetIndex: index,
    };
    setDragging({ id: rule.id, index });
    setDropIndex(index);
    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";
  };

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
          ref={listRef}
          className={
            "rule-chain-manager__list" +
            (dragging ? " rule-chain-manager__list--dragging" : "")
          }
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
                  (dragging?.id === rule.id ? " rule-chain-item--dragging" : "") +
                  (dropIndex === index && dragging ? " rule-chain-item--drop-target" : "")
                }
              >
                <span
                  className="rule-chain-item__drag"
                  title={rules.length > 1 ? "拖拽调整规则顺序" : undefined}
                  onPointerDown={(event) => beginDrag(event, rule, index)}
                >
                  <DotsSixVertical
                    className="button-icon"
                    size={15}
                    weight="bold"
                    aria-hidden="true"
                  />
                </span>
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
