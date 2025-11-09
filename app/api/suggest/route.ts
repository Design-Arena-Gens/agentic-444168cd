import { NextRequest, NextResponse } from 'next/server';
import { getGemini } from '@lib/googleai';
import { SuggestedRules } from '@lib/types';

export async function POST(req: NextRequest) {
  try {
    const { sampleRows } = await req.json();
    if (!Array.isArray(sampleRows) || sampleRows.length === 0) {
      return NextResponse.json({ error: 'sampleRows r?ng' }, { status: 400 });
    }
    const genAI = getGemini();
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    const prompt = `B?n l? chuy?n gia l?m s?ch d? li?u. D?a v?o m?u d? li?u JSON sau, ?? xu?t quy t?c l?m s?ch ph? h?p v? tr? v? JSON theo schema:
{
  "rules": {
    "missing": { "numeric": "mean|median|zero|drop", "string": "mode|empty|drop", "boolean": "mode|drop" },
    "dedupe": { "enabled": true, "keys": "all" },
    "standardize": { "trim": true, "case": "none|lower|upper|title", "dateFormat": "ISO|yyyy-MM-dd|dd/MM/yyyy|MM/dd/yyyy" },
    "outliers": { "handle": "none|remove|mark", "zThreshold": number }
  },
  "rationale": string
}
D? li?u m?u (t?i ?a 30 d?ng):\n${JSON.stringify(sampleRows.slice(0, 30))}
Ch? xu?t JSON h?p l?, kh?ng gi?i th?ch th?m.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    // Attempt to extract JSON
    const jsonText = text.trim().replace(/^```json\n?|\n?```$/g, '');
    const parsed = JSON.parse(jsonText) as SuggestedRules;
    return NextResponse.json(parsed);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? '?? x?y ra l?i' }, { status: 500 });
  }
}
