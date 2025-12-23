"use client";

import { useState, useRef, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Send, User, FileText, CheckCircle, HelpCircle, Lightbulb, Stethoscope, Award, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { EvaluationReport } from "@/components/EvaluationReport";
import { Pdqi9Report } from "@/components/Pdqi9Report";
import { type SoapEvaluationResult } from "@/lib/pdqi9";
import { SoapInputForm, type SoapData } from "@/components/SoapInputForm";
import { isFeatureEnabled, FeatureFlags } from "@/lib/features";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export default function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("AIが回答を作成中..."); // Dynamic loading text
  const [finishing, setFinishing] = useState(false);
  const [notes, setNotes] = useState("");
  const [showGuide, setShowGuide] = useState(true); // Show guide by default on start
  
  // Session Metadata
  const [caseId, setCaseId] = useState<string>("");
  const [caseTitle, setCaseTitle] = useState<string>("");
  const [patientLabel, setPatientLabel] = useState<string>("");
  const [interviewFrames, setInterviewFrames] = useState<{ title: string; items: string[] }[]>([]);
  const [patientProfile, setPatientProfile] = useState<any>(null);

  // SOAP Charting State
  const [showSoap, setShowSoap] = useState(false);
  const [soapData, setSoapData] = useState<SoapData | null>(null);
  const [isEvaluatingSoap, setIsEvaluatingSoap] = useState(false);
  const [pdqi9Result, setPdqi9Result] = useState<SoapEvaluationResult | null>(null);
  const [showPdqi9Modal, setShowPdqi9Modal] = useState(false);

  // Evaluation State
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [evaluationData, setEvaluationData] = useState(null);
  const [showJudgmentModal, setShowJudgmentModal] = useState(false);
  const [judgmentData, setJudgmentData] = useState({ pathology: '', complications: '', rationale: '' });

  const bottomRef = useRef<HTMLDivElement>(null);

  // Load initial context
  useEffect(() => {
    // Only access sessionStorage after mount
    if (typeof window === 'undefined') return;

    const initMsg = sessionStorage.getItem(`session_${id}_init`);
    const cId = sessionStorage.getItem(`session_${id}_caseId`);
    const cTitle = sessionStorage.getItem(`session_${id}_title`);
    const pLabel = sessionStorage.getItem(`session_${id}_patient`);

    if (initMsg && initMsg !== "null") {
       setMessages(prev => prev.length === 0 ? [{ role: "assistant", content: initMsg }] : prev);
    } else if (!initMsg || initMsg === "null") {
       setMessages(prev => prev.length === 0 ? [{ role: "system", content: "**【システム】**\n医療面接を開始します。まずは**自己紹介（挨拶）**と**患者氏名の確認**から始めてください。" }] : prev);
    }

    if (cTitle) setCaseTitle(cTitle);
    if (pLabel) setPatientLabel(pLabel);
    if (cId) setCaseId(cId);
    
    // Load frames and profile
    const iFrames = sessionStorage.getItem(`session_${id}_frames`);
    const pProfile = sessionStorage.getItem(`session_${id}_profile`);
    
    if (iFrames) { try { setInterviewFrames(JSON.parse(iFrames)); } catch(e) { console.error("Failed to parse frames", e); } }
    if (pProfile) { try { setPatientProfile(JSON.parse(pProfile)); } catch(e) { console.error("Failed to parse profile", e); } }
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || loading) return;
    
    const userMsg: Message = { role: "user", content: textToSend };
    setMessages(prev => [...prev, userMsg]);
    if (!textOverride) setInput(""); // Clear input only if manual send
    
    // Use unified loading text per user request
    setLoadingText("AIが回答を作成中...");
    
    setLoading(true);

    try {
      if (!caseId) {
          console.error("Case ID not found in state");
          alert("エラー: セッション情報（Case ID）が読み込めませんでした。ページを更新するか、最初からやり直してください。");
          return;
      }
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            messages: [...messages, userMsg],
            caseId: caseId
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`Network error: ${response.status}`);
      }
      
      // Parse JSON response containing role and content
      const responseText = await response.text();
      console.log('Raw API Response:', responseText.substring(0, 200));
      
      let aiResponse;
      try {
        aiResponse = JSON.parse(responseText);
        console.log('Parsed AI Response:', aiResponse);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.error('Failed to parse:', responseText);
        throw new Error('AIの応答形式が不正です');
      }
      
      // Validate response structure
      if (!aiResponse.content) {
        console.error('Invalid response structure:', aiResponse);
        throw new Error('AIの応答に必要な情報が含まれていません');
      }
      
      // Add assistant message with full content AND preserve the AI role
      // Fix: Replace literal "\n" with actual newlines to fix Markdown rendering
      const sanitizedContent = aiResponse.content.replace(/\\n/g, '\n');
      
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: sanitizedContent,
        aiRole: aiResponse.role // Preserve whether AI is acting as patient or instructor
      }]);
    } catch (e: any) {
      console.error('Chat Error:', e);
      setMessages(prev => [...prev, { role: "system", content: `エラー: ${e.message || 'AIとの通信に失敗しました'}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdvice = () => {
      sendMessage("アドバイスをお願いします。次に何をすべきでしょうか？");
  };

  const handleJudgment = () => {
      setShowJudgmentModal(true);
  };

  const submitJudgment = () => {
      const msg = `【最終判断】現時点での評価は以下の通りです。
主たる病態：${judgmentData.pathology || 'なし'}
疑われる合併症・関連所見：${judgmentData.complications || 'なし'}
根拠：${judgmentData.rationale || '記載なし'}`;
      sendMessage(msg);
      setShowJudgmentModal(false);
      setJudgmentData({ pathology: '', complications: '', rationale: '' });
  };


  const finishSession = async () => {
    setFinishing(true);
    try {
        const res = await fetch('/api/session/finish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_id: id,
                messages: messages,
                caseId: caseId,
                userSummary: notes // Sending the student's notes as summary
            })
        });
        const data = await res.json();
        // Save result to local storage to display on result page (simplifying data passthrough)
        localStorage.setItem(`session_${id}_result`, JSON.stringify(data));
        router.push(`/session/${id}/result`);
    } catch (e) {
        alert("Error finishing session");
        setFinishing(false);
    }
  };
  
  const handleEvaluation = async () => {
      if (!confirm('医療面接の評価（mini-CEX）をリクエストしますか？（セッションは継続します）')) return;
      
      setLoading(true);
      try {
        const res = await fetch('/api/session/finish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_id: id,
                messages: messages,
                caseId: caseId,
                userSummary: notes
            })
        });
        const data = await res.json();
        setEvaluationData(data);
        setShowEvaluation(true);
      } catch (e) {
        alert("Evaluation failed.");
      } finally {
        setLoading(false);
      }
  };

  const handleSoapEvaluation = async (data: SoapData) => {
    setSoapData(data);
    setIsEvaluatingSoap(true);
    
    try {
        const response = await fetch('/api/evaluate/soap', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                soapData: data,
                chatHistory: messages,
                caseId: caseId
            })
        });

        if (!response.ok) throw new Error('Evaluation failed');
        
        const result: SoapEvaluationResult = await response.json();
        setPdqi9Result(result);
        setShowPdqi9Modal(true);
    } catch (error) {
        console.error("Evaluation error:", error);
        alert("評価中にエラーが発生しました。");
    } finally {
        setIsEvaluatingSoap(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans relative">
      
      {/* PDQI-9 Report Modal */}
      {showPdqi9Modal && pdqi9Result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-200 scrollbar-thin scrollbar-thumb-slate-300">
              <button 
                  onClick={() => setShowPdqi9Modal(false)}
                  className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors z-10"
              >
                  <X className="w-6 h-6 text-slate-500" />
              </button>
              <div className="p-8">
                  <Pdqi9Report data={pdqi9Result} soapOriginal={soapData} />
                  <div className="mt-8 flex justify-center">
                    <button 
                        onClick={() => setShowPdqi9Modal(false)}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-lg"
                    >
                        評価レポートを閉じて継続
                    </button>
                  </div>
              </div>
           </div>
        </div>
      )}

        {/* Evaluation Modal */}
        {showEvaluation && evaluationData && (
            <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowEvaluation(false)}>
                <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto shadow-2xl relative" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setShowEvaluation(false)} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200 z-10">
                        <X className="w-6 h-6 text-slate-600" />
                    </button>
                    <EvaluationReport data={evaluationData} />
                    <div className="p-6 bg-slate-50 border-t flex justify-end">
                        <button onClick={() => setShowEvaluation(false)} className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">
                            Continue Session
                        </button>
                    </div>
                </div>
            </div>
        )}
        
        {/* Judgment Modal */}
        {showJudgmentModal && (
            <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowJudgmentModal(false)}>
                <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-6 border-b pb-4">
                        <h2 className="text-xl font-bold text-indigo-800 flex items-center gap-2">
                            <Stethoscope className="w-6 h-6" />
                            最終判断 (Clinical Judgment)
                        </h2>
                        <button onClick={() => setShowJudgmentModal(false)} className="text-slate-400 hover:text-slate-600">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg text-sm text-indigo-800 mb-4">
                            これまで得られた情報から、現時点でのあなたの判断を入力してください。これに基づきAIがフィードバックを行います。
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">1. 主たる病態 (Primary Diagnosis)</label>
                            <input 
                                type="text" 
                                className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="例：右膝前十字靭帯損傷疑い"
                                value={judgmentData.pathology}
                                onChange={e => setJudgmentData({...judgmentData, pathology: e.target.value})}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">2. 疑われる合併症・関連所見 (Complications / Findings)</label>
                            <input 
                                type="text" 
                                className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="例：内側半月板損傷の可能性、関節血腫あり"
                                value={judgmentData.complications}
                                onChange={e => setJudgmentData({...judgmentData, complications: e.target.value})}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">3. その根拠 (Rationale)</label>
                            <textarea 
                                className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none min-h-[100px]"
                                placeholder="例：ラックマンテスト陽性、受傷時のPop音、膝崩れ感があるため。"
                                value={judgmentData.rationale}
                                onChange={e => setJudgmentData({...judgmentData, rationale: e.target.value})}
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <button 
                                onClick={() => setShowJudgmentModal(false)}
                                className="px-5 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                キャンセル
                            </button>
                            <button 
                                onClick={submitJudgment}
                                disabled={!judgmentData.pathology}
                                className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-lg shadow-indigo-200"
                            >
                                決定して送信
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Guide Modal */}
        {showGuide && (
            <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowGuide(false)}>
                <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl p-6" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <HelpCircle className="w-6 h-6 text-indigo-600" />
                            トレーニング開始ガイド
                        </h2>
                        <button onClick={() => setShowGuide(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
                    </div>
                    <div className="prose prose-sm max-w-none text-slate-600 space-y-4">
                        <p>医療面接トレーナーへようこそ。このアプリは、AI模擬患者との対話を通じて、<strong>医療面接スキル、鑑別判断、臨床推論能力</strong>を鍛えるツールです。</p>
                        
                        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                             <h3 className="text-indigo-900 font-bold mb-2">トレーニングの流れ</h3>
                             <ol className="list-decimal pl-5 space-y-2">
                                <li><strong>開始</strong>: 予診情報（左側）を確認し、挨拶から面接を始めてください。</li>
                                <li><strong>実践</strong>: 病歴聴取と身体診察を行います。
                                    <ul className="list-disc pl-5 mt-1 text-xs">
                                        <li>身体診察は「どこを」「どのように」診るか具体的に伝えてください（例：「膝の腫脹を確認します」「ラックマンテストを行います」）。</li>
                                    </ul>
                                </li>
                                <li><strong>推論</strong>: 十分な情報が集まったら、「疾患名を判断する」ボタンを使用します。</li>
                                <li><strong>評価</strong>: 最後に「医療面接を評価する」ボタンで、AI指導役からフィードバックを受け取ります。</li>
                             </ol>
                        </div>
                        <p className="text-xs text-slate-400">画面外をクリックして閉じる</p>
                    </div>
                </div>
            </div>
        )}

        {/* Left Sidebar: Patient & Notes */}
        <aside className="w-72 bg-white/80 backdrop-blur-md border-r border-slate-200 flex flex-col hidden xl:flex z-10">
            <div className="p-5 border-b border-slate-100">
                <div className="flex items-center gap-2 text-indigo-600 font-bold mb-3">
                    <User className="w-5 h-5" />
                    <span className="tracking-tight">予診票 (Patient Profile)</span>
                </div>
                
                {patientProfile ? (
                    <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 text-xs text-slate-700 space-y-2 font-medium leading-relaxed">
                         <div className="flex gap-2"><span className="text-indigo-900 font-bold min-w-[60px]">氏名:</span> {patientProfile.name}</div>
                         <div className="flex gap-2"><span className="text-indigo-900 font-bold min-w-[60px]">年齢:</span> {patientProfile.age}・{patientProfile.gender}</div>
                         <div className="flex gap-2"><span className="text-indigo-900 font-bold min-w-[60px]">職業:</span> {patientProfile.occupation}</div>
                         <div className="my-2 border-t border-indigo-200/50"></div>
                         <div className="flex gap-2"><span className="text-indigo-900 font-bold min-w-[60px]">主訴:</span> {patientProfile.chiefComplaint}</div>
                         <div className="flex gap-2"><span className="text-indigo-900 font-bold min-w-[60px]">発生:</span> {patientProfile.onsetDate}</div>
                         <div className="flex gap-2"><span className="text-indigo-900 font-bold min-w-[60px]">経緯:</span> {patientProfile.history}</div>
                         <div className="my-2 border-t border-indigo-200/50"></div>
                         <div className="flex gap-2"><span className="text-indigo-900 font-bold min-w-[90px]">痛みの程度:</span> {patientProfile.painScale}/10</div>
                         <div className="flex gap-2"><span className="text-indigo-900 font-bold min-w-[90px]">日常生活支障:</span> {patientProfile.adlScale}/10</div>
                         <div className="flex gap-2"><span className="text-indigo-900 font-bold min-w-[90px]">スポーツ支障:</span> {patientProfile.sportsScale}/10</div>
                    </div>
                ) : (
                    <div className="bg-indigo-50 p-3 rounded-2xl border border-indigo-100">
                        <div className="text-sm font-bold text-indigo-900">{patientLabel || "Unknown"}</div>
                        <div className="text-xs text-indigo-600 mt-1 font-medium">{caseTitle || "Clinical Case"}</div>
                    </div>
                )}
            </div>
            
            <div className="flex-1 p-5 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-slate-600 font-bold mb-1 text-sm uppercase tracking-wider">
                    <FileText className="w-4 h-4" />
                    Clinical Notes
                </div>
                <textarea 
                    className="flex-1 w-full p-4 text-sm border-slate-200 rounded-2xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 active:ring-indigo-500/20 outline-none resize-none transition-all shadow-inner"
                    placeholder="Write your findings here..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                />
            </div>


        </aside>

        {/* Main Chat Area */}
        <main className={cn(
            "flex-1 flex flex-col relative w-full shadow-2xl bg-white border-slate-100 transition-all duration-300 ease-in-out",
            showSoap 
                ? "xl:rounded-none xl:my-0 border-r" // Full Mode: No margins, no rounding, flush with sidebar
                : "max-w-5xl mx-auto xl:my-4 xl:rounded-3xl xl:overflow-hidden" // Card Mode: Centered, floating, rounded
        )}>
            <header className="h-14 bg-white border-b flex items-center px-4 justify-center md:hidden">
                 <span className="font-bold text-slate-700">Exam Room 1</span>
            </header>
            
            {/* Desktop Header for Guide */}
            <header className="hidden md:flex h-12 bg-white/50 border-b items-center px-6 justify-between">
                <div className="text-sm font-bold text-slate-400">SESSION ID: {id.substring(0,8)}</div>
                <button onClick={() => setShowGuide(true)} className="text-sm text-indigo-600 font-bold flex items-center gap-1 hover:text-indigo-800 transition-colors">
                    <HelpCircle className="w-4 h-4" /> Usage Guide
                </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {messages.map((m, i) => {
                    const isUser = m.role === 'user';
                    // CRITICAL FIX: Use aiRole field from API response instead of content detection
                    const isInstructor = !isUser && (m as any).aiRole === 'instructor';

                    return (
                        <div key={i} className={cn("flex w-full gap-3", isUser ? "justify-end" : "justify-start")}>
                            {!isUser && (
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1",
                                    isInstructor ? "bg-amber-100 text-amber-600" : "bg-indigo-100 text-indigo-600"
                                )}>
                                    {isInstructor ? <Stethoscope className="w-5 h-5" /> : <User className="w-5 h-5" />}
                                </div>
                            )}

                            <div className={cn(
                                "max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm relative group",
                                isUser 
                                    ? "bg-blue-600 text-white rounded-tr-none" 
                                    : isInstructor
                                        ? "bg-amber-50 text-slate-800 border border-amber-200 rounded-tl-none"
                                        : "bg-white text-slate-800 border border-slate-200 rounded-tl-none"
                            )}>
                                {/* Label for Instructor/Patient to be explicit */}
                                {!isUser && (
                                    <div className="text-[10px] font-bold mb-1 opacity-70 flex items-center gap-1">
                                        {isInstructor ? (
                                            <span className="text-amber-700">指導柔道整復師 (Instructor)</span>
                                        ) : (
                                            <span className="text-indigo-700">模擬患者 (Patient)</span>
                                        )}
                                    </div>
                                )}
                                
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {m.content}
                                </ReactMarkdown>
                            </div>

                            {isUser && (
                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-1">
                                    <span className="text-xs font-bold">You</span>
                                </div>
                            )}
                        </div>
                    );
                })}
                {loading && (
                    <div className="flex justify-start animate-in fade-in duration-300">
                        <div className="bg-slate-100 border border-slate-200 text-slate-600 rounded-2xl rounded-bl-none px-4 py-3 text-sm flex items-center gap-2 shadow-sm">
                            <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                            </div>
                            <span className="font-medium">{loadingText}</span>
                        </div>
                    </div>
                )}
                <div ref={bottomRef} className="h-4" />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t space-y-3">
                <div className="max-w-3xl mx-auto relative flex items-center gap-2">
                    <input 
                        className="flex-1 bg-slate-100 border-0 rounded-full px-5 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                        placeholder={input.includes("【最終判断】") ? "テンプレートを編集して根拠を記入..." : "メッセージを入力..."}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                        disabled={loading}
                    />
                    <button 
                        onClick={() => sendMessage()}
                        disabled={!input.trim() || loading}
                        className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
                
                {/* Action Buttons */}
                <div className="max-w-3xl mx-auto flex gap-2 md:gap-4 overflow-x-auto pb-1">
                    <button onClick={handleAdvice} disabled={loading} className="flex-1 min-w-[120px] py-2 px-3 rounded-lg border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 hover:text-blue-600 transition-colors flex items-center justify-center gap-2 bg-white">
                        <Lightbulb className="w-4 h-4" /> アドバイス
                    </button>
                    <button onClick={handleJudgment} disabled={loading} className="flex-1 min-w-[120px] py-2 px-3 rounded-lg border border-indigo-200 text-indigo-700 text-xs font-bold hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 bg-white">
                        <Stethoscope className="w-4 h-4" /> 疾患判断
                    </button>
                    <button onClick={handleEvaluation} disabled={loading} className="flex-1 min-w-[120px] py-2 px-3 rounded-lg border border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-50 transition-colors flex items-center justify-center gap-2 bg-white">
                        <Award className="w-4 h-4" /> 評価を依頼
                    </button>

                    {/* SOAP Chart Button (Feature Flagged) */}
                    {isFeatureEnabled('SOAP_CHART') && (
                        <button
                            onClick={() => setShowSoap(!showSoap)}
                            className={cn(
                                "flex-1 min-w-[120px] py-2 px-3 rounded-lg border text-xs font-bold transition-colors flex items-center justify-center gap-2",
                                showSoap 
                                    ? "bg-slate-700 text-white border-slate-700 hover:bg-slate-800" 
                                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                            )}
                            title={showSoap ? "カルテを閉じる" : "SOAP形式カルテを作成"}
                        >
                            <FileText className="w-4 h-4" />
                            <span>{showSoap ? "閉じる" : "カルテ作成"}</span>
                        </button>
                    )}
                </div>
            </div>
        </main>

        {/* Right Sidebar (Hints OR SOAP) */}
        <aside className={cn(
            "bg-slate-50/80 backdrop-blur-sm border-l border-white/50 flex flex-col hidden lg:flex overflow-y-auto p-4 gap-4 z-10 print:hidden transition-all duration-300 ease-in-out",
            showSoap ? "w-[45%]" : "w-80"
        )}>
            {showSoap ? (
                // SOAP Charting Mode
                <SoapInputForm 
                    initialData={soapData || undefined}
                    onCancel={() => setShowSoap(false)}
                    onSubmit={handleSoapEvaluation}
                    isEvaluating={isEvaluatingSoap}
                />
            ) : (
                // Standard Hint Mode
                <>
            {interviewFrames.length > 0 && (
                <div className="space-y-4">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Interview Frame</div>
                    {interviewFrames.map((frame, idx) => (
                        <div key={idx} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                            <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                <span className="w-1 h-4 bg-gradient-to-b from-blue-400 to-indigo-500 rounded-full inline-block"></span>
                                {frame.title}
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {frame.items.map((item, i) => (
                                    <span key={i} className="px-3 py-1 bg-slate-50 text-slate-600 text-xs font-medium rounded-lg border border-slate-200">
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {/* Medical Interview Hints */}
            <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                    <Lightbulb className="w-3 h-3" /> Interview Hints
                </div>
                
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-amber-100/50 space-y-4">
                    <div>
                        <h4 className="text-xs font-bold text-amber-700 mb-1">OPQRST (現病歴)</h4>
                        <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
                            <li><strong>O</strong>nset (発症様式)</li>
                            <li><strong>P</strong>alliative (寛解/増悪)</li>
                            <li><strong>Q</strong>uality (性質・強度)</li>
                            <li><strong>R</strong>egion (部位・放散)</li>
                            <li><strong>S</strong>ymptoms (随伴症状)</li>
                            <li><strong>T</strong>ime (時間経過)</li>
                        </ul>
                    </div>
                    
                    <div>
                        <h4 className="text-xs font-bold text-teal-700 mb-1">SAMPLE (関連)</h4>
                        <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
                            <li><strong>S</strong>ignes (症状)</li>
                            <li><strong>A</strong>llergies (アレルギー)</li>
                            <li><strong>M</strong>edications (薬)</li>
                            <li><strong>P</strong>ast history (既往歴)</li>
                            <li><strong>L</strong>ast meal (最終飲食)</li>
                            <li><strong>E</strong>vents (受傷機転)</li>
                        </ul>
                    </div>
                    
                    <div>
                        <h4 className="text-xs font-bold text-indigo-700 mb-1">Physical Exam</h4>
                         <p className="text-xs text-slate-500 mb-1 leading-tight">具体的に指示してください</p>
                        <ul className="text-[10px] text-slate-600 space-y-1 bg-slate-50 p-2 rounded">
                            <li>✅ "内側裂隙の圧痛を..."</li>
                            <li>✅ "ラックマンテストを..."</li>
                            <li>❌ "膝を診ます" (曖昧)</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-xs font-bold text-rose-700 mb-1">Red Flags</h4>
                        <p className="text-[10px] text-slate-500">夜間痛、安静時痛、発熱、説明不能な体重減少</p>
                    </div>
                </div>
            </div>
                </>
            )}
        </aside>
    </div>
  );
}
