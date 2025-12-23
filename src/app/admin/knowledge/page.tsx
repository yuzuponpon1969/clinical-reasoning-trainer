"use client";

import { useState, useEffect } from 'react';
import { Upload, FileText, Trash2, CheckCircle } from 'lucide-react';

interface KnowledgeItem {
    id: string;
    title: string;
    uploadedAt: string;
    contentLength: number;
    metadata?: {
        archetypeId?: string;
        regionId?: string;
        categoryId?: string;
    }
}

import { ARCHETYPES, BODY_REGIONS } from '@/lib/data';

export default function KnowledgeBasePage() {
    const [items, setItems] = useState<KnowledgeItem[]>([]);
    const [uploading, setUploading] = useState(false);

    const [selectedArchetype, setSelectedArchetype] = useState(ARCHETYPES[0].id);
    const [selectedRegion, setSelectedRegion] = useState(BODY_REGIONS[0].id);
    const [selectedCategory, setSelectedCategory] = useState('');

    // Derived state for categories based on selection
    const availableCategories = (() => {
        // Try to find categories from Archetype first (if defined there) or BodyRegion
        // The data structure is a bit complex: Archetypes have navigationGroups which are like regions.
        // Let's simplify: User selects Archetype -> Region -> Category.
        
        const archetype = ARCHETYPES.find(a => a.id === selectedArchetype);
        if (!archetype) return [];
        
        // In the data.ts, archetypes have `navigationGroups` which act as regions.
        // Let's use those if available.
        if (archetype.navigationGroups) {
            const group = archetype.navigationGroups.find(g => g.id === selectedRegion);
            return group?.categories || [];
        }
        return [];
    })();

    // Auto-select first category when region changes
    useEffect(() => {
        if (availableCategories.length > 0) {
            setSelectedCategory(availableCategories[0].id);
        } else {
            setSelectedCategory('');
        }
    }, [selectedArchetype, selectedRegion]);

    useEffect(() => {
        loadItems();
    }, []);

    const loadItems = async () => {
        try {
            const res = await fetch('/api/admin/save-knowledge');
            if (res.ok) setItems(await res.json());
        } catch(e) { console.error(e); }
    };

    const [isDragging, setIsDragging] = useState(false);

    const processUpload = async (file: File) => {
        if (!selectedCategory) {
            alert("Category is not selected. Please select a category first.");
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('archetypeId', selectedArchetype);
        formData.append('regionId', selectedRegion);
        formData.append('categoryId', selectedCategory);

        try {
            const res = await fetch('/api/admin/save-knowledge', {
                method: 'POST',
                body: formData
            });
            if (res.ok) {
                await loadItems();
                alert("ナレッジドキュメントが追加されました！");
            } else {
                alert("アップロードに失敗しました。");
            }
        } catch(e) {
            console.error(e);
            alert("ファイルアップロードエラー");
        } finally {
            setUploading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            processUpload(e.target.files[0]);
            e.target.value = ""; // Reset input
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.type === 'application/pdf') {
                processUpload(droppedFile);
            } else {
                alert("PDFファイルをアップロードしてください。");
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8 font-sans">
            <div className="max-w-4xl mx-auto space-y-8">
                <header>
                    <h1 className="text-3xl font-bold text-slate-800">ナレッジベース管理 (Knowledge Base)</h1>
                    <p className="text-slate-500 mt-2">AIの臨床推論の根拠となる医学ガイドラインや教科書（PDF）をアップロード・管理します。</p>
                </header>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h2 className="text-xl font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <Upload className="w-5 h-5 text-indigo-600" />
                        新規ドキュメント登録
                    </h2>

                    {/* Hierarchy Selection Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">アーキタイプ (Archetype)</label>
                            <select 
                                aria-label="Select Archetype"
                                value={selectedArchetype} 
                                onChange={(e) => setSelectedArchetype(e.target.value)}
                                className="w-full p-2 border rounded-lg bg-slate-50"
                            >
                                {ARCHETYPES.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">部位 (Region)</label>
                            <select 
                                aria-label="Select Region"
                                value={selectedRegion} 
                                onChange={(e) => setSelectedRegion(e.target.value)}
                                className="w-full p-2 border rounded-lg bg-slate-50"
                            >
                                {/* We should probably filter regions based on archetype if they are specific, 
                                    but for now let's show regions defined in the archetype's navigationGroups */}
                                {ARCHETYPES.find(a => a.id === selectedArchetype)?.navigationGroups?.map(r => (
                                    <option key={r.id} value={r.id}>{r.label}</option>
                                )) || <option disabled>No regions</option>}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">カテゴリ・疾患名 (Category)</label>
                            <select 
                                aria-label="Select Category"
                                value={selectedCategory} 
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full p-2 border rounded-lg bg-slate-50"
                                disabled={availableCategories.length === 0}
                            >
                                {availableCategories.map(c => (
                                    <option key={c.id} value={c.id}>{c.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div 
                        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                            isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'
                        }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        {uploading ? (
                            <div className="animate-pulse text-indigo-600 font-bold">PDFを解析・インデックス中...</div>
                        ) : (
                            <label className="cursor-pointer block w-full h-full">
                                <span className="block text-slate-400 mb-2">
                                    {isDragging ? "ドロップしてアップロード" : "ドラッグ＆ドロップ または クリックしてPDFを選択"}
                                </span>
                                <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
                                {!isDragging && (
                                    <div className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold shadow-md hover:bg-indigo-700">
                                        ファイルを選択
                                    </div>
                                )}
                            </label>
                        )}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h2 className="text-xl font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-emerald-600" />
                        登録済みナレッジ ({items.length})
                    </h2>
                    {items.length === 0 ? (
                        <div className="text-slate-400 text-sm italic">ドキュメントはまだありません。</div>
                    ) : (
                        <ul className="space-y-3">
                            {items.map(item => (
                                <li key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <div>
                                        <div className="font-bold text-slate-800">{item.title}</div>
                                        <div className="flex gap-2 text-xs mt-1">
                                            {item.metadata && (
                                                <>
                                                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">{item.metadata.archetypeId}</span>
                                                    <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded">{item.metadata.regionId}</span>
                                                    <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded">{item.metadata.categoryId}</span>
                                                </>
                                            )}
                                        </div>
                                        <div className="text-xs text-slate-500 mt-1">
                                            {(item.contentLength / 1000).toFixed(1)}k chars • Uploaded {new Date(item.uploadedAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                                        {/* Future: Add delete button */}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
