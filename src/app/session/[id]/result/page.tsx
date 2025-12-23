"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Book, Check, X } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { cn } from "@/lib/utils";

export default function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem(`session_${id}_result`);
    if (stored) {
        setData(JSON.parse(stored));
    }
  }, [id]);

  if (!data) return <div className="p-10 text-center">Loading results...</div>;

  // Radar Chart Data Preparation
  const chartData = data.dimensions?.map((d: any) => ({
    subject: d.label,
    A: d.score,
    fullMark: d.max,
  })) || [];

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-800">
        <div className="max-w-5xl mx-auto space-y-8">
            <header className="flex items-center justify-between">
                <Link href="/select" className="flex items-center text-slate-500 hover:text-slate-800 font-bold">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back to Menu
                </Link>
                <div className="text-2xl font-bold text-slate-800">Evaluation Result (mini-CEX)</div>
            </header>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Visuals: Radar Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border flex flex-col items-center">
                    <h3 className="font-bold text-slate-700 mb-4 w-full text-center">Competency Radar</h3>
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
                <div className="bg-white p-6 rounded-2xl shadow-sm border overflow-hidden">
                    <h3 className="font-bold text-slate-700 mb-4">Detailed Scores</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-xs">
                                <tr>
                                    <th className="px-4 py-3">Category</th>
                                    <th className="px-4 py-3 text-center">Score</th>
                                    <th className="px-4 py-3">Comment</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.dimensions?.map((d: any) => (
                                    <tr key={d.key} className="hover:bg-slate-50/50">
                                        <td className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">{d.label}</td>
                                        <td className="px-4 py-3 text-center font-bold text-indigo-600">
                                            {d.score === 0 ? <span className="text-slate-400 text-xs">N/A</span> : d.score}
                                            <span className="text-slate-300 text-xs font-normal">/6</span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 text-xs leading-relaxed">{d.comment}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-4 text-right">
                        <span className="text-sm font-bold text-slate-500 mr-2">Total Score:</span>
                        <span className="text-2xl font-bold text-indigo-600">{data.total_score}</span>
                    </div>
                </div>
            </div>

            {/* Detailed Feedback Sections */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Good Points */}
                <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100">
                    <h3 className="font-bold text-emerald-800 mb-3 flex items-center gap-2"><Check className="w-5 h-5"/> 良かった点</h3>
                    <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {data.detailed_feedback?.good_points || "読み込み中..."}
                    </div>
                </div>

                {/* Improvements */}
                <div className="bg-rose-50/50 p-6 rounded-2xl border border-rose-100">
                    <h3 className="font-bold text-rose-800 mb-3 flex items-center gap-2"><X className="w-4 h-4"/> 改善が必要な点</h3>
                    <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {data.detailed_feedback?.improvements || "読み込み中..."}
                    </div>
                </div>
            </div>

            {/* Next Steps & Patient Voice */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                    <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2"><Book className="w-4 h-4"/> 次回意識するポイント</h3>
                    <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {data.detailed_feedback?.next_steps || "読み込み中..."}
                    </div>
                </div>

                <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100 relative">
                    <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-2">💬 患者役からの感想コメント</h3>
                    <div className="text-sm text-slate-700 italic leading-relaxed bg-white p-4 rounded-xl shadow-sm border border-amber-100/50">
                        "{data.detailed_feedback?.patient_voice || "特にありません"}"
                    </div>
                </div>
            </div>
            
        </div>
    </div>
  );
}
