import { format, parse } from 'date-fns';
import { mean, median, mode, zScores } from './stats';
import { CleaningRules, CleaningSummary, ColumnType, DataRow, InferredSchema } from './types';

function isDateLike(value: string): boolean {
  // Basic heuristics for date-like strings
  const patterns = [/^\d{4}-\d{2}-\d{2}/, /^\d{2}\/\d{2}\/\d{4}/, /^\d{2}-\d{2}-\d{4}/];
  return patterns.some(p => p.test(value));
}

export function inferSchema(rows: DataRow[], maxRows = 200): InferredSchema {
  const sample = rows.slice(0, maxRows);
  const keys = Array.from(new Set(sample.flatMap(r => Object.keys(r))));
  return {
    columns: keys.map(key => {
      let counts: Record<ColumnType, number> = { number: 0, string: 0, boolean: 0, date: 0, unknown: 0 };
      for (const r of sample) {
        const v = r[key];
        if (v === null || v === undefined || v === '') continue;
        if (typeof v === 'number') counts.number++;
        else if (typeof v === 'boolean') counts.boolean++;
        else if (typeof v === 'string') {
          const s = v.trim();
          if (s.toLowerCase() === 'true' || s.toLowerCase() === 'false') counts.boolean++;
          else if (!isNaN(Number(s))) counts.number++;
          else if (isDateLike(s)) counts.date++;
          else counts.string++;
        } else counts.unknown++;
      }
      const type = (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown') as ColumnType;
      return { key, type };
    })
  };
}

function normalizeValueStr(s: string, opt: { trim: boolean; casing: 'none' | 'lower' | 'upper' | 'title' }): string {
  let out = s;
  if (opt.trim) out = out.trim();
  switch (opt.casing) {
    case 'lower': out = out.toLowerCase(); break;
    case 'upper': out = out.toUpperCase(); break;
    case 'title': out = out.replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.substring(1).toLowerCase()); break;
  }
  return out;
}

function formatDate(input: string, target: string): string | null {
  const candidates = [
    "yyyy-MM-dd",
    "MM/dd/yyyy",
    "dd/MM/yyyy",
    "yyyy/MM/dd",
    "dd-MM-yyyy",
    "MM-dd-yyyy"
  ];
  for (const fmt of candidates) {
    try {
      const dt = parse(input, fmt as any, new Date());
      if (!isNaN(dt.getTime())) {
        return target === 'ISO' ? dt.toISOString() : format(dt, target as any);
      }
    } catch {}
  }
  const iso = new Date(input);
  if (!isNaN(iso.getTime())) return target === 'ISO' ? iso.toISOString() : format(iso, target as any);
  return null;
}

