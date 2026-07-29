import { useState, useEffect } from 'react'
import { TrendingUp, AlertTriangle, Wrench, Users, DollarSign, Home, Zap, Droplets, Wind, Mail, BedDouble, Bath, Maximize, Building, Star, Loader2, Calendar } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { api, DashboardStats, TenantModel, HouseModel, ComplaintModel, MaintenanceModel, AnnouncementModel, API_BASE_URL } from '../services/api'

const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

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
    return `منذ ${days} يوم`
  }
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.floor(hours / 24)
  return `${days} day ago`
}

function toList<T>(data: any): T[] {
  if (!data) return []
  if (Array.isArray(data)) return data
  for (const key of ['data', 'houses', 'tenants', 'complaints', 'maintenances', 'announcements', 'payments']) {
    if (data[key] && Array.isArray(data[key])) return data[key]
  }
  return []
}

function val(n: any, fallback = 0): number {
  const v = Number(n)
  return isNaN(v) ? fallback : v
}

function resolveImage(url?: string): string {
  if (!url) return ''
  return url.startsWith('http') ? url : `${API_BASE_URL}${url}`
}

const MAINT_COLORS: Record<string, string> = {
  Electrical: '#16a34a', Plumbing: '#3b82f6', AC: '#f59e0b', Carpentry: '#8b5cf6', Other: '#94a3b8',
}
const CATEGORY_LABELS = (lang: 'AR' | 'EN'): Record<string, string> => ({
  Electrical: lang === 'AR' ? 'كهرباء' : 'Electrical',
  Plumbing: lang === 'AR' ? 'سباكة' : 'Plumbing',
  AC: lang === 'AR' ? 'تكييف' : 'AC',
  Carpentry: lang === 'AR' ? 'نجارة' : 'Carpentry',
  Other: lang === 'AR' ? 'أخرى' : 'Other',
})

interface DashboardProps {
  language: 'AR' | 'EN'
  userName?: string
}

