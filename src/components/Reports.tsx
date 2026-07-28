import { useState, useEffect } from 'react'
import { Download, Users, Home, Wrench, CreditCard, TrendingUp, Loader2, AlertCircle, RefreshCcw, FileText, FileSpreadsheet, ChevronDown } from 'lucide-react'
import * as XLSX from 'xlsx'
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
  const [showFormatMenu, setShowFormatMenu] = useState(false)

  const ar = language === 'AR'
  const t = (a: string, e: string) => ar ? a : e

  const reportTitles: Record<string, { ar: string; en: string }> = {
    revenue: { ar: 'تقرير الإيرادات', en: 'Revenue Report' },
    tenants: { ar: 'تقرير المستأجرين', en: 'Tenants Report' },
    villas: { ar: 'تقرير الفلل', en: 'Villas Report' },
    maintenance: { ar: 'تقرير الصيانة', en: 'Maintenance Report' },
    payments: { ar: 'تقرير المدفوعات', en: 'Payments Report' },
  }

  const now = new Date()
  const dateStr = now.toLocaleDateString(ar ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const timeStr = now.toLocaleTimeString(ar ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })
  const fileName = `azhar-${selectedReport}-${now.toISOString().split('T')[0]}`

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
        setError(t('تعذر تحميل بيانات التقارير — يتم عرض بيانات تجريبية', 'Could not load report data — showing sample data'))
      }
    } catch (err: any) {
      console.warn('Reports API error:', err.message)
      setError(t('تعذر تحميل بيانات التقارير — يتم عرض بيانات تجريبية', 'Could not load report data — showing sample data'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReports() }, [])

  const getReportData = () => {
    switch (selectedReport) {
      case 'tenants':
        return {
          labels: [t('إجمالي المستأجرين', 'Total'), t('نشط', 'Active'), t('غير نشط', 'Inactive')],
          values: [stats.tenants.total, stats.tenants.active, stats.tenants.inactive],
          extras: [{ label: t('نسبة النشاط', 'Activity Rate'), value: `${Math.round((stats.tenants.active / (stats.tenants.total || 1)) * 100)}%` }],
        }
      case 'villas':
        return {
          labels: [t('إجمالي الفلل', 'Total'), t('متاحة', 'Available'), t('مؤجرة', 'Occupied'), t('صيانة', 'Maintenance')],
          values: [stats.villas.total, stats.villas.available, stats.villas.occupied, stats.villas.maintenance],
          extras: [{ label: t('نسبة الإشغال', 'Occupancy Rate'), value: `${Math.round((stats.villas.occupied / (stats.villas.total || 1)) * 100)}%` }],
        }
      case 'maintenance':
        return {
          labels: [t('الإجمالي', 'Total'), t('قيد الانتظار', 'Pending'), t('قيد العمل', 'In Progress'), t('مكتمل', 'Completed'), t('إجمالي التكاليف', 'Total Costs'), t('متوسط التكلفة', 'Average Cost')],
          values: [stats.maintenance.total, stats.maintenance.pending, stats.maintenance.inProgress, stats.maintenance.completed, stats.maintenance.totalCost, stats.maintenance.averageCost],
          extras: [],
        }
      case 'payments':
        return {
          labels: [t('الإجمالي', 'Total'), t('مدفوع', 'Paid'), t('معلق', 'Pending'), t('نسبة التحصيل', 'Collection Rate')],
          values: [stats.payments.total, stats.payments.paid, stats.payments.pending, `${stats.payments.collectionRate}%`],
          extras: [],
        }
      case 'revenue':
      default:
        return {
          labels: [t('الدخل الشهري', 'Monthly Revenue'), t('الدخل السنوي', 'Yearly Revenue'), t('نسبة النمو', 'Growth Rate')],
          values: [stats.revenue.monthly, stats.revenue.yearly, `+${stats.revenue.growth}%`],
          extras: [],
        }
    }
  }

  const getReportRows = () => {
    const d = getReportData()
    const rows: Record<string, string | number>[] = []
    d.labels.forEach((label, i) => { rows.push({ [t('المقياس', 'Metric')]: label, [t('القيمة', 'Value')]: d.values[i] }) })
    d.extras.forEach(e => { rows.push({ [t('المقياس', 'Metric')]: e.label, [t('القيمة', 'Value')]: e.value }) })
    return rows
  }

  const downloadExcel = () => {
    const rows = getReportRows()
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, t(reportTitles[selectedReport]?.ar, reportTitles[selectedReport]?.en))
    XLSX.writeFile(wb, `${fileName}.xlsx`)
  }

  const downloadWord = () => {
    const title = t(reportTitles[selectedReport]?.ar, reportTitles[selectedReport]?.en)
    const rows = getReportRows()
    const tableRows = rows.map(r => `
      <tr>
        <td style="padding:10px 14px;border:1px solid #e2e8f0;font-weight:500;color:#475569;">${Object.values(r)[0]}</td>
        <td style="padding:10px 14px;border:1px solid #e2e8f0;font-weight:600;color:#1e293b;">${Object.values(r)[1]}</td>
      </tr>
    `).join('')

    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${title}</title>
<style>
  body { font-family: 'Segoe UI', Tahoma, sans-serif; direction: ${ar ? 'rtl' : 'ltr'}; color: #1e293b; padding: 40px; }
  h1 { font-size: 22px; margin-bottom: 4px; }
  .subtitle { color: #64748b; font-size: 13px; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  th { background: #0f172a; color: #fff; padding: 10px 14px; text-align: ${ar ? 'right' : 'left'}; font-size: 13px; }
  td { font-size: 14px; }
  .footer { margin-top: 32px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; }
</style></head>
<body>
  <h1>${title}</h1>
  <div class="subtitle">${t('مجمع الزهراء السكني', 'Azhar Residential Complex')} &mdash; ${dateStr} ${timeStr}</div>
  <table>
    <thead><tr>
      <th>${t('المقياس', 'Metric')}</th>
      <th>${t('القيمة', 'Value')}</th>
    </tr></thead>
    <tbody>${tableRows}</tbody>
  </table>
  <div class="footer">${t('تم إنشاء هذا التقرير تلقائياً من نظام إدارة مجمع الزهراء', 'Generated automatically from Azhar Residential Complex Management System')}</div>
</body></html>`

    const blob = new Blob(['\ufeff' + html], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${fileName}.doc`
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadPDF = async () => {
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

    const title = t(reportTitles[selectedReport]?.ar, reportTitles[selectedReport]?.en)

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
      </div>`

    let bodyContent = ''
    const currency = t('ج.م', 'EGP')
    switch (selectedReport) {
      case 'tenants':
        bodyContent = buildCards([
          { label: t('إجمالي المستأجرين', 'Total Tenants'), value: String(stats.tenants.total), color: '#3b82f6' },
          { label: t('نشط', 'Active'), value: String(stats.tenants.active), color: '#22c55e' },
          { label: t('غير نشط', 'Inactive'), value: String(stats.tenants.inactive), color: '#94a3b8' },
        ]) + buildBar(t('نسبة النشاط', 'Activity Rate'), Math.round((stats.tenants.active / (stats.tenants.total || 1)) * 100), '#22c55e')
        break
      case 'villas':
        bodyContent = buildCards([
          { label: t('إجمالي الفلل', 'Total Villas'), value: String(stats.villas.total), color: '#3b82f6' },
          { label: t('متاحة', 'Available'), value: String(stats.villas.available), color: '#22c55e' },
          { label: t('مؤجرة', 'Occupied'), value: String(stats.villas.occupied), color: '#a855f7' },
          { label: t('صيانة', 'Maintenance'), value: String(stats.villas.maintenance), color: '#f59e0b' },
        ]) + buildBar(t('نسبة الإشغال', 'Occupancy Rate'), Math.round((stats.villas.occupied / (stats.villas.total || 1)) * 100), '#a855f7')
        break
      case 'maintenance':
        bodyContent = buildCards([
          { label: t('الإجمالي', 'Total'), value: String(stats.maintenance.total), color: '#94a3b8' },
          { label: t('قيد الانتظار', 'Pending'), value: String(stats.maintenance.pending), color: '#f59e0b' },
          { label: t('قيد العمل', 'In Progress'), value: String(stats.maintenance.inProgress), color: '#3b82f6' },
          { label: t('مكتمل', 'Completed'), value: String(stats.maintenance.completed), color: '#22c55e' },
        ]) + `
          <div style="margin-top:16px;padding:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
            <div style="font-weight:600;color:#1e293b;margin-bottom:8px;">${t('التكاليف', 'Costs')}</div>
            <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f1f5f9;font-size:14px;">
              <span style="color:#64748b;">${t('إجمالي التكاليف', 'Total Costs')}</span>
              <span style="font-weight:600;color:#1e293b;">${stats.maintenance.totalCost.toLocaleString()} ${currency}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:14px;">
              <span style="color:#64748b;">${t('متوسط التكلفة', 'Average Cost')}</span>
              <span style="font-weight:600;color:#1e293b;">${stats.maintenance.averageCost.toLocaleString()} ${currency}</span>
            </div>
          </div>`
        break
      case 'payments':
        bodyContent = buildCards([
          { label: t('الإجمالي', 'Total'), value: `${stats.payments.total.toLocaleString()} ${currency}`, color: '#3b82f6' },
          { label: t('مدفوع', 'Paid'), value: `${stats.payments.paid.toLocaleString()} ${currency}`, color: '#22c55e' },
          { label: t('معلق', 'Pending'), value: `${stats.payments.pending.toLocaleString()} ${currency}`, color: '#f59e0b' },
        ]) + buildBar(t('نسبة التحصيل', 'Collection Rate'), stats.payments.collectionRate, '#22c55e')
        break
      case 'revenue':
      default:
        bodyContent = buildCards([
          { label: t('الدخل الشهري', 'Monthly Revenue'), value: `${stats.revenue.monthly.toLocaleString()} ${currency}`, color: '#22c55e' },
          { label: t('الدخل السنوي', 'Yearly Revenue'), value: `${stats.revenue.yearly.toLocaleString()} ${currency}`, color: '#3b82f6' },
        ]) + `
          <div style="margin-top:16px;padding:16px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;display:flex;align-items:center;gap:8px;">
            <span style="font-size:15px;font-weight:600;color:#15803d;">+${stats.revenue.growth}%</span>
            <span style="font-size:13px;color:#64748b;">${t('مقارنة بالشهر السابق', 'vs last month')}</span>
          </div>`
        break
    }

    const html = `<!DOCTYPE html>
<html lang="${ar ? 'ar' : 'en'}" dir="${ar ? 'rtl' : 'ltr'}">
<head><meta charset="UTF-8"><title>${title}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Segoe UI',Tahoma,Arial,sans-serif; background:#f1f5f9; color:#1e293b; }
  .report { max-width:800px; margin:30px auto; background:#fff; border-radius:16px; box-shadow:0 4px 24px rgba(0,0,0,0.08); overflow:hidden; }
  .header { background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%); color:#fff; padding:32px 40px; display:flex; align-items:center; gap:20px; }
  .header img { width:64px; height:64px; border-radius:12px; background:#fff; padding:4px; }
  .header-text h1 { font-size:22px; font-weight:700; }
  .header-text p { font-size:13px; opacity:0.7; margin-top:4px; }
  .body { padding:32px 40px; }
  .cards { display:flex; gap:12px; flex-wrap:wrap; }
  .footer { padding:16px 40px; border-top:1px solid #e2e8f0; text-align:center; font-size:12px; color:#94a3b8; }
  @media print { body{background:#fff;} .report{box-shadow:none;margin:0;border-radius:0;} }
</style></head>
<body>
<div class="report">
  <div class="header">
    ${logoBase64 ? `<img src="${logoBase64}" alt="Logo" />` : ''}
    <div class="header-text">
      <h1>${title}</h1>
      <p>${t('مجمع الزهراء السكني', 'Azhar Residential Complex')} — ${dateStr} ${timeStr}</p>
    </div>
  </div>
  <div class="body"><div class="cards">${bodyContent}</div></div>
  <div class="footer">${t('تم إنشاء هذا التقرير تلقائياً من نظام إدارة مجمع الزهراء', 'Generated automatically from Azhar Residential Complex Management System')}</div>
</div>
</body></html>`

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
      setTimeout(() => printWindow.print(), 500)
    }
  }

  const handleDownload = (format: 'pdf' | 'word' | 'excel') => {
    setShowFormatMenu(false)
    switch (format) {
      case 'pdf': downloadPDF(); break
      case 'word': downloadWord(); break
      case 'excel': downloadExcel(); break
    }
  }

  const renderReport = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-48">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            <p className="text-sm text-slate-500">{t('جارٍ تحميل التقرير...', 'Loading report data...')}</p>
          </div>
        </div>
      )
    }

    switch (selectedReport) {
      case 'tenants':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-xl"><p className="text-sm text-blue-600">{t('إجمالي المستأجرين', 'Total Tenants')}</p><p className="text-2xl font-bold text-blue-700">{stats.tenants.total}</p></div>
              <div className="p-4 bg-green-50 rounded-xl"><p className="text-sm text-green-600">{t('نشط', 'Active')}</p><p className="text-2xl font-bold text-green-700">{stats.tenants.active}</p></div>
              <div className="p-4 bg-slate-50 rounded-xl"><p className="text-sm text-slate-600">{t('غير نشط', 'Inactive')}</p><p className="text-2xl font-bold text-slate-700">{stats.tenants.inactive}</p></div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <h4 className="font-semibold text-slate-800 mb-3">{t('نسبة النشاط', 'Activity Rate')}</h4>
              <div className="w-full bg-slate-200 rounded-full h-4"><div className="bg-green-500 h-4 rounded-full transition-all duration-700" style={{ width: `${Math.round((stats.tenants.active / (stats.tenants.total || 1)) * 100)}%` }} /></div>
              <p className="text-sm text-slate-500 mt-2">{Math.round((stats.tenants.active / (stats.tenants.total || 1)) * 100)}% {t('نشط', 'active')}</p>
            </div>
          </div>
        )
      case 'villas':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-xl"><p className="text-sm text-blue-600">{t('إجمالي الفلل', 'Total Villas')}</p><p className="text-2xl font-bold text-blue-700">{stats.villas.total}</p></div>
              <div className="p-4 bg-green-50 rounded-xl"><p className="text-sm text-green-600">{t('متاحة', 'Available')}</p><p className="text-2xl font-bold text-green-700">{stats.villas.available}</p></div>
              <div className="p-4 bg-purple-50 rounded-xl"><p className="text-sm text-purple-600">{t('مؤجرة', 'Occupied')}</p><p className="text-2xl font-bold text-purple-700">{stats.villas.occupied}</p></div>
              <div className="p-4 bg-amber-50 rounded-xl"><p className="text-sm text-amber-600">{t('صيانة', 'Maintenance')}</p><p className="text-2xl font-bold text-amber-700">{stats.villas.maintenance}</p></div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <h4 className="font-semibold text-slate-800 mb-3">{t('نسبة الإشغال', 'Occupancy Rate')}</h4>
              <div className="w-full bg-slate-200 rounded-full h-4"><div className="bg-purple-500 h-4 rounded-full transition-all duration-700" style={{ width: `${Math.round((stats.villas.occupied / (stats.villas.total || 1)) * 100)}%` }} /></div>
              <p className="text-sm text-slate-500 mt-2">{Math.round((stats.villas.occupied / (stats.villas.total || 1)) * 100)}% {t('مشغولة', 'occupied')}</p>
            </div>
          </div>
        )
      case 'maintenance':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl"><p className="text-sm text-slate-600">{t('الإجمالي', 'Total')}</p><p className="text-2xl font-bold text-slate-700">{stats.maintenance.total}</p></div>
              <div className="p-4 bg-amber-50 rounded-xl"><p className="text-sm text-amber-600">{t('قيد الانتظار', 'Pending')}</p><p className="text-2xl font-bold text-amber-700">{stats.maintenance.pending}</p></div>
              <div className="p-4 bg-blue-50 rounded-xl"><p className="text-sm text-blue-600">{t('قيد العمل', 'In Progress')}</p><p className="text-2xl font-bold text-blue-700">{stats.maintenance.inProgress}</p></div>
              <div className="p-4 bg-green-50 rounded-xl"><p className="text-sm text-green-600">{t('مكتمل', 'Completed')}</p><p className="text-2xl font-bold text-green-700">{stats.maintenance.completed}</p></div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <h4 className="font-semibold text-slate-800 mb-3">{t('التكاليف', 'Costs')}</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">{t('إجمالي التكاليف', 'Total Costs')}</span><span className="font-medium">{stats.maintenance.totalCost.toLocaleString()} {t('ج.م', 'EGP')}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">{t('متوسط التكلفة', 'Average Cost')}</span><span className="font-medium">{stats.maintenance.averageCost.toLocaleString()} {t('ج.م', 'EGP')}</span></div>
              </div>
            </div>
          </div>
        )
      case 'payments':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-xl"><p className="text-sm text-blue-600">{t('الإجمالي', 'Total')}</p><p className="text-2xl font-bold text-blue-700">{stats.payments.total.toLocaleString()} {t('ج.م', 'EGP')}</p></div>
              <div className="p-4 bg-green-50 rounded-xl"><p className="text-sm text-green-600">{t('مدفوع', 'Paid')}</p><p className="text-2xl font-bold text-green-700">{stats.payments.paid.toLocaleString()} {t('ج.م', 'EGP')}</p></div>
              <div className="p-4 bg-amber-50 rounded-xl"><p className="text-sm text-amber-600">{t('معلق', 'Pending')}</p><p className="text-2xl font-bold text-amber-700">{stats.payments.pending.toLocaleString()} {t('ج.م', 'EGP')}</p></div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <h4 className="font-semibold text-slate-800 mb-3">{t('نسبة التحصيل', 'Collection Rate')}</h4>
              <div className="w-full bg-slate-200 rounded-full h-4"><div className="bg-green-500 h-4 rounded-full transition-all duration-700" style={{ width: `${stats.payments.collectionRate}%` }} /></div>
              <p className="text-sm text-slate-500 mt-2">{stats.payments.collectionRate}% {t('محصلة', 'collected')}</p>
            </div>
          </div>
        )
      case 'revenue':
      default:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-xl"><p className="text-sm text-green-600">{t('الدخل الشهري', 'Monthly Revenue')}</p><p className="text-2xl font-bold text-green-700">{stats.revenue.monthly.toLocaleString()} {t('ج.م', 'EGP')}</p></div>
              <div className="p-4 bg-blue-50 rounded-xl"><p className="text-sm text-blue-600">{t('الدخل السنوي', 'Yearly Revenue')}</p><p className="text-2xl font-bold text-blue-700">{stats.revenue.yearly.toLocaleString()} {t('ج.م', 'EGP')}</p></div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <h4 className="font-semibold text-slate-800 mb-3">{t('نمو الإيرادات', 'Revenue Growth')}</h4>
              <div className="flex items-center gap-2">
                <span className="text-green-600 flex items-center gap-1"><TrendingUp className="w-4 h-4" />+{stats.revenue.growth}%</span>
                <span className="text-slate-500 text-sm">{t('مقارنة بالشهر السابق', 'vs last month')}</span>
              </div>
            </div>
          </div>
        )
    }
  }

  const reportTypes = [
    { id: 'revenue', label: t('الإيرادات', 'Revenue'), icon: CreditCard },
    { id: 'tenants', label: t('المستأجرين', 'Tenants'), icon: Users },
    { id: 'villas', label: t('الفلل', 'Villas'), icon: Home },
    { id: 'maintenance', label: t('الصيانة', 'Maintenance'), icon: Wrench },
    { id: 'payments', label: t('المدفوعات', 'Payments'), icon: CreditCard },
  ]

  return (
    <div className="bg-white rounded-2xl p-6" onClick={() => showFormatMenu && setShowFormatMenu(false)}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-slate-800">{t('التقارير', 'Reports')}</h2>
        <div className="flex items-center gap-2">
          <button onClick={fetchReports} disabled={loading} className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors text-sm disabled:opacity-50">
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {t('تحديث', 'Refresh')}
          </button>
          <div className="relative">
            <button onClick={(e) => { e.stopPropagation(); setShowFormatMenu(!showFormatMenu) }} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors text-sm">
              <Download className="w-4 h-4" />
              {t('تحميل التقرير', 'Download')}
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {showFormatMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 min-w-[160px] py-1" onClick={e => e.stopPropagation()}>
                <button onClick={() => handleDownload('pdf')} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                  <FileText className="w-4 h-4 text-red-500" />
                  PDF
                </button>
                <button onClick={() => handleDownload('word')} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                  <FileText className="w-4 h-4 text-blue-500" />
                  Word (.doc)
                </button>
                <button onClick={() => handleDownload('excel')} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                  <FileSpreadsheet className="w-4 h-4 text-green-500" />
                  Excel (.xlsx)
                </button>
              </div>
            )}
          </div>
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
          <button key={type.id} onClick={() => setSelectedReport(type.id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${selectedReport === type.id ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
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
