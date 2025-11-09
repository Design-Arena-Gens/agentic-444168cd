export type DataRow = Record<string, string | number | boolean | null>;

export type ColumnType = 'number' | 'string' | 'boolean' | 'date' | 'unknown';

export interface InferredSchema {
  columns: Array<{ key: string; type: ColumnType }>;
}

export interface MissingValueStrategy {
  numeric: 'mean' | 'median' | 'zero' | 'drop';
  string: 'mode' | 'empty' | 'drop';
  boolean: 'mode' | 'drop';
}

export interface DedupeOptions {
  enabled: boolean;
  keys: string[] | 'all';
}

export interface StandardizeOptions {
  trim: boolean;
  case: 'none' | 'lower' | 'upper' | 'title';
  dateFormat: 'ISO' | 'yyyy-MM-dd' | 'dd/MM/yyyy' | 'MM/dd/yyyy';
}

export interface OutlierOptions {
  handle: 'none' | 'remove' | 'mark';
  zThreshold: number; // e.g., 3.0
  columns?: string[]; // if undefined, apply to numeric columns
}

export interface CleaningRules {
  missing: MissingValueStrategy;
  dedupe: DedupeOptions;
  standardize: StandardizeOptions;
  outliers: OutlierOptions;
}

export interface CleaningSummary {
  totalRows: number;
  removedDuplicates: number;
  droppedRows: number;
  filledMissing: Record<string, number>; // by column
  outliersRemoved: number;
  outliersMarked: number;
}

export interface SuggestionRequest {
  sampleRows: DataRow[];
}

export interface SuggestedRules {
  rules: Partial<CleaningRules>;
  rationale?: string;
}
