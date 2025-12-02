import React from 'react';
import { X, Info, HelpCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  patientInfo: string | null;
  onStartSession: () => void;
  sessionActive: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, patientInfo, onStartSession, sessionActive }) => {
  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-30 w-80 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        
        {/* Header (Mobile only close button) */}
        <div className="md:hidden p-4 flex justify-end border-b border-gray-100">
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {/* Start Button Area */}
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={() => {
              onStartSession();
              if (window.innerWidth < 768) onClose();
            }}
            disabled={sessionActive}
            className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg shadow transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {sessionActive ? 'セッション進行中' : '医療面接開始'}
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* Patient Info Section */}
          <section>
            <h3 className="flex items-center gap-2 font-bold text-teal-800 mb-3 pb-2 border-b border-gray-100">
              <Info size={18} />
              予診情報
            </h3>
            <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg border border-gray-100 min-h-[100px]">
              {patientInfo ? (
                <ReactMarkdown>{patientInfo}</ReactMarkdown>
              ) : (
                <span className="text-gray-400 italic">「医療面接開始」ボタンを押すと、ここに患者情報が表示されます。</span>
              )}
            </div>
          </section>

          {/* Hints Section */}
          <section>
            <h3 className="flex items-center gap-2 font-bold text-teal-800 mb-3 pb-2 border-b border-gray-100">
              <HelpCircle size={18} />
              医療面接のヒント
            </h3>
            
            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">1. 基本的な流れ</h4>
                <ul className="list-disc pl-4 space-y-1">
                  <li>導入（挨拶、自己紹介）</li>
                  <li>情報収集（現病歴、既往歴）</li>
                  <li>身体診察（視診・触診・検査）</li>
                  <li>まとめ（評価の説明）</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-1">2. 現病歴聴取 (OPQRST)</h4>
                <ul className="list-none space-y-1">
                  <li><strong className="text-teal-700">O</strong>: 発症様式 (Onset)</li>
                  <li><strong className="text-teal-700">P</strong>: 増悪・寛解 (Palli/Prov)</li>
                  <li><strong className="text-teal-700">Q</strong>: 性質・強さ (Qual/Quan)</li>
                  <li><strong className="text-teal-700">R</strong>: 部位・放散 (Region)</li>
                  <li><strong className="text-teal-700">S</strong>: 随伴症状 (Symptoms)</li>
                  <li><strong className="text-teal-700">T</strong>: 時間経過 (Time)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-1">3. 身体診察のコツ</h4>
                <p className="text-xs leading-relaxed">
                  「どこを」「どのように」診察するか具体的に言語化してください。<br/>
                  例：「内側側副靱帯の圧痛を確認」
                </p>
              </div>
            </div>
          </section>

        </div>
      </div>
    </>
  );
};
