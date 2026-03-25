import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { api } from '../lib/api'

interface Chat {
  id: number; visitor_name?: string; visitor_email?: string;
  status: string; created_at: string; last_message?: string
}

const statusColor: Record<string, string> = {
  open: 'bg-green-500/20 text-green-400',
  pending: 'bg-yellow-500/20 text-yellow-400',
  resolved: 'bg-gray-500/20 text-gray-400',
}

export default function Chats() {
  const { data, isLoading } = useQuery<{ data: Chat[] }>({
    queryKey: ['chats'],
    queryFn: () => api.get('/admin/chats').then(r => r.data),
  })

  const chats = data?.data ?? (Array.isArray(data) ? data as unknown as Chat[] : [])

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-white mb-6">Chats</h1>
      {isLoading ? (
        <div className="text-gray-400">Loading…</div>
      ) : chats.length === 0 ? (
        <div className="text-gray-500 text-sm">No chats yet.</div>
      ) : (
        <div className="bg-[#1a1a1a] rounded-xl border border-white/5 overflow-hidden">
          {chats.map((chat, i) => (
            <div key={chat.id} className={`flex items-center gap-4 px-5 py-4 ${i < chats.length - 1 ? 'border-b border-white/5' : ''}`}>
              <div className="w-9 h-9 rounded-full bg-blue-600/20 flex items-center justify-center text-sm font-medium text-blue-400 flex-shrink-0">
                {(chat.visitor_name?.[0] ?? '?').toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{chat.visitor_name || 'Visitor'}</p>
                <p className="text-xs text-gray-500 truncate">{chat.last_message || chat.visitor_email || '—'}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[chat.status] ?? 'bg-gray-500/20 text-gray-400'}`}>
                  {chat.status}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(chat.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
