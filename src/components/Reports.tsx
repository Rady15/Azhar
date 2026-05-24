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

  const handleDownload = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      selectedReport,
      data: stats,
    }
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `azhar-report-${selectedReport}-${new Date().toISOString().split('T')[0]}.json`
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