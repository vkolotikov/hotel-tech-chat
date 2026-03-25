import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

export default function Settings() {
  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/admin/me').then(r => r.data),
  })

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-white mb-6">Settings</h1>
      <div className="bg-[#1a1a1a] rounded-xl border border-white/5 p-5 max-w-sm">
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-4">Profile</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Name</span>
            <span className="text-white">{me?.display_name || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Email</span>
            <span className="text-white">{me?.email || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Role</span>
            <span className="text-white capitalize">{me?.role || '—'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
