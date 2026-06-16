import { User, Bot } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export function ChatMessage({ message }) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
        isUser ? 'bg-indigo-600' : 'bg-gray-100'
      )}>
        {isUser
          ? <User className="w-4 h-4 text-white" />
          : <Bot className="w-4 h-4 text-gray-500" />
        }
      </div>

      {/* Bubble */}
      <div className={cn(
        'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
        isUser
          ? 'bg-indigo-600 text-white rounded-tr-sm'
          : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
      )}>
        {message.content}
      </div>
    </div>
  )
}

export function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
        <Bot className="w-4 h-4 text-gray-500" />
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}