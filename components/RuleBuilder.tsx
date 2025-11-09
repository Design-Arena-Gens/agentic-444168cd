"use client";

import React from 'react';
import { CleaningRules } from "@lib/types";

export default function RuleBuilder({ rules, onChange, onSuggest }: {
  rules: CleaningRules;
  onChange: (r: CleaningRules) => void;
  onSuggest: () => void;
}) {
  return (
    <div className="card">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h3 className="section-title">2) C?u h?nh quy t?c l?m s?ch</h3>
        <button className="button secondary" onClick={onSuggest}>G?i ? b?ng Google AI</button>
      </div>
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div>
          <label>Thi?u (s?):</label>
          <select
            value={rules.missing.numeric}
            onChange={(e) => onChange({ ...rules, missing: { ...rules.missing, numeric: e.target.value as any } })}
          >
            <option value="mean">?i?n mean</option>
            <option value="median">?i?n median</option>
            <option value="zero">?i?n 0</option>
            <option value="drop">Lo?i b? d?ng</option>
          </select>
        </div>
        <div>
          <label>Thi?u (chu?i):</label>
          <select
            value={rules.missing.string}
            onChange={(e) => onChange({ ...rules, missing: { ...rules.missing, string: e.target.value as any } })}
          >
            <option value="mode">?i?n mode</option>
            <option value="empty">?i?n r?ng</option>
            <option value="drop">Lo?i b? d?ng</option>
          </select>
        </div>
        <div>
          <label>Thi?u (boolean):</label>
          <select
            value={rules.missing.boolean}
            onChange={(e) => onChange({ ...rules, missing: { ...rules.missing, boolean: e.target.value as any } })}
          >
            <option value="mode">?i?n mode</option>
            <option value="drop">Lo?i b? d?ng</option>
          </select>
        </div>
        <div>
          <label>Chu?n h?a ch?:</label>
          <select
            value={rules.standardize.case}
            onChange={(e) => onChange({ ...rules, standardize: { ...rules.standardize, case: e.target.value as any } })}
          >
            <option value="none">Gi? nguy?n</option>
            <option value="lower">lowercase</option>
            <option value="upper">UPPERCASE</option>
            <option value="title">Title Case</option>
          </select>
        </div>
        <div>
          <label>Trim kho?ng tr?ng:</label>
          <select
            value={String(rules.standardize.trim)}
            onChange={(e) => onChange({ ...rules, standardize: { ...rules.standardize, trim: e.target.value === 'true' } })}
          >
            <option value="true">C?</option>
            <option value="false">Kh?ng</option>
          </select>
        </div>
        <div>
          <label>??nh d?ng ng?y:</label>
          <select
            value={rules.standardize.dateFormat}
            onChange={(e) => onChange({ ...rules, standardize: { ...rules.standardize, dateFormat: e.target.value as any } })}
          >
            <option value="ISO">ISO</option>
            <option value="yyyy-MM-dd">yyyy-MM-dd</option>
            <option value="dd/MM/yyyy">dd/MM/yyyy</option>
            <option value="MM/dd/yyyy">MM/dd/yyyy</option>
          </select>
        </div>
        <div>
          <label>Lo?i tr?ng l?p:</label>
          <select
            value={String(rules.dedupe.enabled)}
            onChange={(e) => onChange({ ...rules, dedupe: { ...rules.dedupe, enabled: e.target.value === 'true' } })}
          >
            <option value="true">B?t</option>
            <option value="false">T?t</option>
          </select>
          <div className="small">Kh?a: {Array.isArray(rules.dedupe.keys) ? rules.dedupe.keys.join(', ') : 'T?t c? c?t'}</div>
        </div>
        <div>
          <label>X? l? ngo?i lai:</label>
          <select
            value={rules.outliers.handle}
            onChange={(e) => onChange({ ...rules, outliers: { ...rules.outliers, handle: e.target.value as any } })}
          >
            <option value="none">Kh?ng</option>
            <option value="remove">Lo?i b?</option>
            <option value="mark">??nh d?u</option>
          </select>
        </div>
        <div>
          <label>Ng??ng z-score:</label>
          <input
            className="input"
            type="number"
            step="0.1"
            value={rules.outliers.zThreshold}
            onChange={(e) => onChange({ ...rules, outliers: { ...rules.outliers, zThreshold: Number(e.target.value) } })}
          />
        </div>
      </div>
    </div>
  );
}
