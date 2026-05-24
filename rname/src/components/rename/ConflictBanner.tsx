import "./ConflictBanner.css";

interface ConflictBannerProps {
  totalConflicts: number;
}

export function ConflictBanner({ totalConflicts }: ConflictBannerProps) {
  if (totalConflicts <= 0) {
    return null;
  }

  return (
    <div className="conflict-banner">
      ⚠️ 发现 {totalConflicts} 个重名文件，请调整重命名规则
    </div>
  );
}
