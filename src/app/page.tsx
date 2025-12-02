'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Menu, Download } from 'lucide-react';
import { Message, AIResponse } from '@/lib/types';
import { MessageBubble } from '@/components/MessageBubble';
import { InputArea } from '@/components/InputArea';
import { Sidebar } from '@/components/Sidebar';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [patientInfo, setPatientInfo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sessionActive, setSessionActive] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleStartSession = async () => {
    if (sessionActive && !confirm('現在のセッションを終了し、新しい医療面接を開始しますか？会話履歴はリセットされます。')) {
      return;
    }

    setMessages([]);
    setPatientInfo(null);
    setSessionActive(true);
    setIsLoading(true);
    setSidebarOpen(false); // Close sidebar on mobile if open

    try {
      // Send empty message list to trigger system prompt's initial behavior
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [] }),
      });

      if (!response.ok) throw new Error('API Error');

      const data: AIResponse = await response.json();
      
      // Extract patient info if it's the first message
      if (data.role === 'patient' || data.content.includes('予診票')) {
        setPatientInfo(data.content);
        
        // Extract patient name for greeting suggestion
        const nameMatch = data.content.match(/■\s*患者名：\s*(.+)/);
        const patientName = nameMatch ? nameMatch[1].trim() : '〇〇';
        
        const greetingMsg = `新しい患者シナリオが設定されました。予診情報を確認し、医療面接を開始してください。\n\n例：「こんにちは。本日担当する（あなたの名前）です。お名前は${patientName}さんでよろしかったでしょうか？」`;
        
        setMessages([
          { role: 'instructor', content: greetingMsg }
        ]);
      } else {
        // Fallback if AI doesn't return patient info first (shouldn't happen with current prompt)
        setMessages([{ role: data.role, content: data.content }]);
      }

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'instructor', content: 'エラーが発生しました。もう一度お試しください。' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const newMessages = [...messages, { role: 'user', content } as Message];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) throw new Error('API Error');

      const data: AIResponse = await response.json();
      setMessages(prev => [...prev, { role: data.role, content: data.content }]);

      // Check if session ended (evaluation)
      if (data.role === 'instructor' && (data.content.includes('mini-CEX評価スケール') || data.content.includes('詳細フィードバック'))) {
        setSessionActive(false);
        setMessages(prev => [...prev, { role: 'instructor', content: 'トレーニングセッションが完了しました。評価結果を確認してください。\n次のトレーニングを開始するには、サイドバーの「医療面接開始」ボタンを押してください。' }]);
      }

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'instructor', content: 'エラーが発生しました。通信環境を確認してください。' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = (action: 'advice' | 'judgment' | 'evaluate') => {
    if (action === 'advice') {
      sendMessage("アドバイスをお願いします。次に何をすべきでしょうか？");
    } else if (action === 'judgment') {
      const template = "【最終判断】現時点での評価は以下の通りです。\n主たる病態：〇〇\n疑われる合併症・関連所見：△△\n根拠：□□";
      setInput(template);
      // Focus is handled by InputArea being controlled, but we might want to select the text?
      // For now just setting it is enough.
    } else if (action === 'evaluate') {
      if (messages.length < 4) {
        alert("評価を行うには、もう少し面接と診察を進めてください。");
        return;
      }
      if (confirm('医療面接の評価をリクエストします。よろしいですか？')) {
        sendMessage("私の医療面接を評価してください");
      }
    }
  };

  const downloadLog = () => {
    const logContent = messages.map(m => `[${m.role}] ${m.content}`).join('\n\n');
    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `training-log-${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        patientInfo={patientInfo}
        onStartSession={handleStartSession}
        sessionActive={sessionActive}
      />

      <div className="flex-1 flex flex-col w-full">
        {/* Header */}
        <header className="bg-teal-800 text-white p-4 flex items-center justify-between shadow-md z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden p-1 hover:bg-teal-700 rounded">
              <Menu size={24} />
            </button>
            <h1 className="font-bold text-lg md:text-xl truncate">医療面接トレーナー【膝が痛い】</h1>
          </div>
          <button 
            onClick={downloadLog}
            disabled={messages.length === 0}
            className="flex items-center gap-2 text-sm bg-teal-700 hover:bg-teal-600 px-3 py-1.5 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={16} />
            <span className="hidden sm:inline">ログ保存</span>
          </button>
        </header>

        {/* Chat Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 scroll-smooth">
          <div className="max-w-4xl mx-auto flex flex-col gap-4 min-h-full">
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-center p-8">
                <div className="bg-white p-8 rounded-2xl shadow-sm max-w-md">
                  <h2 className="text-xl font-bold text-teal-800 mb-4">トレーニングを開始しましょう</h2>
                  <p className="mb-6">サイドバー（左上のメニュー）から「医療面接開始」ボタンを押して、新しいセッションを始めてください。</p>
                  <button 
                    onClick={handleStartSession}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-6 rounded-full shadow transition-colors"
                  >
                    開始する
                  </button>
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, idx) => (
                  <MessageBubble key={idx} message={msg} />
                ))}
                {isLoading && (
                  <div className="flex justify-start w-full mb-4">
                     <div className="flex items-center gap-2 bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-gray-200">
                        <div className="animate-spin h-4 w-4 border-2 border-teal-600 border-t-transparent rounded-full"></div>
                        <span className="text-sm text-gray-500">AIが入力中...</span>
                     </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </main>

        {/* Input Area */}
        <InputArea 
          onSendMessage={sendMessage} 
          onAction={handleAction} 
          disabled={!sessionActive} 
          isLoading={isLoading}
          value={input}
          onChange={setInput}
        />
      </div>
    </div>
  );
}
