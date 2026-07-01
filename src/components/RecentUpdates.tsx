import { useState, useEffect } from 'react'
import { Wrench, AlertCircle, ArrowLeft, Megaphone } from 'lucide-react'
import { api, AnnouncementModel, ComplaintModel, MaintenanceModel } from '../services/api'

interface UpdateItem {
  id: string
  icon: any
  color: string
  title: string
  description: string
  time: string
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'الآن'
  if (mins < 60) return `منذ ${mins} دقيقة`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `منذ ${hours} ساعة`
  const days = Math.floor(hours / 24)
  if (days < 30) return `منذ ${days} يوم`
  return dateStr.split('T')[0]
}

function getList<T>(data: T[] | { data?: T[]; complaints?: T[]; maintenances?: T[] } | undefined): T[] {
  if (!data) return []
  if (Array.isArray(data)) return data
  return data.data ?? data.complaints ?? data.maintenances ?? []
}

function RecentUpdates() {
  const [updates, setUpdates] = useState<UpdateItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUpdates() {
      try {
        const [announcements, complaints, maintenance] = await Promise.allSettled([
          api.getAnnouncements(),
          api.getComplaints(),
          api.getMaintenance(),
        ])

        const items: UpdateItem[] = []

        if (announcements.status === 'fulfilled') {
          const list = announcements.value
          if (Array.isArray(list)) {
            list.forEach((a: AnnouncementModel) => {
              items.push({
                id: `ann-${a.id ?? a.announcementId ?? Date.now()}`,
                icon: Megaphone,
                color: 'bg-purple-50 text-purple-600',
                title: a.title || 'إعلان',
                description: a.description || a.content || '',
                time: timeAgo(a.createdAt ?? ''),
              })
            })
          }
        }

        if (complaints.status === 'fulfilled') {
          const list = getList<ComplaintModel>(complaints.value as any)
          list.forEach((x: ComplaintModel) => {
            items.push({
              id: `comp-${x.id ?? Date.now()}`,
              icon: AlertCircle,
              color: 'bg-red-50 text-red-600',
              title: x.title || 'شكوى جديدة',
              description: x.villaNumber ? `فيلا رقم ${x.villaNumber}` : '',
              time: timeAgo(x.createdAt ?? ''),
            })
          })
        }

        if (maintenance.status === 'fulfilled') {
          const list = getList<MaintenanceModel>(maintenance.value as any)
          list.forEach((x: MaintenanceModel) => {
            items.push({
              id: `maint-${x.id ?? Date.now()}`,
              icon: Wrench,
              color: 'bg-amber-50 text-amber-600',
              title: x.category || 'طلب صيانة',
              description: x.villaNumber ? `وحدة ${x.villaNumber}` : '',
              time: timeAgo(x.createdAt ?? ''),
            })
          })
        }

        items.sort((a, b) => {
          const aTime = a.time.includes('منذ') ? 0 : 1
          const bTime = b.time.includes('منذ') ? 0 : 1
          return aTime - bTime
        })

        setUpdates(items.slice(0, 5))
      } catch (err) {
        console.error('Failed to fetch updates:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchUpdates()
  }, [])

  return (
    <div className="bg-white rounded-2xl p-6 card-shadow border border-slate-100 h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-800">آخر التحديثات</h3>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-slate-400 text-sm">جارٍ تحميل التحديثات...</div>
        ) : updates.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">لا توجد تحديثات حديثة</div>
        ) : (
          updates.map((update) => (
            <div key={update.id} className="flex gap-3 group">
              <div className={`w-10 h-10 ${update.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <update.icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-700 group-hover:text-primary-700 transition-colors">{update.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">{update.description}</p>
                <p className="text-xs text-slate-300 mt-1">{update.time}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <button className="w-full mt-6 h-10 flex items-center justify-center gap-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-xl transition-colors border border-primary-100">
        <span>عرض جميع الأنشطة</span>
        <ArrowLeft className="w-4 h-4" />
      </button>
    </div>
  )
}

export default RecentUpdates
