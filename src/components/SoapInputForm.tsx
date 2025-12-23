import React, { useState } from 'react';
import { Save, X } from 'lucide-react';

export interface SoapData {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

interface SoapInputFormProps {
  initialData?: SoapData;
  onSubmit: (data: SoapData) => void;
  onCancel: () => void;
  isEvaluating?: boolean;
}

export function SoapInputForm({ initialData, onSubmit, onCancel, isEvaluating = false }: SoapInputFormProps) {
  const [data, setData] = useState<SoapData>(initialData || {
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
  });

  const handleChange = (field: keyof SoapData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const isValid = Object.values(data).every(val => val.trim().length > 0);

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            📝 SOAP形式カルテ作成
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            本日の診療記録を作成してください。
          </p>
        </div>
        <button 
          onClick={onCancel}
          className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Form Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
        {/* Subjective */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
          <label className="block text-sm font-bold text-indigo-900 mb-2 flex justify-between">
            <span>S (Subjective) - 主訴・病歴</span>
            <span className="text-xs font-normal text-slate-400">患者の言葉、自覚症状</span>
          </label>
          <textarea
            value={data.subjective}
            onChange={e => handleChange('subjective', e.target.value)}
            className="w-full min-h-[100px] p-2 text-sm text-slate-700 placeholder-slate-300 border-0 focus:ring-0 resize-none bg-transparent"
            placeholder="例：昨日の部活中に右膝を捻った。歩くと痛い。"
          />
        </div>

        {/* Objective */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
          <label className="block text-sm font-bold text-indigo-900 mb-2 flex justify-between">
            <span>O (Objective) - 客観的所見</span>
            <span className="text-xs font-normal text-slate-400">視診、触診、徒手検査法、画像所見</span>
          </label>
          <textarea
            value={data.objective}
            onChange={e => handleChange('objective', e.target.value)}
            className="w-full min-h-[100px] p-2 text-sm text-slate-700 placeholder-slate-300 border-0 focus:ring-0 resize-none bg-transparent"
            placeholder="例：右膝軽度腫脹あり。Lachman test (+)。圧痛（＋）"
          />
        </div>

        {/* Assessment */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
          <label className="block text-sm font-bold text-indigo-900 mb-2 flex justify-between">
            <span>A (Assessment) - 評価・判断</span>
            <span className="text-xs font-normal text-slate-400">診断、重症度、予後予測</span>
          </label>
          <textarea
            value={data.assessment}
            onChange={e => handleChange('assessment', e.target.value)}
            className="w-full min-h-[100px] p-2 text-sm text-slate-700 placeholder-slate-300 border-0 focus:ring-0 resize-none bg-transparent"
            placeholder="例：右膝前十字靭帯損傷の疑い。急性期炎症あり。"
          />
        </div>

        {/* Plan */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
          <label className="block text-sm font-bold text-indigo-900 mb-2 flex justify-between">
            <span>P (Plan) - 治療・計画</span>
            <span className="text-xs font-normal text-slate-400">処置、指導、次回予定</span>
          </label>
          <textarea
            value={data.plan}
            onChange={e => handleChange('plan', e.target.value)}
            className="w-full min-h-[100px] p-2 text-sm text-slate-700 placeholder-slate-300 border-0 focus:ring-0 resize-none bg-transparent"
            placeholder="例：RICE処置指導。整形外科への対診を指示。"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 bg-white shrink-0 flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors"
        >
          キャンセル
        </button>
        <button
          onClick={() => onSubmit(data)}
          disabled={!isValid || isEvaluating}
          className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-md transition-all transform active:scale-95"
        >
          {isEvaluating ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>評価中...</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>SOAPを評価する</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
