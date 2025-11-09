import Papa from 'papaparse';
import { DataRow } from './types';

export function parseCsv(content: string): DataRow[] {
  const res = Papa.parse<Record<string, string>>(content, { header: true, skipEmptyLines: true });
  if (res.errors?.length) {
    throw new Error(res.errors.map(e => e.message).join('; '));
  }
  return (res.data || []) as unknown as DataRow[];
}

export function toCsv(rows: DataRow[]): string {
  return Papa.unparse(rows as any);
}
