import { useState, useEffect } from 'react'
import { TrendingUp, AlertTriangle, Wrench, Users } from 'lucide-react'
import { api } from '../services/api'

function StatsCards() {
  const [statsData, setStatsData] = useState({
    collectionRate: 0,
    pendingComplaints: 0,
    activeMaintenance: 0,
    totalTenants: 0,
    totalHouses: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      setLoading(true)
      try {
        const [dashboard, tenants, houses, complaints, maintenance] = await Promise.allSettled([
          api.getDashboardStats(),
          api.getTenants(),
          api.getVillas(),
          api.getComplaints(),
          api.getMaintenance(),
        ])

        let collectionRate = 0
        let pendingComplaints = 0
        let activeMaintenance = 0
        let totalTenants = 0
        let totalHouses = 0

        if (dashboard.status === 'fulfilled') {
          const d = dashboard.value
          collectionRate = Number(d.collectionRate ?? d.collectionRatePercent ?? 0)
          pendingComplaints = Number(d.pendingComplaints ?? d.complaintsCount ?? 0)
          activeMaintenance = Number(d.activeMaintenance ?? d.pendingMaintenance ?? d.maintenanceRequestsCount ?? 0)
          totalTenants = Number(d.totalTenants ?? d.tenantsCount ?? d.activeTenants ?? 0)
        }

        if (tenants.status === 'fulfilled') {
          const t = tenants.value
          if (Array.isArray(t)) totalTenants = t.length
          else if (t && (t as any).tenants) totalTenants = (t as any).tenants.length
        }

        if (houses.status === 'fulfilled') {
          const h = houses.value
          if (Array.isArray(h)) totalHouses = h.length
          else if (h && (h as any).houses) totalHouses = (h as any).houses.length
        }

        if (complaints.status === 'fulfilled') {
          const c = complaints.value
          if (Array.isArray(c)) pendingComplaints = c.filter((x: any) => (x.status?.toLowerCase() ?? 'pending').startsWith('pending') || x.status?.toLowerCase() === 'in_progress').length
          else if (c && (c as any).complaints) pendingComplaints = (c as any).complaints.filter((x: any) => (x.status?.toLowerCase() ?? 'pending').startsWith('pending') || x.status?.toLowerCase() === 'in_progress').length
        }

        if (maintenance.status === 'fulfilled') {
          const m = maintenance.value
          const list = Array.isArray(m) ? m : (m as any)?.maintenances ?? (m as any)?.data ?? []
          activeMaintenance = list.filter((x: any) => {
            const s = (x.status ?? '').toLowerCase().replace(' ', '_')
            return s === 'pending' || s === 'in_progress'
          }).length
        }

        setStatsData({ collectionRate, pendingComplaints, activeMaintenance, totalTenants, totalHouses })
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const stats = [
    {
      title: 'نسبة التحصيل',
      value: loading ? '...' : `${statsData.collectionRate}%`,
      subtext: 'ممتاز / Excellent',
      icon: TrendingUp,
      bgColor: 'bg-primary-50',
      iconColor: 'text-primary-600',
      progress: statsData.collectionRate,
      progressColor: 'bg-primary-500',
    },
    {
      title: 'الشكاوى المعلقة',
      value: loading ? '...' : String(statsData.pendingComplaints),
      subtext: 'تحت المراجعة / Under Review',
      icon: AlertTriangle,
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-600',
      progress: null,
    },
    {
      title: 'طلبات الصيانة',
      value: loading ? '...' : String(statsData.activeMaintenance),
      subtext: 'نشطة / Active',
      icon: Wrench,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      progress: null,
    },
    {
      title: 'إجمالي السكان',
      value: loading ? '...' : String(statsData.totalTenants),
      subtext: `${statsData.totalHouses} منزل / Houses`,
      icon: Users,
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      progress: null,
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => (
        <div key={stat.title} className="bg-white rounded-2xl p-5 card-shadow hover:card-shadow-hover transition-all duration-300 border border-slate-100">
          <div className="flex items-start justify-between mb-4">
            <div className={`w-10 h-10 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
              <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
            </div>
          </div>
          <h3 className="text-slate-500 text-sm font-medium mb-1">{stat.title}</h3>
          <p className="text-2xl font-bold text-slate-800 mb-2">{stat.value}</p>
          {stat.progress !== null && (
            <div className="mb-2">
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${stat.progressColor} rounded-full transition-all duration-1000`} style={{ width: `${stat.progress}%` }} />
              </div>
            </div>
          )}
          <p className="text-xs text-slate-400">{stat.subtext}</p>
        </div>
      ))}
    </div>
  )
}

export default StatsCards
