import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useFileList } from "./hooks/useFileList";
import { useRenameEngine } from "./hooks/useRenameEngine";
import { useRenameExecutor } from "./hooks/useRenameExecutor";
import { useDebounce } from "./hooks/useDebounce";
import { FileDropZone } from "./components/FileDropZone";
import { RenamePanel } from "./components/rename/RenamePanel";
import { SequentialForm } from "./components/rename/SequentialForm";
import { RegexForm } from "./components/rename/RegexForm";
import { PrefixForm } from "./components/rename/PrefixForm";
import { SuffixForm } from "./components/rename/SuffixForm";
import { ExtensionForm } from "./components/rename/ExtensionForm";
import { ReplaceForm } from "./components/rename/ReplaceForm";
import { Toast, type ToastType } from "./components/rename/Toast";
import type { RenameModeStates, FileItemUpdate } from "./types/rename";
import "./App.css";

type TabKey = "sequential" | "regex" | "prefix" | "suffix" | "extension" | "replace";

function App() {
  const { files, isDragging, removeFile, clearFiles, openFilePicker, openFolderPicker, updateFileNames } =
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

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<ToastType>("success");
  const [toastKey, setToastKey] = useState(0);

  const showToast = useCallback((message: string, type: ToastType) => {
    setToastMessage(message);
    setToastType(type);
    setToastKey((k) => k + 1);
  }, []);

  // Execution state via useRenameExecutor
  const onFileNamesUpdated = useCallback(
    (updates: Map<string, FileItemUpdate>) => {
      updateFileNames(updates);
    },
    [updateFileNames]
  );

  const {
    isExecuting,
    hasExecuted,
    executionResults,
    executionErrors,
    execute,
    undo,
    resetExecution,
  } = useRenameExecutor(files, previews, onFileNamesUpdated);

  // Handlers
  const handleExecute = useCallback(async () => {
    if (isExecuting) return;
    await execute();
  }, [execute, isExecuting]);

  const handleUndo = useCallback(async () => {
    await undo();
  }, [undo]);

  // Toast on execution complete
  const prevExecutedRef = useRef(false);
  useEffect(() => {
    if (hasExecuted && !prevExecutedRef.current) {
      const failCount = Object.values(executionResults).filter((r) => r === "fail").length;
      const successCount = Object.values(executionResults).filter((r) => r === "success").length;

      if (failCount === 0) {
        showToast(`已成功重命名 ${successCount} 个文件`, "success");
      } else if (successCount > 0) {
        showToast(`已重命名 ${successCount} 个文件，遇到错误已停止。可撤销恢复。`, "warning");
      } else {
        const firstError = Object.values(executionErrors)[0] || "未知错误";
        showToast(`重命名失败：${firstError}`, "error");
      }
    }
    prevExecutedRef.current = hasExecuted;
  }, [hasExecuted, executionResults, executionErrors, showToast]);

  // Toast on undo complete
  const prevHasExecutedRef = useRef(hasExecuted);
  useEffect(() => {
    if (!hasExecuted && prevHasExecutedRef.current) {
      showToast("已撤销重命名", "info");
    }
    prevHasExecutedRef.current = hasExecuted;
  }, [hasExecuted, showToast]);

  // File list change resets execution state
  const prevFilesLengthRef = useRef(files.length);
  useEffect(() => {
    if (hasExecuted && files.length !== prevFilesLengthRef.current) {
      resetExecution();
    }
    prevFilesLengthRef.current = files.length;
  }, [files.length, hasExecuted, resetExecution]);

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
          executionResults={executionResults}
          executionErrors={executionErrors}
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
          isExecuting={isExecuting}
          hasExecuted={hasExecuted}
          onExecute={handleExecute}
          onUndo={handleUndo}
        />
      </div>
      <Toast
        key={toastKey}
        toast={toastMessage ? { message: toastMessage, type: toastType } : null}
        duration={toastType === "error" || toastType === "warning" ? 5000 : 3000}
        onDismiss={() => setToastMessage(null)}
      />
    </div>
  );
}

export default App;
