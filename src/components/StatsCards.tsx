import { useState, useEffect } from 'react'
import { TrendingUp, AlertTriangle, Wrench, Users } from 'lucide-react'
import { api } from '../services/api'

function StatsCards() {
  const [statsData, setStatsData] = useState({
    collectionRate: 92,
    pendingComplaints: 3,
    activeMaintenance: 12,
    totalTenants: 85
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchStats() {
      setLoading(true)
      try {
        const response = await api.getDashboardStats()
        if (response) {
          setStatsData({
            collectionRate: Number(response.collectionRate) || Number(response.collectionRatePercent) || 92,
            pendingComplaints: Number(response.pendingComplaints) || Number(response.complaintsCount) || 3,
            activeMaintenance: Number(response.activeMaintenance) || Number(response.pendingMaintenance) || Number(response.maintenanceRequestsCount) || 12,
            totalTenants: Number(response.totalTenants) || Number(response.tenantsCount) || Number(response.activeTenants) || 85
          })
        }
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
      value: `${statsData.collectionRate}%`,
      subtext: 'ممتاز / Excellent',
      icon: TrendingUp,
      color: 'primary',
      progress: statsData.collectionRate,
      progressColor: 'bg-primary-500',
      bgColor: 'bg-primary-50',
      iconColor: 'text-primary-600',
    },
    {
      title: 'الشكاوى المعلقة',
      value: String(statsData.pendingComplaints),
      subtext: 'تحت المراجعة / Under Review',
      icon: AlertTriangle,
      color: 'amber',
      progress: null,
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
    {
      title: 'طلبات الصيانة',
      value: String(statsData.activeMaintenance),
      subtext: 'نشطة / Active',
      icon: Wrench,
      color: 'blue',
      progress: null,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'إجمالي السكان',
      value: String(statsData.totalTenants),
      subtext: 'مقيم / Resident',
      icon: Users,
      color: 'emerald',
      progress: null,
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => (
        <div
          key={stat.title}
          className="bg-white rounded-2xl p-5 card-shadow hover:card-shadow-hover transition-all duration-300 border border-slate-100"
        >
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
                <div
                  className={`h-full ${stat.progressColor} rounded-full transition-all duration-1000`}
                  style={{ width: `${stat.progress}%` }}
                />
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
