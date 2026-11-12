export interface VisibleRange {
  start: number;
  end: number;
}

function findOffsetIndex(offsets: number[], target: number, itemCount: number): number {
  let low = 0;
  let high = itemCount;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (offsets[middle + 1] <= target) low = middle + 1;
    else high = middle;
  }
  return low;
}

export function computeVisibleRange(
  offsets: number[],
  scrollTop: number,
  viewportHeight: number,
  headerHeight: number,
  overscan: number
): VisibleRange {
  const itemCount = offsets.length - 1;
  if (itemCount <= 0) return { start: 0, end: 0 };

  const startScroll = Math.max(0, scrollTop - headerHeight);
  const endScroll = startScroll + viewportHeight;
  return {
    start: Math.max(0, findOffsetIndex(offsets, startScroll, itemCount) - overscan),
    end: Math.min(
      itemCount,
      findOffsetIndex(offsets, endScroll, itemCount) + overscan + 1
    ),
  };
}
