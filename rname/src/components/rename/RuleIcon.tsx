import type { ComponentType } from "react";
import {
  ArrowsClockwise,
  BracketsCurly,
  CalendarBlank,
  FileCode,
  NumberSquareOne,
  TextAa,
  TextAlignLeft,
  TextAlignRight,
  type IconProps,
} from "@phosphor-icons/react";
import type { TabKey } from "../../types/rename";

const RULE_ICONS: Record<TabKey, ComponentType<IconProps>> = {
  sequential: NumberSquareOne,
  regex: BracketsCurly,
  prefix: TextAlignLeft,
  suffix: TextAlignRight,
  extension: FileCode,
  replace: ArrowsClockwise,
  case: TextAa,
  exif: CalendarBlank,
};

interface RuleIconProps {
  type: TabKey;
  size?: number;
}

export function RuleIcon({
  type,
  size = 16,
}: RuleIconProps) {
  const Icon = RULE_ICONS[type];

  return (
    <Icon
      className="button-icon rule-icon"
      size={size}
      weight="regular"
      aria-hidden="true"
    />
  );
}
