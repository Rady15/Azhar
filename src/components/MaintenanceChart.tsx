import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Zap, Droplets, Wind, Wrench, AlertTriangle } from 'lucide-react'
import { api } from '../services/api'

const CATEGORY_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  كهرباء: { label: 'كهرباء', color: '#16a34a', icon: Zap },
  كهربائية: { label: 'كهرباء', color: '#16a34a', icon: Zap },
  سباكة: { label: 'سباكة', color: '#3b82f6', icon: Droplets },
  مياه: { label: 'مياه', color: '#3b82f6', icon: Droplets },
  تكييف: { label: 'تكييف', color: '#f59e0b', icon: Wind },
  تصليح: { label: 'تصليح', color: '#8b5cf6', icon: Wrench },
  صيانة: { label: 'صيانة', color: '#8b5cf6', icon: Wrench },
  general: { label: 'أخرى', color: '#94a3b8', icon: AlertTriangle },
}

function MaintenanceChart() {
  const [chartData, setChartData] = useState<{ name: string; value: number; percentage: number; color: string; icon: any }[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await api.getMaintenance()
        const list = Array.isArray(data) ? data : (data as any)?.maintenances ?? (data as any)?.data ?? []

        const buckets: Record<string, number> = {}
        list.forEach((item: any) => {
          const cat = item.category || 'general'
          const key = Object.keys(CATEGORY_CONFIG).find(k => cat.toLowerCase().includes(k.toLowerCase())) || 'general'
          buckets[key] = (buckets[key] || 0) + 1
        })

        const totalCount = Object.values(buckets).reduce((s, v) => s + v, 0)
        setTotal(totalCount)

        const chart = Object.entries(buckets).map(([key, value]) => {
          const config = CATEGORY_CONFIG[key] || CATEGORY_CONFIG.general
          return {
            name: config.label,
            value,
            percentage: totalCount > 0 ? Math.round((value / totalCount) * 100) : 0,
            color: config.color,
            icon: config.icon,
          }
        })

        setChartData(chart.length > 0 ? chart : [])
      } catch (err) {
        console.error('Failed to fetch maintenance chart data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="bg-white rounded-2xl p-6 card-shadow border border-slate-100">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-800">توزيع الصيانة</h3>
        <p className="text-sm text-slate-400 mt-1">إجمالي الطلبات: {loading ? '...' : total}</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40 text-slate-400 text-sm">جارٍ التحميل...</div>
      ) : chartData.length === 0 ? (
        <div className="flex items-center justify-center h-40 text-slate-400 text-sm">لا توجد طلبات صيانة</div>
      ) : (
        <div className="flex items-center gap-6">
          <div className="relative w-40 h-40 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={4} dataKey="value" stroke="none">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', fontSize: '13px', direction: 'rtl' }} formatter={(value: number, name: string) => [`${value} طلب`, name]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <span className="text-2xl font-bold text-slate-800">{total}</span>
                <p className="text-xs text-slate-400">طلب</p>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-4">
            {chartData.map((item) => (
              <div key={item.name} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${item.color}15` }}>
                  <item.icon className="w-5 h-5" style={{ color: item.color }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-slate-700">{item.name}</span>
                    <span className="text-sm font-bold text-slate-800">{item.value}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${item.percentage}%`, backgroundColor: item.color }} />
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{item.percentage}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default MaintenanceChart
