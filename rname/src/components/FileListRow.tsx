import { memo } from "react";
import { diffWords } from "diff";
import {
  Check,
  DotsSixVertical,
  X,
  XCircle,
} from "@phosphor-icons/react";
import type { FileItem } from "../types/file";
import type {
  ExecutionResult,
  PreviewResult,
  RulePreviewStep,
} from "../types/rename";
import { DiffCell } from "./rename/DiffCell";
import { formatFileSize } from "../utils/formatFileSize";
import { formatDate } from "../utils/formatDate";
import { RULE_META } from "../utils/ruleChain";
import "./FileList.css";

interface FileListRowProps {
  file: FileItem;
  colWidths: Record<string, number>;
  previewResult?: PreviewResult;
  onRemove: (fileId: string) => void;
  executionResult?: ExecutionResult;
  executionError?: string;
  selected: boolean;
  onToggleSelected: (fileId: string) => void;
  manualSort: boolean;
  onReorder?: (fromId: string, toId: string) => void;
  stepsExpanded: boolean;
  onToggleSteps: (fileId: string) => void;
}

function colStyle(widths: Record<string, number>, key: string) {
  const w = widths[key];
  return w ? { width: `${w}px`, maxWidth: `${w}px` } : undefined;
}

function RuleStepDiff({ step }: { step: RulePreviewStep }) {
  const segments = diffWords(step.beforeFullName, step.afterFullName);

  return (
    <span title={`${step.beforeFullName} → ${step.afterFullName}`}>
      {segments.map((segment, index) => (
        <span
          key={index}
          className={
            segment.added
              ? "rule-step-diff__added"
              : segment.removed
                ? "rule-step-diff__removed"
                : undefined
          }
        >
          {segment.value}
        </span>
      ))}
    </span>
  );
}

export const FileListRow = memo(function FileListRow({ file, colWidths, previewResult, onRemove, executionResult, executionError, selected, onToggleSelected, manualSort, onReorder, stepsExpanded, onToggleSteps }: FileListRowProps) {
  const changedSteps =
    previewResult?.ruleSteps.filter((step) => step.changed).length ?? 0;

  return (
    <>
      <tr
        className={
          "file-row" +
          (previewResult?.hasConflict ? " conflict-row" : "") +
          (selected ? " file-row--selected" : "")
        }
        draggable={manualSort}
        onDragStart={(event) => {
          if (!manualSort) return;
          event.dataTransfer.setData("text/rname-file-id", file.id);
          event.dataTransfer.effectAllowed = "move";
        }}
        onDragOver={(event) => {
          if (manualSort) event.preventDefault();
        }}
        onDrop={(event) => {
          if (!manualSort) return;
          event.preventDefault();
          const fromId = event.dataTransfer.getData("text/rname-file-id");
          if (fromId) onReorder?.(fromId, file.id);
        }}
      >
        <td className="file-select" data-col="select">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelected(file.id)}
            aria-label={`选择 ${file.name}`}
          />
        </td>
        <td className="file-name" data-col="fileName" style={colStyle(colWidths, "fileName")} title={file.path}>
          <span className="file-name-content">
            {manualSort && (
              <span className="file-drag-handle" title="拖拽调整顺序">
                <DotsSixVertical size={14} weight="bold" aria-hidden="true" />
              </span>
            )}
            <span className="file-name-text">{file.name}</span>
          </span>
        </td>
        <td className="new-name-column" data-col="newName" style={colStyle(colWidths, "newName")}>
          {previewResult ? (
            <span className="new-name-preview">
              <DiffCell
                baseNameSegments={previewResult.diffBaseName}
                extensionSegments={previewResult.diffExtension}
                hasConflict={previewResult.hasConflict}
              />
              {previewResult.ruleSteps.length > 0 && (
                <button
                  className={
                    "rule-steps-toggle" +
                    (stepsExpanded ? " rule-steps-toggle--open" : "")
                  }
                  onClick={() => onToggleSteps(file.id)}
                  aria-expanded={stepsExpanded}
                  title="查看每条规则的中间处理结果"
                >
                  {changedSteps} 处变化 · {previewResult.ruleSteps.length} 步
                </button>
              )}
            </span>
          ) : (
            <span className="preview-placeholder">—</span>
          )}
        </td>
        <td className="file-extension" data-col="extension" style={colStyle(colWidths, "extension")}>
          {file.extension || "-"}
        </td>
        <td className="file-size" data-col="size" style={colStyle(colWidths, "size")}>
          {formatFileSize(file.size)}
        </td>
        <td className="file-date" data-col="date" style={colStyle(colWidths, "date")}>
          {formatDate(file.modifiedAt)}
        </td>
        <td className="file-actions" data-col="actions">
          {executionResult === "success" ? (
            <span className="result-indicator result-indicator--success" title="成功">
              <Check size={15} weight="bold" aria-hidden="true" />
            </span>
          ) : executionResult === "fail" ? (
            <span className="result-indicator result-indicator--fail" title={executionError || "失败"}>
              <XCircle size={15} weight="fill" aria-hidden="true" />
            </span>
          ) : (
            <button
              className="remove-button"
              onClick={() => onRemove(file.id)}
              title="移除"
            >
              <X className="button-icon" size={14} aria-hidden="true" />
            </button>
          )}
        </td>
      </tr>
      {stepsExpanded && previewResult && (
        <tr
          className="rule-preview-row"
          style={{ height: `${16 + previewResult.ruleSteps.length * 24}px` }}
        >
          <td colSpan={7}>
            <div className="rule-preview-list">
              {previewResult.ruleSteps.map((step, index) => {
                const meta = RULE_META[step.ruleType];
                return (
                  <div
                    key={step.ruleId}
                    className={
                      "rule-preview-step" +
                      (step.changed ? " rule-preview-step--changed" : "")
                    }
                  >
                    <span className="rule-preview-step__index">{index + 1}</span>
                    <span className="rule-preview-step__rule">
                      {meta.label}
                    </span>
                    <span className="rule-preview-step__diff">
                      <RuleStepDiff step={step} />
                    </span>
                    {!step.changed && (
                      <span className="rule-preview-step__unchanged">未变化</span>
                    )}
                  </div>
                );
              })}
            </div>
          </td>
        </tr>
      )}
    </>
  );
});
