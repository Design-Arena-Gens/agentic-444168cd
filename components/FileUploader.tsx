"use client";

import React, { useRef, useState } from 'react';
import Papa from 'papaparse';
import { DataRow } from "@lib/types";

export default function FileUploader({ onData }: { onData: (rows: DataRow[]) => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFiles(file: File) {
    setError(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result || '');
      const res = Papa.parse<Record<string, string>>(content, { header: true, skipEmptyLines: true });
      if (res.errors?.length) {
        setError(res.errors.map(e => e.message).join('; '));
        return;
      }
      onData(res.data as unknown as DataRow[]);
    };
    reader.onerror = () => setError('Kh?ng th? ??c t?p.');
    reader.readAsText(file);
  }

  return (
    <div className="card">
      <h3 className="section-title">1) T?i l?n CSV</h3>
      <div className="row">
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="input"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFiles(f);
          }}
        />
      </div>
      <div className="small" style={{ marginTop: 6 }}>
        {fileName ? `?? ch?n: ${fileName}` : '??nh d?ng: CSV (header)'}
      </div>
      {error && <div className="small" style={{ color: '#ff9aa2', marginTop: 8 }}>{error}</div>}
    </div>
  );
}
