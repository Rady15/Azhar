import { api, type RentReportItem, type TenantModel, type PaymentModel } from './api'

export interface AdminAlert {
  id: string
  kind: 'paid' | 'unpaid' | 'expiring'
  title: string
  message: string
  time: string
  severity: 'success' | 'warning' | 'danger'
}

const num = (v: any): number => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

const now = () => new Date()

function buildFromReport(lang: 'AR' | 'EN', rep: RentReportItem, tenant?: TenantModel): AdminAlert[] {
  const name = rep.tenantName || tenant?.fullName || '—'
  const unit = rep.unitNumber || tenant?.houseNumber || ''
  const rent = num(rep.rentAmount)
  const paid = num(rep.paidAmount)
  const remaining = num(rep.remainingAmount)
  const remainingDays = num(rep.remainingDays)
  const endDate = rep.contractEndDate || tenant?.contractEndDate
  const dayFmt = (d?: string) => d ? new Date(d).toLocaleDateString(lang === 'AR' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : ''

  const alerts: AdminAlert[] = []
  const unitTxt = unit ? `${unit}` : ''

  if (paid > 0) {
    alerts.push({
      id: `paid-${rep.tenantId || name}-${paid}`,
      kind: 'paid',
      title: lang === 'AR' ? 'تم السداد' : 'Payment received',
      message: lang === 'AR'
        ? `${name} دفع ${paid.toLocaleString()} من أصل ${rent.toLocaleString()}${unitTxt ? ` لوحدة ${unitTxt}` : ''}`
        : `${name} paid ${paid.toLocaleString()} of ${rent.toLocaleString()}${unitTxt ? ` for unit ${unitTxt}` : ''}`,
      time: lang === 'AR' ? 'الآن' : 'Just now',
      severity: 'success',
    })
  }

  if (remaining > 0) {
    alerts.push({
      id: `unpaid-${rep.tenantId || name}-${remaining}`,
      kind: 'unpaid',
      title: lang === 'AR' ? 'إيجار غير مسدد' : 'Unpaid rent',
      message: lang === 'AR'
        ? `${name} لم يسدد كامل الإيجار — المتبقي ${remaining.toLocaleString()}${unitTxt ? ` (وحدة ${unitTxt})` : ''}`
        : `${name} has not fully paid the rent — ${remaining.toLocaleString()} remaining${unitTxt ? ` (unit ${unitTxt})` : ''}`,
      time: lang === 'AR' ? 'الآن' : 'Just now',
      severity: 'danger',
    })
  } else if (paid > 0) {
    alerts.push({
      id: `settled-${rep.tenantId || name}-${paid}`,
      kind: 'paid',
      title: lang === 'AR' ? 'سداد كامل' : 'Fully paid',
      message: lang === 'AR'
        ? `${name} سدد إيجار ${unitTxt ? `الوحدة ${unitTxt} ` : ''}بالكامل (${paid.toLocaleString()})`
        : `${name} fully settled the rent${unitTxt ? ` for unit ${unitTxt} ` : ' '}(${paid.toLocaleString()})`,
      time: lang === 'AR' ? 'الآن' : 'Just now',
      severity: 'success',
    })
  }

  if (remainingDays >= 0 && remainingDays <= 60) {
    alerts.push({
      id: `expiring-${rep.tenantId || name}-${remainingDays}`,
      kind: 'expiring',
      title: lang === 'AR' ? 'عقد قرب ينتهي' : 'Contract expiring soon',
      message: lang === 'AR'
        ? `عقد ${name}${unitTxt ? ` (وحدة ${unitTxt})` : ''} ينتهي خلال ${remainingDays} يوم${endDate ? ` — ${dayFmt(endDate)}` : ''}`
        : `${name}'s contract${unitTxt ? ` (unit ${unitTxt})` : ''} expires in ${remainingDays} day${remainingDays === 1 ? '' : 's'}${endDate ? ` — ${dayFmt(endDate)}` : ''}`,
      time: lang === 'AR' ? 'الآن' : 'Just now',
      severity: 'warning',
    })
  }

  return alerts
}

function buildFromTenants(lang: 'AR' | 'EN', tenants: TenantModel[]): AdminAlert[] {
  const alerts: AdminAlert[] = []
  const t = now()
  tenants.forEach(tn => {
    const end = tn.contractEndDate ? new Date(tn.contractEndDate).getTime() : NaN
    if (!Number.isFinite(end)) return
    const days = Math.ceil((end - t.getTime()) / 86400000)
    if (days >= 0 && days <= 60) {
      const unit = tn.houseNumber || ''
      alerts.push({
        id: `expiring-${tn.id || tn.fullName}-${days}`,
        kind: 'expiring',
        title: lang === 'AR' ? 'عقد قرب ينتهي' : 'Contract expiring soon',
        message: lang === 'AR'
          ? `عقد ${tn.fullName}${unit ? ` (وحدة ${unit})` : ''} ينتهي خلال ${days} يوم — ${new Date(end).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}`
          : `${tn.fullName}'s contract${unit ? ` (unit ${unit})` : ''} expires in ${days} day${days === 1 ? '' : 's'} — ${new Date(end).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`,
        time: lang === 'AR' ? 'الآن' : 'Just now',
        severity: 'warning',
      })
    }
  })
  return alerts
}

function buildFromPayments(lang: 'AR' | 'EN', payments: PaymentModel[]): AdminAlert[] {
  const alerts: AdminAlert[] = []
  const t = now()
  const curMonth = t.getMonth() + 1
  const curYear = t.getFullYear()
  payments
    .filter(p => String(p.status || '').toLowerCase() === 'paid')
    .slice(0, 5)
    .forEach(p => {
      const name = p.tenantName || p.fullName || '—'
      const unit = p.houseNumber || p.villaNumber || ''
      alerts.push({
        id: `paid-${p.id || name}-${num(p.amount)}`,
        kind: 'paid',
        title: lang === 'AR' ? 'تم السداد' : 'Payment received',
        message: lang === 'AR'
          ? `${name} دفع ${num(p.amount).toLocaleString()}${unit ? ` عن وحدة ${unit}` : ''}${curMonth === num(p.month) && curYear === num(p.year) ? ' (هذا الشهر)' : ''}`
          : `${name} paid ${num(p.amount).toLocaleString()}${unit ? ` for unit ${unit}` : ''}${curMonth === num(p.month) && curYear === num(p.year) ? ' (this month)' : ''}`,
        time: p.paymentDate ? new Date(p.paymentDate).toLocaleDateString(lang === 'AR' ? 'ar-EG' : 'en-US') : '',
        severity: 'success',
      })
    })
  return alerts
}

export async function buildAdminAlerts(lang: 'AR' | 'EN'): Promise<AdminAlert[]> {
  const [repRes, tenRes, payRes] = await Promise.allSettled([
    api.getRentReport(),
    api.getTenants(),
    api.getPayments(),
  ])

  const report: RentReportItem[] = repRes.status === 'fulfilled'
    ? (Array.isArray(repRes.value) ? repRes.value : [])
    : []
  const tenants: TenantModel[] = tenRes.status === 'fulfilled'
    ? (Array.isArray(tenRes.value) ? tenRes.value : (tenRes.value as any)?.tenants ?? [])
    : []
  const payments: PaymentModel[] = payRes.status === 'fulfilled'
    ? (Array.isArray(payRes.value) ? payRes.value : (payRes.value as any)?.payments ?? [])
    : []

  const alerts: AdminAlert[] = []
  const seen = new Set<string>()

  const push = (a: AdminAlert) => {
    if (seen.has(a.id)) return
    seen.add(a.id)
    alerts.push(a)
  }

  report.forEach(rep => {
    const tenant = tenants.find(t =>
      (rep.tenantName && t.fullName === rep.tenantName) ||
      (rep.tenantId && t.id === rep.tenantId) ||
      (rep.unitNumber && t.houseNumber === rep.unitNumber)
    )
    buildFromReport(lang, rep, tenant).forEach(push)
  })

  buildFromTenants(lang, tenants).forEach(push)
  buildFromPayments(lang, payments).forEach(push)

  const order = { danger: 0, warning: 1, success: 2 } as const
  return alerts.sort((a, b) => order[a.severity] - order[b.severity]).slice(0, 12)
}
