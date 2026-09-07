import { useEffect, useState, useRef } from "react";
import "./Toast.css";

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastData {
  message: string;
  type: ToastType;
}

interface ToastProps {
  toast: ToastData | null;
  duration?: number;
  onDismiss: () => void;
}

const ICONS: Record<ToastType, string> = {
  success: "✓",
  error: "✗",
  warning: "⚠",
  info: "↩",
};

export function Toast({ toast, duration = 3000, onDismiss }: ToastProps) {
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }

    if (!toast) {
      setExiting(false);
      return;
    }

    setExiting(false);

    timerRef.current = setTimeout(() => {
      setExiting(true);
      exitTimerRef.current = setTimeout(() => {
        onDismiss();
      }, 300);
    }, duration);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }
    };
  }, [toast, duration, onDismiss]);

  if (!toast) return null;

  return (
    <div className={`toast${exiting ? " toast--exiting" : ""}`} role="alert" aria-live="polite">
      <span className={`toast-icon toast-icon--${toast.type}`}>
        {ICONS[toast.type]}
      </span>
      {toast.message}
    </div>
  );
}
