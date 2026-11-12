export type FileSystemPlatform = "macos" | "windows" | "linux" | "other";

export interface RenameItem {
  fileId: string;
  originalPath: string;
  finalPath: string;
}

export interface PreflightIssue {
  fileId: string;
  message: string;
}

export interface PreflightResult {
  issues: PreflightIssue[];
  renameOrder: number[];
}

const WINDOWS_RESERVED_NAME =
  /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i;

export function splitFileName(fileName: string): {
  baseName: string;
  extension: string;
} {
  const lastDot = fileName.lastIndexOf(".");

  // 开头的点是隐藏文件名的一部分，不是扩展名。
  if (lastDot <= 0 || lastDot === fileName.length - 1) {
    return { baseName: fileName, extension: "" };
  }

  return {
    baseName: fileName.slice(0, lastDot),
    extension: fileName.slice(lastDot + 1),
  };
}

export function joinFileName(baseName: string, extension: string): string {
  return extension ? `${baseName}.${extension}` : baseName;
}

export function dirname(filePath: string): string {
  const separator = Math.max(filePath.lastIndexOf("/"), filePath.lastIndexOf("\\"));
  return separator >= 0 ? filePath.slice(0, separator + 1) : "";
}

export function basename(filePath: string): string {
  return filePath.slice(dirname(filePath).length);
}

export function joinPath(dir: string, fileName: string): string {
  const separator = dir.includes("\\") && !dir.includes("/") ? "\\" : "/";
  return dir.endsWith("/") || dir.endsWith("\\")
    ? `${dir}${fileName}`
    : `${dir}${separator}${fileName}`;
}

export function validateFileName(
  fileName: string,
  platform: FileSystemPlatform
): string | null {
  if (!fileName) {
    return "新文件名不能为空";
  }

  if (fileName === "." || fileName === "..") {
    return "新文件名不能是 . 或 ..";
  }

  if (fileName.includes("/") || fileName.includes("\\") || fileName.includes("\0")) {
    return "新文件名不能包含路径分隔符";
  }

  if (platform === "windows") {
    if (/[<>:"|?*]/.test(fileName)) {
      return "Windows 文件名不能包含 <>:\"|?*";
    }
    if (/[. ]$/.test(fileName)) {
      return "Windows 文件名不能以空格或句点结尾";
    }
    if (WINDOWS_RESERVED_NAME.test(fileName)) {
      return "该名称是 Windows 保留名称";
    }
    if (fileName.length > 255) {
      return "文件名不能超过 255 个字符";
    }
  } else if (new TextEncoder().encode(fileName).length > 255) {
    return "文件名的 UTF-8 长度不能超过 255 字节";
  }

  return null;
}

/**
 * 在执行前一次性检查整批操作，并生成安全的提交顺序。
 *
 * 提交顺序的原则：
 * - 被其他操作释放的名称优先使用；
 * - 最后处理真正的外部覆盖；
 * - 如果剩余操作构成循环，则先移除一个目标占用者以打断循环。
 */
export function planRenameOperation(
  items: RenameItem[],
  existingPaths: ReadonlySet<string>,
  platform: FileSystemPlatform
): PreflightResult {
  const issues: PreflightIssue[] = [];
  const sourceIndex = new Map<string, number>();
  const destinationIndex = new Map<string, number[]>();

  const pathKey = (path: string) =>
    platform === "windows" ? path.toLocaleLowerCase() : path;

  items.forEach((item, index) => {
    const nameIssue = validateFileName(basename(item.finalPath), platform);
    if (nameIssue) {
      issues.push({ fileId: item.fileId, message: nameIssue });
    }

    const sourceKey = pathKey(item.originalPath);
    if (sourceIndex.has(sourceKey)) {
      issues.push({ fileId: item.fileId, message: "同一个文件被重复加入批次" });
    } else {
      sourceIndex.set(sourceKey, index);
    }

    const destinationKey = pathKey(item.finalPath);
    const destinations = destinationIndex.get(destinationKey) ?? [];
    destinations.push(index);
    destinationIndex.set(destinationKey, destinations);
  });

  for (const [destinationKey, indices] of destinationIndex) {
    if (indices.length > 1) {
      const firstSource = sourceIndex.get(destinationKey);
      for (const index of indices) {
        if (index !== firstSource) {
          issues.push({
            fileId: items[index].fileId,
            message: "多个文件会生成相同的目标文件名",
          });
        }
      }
    } else {
      const index = indices[0];
      const sourceKey = pathKey(items[index].originalPath);
      if (
        sourceKey !== destinationKey &&
        existingPaths.has(destinationKey) &&
        !sourceIndex.has(destinationKey)
      ) {
        issues.push({
          fileId: items[index].fileId,
          message: "目标文件已存在，已阻止覆盖",
        });
      }
    }
  }

  const allIndices = new Set(items.map((_, index) => index));
  const order: number[] = [];
  let remaining = new Set(allIndices);

  while (remaining.size > 0) {
    let progressed = false;

    for (const index of Array.from(remaining)) {
      const sourceKey = pathKey(items[index].originalPath);
      const destinationKey = pathKey(items[index].finalPath);
      const occupiedBySource = sourceIndex.has(destinationKey);
      const occupiedByExisting =
        sourceKey !== destinationKey && existingPaths.has(destinationKey);

      if (!occupiedBySource && !occupiedByExisting) {
        order.push(index);
        remaining.delete(index);
        progressed = true;
      }
    }

    if (progressed) {
      continue;
    }

    // 所有剩余项都互相占用。先处理被其他项占用的名称，
    // 再把它自己的名称变成后续操作的可用目标。
    const breakIndex =
      Array.from(remaining).find((index) => {
        const sourceKey = pathKey(items[index].originalPath);
        return Array.from(remaining).some(
          (other) =>
            other !== index &&
            pathKey(items[other].finalPath) === sourceKey
        );
      }) ?? remaining.values().next().value;

    if (breakIndex === undefined) {
      break;
    }

    order.push(breakIndex);
    remaining.delete(breakIndex);
  }

  return { issues, renameOrder: order };
}
