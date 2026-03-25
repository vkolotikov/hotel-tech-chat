import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

export default function Analytics() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => api.get('/admin/analytics').then(r => r.data),
  })

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-white mb-6">Analytics</h1>
      {isLoading ? (
        <div className="text-gray-400">Loading…</div>
      ) : (
        <div className="bg-[#1a1a1a] rounded-xl border border-white/5 p-5">
          <pre className="text-xs text-gray-400 overflow-auto">{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
