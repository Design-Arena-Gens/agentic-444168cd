"use client";

import { useMemo, useState } from 'react';
import FileUploader from "@components/FileUploader";
import DataTable from "@components/DataTable";
import RuleBuilder from "@components/RuleBuilder";
import { CleaningRules, DataRow } from "@lib/types";
import { cleanData, inferSchema } from "@lib/cleaning";
import { toCsv } from "@lib/csv";

const defaultRules: CleaningRules = {
  missing: { numeric: 'mean', string: 'mode', boolean: 'mode' },
  dedupe: { enabled: true, keys: 'all' },
  standardize: { trim: true, case: 'none', dateFormat: 'ISO' },
  outliers: { handle: 'none', zThreshold: 3.0 }
};

export default function Page() {
  const [rows, setRows] = useState<DataRow[]>([]);
  const [rules, setRules] = useState<CleaningRules>(defaultRules);
  const [cleaned, setCleaned] = useState<DataRow[] | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const schema = useMemo(() => inferSchema(rows), [rows]);

  function applyClean() {
    const { rows: out, summary } = cleanData(rows, rules);
    setCleaned(out);
    setSummary(summary);
  }

  async function suggest() {
    try {
      setBusy(true); setError(null);
      const res = await fetch('/api/suggest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sampleRows: rows.slice(0, 50) }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'G?i ? th?t b?i');
      if (data?.rules) {
        setRules((prev) => ({
          missing: { ...prev.missing, ...data.rules.missing },
          dedupe: { ...prev.dedupe, ...data.rules.dedupe },
          standardize: { ...prev.standardize, ...data.rules.standardize },
          outliers: { ...prev.outliers, ...data.rules.outliers }
        }));
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  function downloadCsv() {
    if (!cleaned) return;
    const csv = toCsv(cleaned);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'cleaned.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid">
      <div className="grid" style={{ gap: 16 }}>
        <FileUploader onData={(rs) => { setRows(rs); setCleaned(null); setSummary(null); }} />
        {rows.length > 0 && (
          <RuleBuilder rules={rules} onChange={setRules} onSuggest={suggest} />
        )}
        {rows.length > 0 && (
          <div className="card">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <h3 className="section-title">3) Th?c thi</h3>
              <div className="row">
                <button className="button" onClick={applyClean}>Ch?y l?m s?ch</button>
                <button className="button ghost" onClick={downloadCsv} disabled={!cleaned} style={{ marginLeft: 8 }}>T?i CSV s?ch</button>
              </div>
            </div>
            {busy && <div className="small">?ang g?i Google AI ?? g?i ?...</div>}
            {error && <div className="small" style={{ color: '#ff9aa2' }}>{error}</div>}
            <hr />
            <div className="small">
              <strong>L??c ??:</strong> {schema.columns.map(c => `${c.key}:${c.type}`).join(' | ')}
            </div>
            {summary && (
              <div className="small" style={{ marginTop: 8 }}>
                <div>T?ng h?ng: {summary.totalRows}</div>
                <div>B? tr?ng: {summary.removedDuplicates} | B? d?ng: {summary.droppedRows}</div>
                <div>?i?n thi?u: {Object.entries(summary.filledMissing || {}).map(([k,v]) => `${k}:${v}`).join(', ') || '0'}</div>
                <div>Ngo?i lai - lo?i b?: {summary.outliersRemoved} | ??nh d?u: {summary.outliersMarked}</div>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="grid" style={{ gap: 16 }}>
        <DataTable rows={cleaned ?? rows} />
        <div className="card">
          <h3 className="section-title">Ghi ch?</h3>
          <div className="small">
            - H? th?ng g?i ? quy t?c v?i Google Gemini d?a tr?n m?u d? li?u.<br/>
            - X? l?: thi?u d? li?u, tr?ng l?p, chu?n h?a ??nh d?ng, ngo?i lai (z-score).<br/>
            - D? li?u kh?ng r?i m?y khi l?m s?ch (client), ch? m?u nh? g?i ?? g?i ?.
          </div>
        </div>
      </div>
    </div>
  );
}
