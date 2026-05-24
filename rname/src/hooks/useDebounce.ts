import { useState, useEffect } from "react";

/**
 * 通用防抖 hook。
 * 在 delay 毫秒内 value 没有变化时，才更新返回的 debouncedValue。
 *
 * @param value - 需要防抖的值
 * @param delay - 延迟毫秒数
 * @returns 防抖后的值
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
