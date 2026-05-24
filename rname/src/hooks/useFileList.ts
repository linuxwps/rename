import { useState, useEffect, useCallback } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { stat, readDir } from "@tauri-apps/plugin-fs";
import { appWindow } from "@tauri-apps/api/window";
import type { FileItem } from "../types/file";

const FILE_LIMIT = 100;

export function useFileList() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const fetchMetadata = useCallback(async (paths: string[]): Promise<FileItem[]> => {
    const items: FileItem[] = [];

    for (const path of paths) {
      try {
        const metadata = await stat(path);
        const name = path.split("/").pop() || "";
        const extMatch = name.match(/\.([^.]+)$/);
        const extension = extMatch ? extMatch[1] : "";

        items.push({
          id: `${path}-${Date.now()}-${Math.random()}`,
          path,
          name,
          extension,
          size: metadata.size,
          modifiedAt: metadata.mtime ? new Date(metadata.mtime).getTime() : 0,
        });
      } catch (err) {
        console.error(`Failed to get metadata for ${path}:`, err);
      }
    }

    return items;
  }, []);

  const addFiles = useCallback(
    async (paths: string[]) => {
      const remaining = FILE_LIMIT - files.length;
      if (remaining <= 0) {
        alert(`已达到最大文件数量限制 (${FILE_LIMIT})`);
        return;
      }

      const pathsToAdd = paths.slice(0, remaining);
      const newItems = await fetchMetadata(pathsToAdd);

      setFiles((prev) => [...prev, ...newItems]);

      if (paths.length > remaining) {
        alert(`已添加 ${remaining} 个文件。超出限制的文件未添加。`);
      }
    },
    [files.length, fetchMetadata]
  );

  const removeFile = useCallback((fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
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
        const filePaths = entries
          .filter((e) => e.isFile)
          .map((e) => `${selected}/${e.name}`);
        await addFiles(filePaths);
      } catch (err) {
        console.error("Failed to read folder:", err);
      }
    }
  }, [addFiles]);

  useEffect(() => {
    let cleanup: (() => void) | null = null;

    const setupListener = async () => {
      const unlisten = await appWindow.onFileDropEvent((event) => {
        if (event.payload.type === "drop") {
          setIsDragging(false);
          addFiles(event.payload.paths);
        } else if (event.payload.type === "hover") {
          setIsDragging(true);
        } else if (event.payload.type === "cancel") {
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
  };
}