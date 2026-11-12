import "./ConflictBanner.css";

interface ConflictBannerProps {
  totalConflicts: number;
}

export function ConflictBanner({ totalConflicts }: ConflictBannerProps) {
  if (totalConflicts <= 0) {
    return null;
  }

  return (
    <div className="conflict-banner" role="alert">
      ⚠️ 发现 {totalConflicts} 个文件名冲突或规则错误，请查看文件预览
    </div>
  );
}
