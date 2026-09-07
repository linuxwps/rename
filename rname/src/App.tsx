import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useFileList } from "./hooks/useFileList";
import { useRenameEngine } from "./hooks/useRenameEngine";
import { useRenameExecutor } from "./hooks/useRenameExecutor";
import { useDebounce } from "./hooks/useDebounce";
import { usePrevious } from "./hooks/usePrevious";
import { FileDropZone } from "./components/FileDropZone";
import { RenamePanel } from "./components/rename/RenamePanel";
import { SequentialForm } from "./components/rename/SequentialForm";
import { RegexForm } from "./components/rename/RegexForm";
import { PrefixForm } from "./components/rename/PrefixForm";
import { SuffixForm } from "./components/rename/SuffixForm";
import { ExtensionForm } from "./components/rename/ExtensionForm";
import { ReplaceForm } from "./components/rename/ReplaceForm";
import { Toast, type ToastType } from "./components/rename/Toast";
import type { RenameModeStates, FileItemUpdate, TabKey } from "./types/rename";
import "./App.css";

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

  // Resizable split panel
  const [topRatio, setTopRatio] = useState(0.7);
  const isResizing = useRef(false);

  const handleResizeStart = useCallback(() => {
    isResizing.current = true;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const ratio = e.clientY / window.innerHeight;
      setTopRatio(Math.max(0.2, Math.min(0.8, ratio)));
    };
    const handleMouseUp = () => {
      if (isResizing.current) {
        isResizing.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // Toast state (merged)
  const [toast, setToast] = useState<{ message: string; type: ToastType; key: number } | null>(null);

  const showToast = useCallback((message: string, type: ToastType) => {
    setToast((prev) => ({ message, type, key: (prev?.key ?? 0) + 1 }));
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
  const prevExecuted = usePrevious(hasExecuted);
  useEffect(() => {
    if (hasExecuted && !prevExecuted) {
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
  }, [hasExecuted, prevExecuted, executionResults, executionErrors, showToast]);

  // Toast when execution finishes but all files failed
  const prevIsExecuting = usePrevious(isExecuting);
  useEffect(() => {
    if (prevIsExecuting && !isExecuting) {
      const errorKeys = Object.keys(executionErrors);
      if (errorKeys.length > 0 && !hasExecuted) {
        const firstError = executionErrors[errorKeys[0]] || "未知错误";
        showToast(`重命名失败：${firstError}`, "error");
      }
    }
  }, [isExecuting, prevIsExecuting, executionErrors, hasExecuted, showToast]);

  // Toast on undo complete
  const prevHasExecuted = usePrevious(hasExecuted);
  useEffect(() => {
    if (!hasExecuted && prevHasExecuted) {
      showToast("已撤销重命名", "info");
    }
  }, [hasExecuted, prevHasExecuted, showToast]);

  // File list change resets execution state
  const prevFilesLength = usePrevious(files.length);
  useEffect(() => {
    if (hasExecuted && files.length !== prevFilesLength) {
      resetExecution();
    }
  }, [files.length, prevFilesLength, hasExecuted, resetExecution]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (hasExecuted && !isExecuting) handleUndo();
      } else if (e.key === "Enter" && !mod) {
        e.preventDefault();
        if (!isExecuting && previews.length > 0 && totalConflicts === 0) handleExecute();
      } else if (mod && e.key === "o") {
        e.preventDefault();
        openFilePicker();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasExecuted, isExecuting, previews.length, totalConflicts, handleUndo, handleExecute, openFilePicker]);

  const previewMap = useMemo(() => new Map(previews.map((p) => [p.fileId, p])), [previews]);

  const activeFormConfig = activeTabForm ? modeStates[activeTabForm] : undefined;

  const activeFormComponent = useMemo(() => {
    if (!activeTabForm || !activeFormConfig) return undefined;

    const onChange = (p: Partial<RenameModeStates[typeof activeTabForm]>) =>
      onUpdateModeConfig(activeTabForm, p);

    switch (activeTabForm) {
      case "sequential":
        return <SequentialForm config={modeStates.sequential} onChange={onChange as (p: Partial<RenameModeStates["sequential"]>) => void} />;
      case "regex":
        return <RegexForm config={modeStates.regex} onChange={onChange as (p: Partial<RenameModeStates["regex"]>) => void} />;
      case "prefix":
        return <PrefixForm config={modeStates.prefix} onChange={onChange as (p: Partial<RenameModeStates["prefix"]>) => void} />;
      case "suffix":
        return <SuffixForm config={modeStates.suffix} onChange={onChange as (p: Partial<RenameModeStates["suffix"]>) => void} />;
      case "extension":
        return <ExtensionForm config={modeStates.extension} onChange={onChange as (p: Partial<RenameModeStates["extension"]>) => void} />;
      case "replace":
        return <ReplaceForm config={modeStates.replace} onChange={onChange as (p: Partial<RenameModeStates["replace"]>) => void} />;
      default:
        return undefined;
    }
  }, [activeTabForm, activeFormConfig, onUpdateModeConfig]);

  return (
    <div className="app">
      <div className="top-panel" style={{ height: `${topRatio * 100}%` }}>
        <FileDropZone
          files={files}
          isDragging={isDragging}
          previews={previewMap}
          onRemoveFile={removeFile}
          onOpenFilePicker={openFilePicker}
          onOpenFolderPicker={openFolderPicker}
          executionResults={executionResults}
          executionErrors={executionErrors}
        />
      </div>
      <div className="resize-handle" onMouseDown={handleResizeStart} />
      <div className="bottom-panel">
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
          onClearFiles={clearFiles}
        />
      </div>
      <Toast
        key={toast?.key ?? 0}
        toast={toast ? { message: toast.message, type: toast.type } : null}
        duration={toast?.type === "error" || toast?.type === "warning" ? 5000 : 3000}
        onDismiss={() => setToast(null)}
      />
    </div>
  );
}

export default App;
