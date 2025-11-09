"use client";

import React from 'react';
import { DataRow } from "@lib/types";

export default function DataTable({ rows, maxRows = 50 }: { rows: DataRow[]; maxRows?: number }) {
  if (!rows || rows.length === 0) return <div className="small">Kh?ng c? d? li?u ?? hi?n th?.</div>;
  const headers = Array.from(new Set(rows.flatMap(r => Object.keys(r))));
  const view = rows.slice(0, maxRows);
  return (
    <div className="card">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h3 className="section-title">Xem tr??c d? li?u</h3>
        <span className="badge">{rows.length} h?ng</span>
      </div>
      <div style={{ overflow: 'auto', maxHeight: 400 }}>
        <table className="table">
          <thead>
            <tr>
              {headers.map(h => <th key={h}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {view.map((r, i) => (
              <tr key={i}>
                {headers.map(h => <td key={h}>{String(r[h] ?? '')}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > maxRows && <div className="small">Hi?n th? {maxRows}/{rows.length} h?ng...</div>}
    </div>
  );
}
