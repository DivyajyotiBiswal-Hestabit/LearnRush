'use client'

import { User, Bot } from 'lucide-react'
import { CitedAnswer } from '@/components/chat/CitedAnswer'
import { cn } from '@/lib/utils/cn'

export function ChatMessage({ message, citations = [], onCitationClick }) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
        isUser ? 'bg-violet-600' : 'bg-[#0C0F16] border border-[#1a2234]'
      )}>
        {isUser
          ? <User className="w-4 h-4 text-white" />
          : <Bot className="w-4 h-4 text-slate-500" />
        }
      </div>

      {/* Bubble */}
      <div className={cn(
        'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
        isUser
          ? 'bg-violet-600 text-white rounded-tr-sm'
          : 'bg-[#0C0F16] border border-[#1a2234] rounded-tl-sm'
      )}>
        {isUser ? (
          // User messages render as plain text
          <span style={{ color: '#fff' }}>{message.content}</span>
        ) : (
          // Assistant messages render with citation support
          <CitedAnswer
            content={message.content}
            citations={citations}
            onCitationClick={onCitationClick}
          />
        )}
      </div>
    </div>
  )
}

export function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-[#0C0F16] border border-[#1a2234] flex items-center justify-center flex-shrink-0">
        <Bot className="w-4 h-4 text-slate-500" />
      </div>
      <div className="bg-[#0C0F16] border border-[#1a2234] rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          <span className="w-1.5 h-1.5 bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}