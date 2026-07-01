import { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { api, PaymentModel, FinancialReport } from '../services/api'

const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']

function getPaymentsList(data: PaymentModel[] | { payments?: PaymentModel[] } | undefined): PaymentModel[] {
  if (!data) return []
  if (Array.isArray(data)) return data
  return data.payments ?? []
}

interface ChartDataPoint {
  month: string
  value: number
}

function ChartSection() {
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [monthlyData, setMonthlyData] = useState<ChartDataPoint[]>([])
  const [yearlyData, setYearlyData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [payments, report] = await Promise.allSettled([
          api.getPayments(),
          api.getFinancialReport(),
        ])

        const monthBuckets: Record<number, number> = {}
        const yearBuckets: Record<string, number> = {}

        if (payments.status === 'fulfilled') {
          const list = getPaymentsList(payments.value as any)
          list.forEach((p: PaymentModel) => {
            const amt = Number(p.amount) || 0
            const date = p.paymentDate || p.createdAt
            if (date) {
              const d = new Date(date)
              const m = d.getMonth()
              const y = d.getFullYear()
              monthBuckets[m] = (monthBuckets[m] || 0) + amt
              yearBuckets[String(y)] = (yearBuckets[String(y)] || 0) + amt
            }
          })
        }

        if (report.status === 'fulfilled') {
          const r: FinancialReport = report.value
          if (r.monthlyRevenue || r.monthly) {
            const rev = Number(r.monthlyRevenue ?? r.monthly ?? 0)
            const currentMonth = new Date().getMonth()
            monthBuckets[currentMonth] = (monthBuckets[currentMonth] || 0) + rev
          }
          if (r.yearlyRevenue || r.yearly) {
            const rev = Number(r.yearlyRevenue ?? r.yearly ?? 0)
            const currentYear = String(new Date().getFullYear())
            yearBuckets[currentYear] = (yearBuckets[currentYear] || 0) + rev
          }
        }

        const months: ChartDataPoint[] = MONTHS_AR.map((name, i) => ({ month: name, value: monthBuckets[i] || 0 }))
        const years: ChartDataPoint[] = Object.entries(yearBuckets)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([year, value]) => ({ month: year, value }))

        setMonthlyData(months.some(m => m.value > 0) ? months : [])
        setYearlyData(years.length > 0 ? years : [])
      } catch (err) {
        console.error('Failed to fetch chart data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const data = period === 'monthly' ? monthlyData : yearlyData
  const hasData = data.length > 0 && data.some(d => d.value > 0)

  return (
    <div className="bg-white rounded-2xl p-6 card-shadow border border-slate-100 h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800">تحصيل المدفوعات الشهرية</h3>
          <p className="text-sm text-slate-400 mt-1">إجمالي المدفوعات المحصلة</p>
        </div>
        <div className="flex bg-slate-100 rounded-xl p-1">
          <button onClick={() => setPeriod('monthly')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${period === 'monthly' ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>شهري</button>
          <button onClick={() => setPeriod('yearly')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${period === 'yearly' ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>سنوي</button>
        </div>
      </div>

      <div className="h-64">
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm">جارٍ تحميل البيانات...</div>
        ) : !hasData ? (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm">لا توجد بيانات مدفوعات بعد</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', fontSize: '13px', direction: 'rtl' }} formatter={(value: number) => [`${value.toLocaleString()} ر.س`, 'المبلغ']} />
              <Area type="monotone" dataKey="value" stroke="#16a34a" strokeWidth={2.5} fill="url(#colorValue)" dot={{ fill: '#16a34a', strokeWidth: 2, r: 4, stroke: '#fff' }} activeDot={{ r: 6, fill: '#16a34a', stroke: '#fff', strokeWidth: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

export default ChartSection