export default function Dashboard({ language, userName }: DashboardProps) {
  const t = (ar: string, en: string) => language === 'AR' ? ar : en

  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({})
  const [tenants, setTenants] = useState<TenantModel[]>([])
  const [houses, setHouses] = useState<HouseModel[]>([])
  const [complaints, setComplaints] = useState<ComplaintModel[]>([])
  const [maintenance, setMaintenance] = useState<MaintenanceModel[]>([])
  const [announcements, setAnnouncements] = useState<AnnouncementModel[]>([])

  useEffect(() => {
    async function fetchAll() {
      setLoading(true)
      const [dashR, tenR, houseR, compR, maintR, annR] = await Promise.allSettled([
        api.getDashboardStats(),
        api.getTenants(),
        api.getVillas(),
        api.getComplaints(),
        api.getMaintenance(),
        api.getAnnouncements(),
      ])
      if (dashR.status === 'fulfilled') setStats(dashR.value as any)
      if (tenR.status === 'fulfilled') setTenants(toList<TenantModel>(tenR.value))
      if (houseR.status === 'fulfilled') setHouses(toList<HouseModel>(houseR.value))
      if (compR.status === 'fulfilled') setComplaints(toList<ComplaintModel>(compR.value))
      if (maintR.status === 'fulfilled') setMaintenance(toList<MaintenanceModel>(maintR.value))
      if (annR.status === 'fulfilled') setAnnouncements(toList<AnnouncementModel>(annR.value))
      setLoading(false)
    }
    fetchAll()
  }, [])

  // Derived stats
  const collectionRate = val(stats.collectionRate ?? stats.CollectionRate ?? stats.collectionRatePercent ?? stats.CollectionRatePercent)
  const totalTenants = val(stats.totalTenants ?? stats.TotalTenants ?? stats.tenantsCount ?? stats.TenantsCount ?? stats.activeTenants ?? stats.ActiveTenants) || tenants.length
  const totalHouses = val(stats.totalHouses ?? stats.TotalHouses ?? stats.housesCount ?? stats.HousesCount) || houses.length
  const occupancyRate = totalHouses > 0 ? Math.round((totalTenants / totalHouses) * 100) : 0

  // Status breakdowns
  const pendingMaint = maintenance.filter(m => { const s = (m.status ?? '').toLowerCase(); return s === 'submitted' || s === 'assigned' || s === 'inprogress' })
  const completedMaint = maintenance.filter(m => { const s = (m.status ?? '').toLowerCase(); return s === 'completed' })
  const openComps = complaints.filter(c => { const s = (c.status ?? '').toLowerCase(); return s === 'open' || s === 'underreview' })
  const resolvedComps = complaints.filter(c => { const s = (c.status ?? '').toLowerCase(); return s === 'resolved' })
  const occupiedHouses = houses.filter(h => tenants.some(t => t.houseId === h.id || t.houseNumber === h.houseNumber))

  // Maintenance category breakdown for pie chart
  const maintBuckets: Record<string, number> = {}
  maintenance.forEach(m => {
    const cat = m.category || 'Other'
    maintBuckets[cat] = (maintBuckets[cat] || 0) + 1
  })
  const cl = CATEGORY_LABELS(language)
  const pieData = Object.entries(maintBuckets).map(([k, v]) => ({
    name: cl[k] || k,
    value: v,
    color: MAINT_COLORS[k] || '#94a3b8',
  }))
  const pieTotal = pieData.reduce((s, i) => s + i.value, 0)

  // Complaint category breakdown
  const compBuckets: Record<string, number> = {}
  complaints.forEach(c => {
    const cat = c.category || 'Other'
    compBuckets[cat] = (compBuckets[cat] || 0) + 1
  })

  // Chart data from actual maintenance request dates (count by month)
  const monthsData = language === 'AR' ? MONTHS_AR : MONTHS_EN
  const monthCounts: Record<number, number> = {}
  maintenance.forEach(m => {
    if (m.createdAt) {
      try {
        const month = new Date(m.createdAt).getMonth()
        monthCounts[month] = (monthCounts[month] || 0) + 1
      } catch {}
    }
  })
  const chartData = monthsData.map((name, i) => ({
    month: name,
    value: monthCounts[i] || 0,
  }))

  // Recent items (sorted by date)
  const recentItems: Array<{ id: string; icon: any; color: string; title: string; desc: string; time: string }> = []
  announcements.slice(0, 3).forEach(a => recentItems.push({
    id: `ann-${a.id || Math.random()}`, icon: Mail, color: 'bg-purple-50 text-purple-600',
    title: a.title || t('إعلان', 'Announcement'), desc: a.description || a.content || '', time: timeAgo(a.createdAt || '', language),
  }))
  complaints.slice(0, 3).forEach(c => recentItems.push({
    id: `comp-${c.id || Math.random()}`, icon: AlertTriangle, color: 'bg-red-50 text-red-600',
    title: c.title || t('شكوى', 'Complaint'), desc: c.houseNumber ? t(`فيلا ${c.houseNumber}`, `Villa ${c.houseNumber}`) : '', time: timeAgo(c.createdAt || '', language),
  }))
  maintenance.slice(0, 3).forEach(m => recentItems.push({
    id: `maint-${m.id || Math.random()}`, icon: Wrench, color: 'bg-amber-50 text-amber-600',
    title: m.category || t('صيانة', 'Maintenance'), desc: m.houseNumber ? t(`فيلا ${m.houseNumber}`, `Villa ${m.houseNumber}`) : '', time: timeAgo(m.createdAt || '', language),
  }))
  recentItems.sort((a, b) => {
    const isAr = language === 'AR'
    const aTs = a.time.includes(isAr ? 'منذ' : 'ago') || a.time === (isAr ? 'الآن' : 'Just now') ? 0 : 1
    const bTs = b.time.includes(isAr ? 'منذ' : 'ago') || b.time === (isAr ? 'الآن' : 'Just now') ? 0 : 1
    return aTs - bTs
  })

  // Last house for property card
  const lastHouse = houses.length > 0 ? houses[houses.length - 1] : null

  const today = new Date()
  const dateStr = language === 'AR'
    ? `${today.getDate()} ${MONTHS_AR[today.getMonth()]} ${today.getFullYear()}`
    : `${MONTHS_EN[today.getMonth()]} ${today.getDate()}, ${today.getFullYear()}`
  const storedName = localStorage.getItem('azhar_name') || localStorage.getItem('azhar_email') || userName || 'Admin'

  return (
    <div className="space-y-6">
      {/* ── Welcome Banner ── */}
      <div className="relative rounded-2xl p-6 text-white card-shadow overflow-hidden" style={{ backgroundImage: 'url(/bg.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-primary-800/75" />
        <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">{t(`مرحباً بك، ${storedName}`, `Welcome, ${storedName}`)}</h1>
            <div className="flex items-center gap-2 text-primary-100 text-sm">
              <Calendar className="w-4 h-4" />
              <span>{dateStr}</span>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm text-primary-100">{t('النظام نشط', 'System Active')}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-primary-200 text-xs">{t('إجمالي الوحدات', 'Total Units')}</p>
            <p className="text-xl font-bold mt-1">{loading ? '...' : totalHouses}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-primary-200 text-xs">{t('السكان الحاليون', 'Current Residents')}</p>
            <p className="text-xl font-bold mt-1">{loading ? '...' : totalTenants}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-primary-200 text-xs">{t('نسبة الإشغال', 'Occupancy')}</p>
            <p className="text-xl font-bold mt-1">{loading ? '...' : `${occupancyRate}%`}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-primary-200 text-xs">{t('إجمالي الطلبات', 'Total Requests')}</p>
            <p className="text-xl font-bold mt-1">{loading ? '...' : String(maintenance.length + complaints.length)}</p>
          </div>
        </div>
        </div>
      </div>

      {/* ── KPI Cards Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { title: t('نسبة التحصيل', 'Collection Rate'), value: loading ? '...' : `${collectionRate}%`, icon: TrendingUp, bg: 'bg-emerald-50', ic: 'text-emerald-600', progress: collectionRate, pc: 'bg-emerald-500', sub: t('ممتاز', 'Excellent') },
          { title: t('السكان', 'Residents'), value: loading ? '...' : String(totalTenants), icon: Users, bg: 'bg-primary-50', ic: 'text-primary-600', sub: t(`${totalHouses} فيلا`, `${totalHouses} Villas`) },
          { title: t('الصيانة النشطة', 'Active Maintenance'), value: loading ? '...' : String(pendingMaint.length), icon: Wrench, bg: 'bg-blue-50', ic: 'text-blue-600', sub: t(`${completedMaint.length} مكتملة`, `${completedMaint.length} Completed`) },
          { title: t('الشكاوى المفتوحة', 'Open Complaints'), value: loading ? '...' : String(openComps.length), icon: AlertTriangle, bg: 'bg-amber-50', ic: 'text-amber-600', sub: t(`${resolvedComps.length} محلولة`, `${resolvedComps.length} Resolved`) },
          { title: t('إجمالي الطلبات', 'Total Requests'), value: loading ? '...' : String(maintenance.length + complaints.length), icon: DollarSign, bg: 'bg-green-50', ic: 'text-green-600', sub: t(`${maintenance.length} صيانة + ${complaints.length} شكوى`, `${maintenance.length} Maint + ${complaints.length} Compl`) },
          { title: t('نسبة الإشغال', 'Occupancy Rate'), value: loading ? '...' : `${occupancyRate}%`, icon: Home, bg: 'bg-violet-50', ic: 'text-violet-600', progress: occupancyRate, pc: 'bg-violet-500', sub: t(`${occupiedHouses.length} فيلا مأهولة`, `${occupiedHouses.length} Occupied`) },
        ].map(card => (
          <div key={card.title} className="bg-white rounded-2xl p-4 card-shadow border border-slate-100 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 ${card.bg} rounded-xl flex items-center justify-center`}>
                <card.icon className={`w-4 h-4 ${card.ic}`} />
              </div>
            </div>
            <p className="text-xs text-slate-500 mb-1">{card.title}</p>
            <p className="text-lg font-bold text-slate-800 mb-1">{card.value}</p>
            {card.progress !== undefined && (
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1">
                <div className={`h-full ${card.pc} rounded-full transition-all duration-1000`} style={{ width: `${card.progress}%` }} />
              </div>
            )}
            <p className="text-[10px] text-slate-400">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Charts + Activity Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Maintenance Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 card-shadow border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">{t('طلبات الصيانة', 'Maintenance Requests')}</h3>
              <p className="text-sm text-slate-400 mt-0.5">{t('عدد طلبات الصيانة شهرياً', 'Monthly maintenance requests')}</p>
            </div>
            <div className="bg-emerald-50 rounded-xl px-3 py-1.5 flex items-center gap-2">
              <span className="text-sm font-semibold text-emerald-700">{t('الإجمالي', 'Total')}: {maintenance.length}</span>
            </div>
          </div>
          <div className="h-64">
            {loading ? (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">{t('جارٍ التحميل...', 'Loading...')}</div>
            ) : chartData.every(d => d.value === 0) ? (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">{t('لا توجد طلبات صيانة', 'No maintenance requests yet')}</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                  <RechartsTooltip contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '13px', direction: language === 'AR' ? 'rtl' : 'ltr' }} formatter={(v: number) => [String(v), t('طلب', 'Requests')]} />
                  <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2.5} fill="url(#revGrad)" dot={{ fill: '#6366f1', r: 3, stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 5, fill: '#6366f1', stroke: '#fff', strokeWidth: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl p-6 card-shadow border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">{t('آخر النشاطات', 'Recent Activity')}</h3>
          </div>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
          ) : recentItems.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">{t('لا توجد نشاطات حديثة', 'No recent activity')}</div>
          ) : (
            <div className="space-y-4">
              {recentItems.slice(0, 6).map(item => (
                <div key={item.id} className="flex gap-3 group">
                  <div className={`w-9 h-9 ${item.color} rounded-xl flex items-center justify-center shrink-0`}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-700 truncate">{item.title}</p>
                    {item.desc && <p className="text-xs text-slate-400 truncate">{item.desc}</p>}
                    <p className="text-[10px] text-slate-300 mt-0.5">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Maintenance Distribution */}
        <div className="bg-white rounded-2xl p-6 card-shadow border border-slate-100">
          <div className="mb-5">
            <h3 className="text-lg font-bold text-slate-800">{t('توزيع الصيانة', 'Maintenance Distribution')}</h3>
            <p className="text-sm text-slate-400 mt-0.5">{loading ? '...' : `${t('إجمالي', 'Total')}: ${maintenance.length} ${t('طلب', 'requests')}`}</p>
          </div>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
          ) : pieData.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm">{t('لا توجد طلبات', 'No requests')}</div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative w-36 h-36 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={3} dataKey="value" stroke="none">
                      {pieData.map((_, i) => <Cell key={i} fill={pieData[i].color} />)}
                    </Pie>
                    <RechartsTooltip contentStyle={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }} formatter={(v: number, n: string) => [`${v} ${t('طلب', 'req')}`, n]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-lg font-bold text-slate-800">{maintenance.length}</span>
                </div>
              </div>
              <div className="flex-1 w-full space-y-3">
                {pieData.map((item, idx) => {
                  const rawKey = Object.entries(maintBuckets)[idx][0]
                  return (
                  <div key={item.name} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${item.color}18` }}>
                      {rawKey === 'Electrical' ? <Zap className="w-4 h-4" style={{ color: item.color }} /> :
                       rawKey === 'Plumbing' ? <Droplets className="w-4 h-4" style={{ color: item.color }} /> :
                       rawKey === 'AC' ? <Wind className="w-4 h-4" style={{ color: item.color }} /> :
                       <Wrench className="w-4 h-4" style={{ color: item.color }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="font-medium text-slate-700">{item.name}</span>
                        <span className="font-bold text-slate-800">{item.value}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pieTotal > 0 ? (item.value / pieTotal) * 100 : 0}%`, backgroundColor: item.color }} />
                      </div>
                    </div>
                  </div>
                  )})}
              </div>
            </div>
          )}
        </div>

        {/* Property Card */}
        <div className="bg-white rounded-2xl overflow-hidden card-shadow border border-slate-100">
          {loading ? (
            <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
          ) : !lastHouse ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Building className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">{t('لا توجد وحدات', 'No houses registered')}</p>
              </div>
            </div>
          ) : (
            <>
              <div className="relative h-44 bg-slate-200">
                {(lastHouse.imageUrls?.[0] || lastHouse.images?.[0]) ? (
                  <img src={resolveImage(lastHouse.imageUrls?.[0] || lastHouse.images?.[0])} alt={lastHouse.houseNumber || ''} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Building className="w-16 h-16 text-slate-300" /></div>
                )}
                <div className="absolute top-3 right-3 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-xs font-semibold text-primary-700 shadow-sm">
                  {t(`مبنى ${lastHouse.buildingNumber || ''}`, `Bldg ${lastHouse.buildingNumber || ''}`)}
                </div>
                <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/40 backdrop-blur-sm rounded-lg text-xs font-semibold text-white">
                  {lastHouse.houseNumber || ''}
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-base font-bold text-slate-800">{t(`فيلا ${lastHouse.houseNumber}`, `Villa ${lastHouse.houseNumber}`)}</h3>
                  {(lastHouse.roomsCount ?? 0) > 0 && (
                    <div className="flex items-center gap-1 text-slate-400 text-xs">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span>{t('مميزة', 'Featured')}</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  {lastHouse.notes || t(`الدور ${lastHouse.floorNumber || ''}`, `Floor ${lastHouse.floorNumber || ''}`)}
                </p>
                <div className="flex items-center gap-4 mb-4">
                  {(lastHouse.roomsCount ?? 0) > 0 && (
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <BedDouble className="w-3.5 h-3.5" /><span className="text-xs">{lastHouse.roomsCount} {t('غرف', 'Rooms')}</span>
                    </div>
                  )}
                  {(lastHouse.bathroomsCount ?? 0) > 0 && (
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Bath className="w-3.5 h-3.5" /><span className="text-xs">{lastHouse.bathroomsCount} {t('حمام', 'Bath')}</span>
                    </div>
                  )}
                  {(lastHouse.area ?? 0) > 0 && (
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Maximize className="w-3.5 h-3.5" /><span className="text-xs">{lastHouse.area} م²</span>
                    </div>
                  )}
                </div>
                {lastHouse.hasGarage && <span className="inline-block px-2 py-0.5 bg-slate-100 rounded text-[10px] text-slate-500 mr-1">{t('جراج', 'Garage')}</span>}
                {lastHouse.hasGarden && <span className="inline-block px-2 py-0.5 bg-slate-100 rounded text-[10px] text-slate-500">{t('حديقة', 'Garden')}</span>}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Quick Stats Footer ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 card-shadow border border-slate-100">
          <p className="text-xs text-slate-400 mb-1">{t('إجمالي طلبات الصيانة', 'Total Maintenance')}</p>
          <p className="text-xl font-bold text-slate-800">{maintenance.length}</p>
          <div className="flex gap-2 mt-1 text-[10px] text-slate-400">
            <span className="text-amber-600">{pendingMaint.length} {t('نشط', 'Active')}</span>
            <span className="text-green-600">{completedMaint.length} {t('مكتمل', 'Done')}</span>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 card-shadow border border-slate-100">
          <p className="text-xs text-slate-400 mb-1">{t('إجمالي الشكاوى', 'Total Complaints')}</p>
          <p className="text-xl font-bold text-slate-800">{complaints.length}</p>
          <div className="flex gap-2 mt-1 text-[10px] text-slate-400">
            <span className="text-red-600">{openComps.length} {t('مفتوح', 'Open')}</span>
            <span className="text-green-600">{resolvedComps.length} {t('محلول', 'Resolved')}</span>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 card-shadow border border-slate-100">
          <p className="text-xs text-slate-400 mb-1">{t('الإعلانات', 'Announcements')}</p>
          <p className="text-xl font-bold text-slate-800">{announcements.length}</p>
          <p className="text-[10px] text-slate-400 mt-1">{t('آخر التحديثات', 'Latest updates')}</p>
        </div>
        <div className="bg-white rounded-xl p-4 card-shadow border border-slate-100">
          <p className="text-xs text-slate-400 mb-1">{t('أصناف الشكاوى', 'Complaint Categories')}</p>
          <p className="text-xl font-bold text-slate-800">{Object.keys(compBuckets).length}</p>
          <p className="text-[10px] text-slate-400 mt-1">{t('فئة مختلفة', 'Different categories')}</p>
        </div>
      </div>
    </div>
  )
}
