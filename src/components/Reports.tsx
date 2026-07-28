import { useState, useEffect } from 'react'
import { Download, Users, Home, Wrench, CreditCard, TrendingUp, Loader2, AlertCircle, RefreshCcw } from 'lucide-react'
import { api } from '../services/api'

interface ReportsProps {
  language: 'AR' | 'EN'
}

const DEFAULT_STATS = {
  tenants: { total: 45, active: 38, inactive: 7 },
  villas: { total: 50, available: 12, occupied: 35, maintenance: 3 },
  maintenance: { total: 28, pending: 8, inProgress: 5, completed: 15, totalCost: 12500, averageCost: 446 },
  payments: { total: 156000, paid: 142000, pending: 14000, collectionRate: 91 },
  revenue: { monthly: 185000, yearly: 2220000, growth: 8.5 },
}

function Reports({ language }: ReportsProps) {
  const [selectedReport, setSelectedReport] = useState<string>('revenue')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState(DEFAULT_STATS)

  const fetchReports = async () => {
    setLoading(true)
    setError(null)
    try {
      const [financial, maintenance] = await Promise.allSettled([
        api.getFinancialReport(),
        api.getMaintenanceReport(),
      ])

      const fin = financial.status === 'fulfilled' ? financial.value : null
      const maint = maintenance.status === 'fulfilled' ? maintenance.value : null

      setStats(prev => ({
        ...prev,
        // Map financial report fields — adapt keys to match actual backend response
        ...(fin ? {
          payments: {
            total: fin.totalPayments ?? fin.totalAmount ?? prev.payments.total,
            paid: fin.paidAmount ?? fin.totalPaid ?? prev.payments.paid,
            pending: fin.pendingAmount ?? fin.totalPending ?? prev.payments.pending,
            collectionRate: fin.collectionRate ?? prev.payments.collectionRate,
          },
          revenue: {
            monthly: fin.monthlyRevenue ?? fin.monthly ?? prev.revenue.monthly,
            yearly: fin.yearlyRevenue ?? fin.yearly ?? prev.revenue.yearly,
            growth: fin.growth ?? fin.revenueGrowth ?? prev.revenue.growth,
          },
          tenants: {
            total: fin.totalTenants ?? prev.tenants.total,
            active: fin.activeTenants ?? prev.tenants.active,
            inactive: fin.inactiveTenants ?? prev.tenants.inactive,
          },
          villas: {
            total: fin.totalVillas ?? prev.villas.total,
            available: fin.availableVillas ?? prev.villas.available,
            occupied: fin.occupiedVillas ?? prev.villas.occupied,
            maintenance: fin.maintenanceVillas ?? prev.villas.maintenance,
          },
        } : {}),
        // Map maintenance report fields
        ...(maint ? {
          maintenance: {
            total: maint.totalRequests ?? maint.total ?? prev.maintenance.total,
            pending: maint.pendingRequests ?? maint.pending ?? prev.maintenance.pending,
            inProgress: maint.inProgressRequests ?? maint.inProgress ?? prev.maintenance.inProgress,
            completed: maint.completedRequests ?? maint.completed ?? prev.maintenance.completed,
            totalCost: maint.totalCost ?? prev.maintenance.totalCost,
            averageCost: maint.averageCost ?? prev.maintenance.averageCost,
          },
        } : {}),
      }))

      if (financial.status === 'rejected' && maintenance.status === 'rejected') {
        setError(language === 'AR'
          ? 'تعذر تحميل بيانات التقارير — يتم عرض بيانات تجريبية'
          : 'Could not load report data — showing sample data')
      }
    } catch (err: any) {
      console.warn('Reports API error:', err.message)
      setError(language === 'AR'
        ? 'تعذر تحميل بيانات التقارير — يتم عرض بيانات تجريبية'
        : 'Could not load report data — showing sample data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [])

  const handleDownload = async () => {
    let logoBase64 = ''
    try {
      const res = await fetch('/logo.png')
      const blob = await res.blob()
      logoBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(blob)
      })
    } catch {}

    const now = new Date()
    const dateStr = now.toLocaleDateString(language === 'AR' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    const timeStr = now.toLocaleTimeString(language === 'AR' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })

    const ar = language === 'AR'
    const reportTitles: Record<string, { ar: string; en: string }> = {
      revenue: { ar: 'تقرير الإيرادات', en: 'Revenue Report' },
      tenants: { ar: 'تقرير المستأجرين', en: 'Tenants Report' },
      villas: { ar: 'تقرير الفلل', en: 'Villas Report' },
      maintenance: { ar: 'تقرير الصيانة', en: 'Maintenance Report' },
      payments: { ar: 'تقرير المدفوعات', en: 'Payments Report' },
    }
    const title = ar ? reportTitles[selectedReport]?.ar : reportTitles[selectedReport]?.en

    const buildCards = (items: { label: string; value: string; color: string }[]) =>
      items.map(i => `
        <div style="flex:1;min-width:140px;background:${i.color}10;border:1px solid ${i.color}30;border-radius:12px;padding:16px;text-align:center;">
          <div style="font-size:13px;color:${i.color};margin-bottom:6px;">${i.label}</div>
          <div style="font-size:24px;font-weight:700;color:${i.color};">${i.value}</div>
        </div>
      `).join('')

    const buildBar = (label: string, pct: number, color: string) => `
      <div style="margin-top:12px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span style="font-size:13px;color:#64748b;">${label}</span>
          <span style="font-size:13px;font-weight:600;color:${color};">${pct}%</span>
        </div>
        <div style="width:100%;height:10px;background:#e2e8f0;border-radius:99px;overflow:hidden;">
          <div style="width:${pct}%;height:100%;background:${color};border-radius:99px;"></div>
        </div>
      </div>
    `

    let bodyContent = ''
    switch (selectedReport) {
      case 'tenants':
        bodyContent = buildCards([
          { label: ar ? 'إجمالي المستأجرين' : 'Total Tenants', value: String(stats.tenants.total), color: '#3b82f6' },
          { label: ar ? 'نشط' : 'Active', value: String(stats.tenants.active), color: '#22c55e' },
          { label: ar ? 'غير نشط' : 'Inactive', value: String(stats.tenants.inactive), color: '#94a3b8' },
        ]) + buildBar(ar ? 'نسبة النشاط' : 'Activity Rate', Math.round((stats.tenants.active / (stats.tenants.total || 1)) * 100), '#22c55e')
        break
      case 'villas':
        bodyContent = buildCards([
          { label: ar ? 'إجمالي الفلل' : 'Total Villas', value: String(stats.villas.total), color: '#3b82f6' },
          { label: ar ? 'متاحة' : 'Available', value: String(stats.villas.available), color: '#22c55e' },
          { label: ar ? 'مؤجرة' : 'Occupied', value: String(stats.villas.occupied), color: '#a855f7' },
          { label: ar ? 'صيانة' : 'Maintenance', value: String(stats.villas.maintenance), color: '#f59e0b' },
        ]) + buildBar(ar ? 'نسبة الإشغال' : 'Occupancy Rate', Math.round((stats.villas.occupied / (stats.villas.total || 1)) * 100), '#a855f7')
        break
      case 'maintenance':
        bodyContent = buildCards([
          { label: ar ? 'الإجمالي' : 'Total', value: String(stats.maintenance.total), color: '#94a3b8' },
          { label: ar ? 'قيد الانتظار' : 'Pending', value: String(stats.maintenance.pending), color: '#f59e0b' },
          { label: ar ? 'قيد العمل' : 'In Progress', value: String(stats.maintenance.inProgress), color: '#3b82f6' },
          { label: ar ? 'مكتمل' : 'Completed', value: String(stats.maintenance.completed), color: '#22c55e' },
        ]) + `
          <div style="margin-top:16px;padding:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
            <div style="font-weight:600;color:#1e293b;margin-bottom:8px;">${ar ? 'التكاليف' : 'Costs'}</div>
            <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f1f5f9;font-size:14px;">
              <span style="color:#64748b;">${ar ? 'إجمالي التكاليف' : 'Total Costs'}</span>
              <span style="font-weight:600;color:#1e293b;">${stats.maintenance.totalCost.toLocaleString()} ${ar ? 'ج.م' : 'EGP'}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:14px;">
              <span style="color:#64748b;">${ar ? 'متوسط التكلفة' : 'Average Cost'}</span>
              <span style="font-weight:600;color:#1e293b;">${stats.maintenance.averageCost.toLocaleString()} ${ar ? 'ج.م' : 'EGP'}</span>
            </div>
          </div>`
        break
      case 'payments':
        bodyContent = buildCards([
          { label: ar ? 'الإجمالي' : 'Total', value: `${stats.payments.total.toLocaleString()} ${ar ? 'ج.م' : 'EGP'}`, color: '#3b82f6' },
          { label: ar ? 'مدفوع' : 'Paid', value: `${stats.payments.paid.toLocaleString()} ${ar ? 'ج.م' : 'EGP'}`, color: '#22c55e' },
          { label: ar ? 'معلق' : 'Pending', value: `${stats.payments.pending.toLocaleString()} ${ar ? 'ج.م' : 'EGP'}`, color: '#f59e0b' },
        ]) + buildBar(ar ? 'نسبة التحصيل' : 'Collection Rate', stats.payments.collectionRate, '#22c55e')
        break
      case 'revenue':
      default:
        bodyContent = buildCards([
          { label: ar ? 'الدخل الشهري' : 'Monthly Revenue', value: `${stats.revenue.monthly.toLocaleString()} ${ar ? 'ج.م' : 'EGP'}`, color: '#22c55e' },
          { label: ar ? 'الدخل السنوي' : 'Yearly Revenue', value: `${stats.revenue.yearly.toLocaleString()} ${ar ? 'ج.م' : 'EGP'}`, color: '#3b82f6' },
        ]) + `
          <div style="margin-top:16px;padding:16px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;display:flex;align-items:center;gap:8px;">
            <span style="font-size:20px;color:#22c55e;">📈</span>
            <span style="font-size:15px;font-weight:600;color:#15803d;">+${stats.revenue.growth}%</span>
            <span style="font-size:13px;color:#64748b;">${ar ? 'مقارنة بالشهر السابق' : 'vs last month'}</span>
          </div>`
        break
    }

    const html = `<!DOCTYPE html>
<html lang="${ar ? 'ar' : 'en'}" dir="${ar ? 'rtl' : 'ltr'}">
<head>
<meta charset="UTF-8">
<title>${title} - Azhar</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background:#f1f5f9; color:#1e293b; }
  .report { max-width:800px; margin:30px auto; background:#fff; border-radius:16px; box-shadow:0 4px 24px rgba(0,0,0,0.08); overflow:hidden; }
  .header { background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%); color:#fff; padding:32px 40px; display:flex; align-items:center; gap:20px; }
  .header img { width:64px; height:64px; border-radius:12px; background:#fff; padding:4px; }
  .header-text h1 { font-size:22px; font-weight:700; }
  .header-text p { font-size:13px; opacity:0.7; margin-top:4px; }
  .body { padding:32px 40px; }
  .cards { display:flex; gap:12px; flex-wrap:wrap; }
  .footer { padding:16px 40px; border-top:1px solid #e2e8f0; text-align:center; font-size:12px; color:#94a3b8; }
  @media print {
    body { background:#fff; }
    .report { box-shadow:none; margin:0; border-radius:0; }
  }
</style>
</head>
<body>
<div class="report">
  <div class="header">
    ${logoBase64 ? `<img src="${logoBase64}" alt="Logo" />` : ''}
    <div class="header-text">
      <h1>${title}</h1>
      <p>${ar ? 'مجمع الزهراء السكني' : 'Azhar Residential Complex'} — ${dateStr} ${timeStr}</p>
    </div>
  </div>
  <div class="body">
    <div class="cards">${bodyContent}</div>
  </div>
  <div class="footer">
    ${ar ? 'تم إنشاء هذا التقرير تلقائياً من نظام إدارة مجمع الزهراء' : 'This report was generated automatically from Azhar Residential Complex Management System'}
  </div>
</div>
</body>
</html>`

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `azhar-report-${selectedReport}-${now.toISOString().split('T')[0]}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const renderReport = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-48">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            <p className="text-sm text-slate-500">{language === 'AR' ? 'جارٍ تحميل التقرير...' : 'Loading report data...'}</p>
          </div>
        </div>
      )
    }

    switch (selectedReport) {
      case 'tenants':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-xl">
                <p className="text-sm text-blue-600">{language === 'AR' ? 'إجمالي المستأجرين' : 'Total Tenants'}</p>
                <p className="text-2xl font-bold text-blue-700">{stats.tenants.total}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-xl">
                <p className="text-sm text-green-600">{language === 'AR' ? 'نشط' : 'Active'}</p>
                <p className="text-2xl font-bold text-green-700">{stats.tenants.active}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-sm text-slate-600">{language === 'AR' ? 'غير نشط' : 'Inactive'}</p>
                <p className="text-2xl font-bold text-slate-700">{stats.tenants.inactive}</p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <h4 className="font-semibold text-slate-800 mb-3">{language === 'AR' ? 'نسبة النشاط' : 'Activity Rate'}</h4>
              <div className="w-full bg-slate-200 rounded-full h-4">
                <div className="bg-green-500 h-4 rounded-full transition-all duration-700" style={{ width: `${Math.round((stats.tenants.active / (stats.tenants.total || 1)) * 100)}%` }} />
              </div>
              <p className="text-sm text-slate-500 mt-2">
                {Math.round((stats.tenants.active / (stats.tenants.total || 1)) * 100)}% {language === 'AR' ? 'نشط' : 'active'}
              </p>
            </div>
          </div>
        )

      case 'villas':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-xl">
                <p className="text-sm text-blue-600">{language === 'AR' ? 'إجمالي الفلل' : 'Total Villas'}</p>
                <p className="text-2xl font-bold text-blue-700">{stats.villas.total}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-xl">
                <p className="text-sm text-green-600">{language === 'AR' ? 'متاحة' : 'Available'}</p>
                <p className="text-2xl font-bold text-green-700">{stats.villas.available}</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-xl">
                <p className="text-sm text-purple-600">{language === 'AR' ? 'مؤجرة' : 'Occupied'}</p>
                <p className="text-2xl font-bold text-purple-700">{stats.villas.occupied}</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-xl">
                <p className="text-sm text-amber-600">{language === 'AR' ? 'صيانة' : 'Maintenance'}</p>
                <p className="text-2xl font-bold text-amber-700">{stats.villas.maintenance}</p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <h4 className="font-semibold text-slate-800 mb-3">{language === 'AR' ? 'نسبة الإشغال' : 'Occupancy Rate'}</h4>
              <div className="w-full bg-slate-200 rounded-full h-4">
                <div className="bg-purple-500 h-4 rounded-full transition-all duration-700" style={{ width: `${Math.round((stats.villas.occupied / (stats.villas.total || 1)) * 100)}%` }} />
              </div>
              <p className="text-sm text-slate-500 mt-2">
                {Math.round((stats.villas.occupied / (stats.villas.total || 1)) * 100)}% {language === 'AR' ? 'مشغولة' : 'occupied'}
              </p>
            </div>
          </div>
        )

      case 'maintenance':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-sm text-slate-600">{language === 'AR' ? 'الإجمالي' : 'Total'}</p>
                <p className="text-2xl font-bold text-slate-700">{stats.maintenance.total}</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-xl">
                <p className="text-sm text-amber-600">{language === 'AR' ? 'قيد الانتظار' : 'Pending'}</p>
                <p className="text-2xl font-bold text-amber-700">{stats.maintenance.pending}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl">
                <p className="text-sm text-blue-600">{language === 'AR' ? 'قيد العمل' : 'In Progress'}</p>
                <p className="text-2xl font-bold text-blue-700">{stats.maintenance.inProgress}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-xl">
                <p className="text-sm text-green-600">{language === 'AR' ? 'مكتمل' : 'Completed'}</p>
                <p className="text-2xl font-bold text-green-700">{stats.maintenance.completed}</p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <h4 className="font-semibold text-slate-800 mb-3">{language === 'AR' ? 'التكاليف' : 'Costs'}</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">{language === 'AR' ? 'إجمالي التكاليف' : 'Total Costs'}</span>
                  <span className="font-medium">{stats.maintenance.totalCost.toLocaleString()} {language === 'AR' ? 'ريال' : 'SAR'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{language === 'AR' ? 'متوسط التكلفة' : 'Average Cost'}</span>
                  <span className="font-medium">{stats.maintenance.averageCost.toLocaleString()} {language === 'AR' ? 'ريال' : 'SAR'}</span>
                </div>
              </div>
            </div>
          </div>
        )

      case 'payments':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-xl">
                <p className="text-sm text-blue-600">{language === 'AR' ? 'الإجمالي' : 'Total'}</p>
                <p className="text-2xl font-bold text-blue-700">{stats.payments.total.toLocaleString()} {language === 'AR' ? 'ريال' : 'SAR'}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-xl">
                <p className="text-sm text-green-600">{language === 'AR' ? 'مدفوع' : 'Paid'}</p>
                <p className="text-2xl font-bold text-green-700">{stats.payments.paid.toLocaleString()} {language === 'AR' ? 'ريال' : 'SAR'}</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-xl">
                <p className="text-sm text-amber-600">{language === 'AR' ? 'معلق' : 'Pending'}</p>
                <p className="text-2xl font-bold text-amber-700">{stats.payments.pending.toLocaleString()} {language === 'AR' ? 'ريال' : 'SAR'}</p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <h4 className="font-semibold text-slate-800 mb-3">{language === 'AR' ? 'نسبة التحصيل' : 'Collection Rate'}</h4>
              <div className="w-full bg-slate-200 rounded-full h-4">
                <div className="bg-green-500 h-4 rounded-full transition-all duration-700" style={{ width: `${stats.payments.collectionRate}%` }} />
              </div>
              <p className="text-sm text-slate-500 mt-2">{stats.payments.collectionRate}% {language === 'AR' ? 'محصلة' : 'collected'}</p>
            </div>
          </div>
        )

      case 'revenue':
      default:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-xl">
                <p className="text-sm text-green-600">{language === 'AR' ? 'الدخل الشهري' : 'Monthly Revenue'}</p>
                <p className="text-2xl font-bold text-green-700">{stats.revenue.monthly.toLocaleString()} {language === 'AR' ? 'ريال' : 'SAR'}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl">
                <p className="text-sm text-blue-600">{language === 'AR' ? 'الدخل السنوي' : 'Yearly Revenue'}</p>
                <p className="text-2xl font-bold text-blue-700">{stats.revenue.yearly.toLocaleString()} {language === 'AR' ? 'ريال' : 'SAR'}</p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <h4 className="font-semibold text-slate-800 mb-3">{language === 'AR' ? 'نمو الإيرادات' : 'Revenue Growth'}</h4>
              <div className="flex items-center gap-2">
                <span className="text-green-600 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />+{stats.revenue.growth}%
                </span>
                <span className="text-slate-500 text-sm">{language === 'AR' ? 'مقارنة بالشهر السابق' : 'vs last month'}</span>
              </div>
            </div>
          </div>
        )
    }
  }

  const reportTypes = [
    { id: 'revenue', label: language === 'AR' ? 'الإيرادات' : 'Revenue', icon: CreditCard },
    { id: 'tenants', label: language === 'AR' ? 'المستأجرين' : 'Tenants', icon: Users },
    { id: 'villas', label: language === 'AR' ? 'الفلل' : 'Villas', icon: Home },
    { id: 'maintenance', label: language === 'AR' ? 'الصيانة' : 'Maintenance', icon: Wrench },
    { id: 'payments', label: language === 'AR' ? 'المدفوعات' : 'Payments', icon: CreditCard },
  ]

  return (
    <div className="bg-white rounded-2xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-slate-800">{language === 'AR' ? 'التقارير' : 'Reports'}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchReports}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors text-sm disabled:opacity-50"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {language === 'AR' ? 'تحديث' : 'Refresh'}
          </button>
          <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors text-sm">
            <Download className="w-4 h-4" />
            {language === 'AR' ? 'تحميل التقرير' : 'Download Report'}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex gap-2 mb-6 flex-wrap">
        {reportTypes.map(type => (
          <button
            key={type.id}
            onClick={() => setSelectedReport(type.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              selectedReport === type.id ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <type.icon className="w-4 h-4" />
            {type.label}
          </button>
        ))}
      </div>

      {renderReport()}
    </div>
  )
}

export default Reports