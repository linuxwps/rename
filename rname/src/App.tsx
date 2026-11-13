import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
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
import { CaseForm } from "./components/rename/CaseForm";
import { ExifDateForm } from "./components/rename/ExifDateForm";
import { Toast, type ToastType } from "./components/rename/Toast";
import { LabeledRuleForm } from "./components/rename/LabeledRuleForm";
import { LogPanel } from "./components/LogPanel";
import type {
  FileItemUpdate,
  FileSortMode,
  RenamePreset,
  RenameRule,
  RenameRuleConfigMap,
  TabKey,
} from "./types/rename";
import {
  createRule,
  cloneRule,
  hasEffectiveRules,
  MAX_RENAME_RULES,
  moveRule,
  moveRuleById,
  removeRule,
} from "./utils/ruleChain";
import {
  applyRenamePreset,
  loadRenamePresets,
  removeRenamePreset,
  saveRenamePresets,
  upsertRenamePreset,
} from "./utils/presets";
import { parseCsvPathMappings, toCsv } from "./utils/csv";
import { exportCsvFile, importCsvFile, writeAppLog } from "./utils/renameService";
import dayAppIconUrl from "../src-tauri/icons/day/icon.png";
import nightAppIconUrl from "../src-tauri/icons/night/icon.png";
import "./App.css";

