"use client";

import { useState } from "react";
import { Upload, FileText, ArrowRight, CheckCircle, Loader2 } from "lucide-react";
import { ARCHETYPES, BODY_REGIONS } from "@/lib/data";

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Hierarchy State
  const [selectedArchetype, setSelectedArchetype] = useState(ARCHETYPES[0].id);
  const [selectedRegion, setSelectedRegion] = useState(BODY_REGIONS[0].id);
  const [selectedCategory, setSelectedCategory] = useState(BODY_REGIONS[0].categories[0]?.id || "");

  // Derived Options
  const currentArchetype = ARCHETYPES.find(a => a.id === selectedArchetype);
  const currentRegion = BODY_REGIONS.find(r => r.id === selectedRegion);
  const categoryOptions = currentRegion?.categories || [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setSaved(false);
      setMessage(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    setResult(null);
    setMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
        const res = await fetch('/api/admin/parse-pdf', {
            method: 'POST',
            body: formData,
        });

        const contentType = res.headers.get("content-type");
        if (!res.ok) {
            const errorText = await res.text();
            console.error("API Error Status:", res.status);
            console.error("API Error Body:", errorText);
            throw new Error(`Server returned ${res.status}: ${errorText.substring(0, 100)}...`);
        }
        
        if (!contentType || !contentType.includes("application/json")) {
             const errorText = await res.text();
             console.error("Invalid Content-Type:", contentType);
             console.error("Response Body:", errorText);
             throw new Error(`Invalid server response (not JSON): ${errorText.substring(0, 50)}...`);
        }

        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setResult(data.extracted);
    } catch (e: any) {
        console.error("Analysis failed:", e);
        alert("PDF解析エラー: " + e.message);
    } finally {
        setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/save-case', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...result,
            archetypeId: selectedArchetype,
            regionId: selectedRegion,
            categoryId: selectedCategory
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setSaved(true);
      setMessage("成功！症例がライブラリに保存されました。");
    } catch (e: any) {
      alert("保存エラー: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center">
        <header className="w-full max-w-3xl mb-8 border-b pb-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-800">症例PDFインポート (Case Import)</h1>
            <a href="/select" className="text-sm text-blue-600 hover:underline">アプリに戻る</a>
        </header>

        <div className="w-full max-w-3xl bg-white rounded-xl shadow border p-8 space-y-6">
            
            {/* Upload Area */}
            {/* Hierarchy Selection Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">アーキタイプ (Archetype)</label>
                    <select 
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                        value={selectedArchetype} 
                        onChange={e => setSelectedArchetype(e.target.value)}
                    >
                        {ARCHETYPES.map(a => (
                            <option key={a.id} value={a.id}>{a.label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">部位 (Region)</label>
                    <select 
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                        value={selectedRegion} 
                        onChange={e => {
                            setSelectedRegion(e.target.value);
                            // Reset category when region changes
                            const region = BODY_REGIONS.find(r => r.id === e.target.value);
                            if (region && region.categories.length > 0) {
                                setSelectedCategory(region.categories[0].id);
                            }
                        }}
                    >
                        {BODY_REGIONS.map(r => (
                            <option key={r.id} value={r.id}>{r.label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">カテゴリ・疾患名 (Category)</label>
                    <select 
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                        value={selectedCategory} 
                        onChange={e => setSelectedCategory(e.target.value)}
                    >
                        {categoryOptions.map(c => (
                            <option key={c.id} value={c.id}>{c.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Upload Area */}
            <div 
                className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-colors
                    ${file ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:bg-slate-50'}
                `}
                onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }}
                onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        const droppedFile = e.dataTransfer.files[0];
                        if (droppedFile.type === 'application/pdf') {
                            setFile(droppedFile);
                            setResult(null);
                            setSaved(false);
                            setMessage(null);
                        } else {
                            alert("PDFファイルをアップロードしてください。");
                        }
                    }
                }}
            >
                <Upload className={`w-10 h-10 mb-4 ${file ? 'text-blue-500' : 'text-slate-400'}`} />
                <h3 className="text-lg font-medium text-slate-700">
                    {file ? file.name : "症例PDFをアップロード"}
                </h3>
                <p className="text-sm text-slate-500 mb-6">
                    {file ? "「ドキュメント解析」をクリックして開始" : "ドラッグ＆ドロップ または クリックして選択"}
                </p>
                
                <input 
                    type="file" 
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-slate-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
                />
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center">
                <div className="text-sm text-slate-500">
                    {analyzing && "10MBまでのファイルをサポート"}
                </div>
                <button 
                    onClick={handleAnalyze} 
                    disabled={!file || analyzing || saved}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                    {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                    {analyzing ? "AI解析中..." : "ドキュメント解析"}
                </button>
            </div>

            {/* Results Preview */}
            {result && (
                <div className="mt-8 border-t pt-8 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-emerald-600 font-bold">
                            <CheckCircle className="w-5 h-5" />
                            抽出成功
                        </div>
                        <button 
                            onClick={handleSave}
                            disabled={saved || saving}
                            className={`px-4 py-2 rounded-lg font-bold transition-colors ${saved ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                        >
                            {saving ? "保存中..." : saved ? "ライブラリに保存完了" : "ライブラリに保存"}
                        </button>
                    </div>
                    
                    {message && (
                        <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded-lg text-sm text-center">
                            {message} <a href="/select" className="underline font-bold">選択画面へ移動</a>
                        </div>
                    )}

                    <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                        <pre className="text-xs text-emerald-400 font-mono">
                            {JSON.stringify(result, null, 2)}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
}
