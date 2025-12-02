import React, { useState, useRef, useEffect } from 'react';
import { Send, Lightbulb, Stethoscope, ClipboardCheck } from 'lucide-react';

interface InputAreaProps {
  onSendMessage: (message: string) => void;
  onAction: (action: 'advice' | 'judgment' | 'evaluate') => void;
  disabled: boolean;
  isLoading: boolean;
  value: string;
  onChange: (value: string) => void;
}

export const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, onAction, disabled, isLoading, value, onChange }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (value.trim() && !disabled && !isLoading) {
      onSendMessage(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [value]);

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <div className="max-w-4xl mx-auto flex flex-col gap-4">
        
        {/* Text Input */}
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="メッセージを入力 (Shift+Enterで改行)"
            disabled={disabled || isLoading}
            className="flex-grow p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 resize-none max-h-32 min-h-[50px]"
            rows={1}
          />
          <button
            onClick={() => handleSubmit()}
            disabled={!value.trim() || disabled || isLoading}
            className="p-3 bg-teal-700 text-white rounded-full hover:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={20} />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 justify-between">
          <button
            onClick={() => onAction('advice')}
            disabled={disabled || isLoading}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-white border border-gray-400 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm font-medium transition-colors"
          >
            <Lightbulb size={16} />
            アドバイス
          </button>
          <button
            onClick={() => onAction('judgment')}
            disabled={disabled || isLoading}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-white border border-teal-600 text-teal-700 rounded-lg hover:bg-teal-50 disabled:opacity-50 text-sm font-medium transition-colors"
          >
            <Stethoscope size={16} />
            疾患名を判断
          </button>
          <button
            onClick={() => onAction('evaluate')}
            disabled={disabled || isLoading}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-white border border-teal-600 text-teal-700 rounded-lg hover:bg-teal-50 disabled:opacity-50 text-sm font-medium transition-colors"
          >
            <ClipboardCheck size={16} />
            評価する
          </button>
        </div>
      </div>
    </div>
  );
};
