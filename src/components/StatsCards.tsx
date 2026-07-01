import { useState, useEffect } from 'react'
import { TrendingUp, AlertTriangle, Wrench, Users } from 'lucide-react'
import { api, DashboardStats, ComplaintModel, MaintenanceModel, TenantModel, HouseModel } from '../services/api'

interface StatsData {
  collectionRate: number
  pendingComplaints: number
  activeMaintenance: number
  totalTenants: number
  totalHouses: number
}

function getList<T>(data: T[] | { data?: T[]; houses?: T[]; tenants?: T[]; complaints?: T[]; maintenances?: T[] } | undefined): T[] {
  if (!data) return []
  if (Array.isArray(data)) return data
  return data.data ?? data.houses ?? data.tenants ?? data.complaints ?? data.maintenances ?? []
}

function StatsCards() {
  const [statsData, setStatsData] = useState<StatsData>({
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

        let data: StatsData = { collectionRate: 0, pendingComplaints: 0, activeMaintenance: 0, totalTenants: 0, totalHouses: 0 }

        if (dashboard.status === 'fulfilled') {
          const d: DashboardStats = dashboard.value
          data.collectionRate = Number(d.collectionRate ?? d.collectionRatePercent ?? 0)
          data.pendingComplaints = Number(d.pendingComplaints ?? d.complaintsCount ?? 0)
          data.activeMaintenance = Number(d.activeMaintenance ?? d.pendingMaintenance ?? d.maintenanceRequestsCount ?? 0)
          data.totalTenants = Number(d.totalTenants ?? d.tenantsCount ?? d.activeTenants ?? 0)
          data.totalHouses = Number(d.totalHouses ?? d.housesCount ?? 0)
        }

        if (tenants.status === 'fulfilled') {
          data.totalTenants = data.totalTenants || getList<TenantModel>(tenants.value as any).length
        }

        if (houses.status === 'fulfilled') {
          data.totalHouses = data.totalHouses || getList<HouseModel>(houses.value as any).length
        }

        if (complaints.status === 'fulfilled') {
          const list = getList<ComplaintModel>(complaints.value as any)
          data.pendingComplaints = data.pendingComplaints || list.filter(x =>
            (x.status?.toLowerCase() ?? 'pending').startsWith('pending') || x.status?.toLowerCase() === 'in_progress'
          ).length
        }

        if (maintenance.status === 'fulfilled') {
          const list = getList<MaintenanceModel>(maintenance.value as any)
          data.activeMaintenance = data.activeMaintenance || list.filter(x => {
            const s = (x.status ?? '').toLowerCase().replace(' ', '_')
            return s === 'pending' || s === 'in_progress'
          }).length
        }

        setStatsData(data)
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
