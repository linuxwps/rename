import { useState, useCallback, useMemo } from "react";
import { useFileList } from "./hooks/useFileList";
import { useRenameEngine } from "./hooks/useRenameEngine";
import { useDebounce } from "./hooks/useDebounce";
import { FileDropZone } from "./components/FileDropZone";
import { RenamePanel } from "./components/rename/RenamePanel";
import { SequentialForm } from "./components/rename/SequentialForm";
import { RegexForm } from "./components/rename/RegexForm";
import { PrefixForm } from "./components/rename/PrefixForm";
import { SuffixForm } from "./components/rename/SuffixForm";
import { ExtensionForm } from "./components/rename/ExtensionForm";
import { ReplaceForm } from "./components/rename/ReplaceForm";
import type { RenameModeStates } from "./types/rename";
import "./App.css";

type TabKey = "sequential" | "regex" | "prefix" | "suffix" | "extension" | "replace";

function App() {
  const { files, isDragging, removeFile, clearFiles, openFilePicker, openFolderPicker } =
    useFileList();

  const [modeStates, setModeStates] = useState<RenameModeStates>({
    sequential: { enabled: false, startAt: 1, digits: 3, position: "after" },
    regex: { enabled: false, pattern: "", replacement: "", caseSensitive: false },
    prefix: { enabled: false, text: "" },
    suffix: { enabled: false, text: "" },
    extension: { enabled: false, mode: "change", newExtension: "" },
    replace: { enabled: false, findText: "", replaceText: "", caseSensitive: false },
  });

  const [activeTabForm, setActiveTabForm] = useState<TabKey | null>(null);

  const onToggleMode = useCallback((mode: TabKey) => {
    setModeStates((prev) => ({
      ...prev,
      [mode]: { ...prev[mode], enabled: !prev[mode].enabled },
    }));
  }, []);

  const onUpdateModeConfig = useCallback(
    <K extends TabKey>(mode: K, patch: Partial<RenameModeStates[K]>) => {
      setModeStates((prev) => ({
        ...prev,
        [mode]: { ...prev[mode], ...patch },
      }));
    },
    []
  );

  const debouncedModes = useDebounce(modeStates, 300);

  const { previews, totalConflicts } = useRenameEngine(files, debouncedModes);

  const previewMap = useMemo(() => new Map(previews.map((p) => [p.fileId, p])), [previews]);

  const activeFormComponent = useMemo(() => {
    if (!activeTabForm) return undefined;

    switch (activeTabForm) {
      case "sequential":
        return (
          <SequentialForm
            config={modeStates.sequential}
            onChange={(p) => onUpdateModeConfig("sequential", p)}
          />
        );
      case "regex":
        return (
          <RegexForm
            config={modeStates.regex}
            onChange={(p) => onUpdateModeConfig("regex", p)}
          />
        );
      case "prefix":
        return (
          <PrefixForm
            config={modeStates.prefix}
            onChange={(p) => onUpdateModeConfig("prefix", p)}
          />
        );
      case "suffix":
        return (
          <SuffixForm
            config={modeStates.suffix}
            onChange={(p) => onUpdateModeConfig("suffix", p)}
          />
        );
      case "extension":
        return (
          <ExtensionForm
            config={modeStates.extension}
            onChange={(p) => onUpdateModeConfig("extension", p)}
          />
        );
      case "replace":
        return (
          <ReplaceForm
            config={modeStates.replace}
            onChange={(p) => onUpdateModeConfig("replace", p)}
          />
        );
      default:
        return undefined;
    }
  }, [activeTabForm, modeStates, onUpdateModeConfig]);

  return (
    <div className="app">
      <div className="left-panel">
        <FileDropZone
          files={files}
          isDragging={isDragging}
          previews={previewMap}
          onRemoveFile={removeFile}
          onClearFiles={clearFiles}
          onOpenFilePicker={openFilePicker}
          onOpenFolderPicker={openFolderPicker}
        />
      </div>
      <div className="right-panel">
        <RenamePanel
          files={files}
          modeStates={modeStates}
          onToggleMode={onToggleMode}
          onUpdateModeConfig={onUpdateModeConfig}
          activeTabForm={activeTabForm}
          onSetActiveTabForm={setActiveTabForm}
          totalConflicts={totalConflicts}
          activeFormComponent={activeFormComponent}
        />
      </div>
    </div>
  );
}

export default App;
