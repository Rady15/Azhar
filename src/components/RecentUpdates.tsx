import { useState, useEffect } from 'react'
import { Wrench, AlertCircle, ArrowLeft, Mail } from 'lucide-react'
import { api, AnnouncementModel, ComplaintModel, MaintenanceModel } from '../services/api'

interface UpdateItem {
  id: string
  icon: any
  color: string
  title: string
  description: string
  time: string
}

interface RecentUpdatesProps {
  language: 'AR' | 'EN'
}

function timeAgo(dateStr: string, lang: 'AR' | 'EN'): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (lang === 'AR') {
    if (mins < 1) return 'الآن'
    if (mins < 60) return `منذ ${mins} دقيقة`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `منذ ${hours} ساعة`
    const days = Math.floor(hours / 24)
    if (days < 30) return `منذ ${days} يوم`
  } else {
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins} min ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours} hr ago`
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days} day ago`
  }
  return dateStr.split('T')[0]
}

function getList<T>(data: T[] | { data?: T[]; complaints?: T[]; maintenances?: T[] } | undefined): T[] {
  if (!data) return []
  if (Array.isArray(data)) return data
  return data.data ?? data.complaints ?? data.maintenances ?? []
}

function RecentUpdates({ language }: RecentUpdatesProps) {
  const t = (ar: string, en: string) => language === 'AR' ? ar : en
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
                icon: Mail,
                color: 'bg-purple-50 text-purple-600',
                title: a.title || t('خطاب', 'Letter'),
                description: a.description || a.content || '',
                time: timeAgo(a.createdAt ?? '', language),
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
              title: x.title || t('شكوى جديدة', 'New Complaint'),
              description: x.villaNumber ? t(`فيلا رقم ${x.villaNumber}`, `Villa ${x.villaNumber}`) : '',
              time: timeAgo(x.createdAt ?? '', language),
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
              title: x.category || t('طلب صيانة', 'Maintenance Request'),
              description: x.villaNumber ? t(`وحدة ${x.villaNumber}`, `Unit ${x.villaNumber}`) : '',
              time: timeAgo(x.createdAt ?? '', language),
            })
          })
        }

        items.sort((a, b) => {
          const isArabic = language === 'AR'
          const aTime = a.time.includes(isArabic ? 'منذ' : 'ago') ? 0 : 1
          const bTime = b.time.includes(isArabic ? 'منذ' : 'ago') ? 0 : 1
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
  }, [language])

  return (
    <div className="bg-white rounded-2xl p-6 card-shadow border border-slate-100 h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-800">{t('آخر التحديثات', 'Recent Updates')}</h3>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-slate-400 text-sm">{t('جارٍ تحميل التحديثات...', 'Loading updates...')}</div>
        ) : updates.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">{t('لا توجد تحديثات حديثة', 'No recent updates')}</div>
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
        <span>{t('عرض جميع الأنشطة', 'View All Activity')}</span>
        <ArrowLeft className="w-4 h-4" />
      </button>
    </div>
  )
}

export default RecentUpdates
