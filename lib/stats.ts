export function mean(values: number[]): number {
  if (values.length === 0) return NaN;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function median(values: number[]): number {
  if (values.length === 0) return NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function mode<T>(values: T[]): T | undefined {
  if (values.length === 0) return undefined;
  const freq = new Map<T, number>();
  for (const v of values) freq.set(v, (freq.get(v) ?? 0) + 1);
  let best: T | undefined = undefined;
  let bestCount = -1;
  for (const [v, c] of freq) if (c > bestCount) { best = v; bestCount = c; }
  return best;
}

export function stddev(values: number[]): number {
  if (values.length <= 1) return 0;
  const m = mean(values);
  const variance = mean(values.map(v => (v - m) ** 2));
  return Math.sqrt(variance);
}

export function zScores(values: number[]): number[] {
  const m = mean(values);
  const s = stddev(values);
  if (s === 0) return values.map(() => 0);
  return values.map(v => (v - m) / s);
}