function App() {
  const { files, isDragging, addFiles, removeFile, clearFiles, openFilePicker, openFolderPicker, updateFileNames, reorderFiles } =
    useFileList();

  const [rules, setRules] = useState<RenameRule[]>([]);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [presets, setPresets] = useState<RenamePreset[]>(() =>
    loadRenamePresets()
  );
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [fileSortMode, setFileSortMode] = useState<FileSortMode>("added");
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [logsOpen, setLogsOpen] = useState(false);
  const [csvTargetNames, setCsvTargetNames] = useState<Map<string, string>>(new Map());
  const [usesDarkAppearance, setUsesDarkAppearance] = useState(
    () => window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false
  );
  const knownFileIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    writeAppLog("info", "Rename 应用已启动");
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const syncAppearance = () => setUsesDarkAppearance(mediaQuery.matches);

    syncAppearance();
    mediaQuery.addEventListener("change", syncAppearance);
    return () => mediaQuery.removeEventListener("change", syncAppearance);
  }, []);

  const startWindowDrag = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (event.button !== 0) return;
      event.preventDefault();
      void getCurrentWindow().startDragging();
    },
    []
  );

  useEffect(() => {
    const currentIds = new Set(files.map((file) => file.id));
    const newFileIds = [...currentIds].filter(
      (fileId) => !knownFileIdsRef.current.has(fileId)
    );

    setSelectedFileIds((previous) => {
      const next = new Set(
        [...previous].filter((fileId) => currentIds.has(fileId))
      );
      for (const fileId of newFileIds) next.add(fileId);
      return next;
    });
    knownFileIdsRef.current = currentIds;
  }, [files]);

  const displayedFiles = useMemo(() => {
    if (fileSortMode === "added" || fileSortMode === "manual") return files;

    return [...files].sort((left, right) => {
      const result = left.name.localeCompare(right.name, "zh-CN", {
        numeric: true,
        sensitivity: "base",
      });
      return fileSortMode === "ascending" ? result : -result;
    });
  }, [fileSortMode, files]);

  const selectedDisplayedFiles = useMemo(
    () => displayedFiles.filter((file) => selectedFileIds.has(file.id)),
    [displayedFiles, selectedFileIds]
  );
  const hasSelectedCsvTargets = useMemo(
    () => selectedDisplayedFiles.some((file) => csvTargetNames.has(file.path)),
    [csvTargetNames, selectedDisplayedFiles]
  );

  const onToggleSelected = useCallback((fileId: string) => {
    setSelectedFileIds((previous) => {
      const next = new Set(previous);
      if (next.has(fileId)) next.delete(fileId);
      else next.add(fileId);
      return next;
    });
  }, []);

  const onToggleAll = useCallback(() => {
    setSelectedFileIds((previous) =>
      previous.size === displayedFiles.length
        ? new Set()
        : new Set(displayedFiles.map((file) => file.id))
    );
  }, [displayedFiles]);

  const onAddRule = useCallback((type: TabKey) => {
    setRules((prev) => {
      if (prev.length >= MAX_RENAME_RULES) return prev;
      const rule = createRule(type);
      setSelectedRuleId(rule.id);
      return [...prev, rule];
    });
  }, []);

  const onToggleRule = useCallback((ruleId: string) => {
    setRules((prev) =>
      prev.map((rule) =>
        rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
      )
    );
  }, []);

  const onUpdateRuleConfig = useCallback(
    <K extends TabKey>(
      ruleId: string,
      type: K,
      patch: Partial<RenameRuleConfigMap[K]>
    ) => {
      setRules((prev) =>
        prev.map((rule) => {
          if (rule.id !== ruleId || rule.type !== type) {
            return rule;
          }
          return {
            ...rule,
            config: { ...rule.config, ...patch },
          } as RenameRule;
        })
      );
    },
    []
  );

  const onRemoveRule = useCallback((ruleId: string) => {
    setRules((prev) => removeRule(prev, ruleId));
  }, []);

  const onSelectRule = useCallback((ruleId: string | null) => {
    setSelectedRuleId(ruleId);
  }, []);

  const onDuplicateRule = useCallback((ruleId: string) => {
    setRules((prev) => {
      const index = prev.findIndex((rule) => rule.id === ruleId);
      if (index < 0 || prev.length >= MAX_RENAME_RULES) return prev;
      const duplicate = cloneRule(prev[index]);
      setSelectedRuleId(duplicate.id);
      const next = [...prev];
      next.splice(index + 1, 0, duplicate);
      return next;
    });
  }, []);

  const onClearRules = useCallback(() => {
    setRules([]);
    setSelectedRuleId(null);
  }, []);

  const onMoveRule = useCallback((ruleId: string, offset: number) => {
    setRules((prev) => moveRuleById(prev, ruleId, offset));
  }, []);

  const onMoveRuleTo = useCallback((fromIndex: number, toIndex: number) => {
    setRules((prev) => moveRule(prev, fromIndex, toIndex));
    setActivePresetId(null);
  }, []);

  const debouncedRules = useDebounce(rules, 300);
  const isPreviewPending = debouncedRules !== rules;

  const { previews, totalConflicts } = useRenameEngine(
    selectedDisplayedFiles,
    debouncedRules,
    csvTargetNames
  );

  // Resizable split panel
  const [topRatio, setTopRatio] = useState(0.52);
  const isResizing = useRef(false);
  const appContentRef = useRef<HTMLDivElement>(null);

  const handleResizeStart = useCallback(() => {
    isResizing.current = true;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const content = appContentRef.current;
      if (!content) return;
      const bounds = content.getBoundingClientRect();
      const ratio = (e.clientY - bounds.top) / bounds.height;
      setTopRatio(Math.max(0.3, Math.min(0.78, ratio)));
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
    writeAppLog(type === "error" ? "error" : type === "warning" ? "warn" : "info", message);
    setToast((prev) => ({ message, type, key: (prev?.key ?? 0) + 1 }));
  }, []);

  const onSavePreset = useCallback(
    (name: string) => {
      try {
        const result = upsertRenamePreset(presets, name, rules);
        setPresets(result.presets);
        saveRenamePresets(result.presets);
        setActivePresetId(result.preset.id);
        showToast(
          result.created ? `已保存预设“${result.preset.name}”` : `已更新预设“${result.preset.name}”`,
          "success"
        );
      } catch (error) {
        showToast(
          error instanceof Error ? error.message : "保存预设失败",
          "error"
        );
      }
    },
    [presets, rules, showToast]
  );

  const onLoadPreset = useCallback((presetId: string) => {
    const preset = presets.find((item) => item.id === presetId);
    if (!preset) return;
    setRules(applyRenamePreset(preset));
    setSelectedRuleId(null);
    setActivePresetId(preset.id);
    showToast(`已加载预设“${preset.name}”`, "info");
  }, [presets, showToast]);

  const onDeletePreset = useCallback(
    (presetId: string) => {
      const preset = presets.find((item) => item.id === presetId);
      const next = removeRenamePreset(presets, presetId);
      setPresets(next);
      saveRenamePresets(next);
      if (activePresetId === presetId) {
        setActivePresetId(null);
      }
      showToast(
        preset ? `已删除预设“${preset.name}”` : "已删除预设",
        "info"
      );
    },
    [activePresetId, presets, showToast]
  );

  // Execution state via useRenameExecutor
  const onFileNamesUpdated = useCallback(
    (updates: Map<string, FileItemUpdate>) => {
      updateFileNames(updates);
      setCsvTargetNames(new Map());
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
  } = useRenameExecutor(selectedDisplayedFiles, previews, onFileNamesUpdated);

  // Handlers
  const handleExecute = useCallback(async () => {
    if (isExecuting || isPreviewPending) return;
    await execute();
  }, [execute, isExecuting, isPreviewPending]);

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
        if (
          !isExecuting &&
          !isPreviewPending &&
          previews.length > 0 &&
          totalConflicts === 0 &&
          (hasEffectiveRules(rules) || hasSelectedCsvTargets)
        ) {
          handleExecute();
        }
      } else if (mod && e.key === "o") {
        e.preventDefault();
        openFilePicker();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasExecuted, isExecuting, isPreviewPending, previews.length, totalConflicts, rules, hasSelectedCsvTargets, handleUndo, handleExecute, openFilePicker]);

  const previewMap = useMemo(() => new Map(previews.map((p) => [p.fileId, p])), [previews]);

  const handleExportCsv = useCallback(async () => {
    if (selectedDisplayedFiles.length === 0) return;
    try {
      const rows: string[][] = [[
        "原路径",
        "原文件名",
        "新文件名",
        "大小（字节）",
        "修改时间",
        "状态",
      ]];
      for (const file of selectedDisplayedFiles) {
        const preview = previewMap.get(file.id);
        const status = preview?.validationError
          ? `错误：${preview.validationError}`
          : preview?.hasConflict
            ? "冲突"
            : "可执行";
        rows.push([
          file.path,
          file.name,
          preview?.newFullName ?? file.name,
          String(file.size),
          file.modifiedAt ? new Date(file.modifiedAt).toLocaleString("zh-CN") : "",
          status,
        ]);
      }
      const path = await exportCsvFile(toCsv(rows));
      if (path) showToast(`已导出 ${selectedDisplayedFiles.length} 条重命名计划`, "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "CSV 导出失败", "error");
    }
  }, [previewMap, selectedDisplayedFiles, showToast]);

  const handleImportCsv = useCallback(async () => {
    try {
      const file = await importCsvFile();
      if (!file) return;
      const { paths, targetNames } = parseCsvPathMappings(file.content);
      if (paths.length === 0) throw new Error("CSV 中没有找到路径列");
      await addFiles(paths);
      setCsvTargetNames(targetNames);
      showToast(
        targetNames.size > 0
          ? `已导入 ${paths.length} 条路径，其中 ${targetNames.size} 条带目标文件名`
          : `已从 CSV 导入 ${paths.length} 条路径`,
        "success"
      );
    } catch (error) {
      showToast(error instanceof Error ? error.message : "CSV 导入失败", "error");
    }
  }, [addFiles, showToast]);

  const handleClearFiles = useCallback(() => {
    clearFiles();
    setCsvTargetNames(new Map());
  }, [clearFiles]);

  const selectedRule = rules.find((rule) => rule.id === selectedRuleId);

  const activeFormComponent = useMemo(() => {
    if (!selectedRule) return undefined;

    const handleChange = (patch: Partial<RenameRule["config"]>) => {
      onUpdateRuleConfig(selectedRule.id, selectedRule.type, patch);
    };

    const removeSelected = () => {
      setSelectedRuleId(null);
      onRemoveRule(selectedRule.id);
    };

    const form = (() => {
      switch (selectedRule.type) {
      case "sequential":
        return <SequentialForm config={selectedRule.config} onChange={handleChange} />;
      case "regex":
        return <RegexForm config={selectedRule.config} onChange={handleChange} />;
      case "prefix":
        return <PrefixForm config={selectedRule.config} onChange={handleChange} />;
      case "suffix":
        return <SuffixForm config={selectedRule.config} onChange={handleChange} />;
      case "extension":
        return <ExtensionForm config={selectedRule.config} onChange={handleChange} />;
      case "replace":
        return <ReplaceForm config={selectedRule.config} onChange={handleChange} />;
      case "case":
        return <CaseForm config={selectedRule.config} onChange={handleChange} />;
      case "exif":
        return <ExifDateForm config={selectedRule.config} onChange={handleChange} />;
      default:
        return undefined;
      }
    })();

    return (
      <LabeledRuleForm type={selectedRule.type} onRemove={removeSelected}>
        {form}
      </LabeledRuleForm>
    );
  }, [selectedRule, onRemoveRule, onUpdateRuleConfig]);

  return (
    <div className="app">
      <header
        className="app-titlebar"
        data-tauri-drag-region
        onMouseDown={startWindowDrag}
      >
        <img
          className="app-titlebar__icon"
          src={usesDarkAppearance ? nightAppIconUrl : dayAppIconUrl}
          alt=""
          draggable={false}
        />
        <span className="app-titlebar__name" data-tauri-drag-region>
          Rename
        </span>
      </header>
      <div className="app-content" ref={appContentRef}>
        <div className="top-panel" style={{ height: `${topRatio * 100}%` }}>
          <FileDropZone
            files={displayedFiles}
            isDragging={isDragging}
            previews={previewMap}
            onRemoveFile={removeFile}
            onOpenFilePicker={openFilePicker}
            onOpenFolderPicker={openFolderPicker}
            onImportCsv={() => void handleImportCsv()}
            onShowLogs={() => setLogsOpen(true)}
            executionResults={executionResults}
            executionErrors={executionErrors}
            sortMode={fileSortMode}
            onSortModeChange={setFileSortMode}
            selectedIds={selectedFileIds}
            onToggleSelected={onToggleSelected}
            onToggleAll={onToggleAll}
            onReorder={reorderFiles}
          />
        </div>
        <div className="resize-handle" onMouseDown={handleResizeStart} role="separator" aria-label="调整文件区和规则区高度" aria-orientation="horizontal" />
        <div className="bottom-panel">
          <RenamePanel
            files={displayedFiles}
            rules={rules}
            onAddRule={onAddRule}
            onToggleRule={onToggleRule}
            onUpdateRuleConfig={onUpdateRuleConfig}
            selectedRuleId={selectedRuleId}
            onSelectRule={onSelectRule}
            onRemoveRule={onRemoveRule}
            onDuplicateRule={onDuplicateRule}
            onClearRules={onClearRules}
            onMoveRule={onMoveRule}
            onMoveRuleTo={onMoveRuleTo}
            totalConflicts={totalConflicts}
            activeFormComponent={activeFormComponent}
            presets={presets}
            activePresetId={activePresetId}
            onSavePreset={onSavePreset}
            onLoadPreset={onLoadPreset}
            onDeletePreset={onDeletePreset}
            isPreviewPending={isPreviewPending}
            isExecuting={isExecuting}
            hasExecuted={hasExecuted}
            onExecute={handleExecute}
            onUndo={handleUndo}
            onClearFiles={handleClearFiles}
            selectedCount={selectedDisplayedFiles.length}
            onExportCsv={() => void handleExportCsv()}
            onImportCsv={() => void handleImportCsv()}
            onShowLogs={() => setLogsOpen(true)}
            hasCsvTargets={hasSelectedCsvTargets}
          />
        </div>
      </div>
      <LogPanel open={logsOpen} onClose={() => setLogsOpen(false)} />
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
