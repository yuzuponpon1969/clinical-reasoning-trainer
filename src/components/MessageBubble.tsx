import React from 'react';
import ReactMarkdown from 'react-markdown';
import { User, Stethoscope, GraduationCap } from 'lucide-react';
import { Message } from '@/lib/types';
import remarkGfm from 'remark-gfm';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isInstructor = message.role === 'instructor';
  const isPatient = message.role === 'patient';

  return (
    <div className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[90%] md:max-w-[80%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Icon */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white
          ${isUser ? 'bg-green-600' : isPatient ? 'bg-blue-500' : 'bg-amber-500'}`}>
          {isUser && <User size={20} />}
          {isPatient && <Stethoscope size={20} />} {/* Using Stethoscope for Patient as a placeholder, maybe User is better? Original had 'user-injured' */}
          {isInstructor && <GraduationCap size={20} />}
        </div>

        {/* Message Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <span className="text-xs text-gray-500 mb-1">
            {isUser ? 'あなた' : isPatient ? '患者役' : '指導柔道整復師'}
          </span>
          
          <div className={`p-4 rounded-2xl shadow-sm overflow-hidden
            ${isUser ? 'bg-green-100 text-gray-800 rounded-tr-none' : 
              isPatient ? 'bg-white border border-gray-200 text-gray-800 rounded-tl-none' : 
              'bg-amber-50 border border-amber-200 text-amber-900 rounded-tl-none w-full'}`}>
            
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  table: ({node, ...props}) => <table className="border-collapse table-auto w-full text-sm my-4" {...props} />,
                  th: ({node, ...props}) => <th className="border border-gray-300 px-4 py-2 bg-gray-100 font-semibold" {...props} />,
                  td: ({node, ...props}) => <td className="border border-gray-300 px-4 py-2" {...props} />,
                  p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-2" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-2" {...props} />,
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
