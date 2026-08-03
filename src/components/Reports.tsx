import { useState, useEffect, type ReactNode } from 'react'
import { Download, Users, Home, Wrench, CreditCard, TrendingUp, Loader2, AlertCircle, RefreshCcw, ChevronDown, BarChart3, PieChart, CheckCircle2, Clock, AlertTriangle, User } from 'lucide-react'
import * as XLSX from 'xlsx'
import { api, type TenantModel, type HouseModel, type PaymentModel, type MaintenanceModel } from '../services/api'
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

type PayStatus = 'paid' | 'late' | 'deferred' | 'pending' | 'none'

const STATUS_STYLES: Record<PayStatus, { ar: string; en: string; badge: string; fill: string; text: string }> = {
  paid: { ar: 'مدفوع', en: 'Paid', badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200', fill: '#22c55e', text: '#16a34a' },
  late: { ar: 'متأخر', en: 'Late', badge: 'bg-red-50 text-red-700 border border-red-200', fill: '#ef4444', text: '#dc2626' },
  deferred: { ar: 'مؤجل', en: 'Deferred', badge: 'bg-amber-50 text-amber-700 border border-amber-200', fill: '#f59e0b', text: '#d97706' },
  pending: { ar: 'معلق', en: 'Pending', badge: 'bg-blue-50 text-blue-700 border border-blue-200', fill: '#3b82f6', text: '#2563eb' },
  none: { ar: 'لم يدفع', en: 'Not Paid', badge: 'bg-slate-100 text-slate-600 border border-slate-200', fill: '#94a3b8', text: '#64748b' },
}

const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

interface PayRow {
  tenant: TenantModel
  status: PayStatus
  paid: number
  owed: number
  paymentDate?: string
  method?: string
}

function Reports({ language }: ReportsProps) {
  const [selectedReport, setSelectedReport] = useState<string>('tenants')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState(DEFAULT_STATS)
  const [showFormatMenu, setShowFormatMenu] = useState(false)

  const [tenants, setTenants] = useState<TenantModel[]>([])
  const [houses, setHouses] = useState<HouseModel[]>([])
  const [payments, setPayments] = useState<PaymentModel[]>([])
  const [maintenanceReqs, setMaintenanceReqs] = useState<MaintenanceModel[]>([])

  const now = new Date()
  const [selMonth, setSelMonth] = useState(now.getMonth() + 1)
  const [selYear, setSelYear] = useState(now.getFullYear())

  const ar = language === 'AR'
  const t = (a: string, e: string) => ar ? a : e
  const currency = CURRENCY_HTML
  const monthName = (m: number) => (ar ? MONTHS_AR : MONTHS_EN)[Math.min(Math.max(m, 1), 12) - 1]

  const reportTitles: Record<string, { ar: string; en: string }> = {
    tenants: { ar: 'تقرير المستأجرين التفصيلي', en: 'Detailed Tenants Report' },
    villas: { ar: 'تقرير الفلل والوحدات التفصيلي', en: 'Detailed Villas & Units Report' },
    maintenance: { ar: 'تقرير الصيانة والتكاليف', en: 'Maintenance & Costs Report' },
    payments: { ar: 'تقرير تحصيل المدفوعات الشهري', en: 'Monthly Collections Report' },
  }

  const dateStr = now.toLocaleDateString(ar ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const timeStr = now.toLocaleTimeString(ar ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })
  const fileName = `azhar-${selectedReport}-${now.toISOString().split('T')[0]}`

  const fetchReports = async () => {
    setLoading(true)
    setError(null)
    try {
      const [financial, maintenance, dashboard, tenR, houseR, payR, maintR] = await Promise.allSettled([
        api.getFinancialReport(),
        api.getMaintenanceReport(),
        api.getDashboardStats(),
        api.getTenants(),
        api.getVillas(),
        api.getPayments(),
        api.getMaintenance(),
      ])
      const fin = financial.status === 'fulfilled' ? financial.value : null
      const maint = maintenance.status === 'fulfilled' ? maintenance.value : null
      const dash = dashboard.status === 'fulfilled' ? dashboard.value : null
      const ten = tenR.status === 'fulfilled' ? tenR.value : null
      const hse = houseR.status === 'fulfilled' ? houseR.value : null
      const pay = payR.status === 'fulfilled' ? payR.value : null
      const mnt = maintR.status === 'fulfilled' ? maintR.value : null

      if (ten) setTenants(Array.isArray(ten) ? ten : (ten as any)?.tenants ?? [])
      if (hse && Array.isArray(hse)) setHouses(hse)
      if (pay) setPayments(Array.isArray(pay) ? pay : (pay as any)?.payments ?? [])
      if (mnt) setMaintenanceReqs(Array.isArray(mnt) ? mnt : (mnt as any)?.maintenances ?? [])

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

  // ---------- derived helpers ----------

  const num = (v: any): number => {
    const n = Number(v)
    return Number.isFinite(n) ? n : 0
  }
  const money = (n: number, withCur = true) => n ? (
    <span className="inline-flex items-center gap-0.5 whitespace-nowrap">{n.toLocaleString()}{withCur ? <CurrencySymbol className="h-[1em] w-[0.9em] inline-block" /> : null}</span>
  ) : '—'
  const dateFmt = (d?: string) => d ? new Date(d).toLocaleDateString(ar ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'
  const statusOf = (p: PaymentModel) => String(p.status || '').toLowerCase()

  const enrichPayment = (p: PaymentModel): PaymentModel => {
    let tenant = p.tenantId ? tenants.find(t => t.id === p.tenantId) : undefined
    if (!tenant && p.tenantName) tenant = tenants.find(t => t.fullName === p.tenantName)
    if (!tenant && (p.houseNumber || p.villaNumber)) tenant = tenants.find(t => t.houseNumber === (p.houseNumber || p.villaNumber))
    if (!tenant) return p
    return {
      ...p,
      tenantId: tenant.id || p.tenantId,
      tenantName: tenant.fullName,
      houseNumber: tenant.houseNumber || p.houseNumber,
      villaNumber: tenant.houseNumber || p.villaNumber,
    }
  }
  const enrichedPayments = payments.map(enrichPayment)

  const endOfMonth = new Date(selYear, selMonth, 0)
  const monthPayments = enrichedPayments.filter(p => num(p.month) === selMonth && num(p.year) === selYear)

  const monthTenants = tenants.filter(t => {
    const expired = t.isActive === false || String((t as any).status || '').toLowerCase() === 'expired'
    return !expired || num(t.monthlyRent) > 0
  })

  const classify = (tenant: TenantModel): PayRow => {
    const id = tenant.id
    const name = tenant.fullName
    const recs = monthPayments.filter(p =>
      (id && p.tenantId === id) || (name && p.tenantName && p.tenantName === name)
    )
    const paidRecs = recs.filter(p => statusOf(p) === 'paid')
    if (paidRecs.length) {
      return { tenant, status: 'paid', paid: paidRecs.reduce((s, p) => s + num(p.amount), 0), owed: 0, paymentDate: paidRecs[0].paymentDate, method: paidRecs[0].paymentMethod }
    }
    const lateRecs = recs.filter(p => statusOf(p) === 'late')
    if (lateRecs.length) {
      return { tenant, status: 'late', paid: 0, owed: lateRecs.reduce((s, p) => s + num(p.amount), 0), paymentDate: lateRecs[0].paymentDate, method: lateRecs[0].paymentMethod }
    }
    const pendRecs = recs.filter(p => statusOf(p) === 'pending')
    if (pendRecs.length) {
      const deferred = pendRecs.some(p => p.paymentDate && new Date(p.paymentDate).getTime() > endOfMonth.getTime())
      return { tenant, status: deferred ? 'deferred' : 'pending', paid: 0, owed: pendRecs.reduce((s, p) => s + num(p.amount), 0), paymentDate: pendRecs[0].paymentDate, method: pendRecs[0].paymentMethod }
    }
    const arrears = enrichedPayments.filter(p =>
      ((id && p.tenantId === id) || (name && p.tenantName === name)) &&
      statusOf(p) !== 'paid' &&
      (num(p.year) < selYear || (num(p.year) === selYear && num(p.month) < selMonth))
    )
    if (arrears.length) {
      return { tenant, status: 'late', paid: 0, owed: arrears.reduce((s, p) => s + num(p.amount), 0) }
    }
    return { tenant, status: 'none', paid: 0, owed: num(tenant.monthlyRent) }
  }

  const paymentRows: PayRow[] = monthTenants.map(classify)
  monthPayments.forEach(p => {
    const exists = paymentRows.some(r =>
      (r.tenant.id && p.tenantId && r.tenant.id === p.tenantId) ||
      (r.tenant.fullName && p.tenantName && r.tenant.fullName === p.tenantName)
    )
    if (!exists) {
      const known = p.tenantName ? tenants.find(t => t.fullName === p.tenantName) : undefined
      paymentRows.push(classify(known || {
        id: p.tenantId,
        fullName: p.tenantName || p.fullName || '—',
        phoneNumber: '',
        houseNumber: p.houseNumber || p.villaNumber || '',
        email: '',
        contractNumber: '',
        contractEndDate: '',
        monthlyRent: 0,
      }))
    }
  })

  const groups = {
    paid: paymentRows.filter(r => r.status === 'paid'),
    late: paymentRows.filter(r => r.status === 'late'),
    deferred: paymentRows.filter(r => r.status === 'deferred'),
    pending: paymentRows.filter(r => r.status === 'pending'),
    none: paymentRows.filter(r => r.status === 'none'),
  }
  const collected = groups.paid.reduce((s, r) => s + r.paid, 0)
  const outstanding = [...groups.late, ...groups.deferred, ...groups.pending, ...groups.none].reduce((s, r) => s + r.owed, 0)
  const expected = collected + outstanding
  const collectionRate = expected > 0 ? Math.round((collected / expected) * 100) : 0

  const tenantRows = tenants.map(t => ({ t, pr: classify(t) }))
  const activeCount = tenants.filter(t => t.isActive !== false && String((t as any).status || '').toLowerCase() !== 'expired').length
  const expiredCount = tenants.length - activeCount
  const expiringSoon = tenants.filter(t => {
    const end = t.contractEndDate ? new Date(t.contractEndDate).getTime() : NaN
    return Number.isFinite(end) && end > now.getTime() && end <= now.getTime() + 60 * 86400000
  }).length

  const villaRows = houses.map(h => {
    const tenant = tenants.find(t => t.houseId === h.id || (t.houseNumber && t.houseNumber === h.houseNumber))
    const occupied = !!(tenant || h.userId)
    return { h, tenant, occupied, pr: tenant ? classify(tenant) : null }
  })
  const occCount = villaRows.filter(v => v.occupied).length
  const villaTotal = houses.length || stats.villas.total
  const mntCount = stats.villas.maintenance

  const maintRows = maintenanceReqs.map(m => m)

  // ---------- export helpers ----------

  const getDetail = (): { columns: string[]; rows: (string | number)[][] } => {
    switch (selectedReport) {
      case 'tenants': {
        const columns = [t('المستأجر', 'Tenant'), t('الهاتف', 'Phone'), t('الوحدة', 'Unit'), t('رقم العقد', 'Contract #'), t('البداية', 'Start'), t('النهاية', 'End'), t('الإيجار الشهري', 'Monthly Rent'), t('حالة الدفع', 'Payment'), t('المتبقي', 'Outstanding')]
        const rows = tenantRows.map(({ t: tn, pr }) => [
          tn.fullName, tn.phoneNumber || '—', tn.houseNumber || '—', tn.contractNumber || '—',
          dateFmt(tn.contractStartDate), dateFmt(tn.contractEndDate),
          num(tn.monthlyRent) ? num(tn.monthlyRent) : '—',
          t(STATUS_STYLES[pr.status].ar, STATUS_STYLES[pr.status].en),
          pr.status === 'paid' ? '—' : (pr.owed || '—'),
        ])
        return { columns, rows }
      }
      case 'villas': {
        const columns = [t('الوحدة', 'Unit'), t('المبنى', 'Building'), t('الدور', 'Floor'), t('الغرف', 'Rooms'), t('المساحة', 'Area'), t('مرآب', 'Garage'), t('حديقة', 'Garden'), t('المستأجر', 'Tenant'), t('الهاتف', 'Phone'), t('الإيجار', 'Rent'), t('الحالة', 'Status')]
        const rows = villaRows.map(({ h, tenant, occupied }) => [
          h.houseNumber, h.buildingNumber || '—', h.floorNumber ?? '—', h.roomsCount ?? '—',
          h.area ? `${h.area} m²` : '—', h.hasGarage ? (ar ? 'نعم' : 'Yes') : (ar ? 'لا' : 'No'),
          h.hasGarden ? (ar ? 'نعم' : 'Yes') : (ar ? 'لا' : 'No'),
          tenant?.fullName || (h.userDisplayName || '—'), tenant?.phoneNumber || '—',
          tenant ? (num(tenant.monthlyRent) || '—') : '—',
          occupied ? t('مشغولة', 'Occupied') : t('متاحة', 'Available'),
        ])
        return { columns, rows }
      }
      case 'maintenance': {
        const columns = [t('الرقم', 'Request #'), t('الفئة', 'Category'), t('الوصف', 'Description'), t('الوحدة', 'Unit'), t('المستأجر', 'Tenant'), t('الحالة', 'Status'), t('التكلفة', 'Cost'), t('التاريخ', 'Date')]
        const rows = maintRows.map(m => [
          m.requestNumber || '—', m.category || '—', m.description || '—',
          m.houseNumber || m.villaNumber || '—', m.tenantName || '—',
          m.status || '—', num(m.cost) ? num(m.cost) : '—', dateFmt(m.createdAt),
        ])
        return { columns, rows }
      }
      case 'payments': {
        const columns = [t('المستأجر', 'Tenant'), t('الوحدة', 'Unit'), t('الهاتف', 'Phone'), t('الإيجار', 'Rent'), t('الحالة', 'Status'), t('المدفوع', 'Paid'), t('المتبقي', 'Outstanding'), t('التاريخ', 'Date')]
        const rows = paymentRows.map(r => [
          r.tenant.fullName || '—', r.tenant.houseNumber || '—', r.tenant.phoneNumber || '—',
          num(r.tenant.monthlyRent) || '—',
          t(STATUS_STYLES[r.status].ar, STATUS_STYLES[r.status].en),
          r.paid || '—', r.owed || '—', r.paymentDate ? dateFmt(r.paymentDate) : '—',
        ])
        return { columns, rows }
      }
      default:
        return { columns: [], rows: [] }
    }
  }

  const buildTableHTML = (columns: string[], rows: (string | number)[][]) => `
    <div style="margin-top:28px;">
      <div style="font-size:15px;font-weight:700;color:#1e293b;margin-bottom:12px;">${t('التفاصيل', 'Details')}</div>
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr>${columns.map(c => `<th style="background:#0f172a;color:#fff;padding:10px 12px;font-size:11px;text-align:${ar ? 'right' : 'left'};font-weight:600;">${c}</th>`).join('')}</tr></thead>
        <tbody>${rows.slice(0, 60).map((r, i) => `<tr>${columns.map((_, ci) => `<td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#334155;background:${i % 2 ? '#f8fafc' : '#fff'};">${r[ci] ?? '—'}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>
    </div>`

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

  const downloadExcel = () => {
    const { columns, rows } = getDetail()
    const data = rows.map(r => {
      const o: Record<string, string | number> = {}
      columns.forEach((c, i) => { o[c] = r[i] ?? '—' })
      return o
    })
    const ws = XLSX.utils.json_to_sheet(data)
    ws['!cols'] = columns.map(() => ({ wch: 20 }))
    const wb = XLSX.utils.book_new()
    const sheetName = (t(reportTitles[selectedReport]?.ar, reportTitles[selectedReport]?.en) || 'Report').slice(0, 31)
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
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
    const { columns, rows } = getDetail()
    const head = columns.map(c => `<th style="background:#0f172a;color:#fff;padding:10px 12px;font-size:12px;font-weight:600;">${c}</th>`).join('')
    const body = rows.map((r, i) => `<tr>${columns.map((_, ci) => `<td style="padding:8px 12px;border:1px solid #e2e8f0;font-size:12px;color:#475569;background:${i % 2 ? '#f8fafc' : '#fff'};">${r[ci] ?? '—'}</td>`).join('')}</tr>`).join('')

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
    <thead><tr>${head}</tr></thead>
    <tbody>${body}</tbody>
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
    const detail = getDetail()

    switch (selectedReport) {
      case 'tenants': {
        const total = tenants.length || stats.tenants.total
        const active = activeCount || stats.tenants.active
        const pct = Math.round((active / (total || 1)) * 100)
        bodyContent = `
          <div style="display:flex;gap:20px;flex-wrap:wrap;margin-bottom:32px;">
            ${[
              { l: t('إجمالي المستأجرين','Total'), v: String(total), c: COLORS.blue },
              { l: t('نشط','Active'), v: String(active), c: COLORS.green },
              { l: t('ينتهي خلال 60 يوم','Expiring in 60d'), v: String(expiringSoon), c: COLORS.amber },
              { l: t('غير نشط / منتهي','Inactive'), v: String(expiredCount || stats.tenants.inactive), c: COLORS.slate },
            ].map(i => `<div style="flex:1;min-width:150px;background:${i.c.bg};border:1px solid ${i.c.border};border-radius:14px;padding:20px;text-align:center;">
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
          </div>
          ${buildTableHTML(detail.columns, detail.rows)}`
        insightText = pct > 80
          ? t(`نسبة ممتازة! ${pct}% من المستأجرين نشطين.`, `Excellent! ${pct}% of tenants are active.`)
          : t(`يحتاج تحسين — ${pct}% فقط نشطين.`, `Needs improvement — only ${pct}% active.`)
        break
      }
      case 'villas': {
        const tot = villaTotal
        const occ = occCount || stats.villas.occupied
        const pct = Math.round((occ / (tot || 1)) * 100)
        const avl = Math.max(tot - occ, 0)
        bodyContent = `
          <div style="display:flex;gap:20px;flex-wrap:wrap;margin-bottom:32px;">
            ${[
              { l: t('إجمالي الفلل','Total'), v: String(tot), c: COLORS.blue },
              { l: t('مؤجرة','Occupied'), v: String(occ), c: COLORS.purple },
              { l: t('متاحة','Available'), v: String(avl || stats.villas.available), c: COLORS.green },
              { l: t('صيانة','Maintenance'), v: String(mntCount), c: COLORS.amber },
            ].map(i => `<div style="flex:1;min-width:140px;background:${i.c.bg};border:1px solid ${i.c.border};border-radius:14px;padding:20px;text-align:center;">
              <div style="font-size:12px;color:${i.c.text};font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">${i.l}</div>
              <div style="font-size:32px;font-weight:800;color:${i.c.text};">${i.v}</div>
            </div>`).join('')}
          </div>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:24px;">
            <div style="display:flex;align-items:center;gap:24px;">
              ${donutSVG(pct, COLORS.purple.fill)}
              <div style="flex:1;">
                <div style="font-size:16px;font-weight:700;color:#1e293b;margin-bottom:4px;">${t('نسبة الإشغال','Occupancy Rate')}</div>
                <div style="font-size:14px;color:#64748b;">${pct}% ${t('من الفلل مشغولة','of villas are occupied')}</div>
                ${horizontalBar(t('مؤجرة','Occupied'), pct, COLORS.purple.fill)}
                ${horizontalBar(t('متاحة','Available'), 100 - pct, COLORS.green.fill)}
              </div>
            </div>
          </div>
          ${buildTableHTML(detail.columns, detail.rows)}`
        insightText = pct > 70
          ? t(`إشغال جيد بنسبة ${pct}%.`, `Good occupancy at ${pct}%.`)
          : t(`الإشغال منخفض (${pct}%) — يُنصح بالترويج.`, `Low occupancy (${pct}%) — consider promotion.`)
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
          </div>
          ${buildTableHTML(detail.columns, detail.rows)}`
        insightText = stats.maintenance.pending > stats.maintenance.completed
          ? t('⚠️ الطلبات المعلقة أكثر من المكتملة — يُنصح بمراجعة.', '⚠️ Pending requests exceed completed — review recommended.')
          : t('✅ الأداء جيد — majority of requests are completed.', '✅ Performance is good — majority of requests completed.')
        break
      }
      case 'payments': {
        bodyContent = `
          <div style="display:flex;gap:20px;flex-wrap:wrap;margin-bottom:32px;">
            ${[
              { l: `${t('المتوقع تحصيله','Expected')} — ${monthName(selMonth)} ${selYear}`, v: `${expected.toLocaleString()} ${currency}`, c: COLORS.blue },
              { l: t('محصل','Collected'), v: `${collected.toLocaleString()} ${currency}`, c: COLORS.green },
              { l: t('متبقٍ','Outstanding'), v: `${outstanding.toLocaleString()} ${currency}`, c: COLORS.red },
              { l: t('نسبة التحصيل','Collection Rate'), v: `${collectionRate}%`, c: COLORS.amber },
            ].map(i => `<div style="flex:1;min-width:150px;background:${i.c.bg};border:1px solid ${i.c.border};border-radius:14px;padding:20px;text-align:center;">
              <div style="font-size:11px;color:${i.c.text};font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">${i.l}</div>
              <div style="font-size:24px;font-weight:800;color:${i.c.text};">${i.v}</div>
            </div>`).join('')}
          </div>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:24px;">
            <div style="display:flex;align-items:center;gap:24px;">
              ${donutSVG(collectionRate, COLORS.green.fill)}
              <div style="flex:1;">
                <div style="font-size:16px;font-weight:700;color:#1e293b;margin-bottom:4px;">${t('نسبة التحصيل','Collection Rate')}</div>
                <div style="font-size:14px;color:#64748b;">${collectionRate}% ${t('من المستحقات محصلة','of dues collected')}</div>
                ${horizontalBar(t('محصلة','Collected'), collectionRate, COLORS.green.fill)}
              </div>
            </div>
          </div>
          ${buildTableHTML(detail.columns, detail.rows)}`
        insightText = collectionRate >= 90
          ? t(`نسبة تحصيل ممتازة ${collectionRate}%`, `Excellent collection rate of ${collectionRate}%`)
          : t(`التحصيل ${collectionRate}% — يُنصح بمتابعة المتأخرات.`, `Collection at ${collectionRate}% — follow up on delays.`)
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

    const Card = ({ label, value, color, icon }: { label: string; value: string | ReactNode; color: string; icon?: ReactNode }) => (
      <div className="rounded-xl p-5 border transition-all hover:shadow-md min-w-0" style={{ background: `${color}08`, borderColor: `${color}25` }}>
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <span className="text-xs font-semibold uppercase tracking-wide truncate" style={{ color }}>{label}</span>
        </div>
        <p className="text-xl sm:text-2xl lg:text-3xl font-extrabold break-words leading-tight" style={{ color }}>{value}</p>
      </div>
    )

    const StatusBadge = ({ status }: { status: PayStatus }) => {
      const s = STATUS_STYLES[status]
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${s.badge}`}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.fill }} />
          {t(s.ar, s.en)}
        </span>
      )
    }

    const MaintBadge = ({ status }: { status?: string }) => {
      const l = String(status || '').toLowerCase()
      const cls = l === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        : l === 'cancelled' ? 'bg-rose-50 text-rose-700 border border-rose-200'
        : (l === 'inprogress' || l === 'assigned') ? 'bg-blue-50 text-blue-700 border border-blue-200'
        : 'bg-amber-50 text-amber-700 border border-amber-200'
      return <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${cls}`}>{status || '—'}</span>
    }

    const Table = ({ columns, rows, empty }: { columns: string[]; rows: ReactNode[][]; empty?: string }) => (
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="bg-slate-800">
              {columns.map((c, i) => (
                <th key={i} className="py-3 px-4 text-xs font-semibold text-white uppercase tracking-wide text-right whitespace-nowrap">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr><td colSpan={columns.length} className="py-10 text-center text-slate-400 text-sm">{empty || '—'}</td></tr>
            ) : rows.map((row, ri) => (
              <tr key={ri} className={`hover:bg-slate-50 ${ri % 2 ? 'bg-slate-50/50' : 'bg-white'}`}>
                {row.map((cell, ci) => <td key={ci} className="py-3 px-4 text-slate-600 whitespace-nowrap">{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )

    const PayCard = ({ row, accent }: { row: PayRow; accent: string }) => (
      <div className="flex items-center justify-between p-3 rounded-xl border bg-white">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${accent}18`, color: accent }}>
            <User className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate">{row.tenant.fullName || '—'}</p>
            <p className="text-xs text-slate-400 truncate">{row.tenant.houseNumber ? row.tenant.houseNumber : ''}{row.tenant.houseNumber && row.tenant.phoneNumber ? ' • ' : ''}<span dir="ltr">{row.tenant.phoneNumber || ''}</span>{!row.tenant.houseNumber && !row.tenant.phoneNumber ? '—' : ''}</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold" style={{ color: accent }}>{money(row.status === 'paid' ? row.paid : row.owed)}</p>
          {row.paymentDate ? <p className="text-[10px] text-slate-400">{dateFmt(row.paymentDate)}</p> : null}
        </div>
      </div>
    )

    const GroupSection = ({ title, count, color, children }: { title: string; count: number; color: string; children: ReactNode }) => (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
          <h4 className="text-sm font-bold text-slate-800">{title}</h4>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold">{count}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>
      </div>
    )

    const EmptyNote = ({ text }: { text: string }) => (
      <div className="col-span-2 py-6 text-center text-slate-400 text-sm bg-slate-50 border border-dashed border-slate-200 rounded-xl">{text}</div>
    )

    if (selectedReport === 'villas') {
      const occPct = villaTotal ? Math.round((occCount / villaTotal) * 100) : 0
      const avlPct = Math.max(100 - occPct, 0)
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <Card label={t('إجمالي الفلل', 'Total')} value={String(villaTotal)} color="#3b82f6" icon={<Home className="w-4 h-4" />} />
            <Card label={t('مؤجرة', 'Occupied')} value={String(occCount || stats.villas.occupied)} color="#a855f7" />
            <Card label={t('متاحة', 'Available')} value={String(Math.max(villaTotal - occCount, 0) || stats.villas.available)} color="#22c55e" />
            <Card label={t('صيانة', 'Maintenance')} value={String(mntCount)} color="#f59e0b" />
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <Donut pct={occPct} color="#a855f7" label={t('نسبة الإشغال', 'Occupancy')} sub={`${occPct}% ${t('مشغولة', 'occupied')}`} />
              <div className="flex-1">
                <Bar label={t('مؤجرة', 'Occupied')} pct={occPct} color="#a855f7" />
                <Bar label={t('متاحة', 'Available')} pct={avlPct} color="#22c55e" />
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-3">{t('تفاصيل الوحدات والإشغال', 'Unit details & occupancy')}</h3>
            <Table
              columns={[t('الوحدة', 'Unit'), t('المبنى', 'Building'), t('الدور', 'Floor'), t('الغرف', 'Rooms'), t('المساحة', 'Area'), t('مرآب', 'Garage'), t('حديقة', 'Garden'), t('المستأجر', 'Tenant'), t('الهاتف', 'Phone'), t('الإيجار', 'Rent'), t('الحالة', 'Status')]}
              rows={villaRows.map(({ h, tenant, occupied }) => [
                <span key="u" className="font-bold text-slate-800">{h.houseNumber}</span>,
                h.buildingNumber || '—',
                h.floorNumber ?? '—',
                h.roomsCount ?? '—',
                h.area ? <span key="a">{h.area} m²</span> : '—',
                h.hasGarage ? (ar ? 'نعم' : 'Yes') : (ar ? 'لا' : 'No'),
                h.hasGarden ? (ar ? 'نعم' : 'Yes') : (ar ? 'لا' : 'No'),
                <span key="n" className="font-semibold">{tenant?.fullName || h.userDisplayName || '—'}</span>,
                <span key="p" dir="ltr" className="text-xs">{tenant?.phoneNumber || '—'}</span>,
                <span key="r" className="font-bold">{tenant ? money(num(tenant.monthlyRent)) : '—'}</span>,
                <span key="s" className={`px-2.5 py-1 rounded-full text-xs font-bold ${occupied ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                  {occupied ? t('مشغولة', 'Occupied') : t('متاحة', 'Available')}
                </span>,
              ])}
              empty={t('لا توجد وحدات بعد', 'No villas yet')}
            />
          </div>
        </div>
      )
    }

    if (selectedReport === 'maintenance') {
      const donePct = stats.maintenance.total ? Math.round((stats.maintenance.completed / stats.maintenance.total) * 100) : 0
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <Card label={t('الإجمالي', 'Total')} value={String(stats.maintenance.total)} color="#475569" icon={<Wrench className="w-4 h-4" />} />
            <Card label={t('قيد الانتظار', 'Pending')} value={String(stats.maintenance.pending)} color="#f59e0b" />
            <Card label={t('قيد العمل', 'In Progress')} value={String(stats.maintenance.inProgress)} color="#3b82f6" />
            <Card label={t('مكتمل', 'Completed')} value={String(stats.maintenance.completed)} color="#22c55e" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-3">{t('طلبات الصيانة', 'Maintenance requests')}</h3>
            <Table
              columns={[t('الرقم', 'Request #'), t('الفئة', 'Category'), t('الوصف', 'Description'), t('الوحدة', 'Unit'), t('المستأجر', 'Tenant'), t('الحالة', 'Status'), t('التكلفة', 'Cost'), t('التاريخ', 'Date')]}
              rows={maintRows.map(m => [
                m.requestNumber || '—',
                m.category || '—',
                <span key="d" className="inline-block align-middle text-xs max-w-[240px] truncate">{m.description || '—'}</span>,
                m.houseNumber || m.villaNumber || '—',
                m.tenantName || '—',
                <MaintBadge key="sb" status={m.status} />,
                num(m.cost) ? <span key="c" className="font-bold">{num(m.cost).toLocaleString()} <CurrencySymbol /></span> : '—',
                <span key="dt" className="text-xs">{dateFmt(m.createdAt)}</span>,
              ])}
              empty={t('لا توجد طلبات صيانة', 'No maintenance requests')}
            />
          </div>
        </div>
      )
    }

    if (selectedReport === 'payments') {
      const years = Array.from(new Set([...payments.map(p => num(p.year)), selYear, now.getFullYear()])).filter(y => y >= 2000).sort((a, b) => b - a)
      return (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">{t('تقرير تحصيل الشهر', 'Monthly collection report')}</h3>
              <p className="text-xs text-slate-400">{t('من دفع، ومن تأخر، ومن أجل دفعه', 'Who paid, who is late, and who deferred')}</p>
            </div>
            <div className="flex items-center gap-2">
              <select value={selMonth} onChange={e => setSelMonth(Number(e.target.value))} className="h-10 px-3 border border-slate-200 rounded-xl text-sm bg-white">
                {(ar ? MONTHS_AR : MONTHS_EN).map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
              <select value={selYear} onChange={e => setSelYear(Number(e.target.value))} className="h-10 px-3 border border-slate-200 rounded-xl text-sm bg-white">
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <Card label={t('المتوقع تحصيله', 'Expected')} value={<>{expected.toLocaleString()} <CurrencySymbol /></>} color="#3b82f6" icon={<CreditCard className="w-4 h-4" />} />
            <Card label={t('محصل', 'Collected')} value={<>{collected.toLocaleString()} <CurrencySymbol /></>} color="#22c55e" icon={<CheckCircle2 className="w-4 h-4" />} />
            <Card label={t('متبقٍ', 'Outstanding')} value={<>{outstanding.toLocaleString()} <CurrencySymbol /></>} color="#ef4444" icon={<AlertTriangle className="w-4 h-4" />} />
            <Card label={t('نسبة التحصيل', 'Collection Rate')} value={`${collectionRate}%`} color="#f59e0b" icon={<TrendingUp className="w-4 h-4" />} />
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6 flex-wrap">
              <Donut pct={collectionRate} color="#22c55e" label={t('نسبة التحصيل', 'Collection Rate')} sub={`${collectionRate}% ${t('محصلة', 'collected')}`} />
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Bar label={t('محصل', 'Collected')} pct={collectionRate} color="#22c55e" />
                <Bar label={t('متبقٍ', 'Outstanding')} pct={100 - collectionRate} color="#ef4444" />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <GroupSection title={t('دفعوا في هذا الشهر', 'Paid this month')} count={groups.paid.length} color={STATUS_STYLES.paid.fill}>
              {groups.paid.length ? groups.paid.map((r, i) => <PayCard key={i} row={r} accent={STATUS_STYLES.paid.text} />) : <EmptyNote text={t('لا أحد دفع بعد', 'No one has paid yet')} />}
            </GroupSection>
            <GroupSection title={t('متأخرون', 'Late')} count={groups.late.length} color={STATUS_STYLES.late.fill}>
              {groups.late.length ? groups.late.map((r, i) => <PayCard key={i} row={r} accent={STATUS_STYLES.late.text} />) : <EmptyNote text={t('لا يوجد متأخرون', 'No late payments')} />}
            </GroupSection>
            <GroupSection title={t('أجّلوا الدفع', 'Deferred')} count={groups.deferred.length} color={STATUS_STYLES.deferred.fill}>
              {groups.deferred.length ? groups.deferred.map((r, i) => <PayCard key={i} row={r} accent={STATUS_STYLES.deferred.text} />) : <EmptyNote text={t('لا يوجد مؤجلون', 'No deferred payments')} />}
            </GroupSection>
            <GroupSection title={t('لم يدفعوا بعد', 'Not paid yet')} count={groups.pending.length + groups.none.length} color={STATUS_STYLES.none.fill}>
              {[...groups.pending, ...groups.none].length ? [...groups.pending, ...groups.none].map((r, i) => <PayCard key={i} row={r} accent={STATUS_STYLES.none.text} />) : <EmptyNote text={t('لا يوجد', 'None')} />}
            </GroupSection>
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h3 className="text-sm font-bold text-slate-800">{t('دفتر التحصيل الكامل', 'Full collection ledger')} — {monthName(selMonth)} {selYear}</h3>
            </div>
            <Table
              columns={[t('المستأجر', 'Tenant'), t('الوحدة', 'Unit'), t('الهاتف', 'Phone'), t('الإيجار', 'Rent'), t('الحالة', 'Status'), t('المدفوع', 'Paid'), t('المتبقي', 'Outstanding'), t('التاريخ', 'Date')]}
              rows={paymentRows.map(r => [
                <span key="n" className="font-semibold text-slate-800">{r.tenant.fullName || '—'}</span>,
                r.tenant.houseNumber || '—',
                <span key="p" dir="ltr" className="text-xs">{r.tenant.phoneNumber || '—'}</span>,
                <span key="r" className="font-bold">{num(r.tenant.monthlyRent) ? money(num(r.tenant.monthlyRent)) : '—'}</span>,
                <StatusBadge key="sb" status={r.status} />,
                r.paid ? <span key="pd" className="text-emerald-600 font-bold">{money(r.paid)}</span> : <span key="pd0" className="text-slate-300">—</span>,
                r.owed ? <span key="od" className="text-red-500 font-bold">{money(r.owed)}</span> : <span key="od0" className="text-slate-300">—</span>,
                <span key="d" className="text-xs">{r.paymentDate ? dateFmt(r.paymentDate) : '—'}</span>,
              ])}
              empty={t('لا توجد مدفوعات لهذا الشهر', 'No payments for this month')}
            />
          </div>
        </div>
      )
    }

    // tenants (default)
    const pct = tenants.length ? Math.round((activeCount / tenants.length) * 100) : (stats.tenants.total ? Math.round((stats.tenants.active / stats.tenants.total) * 100) : 0)
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <Card label={t('إجمالي المستأجرين', 'Total Tenants')} value={String(tenants.length || stats.tenants.total)} color="#3b82f6" icon={<Users className="w-4 h-4" />} />
          <Card label={t('نشط', 'Active')} value={String(activeCount || stats.tenants.active)} color="#22c55e" />
          <Card label={t('ينتهي خلال 60 يوم', 'Expiring in 60d')} value={String(expiringSoon)} color="#f59e0b" icon={<Clock className="w-4 h-4" />} />
          <Card label={t('غير نشط / منتهي', 'Inactive / Expired')} value={String(expiredCount || stats.tenants.inactive)} color="#94a3b8" />
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <Donut pct={pct} color="#22c55e" label={t('نسبة النشاط', 'Activity Rate')} sub={`${pct}% ${t('نشط', 'active')}`} />
            <div className="flex-1">
              <Bar label={t('نشط', 'Active')} pct={pct} color="#22c55e" />
              <Bar label={t('غير نشط', 'Inactive')} pct={100 - pct} color="#94a3b8" />
            </div>
          </div>
        </div>
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h3 className="text-sm font-bold text-slate-800">{t('تفاصيل المستأجرين وحالة الدفع', 'Tenant details & payment status')}</h3>
            <span className="text-xs text-slate-400">{monthName(selMonth)} {selYear}</span>
          </div>
          <Table
            columns={[t('المستأجر', 'Tenant'), t('الهاتف', 'Phone'), t('الوحدة', 'Unit'), t('رقم العقد', 'Contract #'), t('البداية', 'Start'), t('النهاية', 'End'), t('الإيجار', 'Rent'), t('حالة الدفع', 'Payment'), t('المتبقي', 'Outstanding')]}
            rows={tenantRows.map(({ t: tn, pr }) => [
              <div key="n" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0"><User className="w-4 h-4" /></div>
                <div>
                  <p className="text-slate-800 font-semibold text-xs">{tn.fullName}</p>
                  <p className="text-[10px] text-slate-400" dir="ltr">{tn.email}</p>
                </div>
              </div>,
              <span key="p" dir="ltr" className="text-xs">{tn.phoneNumber || '—'}</span>,
              tn.houseNumber || '—',
              tn.contractNumber || '—',
              <span key="s" className="text-xs">{dateFmt(tn.contractStartDate)}</span>,
              <span key="e" className="text-xs">{dateFmt(tn.contractEndDate)}</span>,
              <span key="r" className="font-bold">{num(tn.monthlyRent) ? money(num(tn.monthlyRent)) : '—'}</span>,
              <StatusBadge key="sb" status={pr.status} />,
              pr.status === 'paid'
                ? <span key="o" className="text-emerald-600 font-bold">—</span>
                : <span key="o2" className="text-red-500 font-bold">{pr.owed ? money(pr.owed) : '—'}</span>,
            ])}
            empty={t('لا يوجد مستأجرون بعد', 'No tenants yet')}
          />
        </div>
      </div>
    )
  }

  const reportTypes = [
    { id: 'tenants', label: t('المستأجرين', 'Tenants'), icon: Users },
    { id: 'villas', label: t('الفلل', 'Villas'), icon: Home },
    { id: 'maintenance', label: t('الصيانة', 'Maintenance'), icon: Wrench },
    { id: 'payments', label: t('المدفوعات', 'Payments'), icon: CreditCard },
  ]

  return (
    <div className="bg-white rounded-2xl p-6" onClick={() => showFormatMenu && setShowFormatMenu(false)}>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
            <PieChart className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{t('التقارير', 'Reports')}</h2>
            <p className="text-xs text-slate-400">{t('تقارير تفصيلية للفلل والمستأجرين والمدفوعات', 'Detailed villa, tenant & payment reports')}</p>
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