export function cleanData(rows: DataRow[], rules: CleaningRules): { rows: DataRow[]; summary: CleaningSummary } {
  const schema = inferSchema(rows);
  const numericCols = schema.columns.filter(c => c.type === 'number').map(c => c.key);

  let summary: CleaningSummary = {
    totalRows: rows.length,
    removedDuplicates: 0,
    droppedRows: 0,
    filledMissing: {},
    outliersRemoved: 0,
    outliersMarked: 0
  };

  // Standardize strings and dates first
  const standardized = rows.map((r) => {
    const out: DataRow = { ...r };
    for (const { key, type } of schema.columns) {
      const v = r[key];
      if (v === null || v === undefined || v === '') continue;
      if (type === 'string') {
        if (typeof v === 'string') out[key] = normalizeValueStr(v, { trim: rules.standardize.trim, casing: rules.standardize.case });
      } else if (type === 'date') {
        const asStr = String(v);
        const formatted = formatDate(asStr, rules.standardize.dateFormat);
        if (formatted) out[key] = formatted;
      }
    }
    return out;
  });

  // Handle missing values and drop rows if necessary
  const cols = schema.columns.map(c => c.key);
  const filledCounts: Record<string, number> = {};

  // Precompute stats for numeric and categorical columns
  const numStats: Record<string, { mean: number; median: number } | undefined> = {};
  const strModes: Record<string, string | undefined> = {};
  for (const key of cols) {
    const colValues = standardized.map(r => r[key]).filter(v => v !== null && v !== undefined && v !== '') as any[];
    const inferredType = schema.columns.find(c => c.key === key)?.type;
    if (inferredType === 'number') {
      const nums = colValues.map(v => typeof v === 'number' ? v : Number(v)).filter(v => !isNaN(v));
      numStats[key] = { mean: mean(nums), median: median(nums) };
    } else if (inferredType === 'string' || inferredType === 'boolean') {
      const vals = colValues.map(v => String(v));
      strModes[key] = mode(vals);
    }
  }

  let afterMissing: DataRow[] = [];
  for (const r of standardized) {
    let row: DataRow = { ...r };
    let dropRow = false;
    for (const { key, type } of schema.columns) {
      const v = row[key];
      const isMissing = v === null || v === undefined || v === '';
      if (!isMissing) continue;

      if (type === 'number') {
        const strat = rules.missing.numeric;
        if (strat === 'drop') { dropRow = true; break; }
        const stats = numStats[key];
        let fill: number = 0;
        if (strat === 'mean') fill = stats?.mean ?? 0;
        else if (strat === 'median') fill = stats?.median ?? 0;
        else fill = 0;
        row[key] = fill;
        filledCounts[key] = (filledCounts[key] ?? 0) + 1;
      } else if (type === 'string') {
        const strat = rules.missing.string;
        if (strat === 'drop') { dropRow = true; break; }
        if (strat === 'mode') row[key] = strModes[key] ?? '';
        else row[key] = '';
        filledCounts[key] = (filledCounts[key] ?? 0) + 1;
      } else if (type === 'boolean') {
        const strat = rules.missing.boolean;
        if (strat === 'drop') { dropRow = true; break; }
        if (strat === 'mode') row[key] = (strModes[key]?.toLowerCase?.() === 'true');
        else row[key] = false;
        filledCounts[key] = (filledCounts[key] ?? 0) + 1;
      }
    }
    if (dropRow) summary.droppedRows++;
    else afterMissing.push(row);
  }
  summary.filledMissing = filledCounts;

  // Dedupe
  let deduped: DataRow[] = afterMissing;
  if (rules.dedupe.enabled) {
    const seen = new Set<string>();
    const keys = rules.dedupe.keys === 'all' ? cols : rules.dedupe.keys;
    const filtered: DataRow[] = [];
    for (const r of afterMissing) {
      const sig = JSON.stringify(keys.reduce((acc, k) => { acc[k] = r[k]; return acc; }, {} as Record<string, unknown>));
      if (!seen.has(sig)) { seen.add(sig); filtered.push(r); }
    }
    summary.removedDuplicates = afterMissing.length - filtered.length;
    deduped = filtered;
  }

  // Outliers
  let finalRows: DataRow[] = deduped;
  if (rules.outliers.handle !== 'none') {
    const colsToUse = (rules.outliers.columns && rules.outliers.columns.length > 0) ? rules.outliers.columns : numericCols;
    if (colsToUse.length > 0 && deduped.length > 0) {
      const zMaps: Record<string, number[]> = {};
      for (const c of colsToUse) {
        const values = deduped.map(r => Number(r[c] ?? NaN));
        const zs = zScores(values.map(v => (isNaN(v) ? 0 : v)));
        zMaps[c] = zs;
      }
      const threshold = rules.outliers.zThreshold;
      if (rules.outliers.handle === 'remove') {
        finalRows = deduped.filter((_, i) => {
          const flagged = Object.values(zMaps).some(arr => Math.abs(arr[i]) > threshold);
          if (flagged) summary.outliersRemoved++;
          return !flagged;
        });
      } else if (rules.outliers.handle === 'mark') {
        finalRows = deduped.map((r, i) => {
          const flagged = Object.entries(zMaps)
            .filter(([_, arr]) => Math.abs(arr[i]) > threshold)
            .map(([col]) => col);
          if (flagged.length > 0) {
            summary.outliersMarked++;
            return { ...r, __outliers__: flagged.join(',') };
          }
          return r;
        });
      }
    }
  }

  return { rows: finalRows, summary };
}
