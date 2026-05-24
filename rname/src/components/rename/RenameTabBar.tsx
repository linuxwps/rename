import type { RenameModeStates } from "../../types/rename";
import "./RenameTabBar.css";

type TabKey = "sequential" | "regex" | "prefix" | "suffix" | "extension" | "replace";

interface RenameTabBarProps {
  modeStates: RenameModeStates;
  onToggleMode: (mode: TabKey) => void;
  activeTabForm: TabKey | null;
  onSetActiveTabForm: (tab: TabKey | null) => void;
  hasFiles: boolean;
}

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: "sequential", label: "时间", icon: "🔢" },
  { key: "regex", label: "正则", icon: "🔍" },
  { key: "prefix", label: "前缀", icon: "📎" },
  { key: "suffix", label: "后缀", icon: "➕" },
  { key: "extension", label: "扩展名", icon: "📄" },
  { key: "replace", label: "替换", icon: "🔄" },
];

export function RenameTabBar({
  modeStates,
  onToggleMode,
  activeTabForm,
  onSetActiveTabForm,
  hasFiles,
}: RenameTabBarProps) {
  const anyEnabled = Object.values(modeStates).some((m) => m.enabled);

  return (
    <div className={"rename-tab-bar" + (anyEnabled ? " tab-bar-has-active" : "")}>
      {TABS.map((tab) => {
        const enabled = modeStates[tab.key].enabled;
        const className =
          "rename-tab" +
          (enabled ? " tab-active" : "") +
          (activeTabForm === tab.key ? " tab-form-open" : "") +
          (!hasFiles ? " tab-disabled" : "");

        return (
          <button
            key={tab.key}
            className={className}
            disabled={!hasFiles}
            onClick={() => {
              onToggleMode(tab.key);
              onSetActiveTabForm(tab.key);
            }}
          >
            {tab.icon} {tab.label}
          </button>
        );
      })}
    </div>
  );
}
