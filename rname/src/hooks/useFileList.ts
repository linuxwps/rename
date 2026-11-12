import { useState, useEffect, useCallback } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { stat, readDir } from "@tauri-apps/plugin-fs";
import { getCurrentWindow } from "@tauri-apps/api/window";
import type { FileItem } from "../types/file";
import type { FileItemUpdate } from "../types/rename";
import { basename, splitFileName } from "../utils/rename";
import { readExifDatetime, writeAppLog } from "../utils/renameService";
import { moveItemById } from "../utils/fileOrder";

const EXIF_EXTENSIONS = new Set(["jpg", "jpeg", "heic", "heif", "png", "webp", "tif", "tiff", "avif"]);

export function useFileList() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const fetchMetadata = useCallback(async (paths: string[]): Promise<FileItem[]> => {
    const items: FileItem[] = [];

    for (let start = 0; start < paths.length; start += 8) {
      const batch = paths.slice(start, start + 8);
      const results = await Promise.allSettled(
        batch.map(async (path) => {
          const metadata = await stat(path);
          const name = basename(path);
          const { extension } = splitFileName(name);
          const exifTakenAt = EXIF_EXTENSIONS.has(extension.toLowerCase())
            ? await readExifDatetime(path).catch(() => null)
            : null;

          return {
            id: `${path}-${crypto.randomUUID()}`,
            path,
            name,
            extension,
            size: metadata.size,
            modifiedAt: metadata.mtime ? new Date(metadata.mtime).getTime() : 0,
            createdAt: metadata.birthtime ? new Date(metadata.birthtime).getTime() : 0,
            exifTakenAt,
          } satisfies FileItem;
        })
      );

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          items.push(result.value);
        } else {
          console.error(`Failed to get metadata for file ${start + index + 1}:`, result.reason);
          writeAppLog("warn", `读取第 ${start + index + 1} 个文件的元数据失败`);
        }
      });
    }

    return items;
  }, []);

  const addFiles = useCallback(
    async (paths: string[]) => {
      const uniquePaths = Array.from(new Set(paths));
      const newItems = await fetchMetadata(uniquePaths);
      setFiles((prev) => {
        const existingPaths = new Set(prev.map((file) => file.path));
        return [
          ...prev,
          ...newItems.filter((file) => !existingPaths.has(file.path)),
        ];
      });
    },
    [fetchMetadata]
  );

  const removeFile = useCallback((fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, []);

  const reorderFiles = useCallback((fromId: string, toId: string) => {
    setFiles((prev) => moveItemById(prev, fromId, toId));
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
  }, []);

  const openFilePicker = useCallback(async () => {
    const selected = await open({
      multiple: true,
      directory: false,
      filters: [
        { name: "Images", extensions: ["jpg", "jpeg", "png", "gif", "webp", "heic"] },
        { name: "Documents", extensions: ["pdf", "doc", "docx", "txt", "rtf", "xls", "xlsx"] },
        { name: "Video", extensions: ["mp4", "mov", "avi", "mkv"] },
        { name: "Audio", extensions: ["mp3", "wav", "aac", "m4a"] },
        { name: "All Files", extensions: ["*"] },
      ],
    });

    if (selected && selected.length > 0) {
      const paths = Array.isArray(selected) ? selected : [selected];
      await addFiles(paths);
    }
  }, [addFiles]);

  const openFolderPicker = useCallback(async () => {
    const selected = await open({
      multiple: false,
      directory: true,
    });

    if (selected) {
      try {
        const entries = await readDir(selected);
        const sep = selected.includes("\\") ? "\\" : "/";
        const filePaths = entries
          .filter((e) => e.isFile)
          .map((e) => `${selected}${sep}${e.name}`);
        await addFiles(filePaths);
      } catch (err) {
        console.error("Failed to read folder:", err);
        writeAppLog("error", `读取文件夹失败：${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }, [addFiles]);

  const updateFileNames = useCallback(
    (updates: Map<string, FileItemUpdate>): void => {
      setFiles((prev) =>
        prev.map((f) => {
          const u = updates.get(f.id);
          return u ? { ...f, ...u } : f;
        })
      );
    },
    []
  );

  useEffect(() => {
    let cleanup: (() => void) | null = null;

    const setupListener = async () => {
      const win = getCurrentWindow();
      const unlisten = await win.onDragDropEvent((event) => {
        if (event.payload.type === "drop") {
          setIsDragging(false);
          if (event.payload.paths.length > 0) {
            addFiles(event.payload.paths);
          }
        } else if (event.payload.type === "enter") {
          setIsDragging(event.payload.paths.length > 0);
        } else if (event.payload.type === "leave") {
          setIsDragging(false);
        }
      });

      cleanup = unlisten;
    };

    setupListener();

    return () => {
      if (cleanup) cleanup();
    };
  }, [addFiles]);

  return {
    files,
    isDragging,
    addFiles,
    removeFile,
    clearFiles,
    openFilePicker,
    openFolderPicker,
    updateFileNames,
    reorderFiles,
  };
}
