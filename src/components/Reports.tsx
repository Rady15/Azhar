import { useState, useEffect } from 'react'
import { Download, Users, Home, Wrench, CreditCard, TrendingUp, Loader2, AlertCircle, RefreshCcw, ChevronDown, BarChart3, PieChart } from 'lucide-react'
import * as XLSX from 'xlsx'
import { api } from '../services/api'
import CurrencySymbol, { CURRENCY_HTML } from './CurrencySymbol'

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

const COLORS = {
  blue: { bg: '#eff6ff', border: '#bfdbfe', text: '#2563eb', fill: '#3b82f6' },
  green: { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a', fill: '#22c55e' },
  amber: { bg: '#fffbeb', border: '#fde68a', text: '#d97706', fill: '#f59e0b' },
  purple: { bg: '#faf5ff', border: '#e9d5ff', text: '#9333ea', fill: '#a855f7' },
  slate: { bg: '#f8fafc', border: '#e2e8f0', text: '#475569', fill: '#94a3b8' },
  red: { bg: '#fef2f2', border: '#fecaca', text: '#dc2626', fill: '#ef4444' },
}

function Reports({ language }: ReportsProps) {
  const [selectedReport, setSelectedReport] = useState<string>('revenue')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState(DEFAULT_STATS)
  const [showFormatMenu, setShowFormatMenu] = useState(false)

  const ar = language === 'AR'
  const t = (a: string, e: string) => ar ? a : e
  const currency = CURRENCY_HTML

  const reportTitles: Record<string, { ar: string; en: string }> = {
    revenue: { ar: 'تقرير الإيرادات والدخل', en: 'Revenue & Income Report' },
    tenants: { ar: 'تقرير المستأجرين', en: 'Tenants Report' },
    villas: { ar: 'تقرير الفلل وال Units', en: 'Villas & Units Report' },
    maintenance: { ar: 'تقرير الصيانة والتكاليف', en: 'Maintenance & Costs Report' },
    payments: { ar: 'تقرير المدفوعات والتحصيل', en: 'Payments & Collection Report' },
  }

  const now = new Date()
  const dateStr = now.toLocaleDateString(ar ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const timeStr = now.toLocaleTimeString(ar ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })
  const fileName = `azhar-${selectedReport}-${now.toISOString().split('T')[0]}`

  const fetchReports = async () => {
    setLoading(true)
    setError(null)
    try {
      const [financial, maintenance, dashboard] = await Promise.allSettled([
        api.getFinancialReport(),
        api.getMaintenanceReport(),
        api.getDashboardStats(),
      ])
      const fin = financial.status === 'fulfilled' ? financial.value : null
      const maint = maintenance.status === 'fulfilled' ? maintenance.value : null
      const dash = dashboard.status === 'fulfilled' ? dashboard.value : null

      const mergedMaintenance = { ...stats.maintenance }
      if (maint) {
        mergedMaintenance.totalCost = maint.totalCost ?? mergedMaintenance.totalCost
        mergedMaintenance.averageCost = maint.averageCost ?? mergedMaintenance.averageCost
        mergedMaintenance.total = maint.totalRequests ?? maint.total ?? mergedMaintenance.total
        mergedMaintenance.pending = maint.pendingRequests ?? maint.pending ?? mergedMaintenance.pending
        mergedMaintenance.inProgress = maint.inProgressRequests ?? maint.inProgress ?? mergedMaintenance.inProgress
        mergedMaintenance.completed = maint.completedRequests ?? maint.completed ?? mergedMaintenance.completed
      }
      if (dash) {
        mergedMaintenance.total = dash.totalMaintenanceRequests ?? mergedMaintenance.total
        mergedMaintenance.pending = dash.openRequests ?? mergedMaintenance.pending
        mergedMaintenance.inProgress = dash.inProgressRequests ?? mergedMaintenance.inProgress
        mergedMaintenance.completed = dash.completedRequests ?? mergedMaintenance.completed
      }

      setStats(prev => ({
        ...prev,
        ...(dash ? {
          tenants: {
            total: dash.totalTenants ?? prev.tenants.total,
            active: dash.activeTenants ?? prev.tenants.active,
            inactive: dash.inactiveTenants ?? prev.tenants.inactive,
          },
          villas: {
            total: dash.totalHouses ?? prev.villas.total,
            available: dash.availableHouses ?? prev.villas.available,
            occupied: dash.occupiedHouses ?? prev.villas.occupied,
            maintenance: dash.housesWithMaintenance ?? prev.villas.maintenance,
          },
        } : {}),
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
        } : {}),
        maintenance: mergedMaintenance,
      }))
      if (financial.status === 'rejected' && maintenance.status === 'rejected' && dashboard.status === 'rejected') {
        setError(t('تعذر تحميل البيانات — عرض بيانات تجريبية', 'Could not load data — showing sample data'))
      }
    } catch (err: any) {
      setError(t('تعذر تحميل البيانات — عرض بيانات تجريبية', 'Could not load data — showing sample data'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReports() }, [])

  const donutSVG = (pct: number, color: string, size = 120, stroke = 14) => {
    const r = (size - stroke) / 2
    const circ = 2 * Math.PI * r
    const offset = circ - (pct / 100) * circ
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="#e2e8f0" stroke-width="${stroke}"/>
      <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-dasharray="${circ}" stroke-dashoffset="${offset}" stroke-linecap="round" transform="rotate(-90 ${size/2} ${size/2})"/>
      <text x="${size/2}" y="${size/2}" text-anchor="middle" dy=".35em" font-size="22" font-weight="700" fill="${color}">${pct}%</text>
    </svg>`
  }

  const barChartSVG = (items: { label: string; value: number; color: string }[], maxVal: number) => {
    const barH = 32
    const gap = 12
    const labelW = 120
    const chartW = 400
    const h = items.length * (barH + gap)
    return `<svg width="100%" viewBox="0 0 ${labelW + chartW + 60} ${h}" xmlns="http://www.w3.org/2000/svg">
      ${items.map((item, i) => {
        const y = i * (barH + gap)
        const w = maxVal > 0 ? (item.value / maxVal) * chartW : 0
        return `
          <text x="${labelW - 8}" y="${y + barH / 2 + 1}" text-anchor="end" dy=".35em" font-size="13" fill="#64748b">${item.label}</text>
          <rect x="${labelW}" y="${y}" width="${chartW}" height="${barH}" rx="6" fill="#f1f5f9"/>
          <rect x="${labelW}" y="${y}" width="${Math.max(w, 4)}" height="${barH}" rx="6" fill="${item.color}">
            <animate attributeName="width" from="0" to="${w}" dur="0.8s" fill="freeze"/>
          </rect>
          <text x="${labelW + Math.max(w, 4) + 8}" y="${y + barH / 2 + 1}" dy=".35em" font-size="13" font-weight="600" fill="${item.color}">${item.value.toLocaleString()}</text>
        `
      }).join('')}
    </svg>`
  }

  const horizontalBar = (label: string, pct: number, color: string) => `
    <div style="margin:16px 0;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span style="font-size:14px;color:#475569;font-weight:500;">${label}</span>
        <span style="font-size:14px;font-weight:700;color:${color};">${pct}%</span>
      </div>
      <div style="width:100%;height:12px;background:#f1f5f9;border-radius:99px;overflow:hidden;">
        <div style="width:${pct}%;height:100%;background:linear-gradient(90deg,${color}cc,${color});border-radius:99px;"></div>
      </div>
    </div>`

  const getExcelRows = () => {
    const rows: Record<string, string | number>[] = []
    const add = (l: string, v: string | number) => rows.push({ [t('المقياس', 'Metric')]: l, [t('القيمة', 'Value')]: v })
    switch (selectedReport) {
      case 'tenants':
        add(t('إجمالي المستأجرين', 'Total Tenants'), stats.tenants.total)
        add(t('المستأجرين النشطين', 'Active Tenants'), stats.tenants.active)
        add(t('المستأجرين غير النشطين', 'Inactive Tenants'), stats.tenants.inactive)
        add(t('نسبة النشاط', 'Activity Rate'), `${Math.round((stats.tenants.active / (stats.tenants.total || 1)) * 100)}%`)
        break
      case 'villas':
        add(t('إجمالي الفلل', 'Total Villas'), stats.villas.total)
        add(t('الفلل المتاحة', 'Available'), stats.villas.available)
        add(t('الفلل المؤجرة', 'Occupied'), stats.villas.occupied)
        add(t('الفلل قيد الصيانة', 'Under Maintenance'), stats.villas.maintenance)
        add(t('نسبة الإشغال', 'Occupancy Rate'), `${Math.round((stats.villas.occupied / (stats.villas.total || 1)) * 100)}%`)
        break
      case 'maintenance':
        add(t('إجمالي الطلبات', 'Total Requests'), stats.maintenance.total)
        add(t('قيد الانتظار', 'Pending'), stats.maintenance.pending)
        add(t('قيد العمل', 'In Progress'), stats.maintenance.inProgress)
        add(t('مكتملة', 'Completed'), stats.maintenance.completed)
        add(t('إجمالي التكاليف', 'Total Costs'), `${stats.maintenance.totalCost.toLocaleString()} ${currency}`)
        add(t('متوسط التكلفة', 'Avg Cost'), `${stats.maintenance.averageCost.toLocaleString()} ${currency}`)
        break
      case 'payments':
        add(t('إجمالي المدفوعات', 'Total Payments'), `${stats.payments.total.toLocaleString()} ${currency}`)
        add(t('المدفوع', 'Paid'), `${stats.payments.paid.toLocaleString()} ${currency}`)
        add(t('المعلق', 'Pending'), `${stats.payments.pending.toLocaleString()} ${currency}`)
        add(t('نسبة التحصيل', 'Collection Rate'), `${stats.payments.collectionRate}%`)
        break
      default:
        add(t('الدخل الشهري', 'Monthly Revenue'), `${stats.revenue.monthly.toLocaleString()} ${currency}`)
        add(t('الدخل السنوي', 'Yearly Revenue'), `${stats.revenue.yearly.toLocaleString()} ${currency}`)
        add(t('نسبة النمو', 'Growth Rate'), `+${stats.revenue.growth}%`)
    }
    return rows
  }

  const downloadExcel = () => {
    const ws = XLSX.utils.json_to_sheet(getExcelRows())
    ws['!cols'] = [{ wch: 30 }, { wch: 20 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, t(reportTitles[selectedReport]?.ar, reportTitles[selectedReport]?.en))
    XLSX.writeFile(wb, `${fileName}.xlsx`)
  }

  const downloadWord = async () => {
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
    const rows = getExcelRows()
    const tableRows = rows.map(r => `
      <tr>
        <td style="padding:12px 16px;border:1px solid #e2e8f0;font-size:14px;color:#475569;background:#f8fafc;">${Object.values(r)[0]}</td>
        <td style="padding:12px 16px;border:1px solid #e2e8f0;font-size:15px;font-weight:700;color:#1e293b;">${Object.values(r)[1]}</td>
      </tr>
    `).join('')

    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head><meta charset="utf-8"><title>${title}</title>
<style>
  @page { size: A4; margin: 2cm; }
  body { font-family:'Segoe UI',Tahoma,sans-serif; direction:${ar ? 'rtl' : 'ltr'}; color:#1e293b; line-height:1.6; }
  .header { background:linear-gradient(135deg,#0f172a,#1e3a5f); color:#fff; padding:32px 40px; border-radius:12px; display:flex; align-items:center; gap:20px; margin-bottom:32px; }
  .header img { width:60px; height:60px; border-radius:10px; background:#fff; padding:3px; }
  .header h1 { font-size:24px; margin:0; }
  .header p { font-size:13px; opacity:0.7; margin-top:4px; }
  table { width:100%; border-collapse:collapse; margin:20px 0; }
  th { background:#0f172a; color:#fff; padding:12px 16px; text-align:${ar ? 'right' : 'left'}; font-size:13px; font-weight:600; }
  .footer { margin-top:40px; text-align:center; font-size:11px; color:#94a3b8; border-top:2px solid #e2e8f0; padding-top:16px; }
</style></head>
<body>
  <div class="header">
    ${logoBase64 ? `<img src="${logoBase64}" alt="Logo"/>` : ''}
    <div><h1>${title}</h1><p>${t('مجمع الزهراء السكني', 'Azhar Residential Complex')} &mdash; ${dateStr} ${timeStr}</p></div>
  </div>
  <table>
    <thead><tr><th>${t('المقياس', 'Metric')}</th><th>${t('القيمة', 'Value')}</th></tr></thead>
    <tbody>${tableRows}</tbody>
  </table>
  <div class="footer">${t('تم إنشاء هذا التقرير تلقائياً من نظام إدارة مجمع الزهراء', 'Generated automatically from Azhar Residential Complex Management System')}</div>
</body></html>`

    const blob = new Blob(['\ufeff' + html], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${fileName}.doc`; a.click()
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
    let bodyContent = ''
    let insightText = ''

    switch (selectedReport) {
      case 'tenants': {
        const pct = Math.round((stats.tenants.active / (stats.tenants.total || 1)) * 100)
        bodyContent = `
          <div style="display:flex;gap:20px;flex-wrap:wrap;margin-bottom:32px;">
            ${[
              { l: t('إجمالي المستأجرين','Total'), v: String(stats.tenants.total), c: COLORS.blue },
              { l: t('نشط','Active'), v: String(stats.tenants.active), c: COLORS.green },
              { l: t('غير نشط','Inactive'), v: String(stats.tenants.inactive), c: COLORS.slate },
            ].map(i => `<div style="flex:1;min-width:160px;background:${i.c.bg};border:1px solid ${i.c.border};border-radius:14px;padding:20px;text-align:center;">
              <div style="font-size:12px;color:${i.c.text};font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">${i.l}</div>
              <div style="font-size:32px;font-weight:800;color:${i.c.text};">${i.v}</div>
            </div>`).join('')}
          </div>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:24px;">
            <div style="display:flex;align-items:center;gap:24px;">
              ${donutSVG(pct, COLORS.green.fill)}
              <div>
                <div style="font-size:16px;font-weight:700;color:#1e293b;margin-bottom:4px;">${t('نسبة النشاط','Activity Rate')}</div>
                <div style="font-size:14px;color:#64748b;">${pct}% ${t('من المستأجرين نشطين حالياً','of tenants are currently active')}</div>
                ${horizontalBar(t('النشط','Active'), pct, COLORS.green.fill)}
              </div>
            </div>
          </div>`
        insightText = pct > 80
          ? t(`نسبة ممتازة! ${pct}% من المستأجرين نشطين.`, `Excellent! ${pct}% of tenants are active.`)
          : t(`يحتاج تحسين — ${pct}% فقط نشطين.`, `Needs improvement — only ${pct}% active.`)
        break
      }
      case 'villas': {
        const occPct = Math.round((stats.villas.occupied / (stats.villas.total || 1)) * 100)
        const avlPct = Math.round((stats.villas.available / (stats.villas.total || 1)) * 100)
        bodyContent = `
          <div style="display:flex;gap:20px;flex-wrap:wrap;margin-bottom:32px;">
            ${[
              { l: t('إجمالي الفلل','Total'), v: String(stats.villas.total), c: COLORS.blue },
              { l: t('مؤجرة','Occupied'), v: String(stats.villas.occupied), c: COLORS.purple },
              { l: t('متاحة','Available'), v: String(stats.villas.available), c: COLORS.green },
              { l: t('صيانة','Maintenance'), v: String(stats.villas.maintenance), c: COLORS.amber },
            ].map(i => `<div style="flex:1;min-width:140px;background:${i.c.bg};border:1px solid ${i.c.border};border-radius:14px;padding:20px;text-align:center;">
              <div style="font-size:12px;color:${i.c.text};font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">${i.l}</div>
              <div style="font-size:32px;font-weight:800;color:${i.c.text};">${i.v}</div>
            </div>`).join('')}
          </div>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:24px;">
            <div style="display:flex;align-items:center;gap:24px;">
              ${donutSVG(occPct, COLORS.purple.fill)}
              <div style="flex:1;">
                <div style="font-size:16px;font-weight:700;color:#1e293b;margin-bottom:4px;">${t('نسبة الإشغال','Occupancy Rate')}</div>
                <div style="font-size:14px;color:#64748b;">${occPct}% ${t('من الفلل مشغولة','of villas are occupied')}</div>
                ${horizontalBar(t('مؤجرة','Occupied'), occPct, COLORS.purple.fill)}
                ${horizontalBar(t('متاحة','Available'), avlPct, COLORS.green.fill)}
              </div>
            </div>
          </div>`
        insightText = occPct > 70
          ? t(`إشغال جيد بنسبة ${occPct}%.`, `Good occupancy at ${occPct}%.`)
          : t(`الإشغال منخفض (${occPct}%) — يُنصح بالترويج.`, `Low occupancy (${occPct}%) — consider promotion.`)
        break
      }
      case 'maintenance': {
        bodyContent = `
          <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:32px;">
            ${[
              { l: t('الإجمالي','Total'), v: String(stats.maintenance.total), c: COLORS.slate },
              { l: t('قيد الانتظار','Pending'), v: String(stats.maintenance.pending), c: COLORS.amber },
              { l: t('قيد العمل','In Progress'), v: String(stats.maintenance.inProgress), c: COLORS.blue },
              { l: t('مكتمل','Completed'), v: String(stats.maintenance.completed), c: COLORS.green },
            ].map(i => `<div style="flex:1;min-width:140px;background:${i.c.bg};border:1px solid ${i.c.border};border-radius:14px;padding:20px;text-align:center;">
              <div style="font-size:12px;color:${i.c.text};font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">${i.l}</div>
              <div style="font-size:32px;font-weight:800;color:${i.c.text};">${i.v}</div>
            </div>`).join('')}
          </div>
          ${barChartSVG([
            { label: t('قيد الانتظار','Pending'), value: stats.maintenance.pending, color: COLORS.amber.fill },
            { label: t('قيد العمل','In Progress'), value: stats.maintenance.inProgress, color: COLORS.blue.fill },
            { label: t('مكتمل','Completed'), value: stats.maintenance.completed, color: COLORS.green.fill },
          ], Math.max(stats.maintenance.pending, stats.maintenance.inProgress, stats.maintenance.completed))}
          <div style="margin-top:24px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:24px;display:flex;gap:32px;">
            <div style="flex:1;text-align:center;border-right:1px solid #e2e8f0;">
              <div style="font-size:12px;color:#64748b;margin-bottom:4px;">${t('إجمالي التكاليف','Total Costs')}</div>
              <div style="font-size:24px;font-weight:800;color:#1e293b;">${stats.maintenance.totalCost.toLocaleString()} ${currency}</div>
            </div>
            <div style="flex:1;text-align:center;">
              <div style="font-size:12px;color:#64748b;margin-bottom:4px;">${t('متوسط التكلفة','Avg Cost')}</div>
              <div style="font-size:24px;font-weight:800;color:#1e293b;">${stats.maintenance.averageCost.toLocaleString()} ${currency}</div>
            </div>
          </div>`
        insightText = stats.maintenance.pending > stats.maintenance.completed
          ? t('⚠️ الطلبات المعلقة أكثر من المكتملة — يُنصح بمراجعة.', '⚠️ Pending requests exceed completed — review recommended.')
          : t('✅ الأداء جيد — majority of requests are completed.', '✅ Performance is good — majority of requests completed.')
        break
      }
      case 'payments': {
        bodyContent = `
          <div style="display:flex;gap:20px;flex-wrap:wrap;margin-bottom:32px;">
            ${[
              { l: t('الإجمالي','Total'), v: `${stats.payments.total.toLocaleString()} ${currency}`, c: COLORS.blue },
              { l: t('مدفوع','Paid'), v: `${stats.payments.paid.toLocaleString()} ${currency}`, c: COLORS.green },
              { l: t('معلق','Pending'), v: `${stats.payments.pending.toLocaleString()} ${currency}`, c: COLORS.amber },
            ].map(i => `<div style="flex:1;min-width:160px;background:${i.c.bg};border:1px solid ${i.c.border};border-radius:14px;padding:20px;text-align:center;">
              <div style="font-size:12px;color:${i.c.text};font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">${i.l}</div>
              <div style="font-size:24px;font-weight:800;color:${i.c.text};">${i.v}</div>
            </div>`).join('')}
          </div>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:24px;">
            <div style="display:flex;align-items:center;gap:24px;">
              ${donutSVG(stats.payments.collectionRate, COLORS.green.fill)}
              <div style="flex:1;">
                <div style="font-size:16px;font-weight:700;color:#1e293b;margin-bottom:4px;">${t('نسبة التحصيل','Collection Rate')}</div>
                <div style="font-size:14px;color:#64748b;">${stats.payments.collectionRate}% ${t('من المدفوعات محصلة','of payments collected')}</div>
                ${horizontalBar(t('محصلة','Collected'), stats.payments.collectionRate, COLORS.green.fill)}
              </div>
            </div>
          </div>`
        insightText = stats.payments.collectionRate >= 90
          ? t(`نسبة تحصيل ممتازة ${stats.payments.collectionRate}%`, `Excellent collection rate of ${stats.payments.collectionRate}%`)
          : t(`التحصيل ${stats.payments.collectionRate}% — يُنصح بمتابعة المتأخرات.`, `Collection at ${stats.payments.collectionRate}% — follow up on delays.`)
        break
      }
      case 'revenue':
      default: {
        bodyContent = `
          <div style="display:flex;gap:20px;flex-wrap:wrap;margin-bottom:32px;">
            <div style="flex:1;min-width:200px;background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1px solid #bbf7d0;border-radius:14px;padding:24px;text-align:center;">
              <div style="font-size:12px;color:#16a34a;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">${t('الدخل الشهري','Monthly Revenue')}</div>
              <div style="font-size:36px;font-weight:800;color:#15803d;">${stats.revenue.monthly.toLocaleString()}</div>
              <div style="font-size:13px;color:#64748b;margin-top:4px;">${currency}</div>
            </div>
            <div style="flex:1;min-width:200px;background:linear-gradient(135deg,#eff6ff,#dbeafe);border:1px solid #bfdbfe;border-radius:14px;padding:24px;text-align:center;">
              <div style="font-size:12px;color:#2563eb;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">${t('الدخل السنوي','Yearly Revenue')}</div>
              <div style="font-size:36px;font-weight:800;color:#1d4ed8;">${stats.revenue.yearly.toLocaleString()}</div>
              <div style="font-size:13px;color:#64748b;margin-top:4px;">${currency}</div>
            </div>
          </div>
          <div style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1px solid #bbf7d0;border-radius:14px;padding:24px;display:flex;align-items:center;gap:16px;">
            <div style="width:56px;height:56px;background:#22c55e;border-radius:50%;display:flex;align-items:center;justify-content:center;">
              <span style="font-size:24px;">📈</span>
            </div>
            <div>
              <div style="font-size:24px;font-weight:800;color:#15803d;">+${stats.revenue.growth}%</div>
              <div style="font-size:14px;color:#64748b;">${t('نمو الإيرادات مقارنة بالشهر السابق','Revenue growth vs last month')}</div>
            </div>
          </div>`
        insightText = t(`نمو إيجابي بنسبة ${stats.revenue.growth}% — استمرار في التحسن.`, `Positive growth at ${stats.revenue.growth}% — continued improvement.`)
        break
      }
    }

    const html = `<!DOCTYPE html>
<html lang="${ar ? 'ar' : 'en'}" dir="${ar ? 'rtl' : 'ltr'}">
<head><meta charset="UTF-8"><title>${title}</title>
<style>
  @page { size:A4; margin:15mm; }
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Segoe UI',Tahoma,Arial,sans-serif;background:#f1f5f9;color:#1e293b;}
  .report{max-width:820px;margin:24px auto;background:#fff;border-radius:20px;box-shadow:0 8px 40px rgba(0,0,0,0.06);overflow:hidden;}
  .header{background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 50%,#0f766e 100%);color:#fff;padding:36px 44px;display:flex;align-items:center;gap:24px;position:relative;overflow:hidden;}
  .header::after{content:'';position:absolute;top:-40px;right:-40px;width:200px;height:200px;background:rgba(255,255,255,0.05);border-radius:50%;}
  .header::before{content:'';position:absolute;bottom:-60px;left:30%;width:300px;height:300px;background:rgba(255,255,255,0.03);border-radius:50%;}
  .header img{width:72px;height:72px;border-radius:14px;background:#fff;padding:5px;position:relative;z-index:1;}
  .header-text{position:relative;z-index:1;}
  .header-text h1{font-size:26px;font-weight:800;letter-spacing:-0.3px;}
  .header-text p{font-size:14px;opacity:0.65;margin-top:6px;}
  .body{padding:36px 44px;}
  .insight{background:linear-gradient(135deg,#f8fafc,#f1f5f9);border:1px solid #e2e8f0;border-radius:14px;padding:20px 24px;margin-top:32px;display:flex;align-items:center;gap:12px;}
  .insight-icon{width:40px;height:40px;background:#fff;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 2px 8px rgba(0,0,0,0.06);flex-shrink:0;}
  .insight-text{font-size:14px;color:#475569;line-height:1.6;}
  .footer{padding:20px 44px;border-top:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;font-size:11px;color:#94a3b8;}
  .footer-line{width:40px;height:3px;background:linear-gradient(90deg,#0f172a,#0f766e);border-radius:99px;margin:0 auto 12px;}
  @media print{body{background:#fff;}.report{box-shadow:none;margin:0;border-radius:0;}}
</style></head>
<body>
<div class="report">
  <div class="header">
    ${logoBase64 ? `<img src="${logoBase64}" alt="Logo"/>` : ''}
    <div class="header-text">
      <h1>${title}</h1>
      <p>${t('مجمع الزهراء السكني','Azhar Residential Complex')} &bull; ${dateStr} &bull; ${timeStr}</p>
    </div>
  </div>
  <div class="body">
    ${bodyContent}
    ${insightText ? `<div class="insight">
      <div class="insight-icon">💡</div>
      <div class="insight-text">${insightText}</div>
    </div>` : ''}
  </div>
  <div class="footer">
    <span>${t('نظام إدارة مجمع الزهراء السكني','Azhar Residential Complex Management')}</span>
    <div class="footer-line"></div>
    <span>${dateStr}</span>
  </div>
</div>
</body></html>`

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
      setTimeout(() => printWindow.print(), 600)
    }
  }

  const handleDownload = (format: 'pdf' | 'word' | 'excel') => {
    setShowFormatMenu(false)
    if (format === 'pdf') downloadPDF()
    else if (format === 'word') downloadWord()
    else downloadExcel()
  }

  const renderReport = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-48">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            <p className="text-sm text-slate-500">{t('جارٍ تحميل التقرير...', 'Loading report...')}</p>
          </div>
        </div>
      )
    }

    const Donut = ({ pct, color, label, sub }: { pct: number; color: string; label: string; sub: string }) => (
      <div className="flex items-center gap-4">
        <svg width="100" height="100" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="10" />
          <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="10" strokeDasharray={`${2 * Math.PI * 40}`} strokeDashoffset={`${2 * Math.PI * 40 * (1 - pct / 100)}`} strokeLinecap="round" transform="rotate(-90 50 50)" className="transition-all duration-1000" />
          <text x="50" y="50" textAnchor="middle" dy=".35em" fontSize="18" fontWeight="700" fill={color}>{pct}%</text>
        </svg>
        <div>
          <p className="text-sm font-bold text-slate-800">{label}</p>
          <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
        </div>
      </div>
    )

    const Bar = ({ label, pct, color }: { label: string; pct: number; color: string }) => (
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-sm text-slate-600">{label}</span>
          <span className="text-sm font-bold" style={{ color }}>{pct}%</span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}cc, ${color})` }} />
        </div>
      </div>
    )

    const Card = ({ label, value, color, icon }: { label: string; value: string | React.ReactNode; color: string; icon?: React.ReactNode }) => (
      <div className="rounded-xl p-5 border transition-all hover:shadow-md" style={{ background: `${color}08`, borderColor: `${color}25` }}>
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color }}>{label}</span>
        </div>
        <p className="text-3xl font-extrabold" style={{ color }}>{value}</p>
      </div>
    )

    switch (selectedReport) {
      case 'tenants': {
        const pct = Math.round((stats.tenants.active / (stats.tenants.total || 1)) * 100)
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <Card label={t('إجمالي المستأجرين', 'Total Tenants')} value={String(stats.tenants.total)} color="#3b82f6" icon={<Users className="w-4 h-4" />} />
              <Card label={t('نشط', 'Active')} value={String(stats.tenants.active)} color="#22c55e" />
              <Card label={t('غير نشط', 'Inactive')} value={String(stats.tenants.inactive)} color="#94a3b8" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
              <div className="flex items-center gap-6">
                <Donut pct={pct} color="#22c55e" label={t('نسبة النشاط', 'Activity Rate')} sub={`${pct}% ${t('نشط', 'active')}`} />
                <div className="flex-1">
                  <Bar label={t('نشط', 'Active')} pct={pct} color="#22c55e" />
                  <Bar label={t('غير نشط', 'Inactive')} pct={100 - pct} color="#94a3b8" />
                </div>
              </div>
            </div>
          </div>
        )
      }
      case 'villas': {
        const occPct = Math.round((stats.villas.occupied / (stats.villas.total || 1)) * 100)
        const avlPct = Math.round((stats.villas.available / (stats.villas.total || 1)) * 100)
        const mntPct = Math.round((stats.villas.maintenance / (stats.villas.total || 1)) * 100)
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <Card label={t('إجمالي الفلل', 'Total')} value={String(stats.villas.total)} color="#3b82f6" icon={<Home className="w-4 h-4" />} />
              <Card label={t('مؤجرة', 'Occupied')} value={String(stats.villas.occupied)} color="#a855f7" />
              <Card label={t('متاحة', 'Available')} value={String(stats.villas.available)} color="#22c55e" />
              <Card label={t('صيانة', 'Maintenance')} value={String(stats.villas.maintenance)} color="#f59e0b" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
              <div className="flex items-center gap-6">
                <Donut pct={occPct} color="#a855f7" label={t('نسبة الإشغال', 'Occupancy')} sub={`${occPct}% ${t('مشغولة', 'occupied')}`} />
                <div className="flex-1">
                  <Bar label={t('مؤجرة', 'Occupied')} pct={occPct} color="#a855f7" />
                  <Bar label={t('متاحة', 'Available')} pct={avlPct} color="#22c55e" />
                  <Bar label={t('صيانة', 'Maintenance')} pct={mntPct} color="#f59e0b" />
                </div>
              </div>
            </div>
          </div>
        )
      }
      case 'maintenance': {
        const donePct = Math.round((stats.maintenance.completed / (stats.maintenance.total || 1)) * 100)
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <Card label={t('الإجمالي', 'Total')} value={String(stats.maintenance.total)} color="#475569" icon={<Wrench className="w-4 h-4" />} />
              <Card label={t('قيد الانتظار', 'Pending')} value={String(stats.maintenance.pending)} color="#f59e0b" />
              <Card label={t('قيد العمل', 'In Progress')} value={String(stats.maintenance.inProgress)} color="#3b82f6" />
              <Card label={t('مكتمل', 'Completed')} value={String(stats.maintenance.completed)} color="#22c55e" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-slate-500" />
                  <h4 className="font-bold text-slate-800">{t('التوزيع', 'Distribution')}</h4>
                </div>
                <Donut pct={donePct} color="#22c55e" label={t('نسبة الإنجاز', 'Completion Rate')} sub={`${stats.maintenance.completed}/${stats.maintenance.total}`} />
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                <h4 className="font-bold text-slate-800 mb-4">{t('التكاليف', 'Costs')}</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100">
                    <span className="text-sm text-slate-500">{t('إجمالي التكاليف', 'Total Costs')}</span>
                    <span className="text-lg font-bold text-slate-800">{stats.maintenance.totalCost.toLocaleString()} <CurrencySymbol /></span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100">
                    <span className="text-sm text-slate-500">{t('متوسط التكلفة', 'Avg Cost')}</span>
                    <span className="text-lg font-bold text-slate-800">{stats.maintenance.averageCost.toLocaleString()} <CurrencySymbol /></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }
      case 'payments': {
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <Card label={t('الإجمالي', 'Total')} value={<>{stats.payments.total.toLocaleString()} <CurrencySymbol /></>} color="#3b82f6" icon={<CreditCard className="w-4 h-4" />} />
              <Card label={t('مدفوع', 'Paid')} value={<>{stats.payments.paid.toLocaleString()} <CurrencySymbol /></>} color="#22c55e" />
              <Card label={t('معلق', 'Pending')} value={<>{stats.payments.pending.toLocaleString()} <CurrencySymbol /></>} color="#f59e0b" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
              <div className="flex items-center gap-6">
                <Donut pct={stats.payments.collectionRate} color="#22c55e" label={t('نسبة التحصيل', 'Collection Rate')} sub={`${stats.payments.collectionRate}% ${t('محصلة', 'collected')}`} />
                <div className="flex-1">
                  <Bar label={t('مدفوع', 'Paid')} pct={Math.round((stats.payments.paid / (stats.payments.total || 1)) * 100)} color="#22c55e" />
                  <Bar label={t('معلق', 'Pending')} pct={Math.round((stats.payments.pending / (stats.payments.total || 1)) * 100)} color="#f59e0b" />
                </div>
              </div>
            </div>
          </div>
        )
      }
      case 'revenue':
      default: {
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl p-6 border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                <p className="text-sm font-semibold text-green-600 uppercase tracking-wide mb-2">{t('الدخل الشهري', 'Monthly Revenue')}</p>
                <p className="text-4xl font-extrabold text-green-700">{stats.revenue.monthly.toLocaleString()}</p>
                <p className="text-sm text-slate-500 mt-1"><CurrencySymbol /></p>
              </div>
              <div className="rounded-xl p-6 border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
                <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-2">{t('الدخل السنوي', 'Yearly Revenue')}</p>
                <p className="text-4xl font-extrabold text-blue-700">{stats.revenue.yearly.toLocaleString()}</p>
                <p className="text-sm text-slate-500 mt-1"><CurrencySymbol /></p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 flex items-center gap-5">
              <div className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-200">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-3xl font-extrabold text-green-700">+{stats.revenue.growth}%</p>
                <p className="text-sm text-slate-500">{t('نمو الإيرادات مقارنة بالشهر السابق', 'Revenue growth vs last month')}</p>
              </div>
            </div>
          </div>
        )
      }
    }
  }

  const reportTypes = [
    { id: 'revenue', label: t('الإيرادات', 'Revenue'), icon: TrendingUp },
    { id: 'tenants', label: t('المستأجرين', 'Tenants'), icon: Users },
    { id: 'villas', label: t('الفلل', 'Villas'), icon: Home },
    { id: 'maintenance', label: t('الصيانة', 'Maintenance'), icon: Wrench },
    { id: 'payments', label: t('المدفوعات', 'Payments'), icon: CreditCard },
  ]

  return (
    <div className="bg-white rounded-2xl p-6" onClick={() => showFormatMenu && setShowFormatMenu(false)}>
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
            <PieChart className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{t('التقارير', 'Reports')}</h2>
            <p className="text-xs text-slate-400">{t('نظرة عامة على أداء المجمع', 'Overview of complex performance')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchReports} disabled={loading} className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors text-sm disabled:opacity-50">
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <div className="relative">
            <button onClick={(e) => { e.stopPropagation(); setShowFormatMenu(!showFormatMenu) }} className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all text-sm shadow-sm shadow-primary-200">
              <Download className="w-4 h-4" />
              {t('تحميل', 'Download')}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFormatMenu ? 'rotate-180' : ''}`} />
            </button>
            {showFormatMenu && (
              <div className="absolute right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 min-w-[180px] py-1.5" onClick={e => e.stopPropagation()}>
                {[
                  { fmt: 'pdf' as const, label: 'PDF', color: 'text-red-500', desc: t('جاهز للطباعة', 'Print-ready') },
                  { fmt: 'word' as const, label: 'Word (.doc)', color: 'text-blue-500', desc: t('قابل للتعديل', 'Editable') },
                  { fmt: 'excel' as const, label: 'Excel (.xlsx)', color: 'text-green-500', desc: t('جدول بيانات', 'Spreadsheet') },
                ].map(item => (
                  <button key={item.fmt} onClick={() => handleDownload(item.fmt)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors">
                    <span className={`font-bold ${item.color}`}>{item.label}</span>
                    <span className="text-xs text-slate-400 mr-auto">{item.desc}</span>
                  </button>
                ))}
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
          <button key={type.id} onClick={() => setSelectedReport(type.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${selectedReport === type.id ? 'bg-primary-600 text-white shadow-sm shadow-primary-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
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
