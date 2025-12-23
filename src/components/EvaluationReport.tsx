import { ArrowLeft, Book, Check, X, Printer } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface EvaluationData {
  total_score: number;
  dimensions: { key: string; label: string; score: number; max: number; comment: string }[];
  detailed_feedback: {
    good_points: string;
    improvements: string;
    next_steps: string;
    patient_voice: string;
  };
  strengths: string[];
  improvements: string[];
  rationale_links: { title: string; url: string }[];
}

export function EvaluationReport({ data }: { data: EvaluationData }) {
  if (!data) return <div className="p-10 text-center">結果を読み込んでいます...</div>;

  // Radar Chart Data Preparation
  const chartData = data.dimensions?.map((d: any) => ({
    subject: d.label,
    A: d.score, // Student
    fullMark: d.max,
  })) || [];

  return (
    <div id="print-area" className="bg-slate-50 p-6 font-sans text-slate-800 rounded-2xl print:p-0 print:bg-white">
        <div className="max-w-5xl mx-auto space-y-8 print:space-y-4">
            <header className="flex items-center justify-between pb-4 border-b">
                <div className="text-2xl font-bold text-slate-800">医療面接評価レポート (mini-CEX)</div>
                <button 
                    onClick={() => {
                        const chartSvg = document.querySelector('#radar-chart-container svg')?.outerHTML || '';
                        const dateStr = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
                        const printWindow = window.open('', '_blank', 'width=1000,height=800');
                        
                        if (printWindow) {
                            printWindow.document.write(`
                                <html>
                                <head>
                                    <title>Evaluation Report</title>
                                    <script src="https://cdn.tailwindcss.com"></script>
                                    <style>
                                        @media print { 
                                            @page { size: A4; margin: 15mm; }
                                            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; font-family: "Hiragino Mincho ProN", "Yu Mincho", serif; } 
                                        }
                                        body { font-family: "Hiragino Mincho ProN", "Yu Mincho", serif; }
                                        .sans { font-family: "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif; }
                                    </style>
                                </head>
                                <body class="bg-white text-slate-900">
                                    <header class="border-b-2 border-slate-800 pb-4 mb-6 flex justify-between items-end">
                                        <div>
                                            <h1 class="text-2xl font-bold tracking-widest text-slate-900">臨床推論・医療面接 評価報告書</h1>
                                            <p class="text-xs text-slate-500 mt-1">Clinical Reasoning & Interview Skills Assessment (mini-CEX)</p>
                                        </div>
                                        <div class="text-right text-sm">
                                            <p>実施日: ${dateStr}</p>
                                            <p class="font-bold text-slate-700 mt-1">総合スコア: <span class="text-xl">${data.total_score}</span> / 36</p>
                                        </div>
                                    </header>

                                    <div class="flex gap-8 mb-8">
                                        <div class="w-1/3 flex flex-col items-center justify-center border border-slate-200 rounded p-4 bg-slate-50 min-h-[250px]">
                                            <h3 class="text-xs font-bold text-slate-500 mb-2 w-full text-center sans">コンピテンシーバランス</h3>
                                            <div class="w-full flex-1 flex items-center justify-center grayscale opacity-90 scale-110">
                                                ${chartSvg}
                                            </div>
                                        </div>

                                        <div class="w-2/3">
                                            <table class="w-full text-xs border-collapse border border-slate-300">
                                                <thead class="bg-slate-100 sans">
                                                    <tr>
                                                        <th class="border border-slate-300 px-3 py-2 text-left w-[30%]">評価項目</th>
                                                        <th class="border border-slate-300 px-2 py-2 text-center w-16">点数</th>
                                                        <th class="border border-slate-300 px-3 py-2 text-left">フィードバックコメント</th>
                                                    </tr>
                                                </thead>
                                                <tbody class="sans">
                                                    ${data.dimensions.map(d => `
                                                        <tr>
                                                            <td class="border border-slate-300 px-3 py-2 font-bold text-slate-800 break-words">${d.label}</td>
                                                            <td class="border border-slate-300 px-2 py-2 text-center font-bold">${d.score}<span class="text-slate-400 font-normal">/6</span></td>
                                                            <td class="border border-slate-300 px-3 py-2 text-slate-600 leading-snug text-[10px]">${d.comment}</td>
                                                        </tr>
                                                    `).join('')}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div class="grid grid-cols-2 gap-4 mb-6">
                                        <div class="border border-slate-300 rounded p-4">
                                            <h3 class="font-bold text-sm text-slate-800 border-b border-slate-200 pb-2 mb-2 sans">✅ 良かった点 (Strengths)</h3>
                                            <div class="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap sans">${data.detailed_feedback?.good_points || ''}</div>
                                        </div>
                                        <div class="border border-slate-300 rounded p-4">
                                            <h3 class="font-bold text-sm text-slate-800 border-b border-slate-200 pb-2 mb-2 sans">⚠️ 改善が必要な点 (Improvements)</h3>
                                            <div class="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap sans">${data.detailed_feedback?.improvements || ''}</div>
                                        </div>
                                        <div class="border border-slate-300 rounded p-4">
                                            <h3 class="font-bold text-sm text-slate-800 border-b border-slate-200 pb-2 mb-2 sans">📚 次回の学習目標 (Next Steps)</h3>
                                            <div class="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap sans">${data.detailed_feedback?.next_steps || ''}</div>
                                        </div>
                                        <div class="border border-slate-300 rounded p-4 bg-slate-50">
                                            <h3 class="font-bold text-sm text-slate-800 border-b border-slate-200 pb-2 mb-2 sans">💭 患者の声 (Patient's Voice)</h3>
                                            <div class="text-xs text-slate-700 italic leading-relaxed whitespace-pre-wrap sans">"${data.detailed_feedback?.patient_voice || ''}"</div>
                                        </div>
                                    </div>

                                    <footer class="text-center text-[10px] text-slate-400 mt-8 pt-4 border-t border-slate-100 sans">
                                        Generated by Clinical Reasoning Trainer System | ${new Date().toISOString().split('T')[0]}
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
                    }} 
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors print:hidden"
                >
                    <Printer className="w-4 h-4" /> 結果を印刷
                </button>
            </header>

            <div className="grid lg:grid-cols-2 gap-6 print:block print:space-y-6">
                {/* Visuals: Radar Chart */}
                <div id="radar-chart-container" className="bg-white p-6 rounded-2xl shadow-sm border flex flex-col items-center print:shadow-none print:border-none print:break-inside-avoid">
                    <h3 className="font-bold text-slate-700 mb-4 w-full text-center">コンピテンシー評価（レーダーチャート）</h3>
                    <div className="w-full h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 6]} tickCount={7} />
                                <Radar name="Student" dataKey="A" stroke="#4f46e5" fill="#6366f1" fillOpacity={0.5} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Score Table */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border overflow-hidden print:shadow-none print:border-none print:break-inside-avoid">
                    <h3 className="font-bold text-slate-700 mb-4">詳細スコア</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-xs print:bg-white">
                                <tr>
                                    <th className="px-4 py-3">評価項目</th>
                                    <th className="px-4 py-3 text-center">点数</th>
                                    <th className="px-4 py-3">コメント</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.dimensions?.map((d: any) => (
                                    <tr key={d.key} className="hover:bg-slate-50/50">
                                        <td className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">{d.label}</td>
                                        <td className="px-4 py-3 text-center font-bold text-indigo-600">
                                            {d.score === 0 ? <span className="text-slate-400 text-xs">測定不能</span> : d.score}
                                            <span className="text-slate-300 text-xs font-normal">/6</span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 text-xs leading-relaxed">{d.comment}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-4 text-right">
                        <span className="text-sm font-bold text-slate-500 mr-2">合計スコア:</span>
                        <span className="text-2xl font-bold text-indigo-600">{data.total_score}</span>
                    </div>
                </div>
            </div>

            {/* Detailed Feedback Sections */}
            <div className="grid md:grid-cols-2 gap-6 print:gap-4 print:break-inside-avoid">
                {/* Good Points */}
                <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 print:bg-white print:border-slate-200">
                    <h3 className="font-bold text-emerald-800 mb-3 flex items-center gap-2 print:text-slate-800"><Check className="w-5 h-5"/> 良かった点</h3>
                    <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {data.detailed_feedback?.good_points || "読み込み中..."}
                    </div>
                </div>

                {/* Improvements */}
                <div className="bg-rose-50/50 p-6 rounded-2xl border border-rose-100 print:bg-white print:border-slate-200">
                    <h3 className="font-bold text-rose-800 mb-3 flex items-center gap-2 print:text-slate-800"><X className="w-4 h-4"/> 改善が必要な点</h3>
                    <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {data.detailed_feedback?.improvements || "読み込み中..."}
                    </div>
                </div>
            </div>

            {/* Next Steps & Patient Voice */}
            <div className="grid md:grid-cols-2 gap-6 print:gap-4 print:break-inside-avoid">
                <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 print:bg-white print:border-slate-200">
                    <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2 print:text-slate-800"><Book className="w-4 h-4"/> 次回意識するポイント</h3>
                    <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {data.detailed_feedback?.next_steps || "読み込み中..."}
                    </div>
                </div>

                <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100 relative print:bg-white print:border-slate-200">
                    <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-2 print:text-slate-800">💬 患者役からの感想コメント</h3>
                    <div className="text-sm text-slate-700 italic leading-relaxed bg-white p-4 rounded-xl shadow-sm border border-amber-100/50 print:border-none print:shadow-none print:p-0 print:not-italic">
                        "{data.detailed_feedback?.patient_voice || "特にありません"}"
                    </div>
                </div>
            </div>
            
        </div>
    </div>
  );
}
