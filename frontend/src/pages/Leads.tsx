import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

interface Lead { id: number; name?: string; email?: string; phone?: string; created_at: string; status?: string }

export default function Leads() {
  const { data, isLoading } = useQuery<{ data: Lead[] } | Lead[]>({
    queryKey: ['leads'],
    queryFn: () => api.get('/admin/leads').then(r => r.data),
  })

  const leads: Lead[] = Array.isArray(data) ? data : (data as { data: Lead[] })?.data ?? []

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-white mb-6">Leads</h1>
      {isLoading ? (
        <div className="text-gray-400">Loading…</div>
      ) : leads.length === 0 ? (
        <div className="text-gray-500 text-sm">No leads yet.</div>
      ) : (
        <div className="bg-[#1a1a1a] rounded-xl border border-white/5 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-gray-400 text-xs uppercase">
                <th className="px-5 py-3 text-left">Name</th>
                <th className="px-5 py-3 text-left">Email</th>
                <th className="px-5 py-3 text-left">Phone</th>
                <th className="px-5 py-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead, i) => (
                <tr key={lead.id} className={i < leads.length - 1 ? 'border-b border-white/5' : ''}>
                  <td className="px-5 py-3 text-white">{lead.name || '—'}</td>
                  <td className="px-5 py-3 text-gray-400">{lead.email || '—'}</td>
                  <td className="px-5 py-3 text-gray-400">{lead.phone || '—'}</td>
                  <td className="px-5 py-3 text-gray-500">{new Date(lead.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
