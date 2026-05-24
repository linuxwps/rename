import type { DiffSegment } from "../../types/rename";
import "./DiffCell.css";

interface DiffCellProps {
  baseNameSegments: DiffSegment[];
  extensionSegments: DiffSegment[];
  hasConflict: boolean;
}

export function DiffCell({
  baseNameSegments,
  extensionSegments,
  hasConflict,
}: DiffCellProps) {
  return (
    <span className={"diff-cell" + (hasConflict ? " diff-conflict" : "")}>
      {hasConflict && <span className="conflict-icon">⚠</span>}
      {baseNameSegments.map((seg, i) => (
        <span key={"b-" + i} className={"diff-" + seg.type}>
          {seg.value}
        </span>
      ))}
      {extensionSegments.map((seg, i) => (
        <span key={"e-" + i} className={"diff-" + seg.type}>
          {seg.value}
        </span>
      ))}
    </span>
  );
}
