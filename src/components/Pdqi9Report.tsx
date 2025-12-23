import { Printer, FileText, CheckCircle, AlertTriangle, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { useState } from 'react';
import type { SoapEvaluationResult } from "@/lib/pdqi9";
import { cn } from "@/lib/utils";

export function Pdqi9Report({ data, soapOriginal }: { data: SoapEvaluationResult, soapOriginal?: any }) {
  const [showFactCheck, setShowFactCheck] = useState(false);

  if (!data || !data.scores) return <div className="p-10 text-center text-slate-500">評価データを読み込んでいます...</div>;

  const qNoteLabels: Record<string, string> = {
    Clear: '明瞭さ',
    Complete: '完全性',
    Concise: '簡潔さ',
    Current: '現状反映',
    Organized: '構成',
    Prioritized: '優先順位',
    Sufficient: '根拠十分'
  };

  const pdqiLabels: Record<string, string> = {
    Accurate: '正確性',
    Thorough: '網羅性',
    Useful: '有用性',
    Organized: '構成',
    Comprehensible: '分かりやすさ',
    Succinct: '簡明さ',
    Synthesized: '統合性',
    InternallyConsistent: '整合性'
  };

  // Recalculate Totals (Frontend Source of Truth)
  const qNoteScores = Object.values(data.scores.q_note || {});
  const pdqiScores = Object.values(data.scores.pdqi_8 || {});
  
  const qNoteTotal = qNoteScores.reduce((sum, item) => sum + item.score_1to5, 0);
  const pdqiTotal = pdqiScores.reduce((sum, item) => sum + item.score_1to5, 0);

  // Q-NOTE Data for Radar Chart
  const qNoteData = Object.entries(data.scores.q_note || {}).map(([key, value]) => ({
    subject: qNoteLabels[key] || key,
    A: value.score_1to5,
    fullMark: 5,
  }));

  // Fact Check Counts
  const supportedCount = data.fact_check?.supported_claims?.length || 0;
  const missingCount = data.fact_check?.missing_from_soap?.length || 0;
  const hallucinationCount = data.fact_check?.hallucination_risk?.length || 0;

  const handlePrint = () => {
    const chartSvg = document.querySelector('#soap-radar-chart-container svg')?.outerHTML || '';
    const dateStr = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    
    if (printWindow) {
        // Generate Print HTML
        printWindow.document.write(`
            <html>
            <head>
                <title>SOAP Evaluation Report</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    @media print { 
                        @page { size: A4; margin: 10mm; }
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; font-family: "Hiragino Mincho ProN", "Yu Mincho", serif; } 
                        .break-avoid { break-inside: avoid; }
                    }
                    body { font-family: "Hiragino Mincho ProN", "Yu Mincho", serif; }
                    .sans { font-family: "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif; }
                </style>
            </head>
            <body class="bg-white text-slate-900 p-8">
                <header class="border-b-2 border-slate-800 pb-4 mb-6 flex justify-between items-end">
                    <div>
                        <h1 class="text-2xl font-bold tracking-widest text-slate-900">SOAPカルテ評価報告書</h1>
                        <p class="text-xs text-slate-500 mt-1">Clinical Reasoning Trainer - Fact-Checked Evaluation</p>
                    </div>
                    <div class="text-right text-sm">
                        <p>実施日: ${dateStr}</p>
                    </div>
                </header>

                <!-- Score Summary -->
                <div class="flex gap-4 mb-6 break-avoid">
                    <div class="flex-1 border border-indigo-200 bg-indigo-50 rounded p-4 text-center">
                        <h3 class="text-xs font-bold text-indigo-800 uppercase mb-1 sans">Q-NOTE Total</h3>
                        <p class="text-3xl font-black text-indigo-700">${qNoteTotal} <span class="text-sm font-normal text-slate-500">/ 35</span></p>
                    </div>
                    <div class="flex-1 border border-teal-200 bg-teal-50 rounded p-4 text-center">
                        <h3 class="text-xs font-bold text-teal-800 uppercase mb-1 sans">PDQI-8 Total</h3>
                        <p class="text-3xl font-black text-teal-700">${pdqiTotal} <span class="text-sm font-normal text-slate-500">/ 40</span></p>
                    </div>
                    <div class="flex-1 border border-slate-200 bg-slate-50 rounded p-4 flex flex-col justify-center">
                        <div class="text-xs font-bold text-slate-500 mb-2 sans">Fact Check Stats</div>
                        <div class="flex justify-between text-xs font-bold text-emerald-700 mb-1"><span>Supported:</span> <span>${supportedCount}</span></div>
                        <div class="flex justify-between text-xs font-bold text-amber-600 mb-1"><span>Missing:</span> <span>${missingCount}</span></div>
                        <div class="flex justify-between text-xs font-bold text-rose-600"><span>Risk:</span> <span>${hallucinationCount}</span></div>
                    </div>
                </div>

                <div class="flex gap-8 mb-6 break-avoid">
                    <!-- Radar Chart -->
                    <div class="w-1/3 flex flex-col items-center justify-center border border-slate-200 rounded p-4 bg-slate-50 min-h-[250px]">
                        <h3 class="text-xs font-bold text-slate-500 mb-2 w-full text-center sans">Q-NOTE Balance</h3>
                        <div class="w-full flex-1 flex items-center justify-center grayscale opacity-90 scale-110">
                            ${chartSvg}
                        </div>
                    </div>

                    <!-- Priority Fixes -->
                    <div class="w-2/3 border border-rose-200 bg-rose-50/30 rounded p-4">
                        <h3 class="font-bold text-sm text-rose-800 border-b border-rose-200 pb-2 mb-2 sans">⚠️ 優先修正ポイント (Top 3)</h3>
                        <div class="space-y-3">
                            ${data.priority_fixes_top3.map((fix, i) => `
                                <div class="text-xs">
                                    <div class="font-bold text-rose-700 mb-1 sans">[${fix.where}] ${fix.issue}</div>
                                    <div class="pl-4 text-slate-700 mb-1">${fix.why}</div>
                                    <div class="pl-4 text-emerald-700 font-mono bg-white inline-block border border-slate-200 px-1 rounded">例: ${fix.example_patch}</div>
                                </div>
                            `).join('')}
                            ${data.priority_fixes_top3.length === 0 ? '<div class="text-center text-slate-400 text-xs py-4">特になし</div>' : ''}
                        </div>
                    </div>
                </div>

                <!-- PDQI-8 Detail Table -->
                <div class="mb-6 border border-slate-300 rounded overflow-hidden break-avoid">
                    <h3 class="font-bold text-sm text-slate-700 bg-slate-100 px-4 py-2 border-b border-slate-300 sans">PDQI-8 詳細評価</h3>
                    <table class="w-full text-xs">
                        <thead class="bg-slate-50 border-b border-slate-200 sans">
                            <tr>
                                <th class="px-3 py-2 text-left w-1/4">項目</th>
                                <th class="px-2 py-2 text-center w-12">点数</th>
                                <th class="px-3 py-2 text-left">評価コメント・改善点</th>
                            </tr>
                        </thead>
                        <tbody class="sans divide-y divide-slate-100">
                            ${Object.entries(data.scores.pdqi_8).map(([key, val]) => `
                                <tr>
                                    <td class="px-3 py-2 font-bold text-slate-700">${pdqiLabels[key] || key}</td>
                                    <td class="px-2 py-2 text-center font-bold">${val.score_1to5}</td>
                                    <td class="px-3 py-2 text-slate-600">
                                        <div class="mb-1">${val.rationale}</div>
                                        ${val.score_1to5 < 5 ? `<div class="text-indigo-600 font-bold">Fix: ${val.one_line_fix}</div>` : ''}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <!-- Fact Check Details -->
                <div class="grid grid-cols-2 gap-4 mb-6 break-avoid">
                    <div class="border border-amber-200 rounded p-4 bg-white">
                        <h3 class="font-bold text-sm text-amber-800 border-b border-amber-100 pb-2 mb-2 sans">記載漏れ (Missing)</h3>
                        <ul class="text-xs space-y-2">
                             ${(data.fact_check?.missing_from_soap || []).length === 0 ? '<li class="text-slate-400">なし</li>' : (data.fact_check?.missing_from_soap || []).map(item => `
                                <li>
                                    <span class="font-bold text-amber-700">・${item.item}</span>
                                    <div class="text-[10px] text-slate-500 pl-2">"${item.evidence_quotes[0] || ''}"</div>
                                </li>
                             `).join('')}
                        </ul>
                    </div>
                     <div class="border border-rose-200 rounded p-4 bg-white">
                        <h3 class="font-bold text-sm text-rose-800 border-b border-rose-100 pb-2 mb-2 sans">幻覚リスク (Hallucination)</h3>
                        <ul class="text-xs space-y-2">
                             ${(data.fact_check?.hallucination_risk || []).length === 0 ? '<li class="text-slate-400">なし</li>' : (data.fact_check?.hallucination_risk || []).map(item => `
                                <li>
                                    <span class="font-bold text-rose-700">[${item.section}] ${item.item}</span>
                                    <div class="text-[10px] text-rose-500 pl-2">${item.why}</div>
                                </li>
                             `).join('')}
                        </ul>
                    </div>
                </div>

                <!-- Original SOAP -->
                ${soapOriginal ? `
                <div class="border border-slate-300 rounded p-4 break-avoid">
                    <h3 class="font-bold text-sm text-slate-800 border-b border-slate-200 pb-2 mb-2 sans">📄 対象SOAPカルテ</h3>
                    <div class="grid grid-cols-1 gap-1 text-[10px] text-slate-600 leading-tight">
                        <div><span class="font-bold">S:</span> ${soapOriginal.subjective.replace(/\n/g, '<br/>')}</div>
                        <div class="mt-1"><span class="font-bold">O:</span> ${soapOriginal.objective.replace(/\n/g, '<br/>')}</div>
                        <div class="mt-1"><span class="font-bold">A:</span> ${soapOriginal.assessment.replace(/\n/g, '<br/>')}</div>
                        <div class="mt-1"><span class="font-bold">P:</span> ${soapOriginal.plan.replace(/\n/g, '<br/>')}</div>
                    </div>
                </div>
                ` : ''}

                <footer class="text-center text-[10px] text-slate-400 mt-6 pt-4 border-t border-slate-100 sans">
                    Generated by Clinical Reasoning Trainer | ${new Date().toISOString().split('T')[0]}
                </footer>

                <script>
                    setTimeout(() => {
                        window.print();
                        window.close();
                    }, 800);
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    } else {
        alert('ポップアップを許可してください');
    }
  };

  return (
    <div className="bg-slate-50 p-6 font-sans text-slate-800 rounded-2xl max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex items-center justify-between pb-4 border-b">
            <div className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-6 h-6 text-indigo-600"/>
                SOAPカルテ評価報告書
            </div>
            <button 
                onClick={handlePrint} 
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
                <Printer className="w-4 h-4" /> 印刷・PDF保存
            </button>
        </header>

        {/* Top Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-indigo-50 flex flex-col items-center justify-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Q-NOTE Total</span>
                {/* Use calculated total */}
                <span className="text-4xl font-black text-indigo-600">{qNoteTotal} <span className="text-lg text-slate-300 font-normal">/ 35</span></span>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-indigo-50 flex flex-col items-center justify-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">PDQI-8 Total</span>
                {/* Use calculated total */}
                <span className="text-4xl font-black text-teal-600">{pdqiTotal} <span className="text-lg text-slate-300 font-normal">/ 40</span></span>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-indigo-50 flex flex-col justify-center px-6">
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Fact Check Overview</span>
                 <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-emerald-700 font-medium">
                        <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4"/> 根拠あり</span>
                        <span>{supportedCount}</span>
                    </div>
                    <div className="flex justify-between text-amber-600 font-medium">
                        <span className="flex items-center gap-1"><AlertTriangle className="w-4 h-4"/> 未記載(Missing)</span>
                        <span>{missingCount}</span>
                    </div>
                    <div className="flex justify-between text-rose-600 font-medium">
                        <span className="flex items-center gap-1"><XCircle className="w-4 h-4"/> 根拠なし(Risk)</span>
                        <span>{hallucinationCount}</span>
                    </div>
                 </div>
            </div>
        </div>

        {/* Data Visualization Section */}
        <div className="grid lg:grid-cols-2 gap-6">
            
            {/* Q-NOTE Radar */}
            <div id="soap-radar-chart-container" className="bg-white p-6 rounded-2xl shadow-sm border">
                <h3 className="font-bold text-slate-700 mb-4 text-center">Q-NOTE (質的評価)</h3>
                <div className="w-full h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={qNoteData}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#475569' }} />
                            <PolarRadiusAxis angle={30} domain={[0, 5]} tickCount={6} />
                            <Radar name="Student" dataKey="A" stroke="#4f46e5" fill="#6366f1" fillOpacity={0.5} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
                {/* Specific Q-NOTE Feedback List */}
                <div className="mt-4 space-y-3">
                    {data.scores.q_note && Object.entries(data.scores.q_note).map(([key, val]) => (
                        val.score_1to5 < 5 && (
                            <div key={key} className="text-xs bg-slate-50 p-2 rounded border border-slate-100">
                                <strong className="text-indigo-700 mr-1">{qNoteLabels[key]}:</strong>
                                <span className="text-slate-600">{val.one_line_fix}</span>
                            </div>
                        )
                    ))}
                </div>
            </div>

            {/* Priority Fixes (Top 3) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border flex flex-col">
                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded text-xs">Correction</span>
                    優先して修正すべき点
                </h3>
                <div className="flex-1 space-y-4">
                    {data.priority_fixes_top3.map((fix, idx) => (
                        <div key={idx} className="bg-rose-50/50 border border-rose-100 rounded-xl p-4">
                             <div className="flex items-center gap-2 mb-2">
                                 <span className="bg-rose-600 text-white w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold">
                                     {idx + 1}
                                 </span>
                                 <span className="font-bold text-rose-800 text-sm">
                                     [{fix.where}] {fix.issue}
                                 </span>
                             </div>
                             <p className="text-xs text-rose-800/80 mb-2 pl-7 leading-relaxed">
                                 {fix.why}
                             </p>
                             <div className="pl-7 text-xs bg-white rounded p-2 border border-rose-100 font-mono text-slate-600">
                                 <span className="text-emerald-600 font-bold">例: </span>
                                 {fix.example_patch}
                             </div>
                        </div>
                    ))}
                    {data.priority_fixes_top3.length === 0 && (
                        <div className="text-center py-10 text-slate-400 text-sm">
                            修正が必要な重大な問題は見つかりませんでした。素晴らしい！
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Fact Check Detail Accordion */}
        {data.fact_check && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <button 
                    onClick={() => setShowFactCheck(!showFactCheck)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-100"
                >
                    <div className="font-bold text-slate-700 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                        事実照合レポート (Fact Check)
                    </div>
                    {showFactCheck ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </button>
                
                {showFactCheck && (
                    <div className="p-6 bg-slate-50/50 space-y-6 animate-in slide-in-from-top-2 duration-200">
                        {/* Missing Items */}
                        {data.fact_check.missing_from_soap.length > 0 && (
                             <div>
                                 <h4 className="text-sm font-bold text-amber-700 mb-3 flex items-center gap-2">
                                     <AlertTriangle className="w-4 h-4" /> 記載漏れの重要情報 (Missing)
                                 </h4>
                                 <ul className="space-y-2">
                                     {data.fact_check.missing_from_soap.map((item, i) => (
                                         <li key={i} className="bg-white border border-amber-200 p-3 rounded-lg text-xs shadow-sm">
                                             <span className="inline-block px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold mr-2 text-[10px]">
                                                 {item.importance}
                                             </span>
                                             <span className="text-slate-700 font-medium">{item.item}</span>
                                             <div className="mt-1 text-slate-400 text-[10px] pl-2 border-l-2 border-amber-100">
                                                 "{item.evidence_quotes[0]}"
                                             </div>
                                         </li>
                                     ))}
                                 </ul>
                             </div>
                        )}

                        {/* Hallucination Risks */}
                        {data.fact_check.hallucination_risk.length > 0 && (
                             <div>
                                 <h4 className="text-sm font-bold text-rose-700 mb-3 flex items-center gap-2">
                                     <XCircle className="w-4 h-4" /> 根拠のない記載 (Hallucination Risk)
                                 </h4>
                                 <ul className="space-y-2">
                                     {data.fact_check.hallucination_risk.map((item, i) => (
                                         <li key={i} className="bg-white border border-rose-200 p-3 rounded-lg text-xs shadow-sm">
                                             <span className="font-bold text-rose-800 mr-2">[{item.section}]</span>
                                             <span className="text-slate-700">{item.item}</span>
                                             <p className="mt-1 text-rose-600/80 text-[10px]">{item.why}</p>
                                         </li>
                                     ))}
                                 </ul>
                             </div>
                        )}

                        {/* Supported (Summary) */}
                         <div>
                             <h4 className="text-sm font-bold text-emerald-700 mb-3 flex items-center gap-2">
                                 <CheckCircle className="w-4 h-4" /> 根拠が確認された記載
                             </h4>
                             <div className="text-xs text-slate-600 bg-white p-4 rounded-lg border border-emerald-100 italic">
                                 {data.fact_check.supported_claims.slice(0, 5).map(c => `"${c.claim_text}"`).join(", ")}
                                 {data.fact_check.supported_claims.length > 5 && ` ...他 ${data.fact_check.supported_claims.length - 5} 件`}
                             </div>
                         </div>
                    </div>
                )}
            </div>
        )}

        {/* Evaluation Scores Detail Table (PDQI-8) */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
             <h3 className="font-bold text-slate-700 mb-4">PDQI-8 ドメイン評価詳細</h3>
             <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left border-collapse">
                     <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-xs">
                         <tr>
                             <th className="px-4 py-3 rounded-tl-lg">項目</th>
                             <th className="px-4 py-3 text-center">スコア</th>
                             <th className="px-4 py-3">評価理由 / 改善点</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                         {Object.entries(data.scores.pdqi_8).map(([key, val]) => (
                             <tr key={key} className="hover:bg-slate-50/50">
                                 <td className="px-4 py-3 font-bold text-slate-700 whitespace-nowrap">
                                     {pdqiLabels[key] || key}
                                 </td>
                                 <td className="px-4 py-3 text-center">
                                     <span className={cn(
                                         "inline-block w-8 h-8 leading-8 rounded-full font-bold text-white text-xs",
                                         val.score_1to5 >= 4 ? "bg-teal-500" : 
                                         val.score_1to5 === 3 ? "bg-amber-400" : "bg-rose-500"
                                     )}>
                                         {val.score_1to5}
                                     </span>
                                 </td>
                                 <td className="px-4 py-3">
                                     <p className="text-slate-700 text-xs mb-1">{val.rationale}</p>
                                     {val.score_1to5 < 5 && (
                                         <p className="text-indigo-600 text-xs font-bold flex items-center gap-1">
                                             <CheckCircle className="w-3 h-3" /> Fix: {val.one_line_fix}
                                         </p>
                                     )}
                                 </td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
        </div>

        <div className="bg-slate-800 text-slate-200 p-6 rounded-2xl shadow-sm">
             <h3 className="font-bold text-white mb-2">総評</h3>
             <p className="text-sm leading-relaxed whitespace-pre-wrap">{data.totals.overall_comment}</p>
        </div>

    </div>
  );
}
