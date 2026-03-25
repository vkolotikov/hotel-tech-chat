import { useQuery } from '@tanstack/react-query'
import { MessageSquare, Users, CheckCircle, Clock } from 'lucide-react'
import { api } from '../lib/api'

interface DashboardData {
  open_chats: number; total_chats: number; resolved_chats: number;
  total_leads: number; avg_response_seconds: number
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-[#1a1a1a] rounded-xl p-5 border border-white/5">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${color} mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-gray-400 mt-0.5">{label}</p>
    </div>
  )
}

export default function Dashboard() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/admin/dashboard').then(r => r.data),
  })

  const fmtTime = (s?: number) => {
    if (!s) return '—'
    if (s < 60) return `${s}s`
    return `${Math.round(s / 60)}m`
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-white mb-6">Dashboard</h1>
      {isLoading ? (
        <div className="text-gray-400">Loading…</div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={MessageSquare} label="Open Chats" value={data?.open_chats ?? 0} color="bg-blue-600/20 text-blue-400" />
          <StatCard icon={CheckCircle} label="Resolved Today" value={data?.resolved_chats ?? 0} color="bg-green-600/20 text-green-400" />
          <StatCard icon={Users} label="Total Leads" value={data?.total_leads ?? 0} color="bg-purple-600/20 text-purple-400" />
          <StatCard icon={Clock} label="Avg Response" value={fmtTime(data?.avg_response_seconds)} color="bg-orange-600/20 text-orange-400" />
        </div>
      )}
    </div>
  )
}
