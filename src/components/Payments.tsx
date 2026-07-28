import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, X, User, Home, Send, LayoutList, Grid3X3, DollarSign, Tag, FileText, Calendar, Building2, Phone, Mail, CheckCircle, XCircle } from 'lucide-react'
import { api } from '../services/api'

interface Payment {
  id: string | number
  tenantName: string
  villaNumber: string
  amount: number
  month: string
  year: number
  status: 'paid' | 'pending' | 'late' | 'cancelled'
  paymentDate?: string
  paymentMethod: 'cash' | 'bank_transfer' | 'card'
}

interface Expense {
  id: string
  description: string
  amount: number
  category: string
  date: string
  paymentMethod: 'cash' | 'bank_transfer' | 'card'
  notes: string
}

interface Company {
  id: string
  name: string
  specialization: string
  contactPerson: string
  phone: string
  email: string
  notes: string
  createdAt: string
}

interface ContractInstallment {
  id: string
  amount: number
  dueDate: string
  paidDate?: string
  status: 'paid' | 'pending' | 'late'
}

interface CompanyContract {
  id: string
  companyId: string
  description: string
  totalAmount: number
  paymentType: 'full' | 'installment'
  installmentCount: number
  startDate: string
  endDate: string
  status: 'active' | 'completed' | 'cancelled'
  installments: ContractInstallment[]
}

interface PaymentsProps {
  language: 'AR' | 'EN'
}

const EXPENSE_CATEGORIES: { ar: string; en: string }[] = [
  { ar: 'كهرباء', en: 'Electricity' },
  { ar: 'مياه', en: 'Water' },
  { ar: 'صيانة', en: 'Maintenance' },
  { ar: 'رواتب', en: 'Salaries' },
  { ar: 'نظافة', en: 'Cleaning' },
  { ar: 'أمن', en: 'Security' },
  { ar: 'أخرى', en: 'Other' },
]

const COMPANY_SPECIALIZATIONS: { ar: string; en: string }[] = [
  { ar: 'نظافة', en: 'Cleaning' },
  { ar: 'أمن', en: 'Security' },
  { ar: 'صيانة', en: 'Maintenance' },
  { ar: 'كهرباء', en: 'Electrical' },
  { ar: 'سباكة', en: 'Plumbing' },
  { ar: 'حدائق', en: 'Gardening' },
  { ar: 'مكافحة حشرات', en: 'Pest Control' },
  { ar: 'مصاعد', en: 'Elevators' },
  { ar: 'تكييف', en: 'AC' },
  { ar: 'مقاولات عامة', en: 'General Contracting' },
  { ar: 'أخرى', en: 'Other' },
]

function Payments({ language }: PaymentsProps) {
  const t = (ar: string, en: string) => language === 'AR' ? ar : en
  const [payments, setPayments] = useState<Payment[]>([])
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const stored = localStorage.getItem('azhar_expenses')
    return stored ? JSON.parse(stored) : []
  })
  const [companies, setCompanies] = useState<Company[]>(() => {
    const stored = localStorage.getItem('azhar_companies')
    return stored ? JSON.parse(stored) : []
  })
  const [companyContracts, setCompanyContracts] = useState<CompanyContract[]>(() => {
    const stored = localStorage.getItem('azhar_company_contracts')
    return stored ? JSON.parse(stored) : []
  })
  const [, setLoading] = useState(false)
  const [, setError] = useState('')
  const [activeSection, setActiveSection] = useState<'payments' | 'expenses' | 'companies'>('payments')

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showPaymentView, setShowPaymentView] = useState(false)
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null)
  const [viewingPayment, setViewingPayment] = useState<Payment | null>(null)
  const [paymentFormData, setPaymentFormData] = useState<Partial<Payment>>({})
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  // Expense modal state
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [showExpenseView, setShowExpenseView] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null)
  const [expenseFormData, setExpenseFormData] = useState<Partial<Expense>>({})

  // Company modal state
  const [showCompanyModal, setShowCompanyModal] = useState(false)
  const [showCompanyView, setShowCompanyView] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [viewingCompany, setViewingCompany] = useState<Company | null>(null)
  const [companyFormData, setCompanyFormData] = useState<Partial<Company>>({})

  // Contract modal state
  const [showContractModal, setShowContractModal] = useState(false)
  const [editingContract, setEditingContract] = useState<CompanyContract | null>(null)
  const [contractFormData, setContractFormData] = useState<Partial<CompanyContract>>({})

  // localStorage sync
  useEffect(() => {
    localStorage.setItem('azhar_expenses', JSON.stringify(expenses))
  }, [expenses])

  useEffect(() => {
    localStorage.setItem('azhar_companies', JSON.stringify(companies))
  }, [companies])

  useEffect(() => {
    localStorage.setItem('azhar_company_contracts', JSON.stringify(companyContracts))
  }, [companyContracts])

  const mapToFrontend = (item: any): Payment => ({
    id: item.id || String(Date.now()),
    tenantName: item.tenantName || item.fullName || '',
    villaNumber: item.villaNumber || item.houseNumber || '',
    amount: Number(item.amount) || 0,
    month: item.month || t('يناير', 'Jan'),
    year: Number(item.year) || 2026,
    status: item.status?.toLowerCase() === 'paid' ? 'paid' : item.status?.toLowerCase() === 'late' ? 'late' : item.status?.toLowerCase() === 'cancelled' ? 'cancelled' : 'pending',
    paymentDate: item.paymentDate ? item.paymentDate.split('T')[0] : undefined,
    paymentMethod: item.paymentMethod || 'cash'
  })

  const mapToBackend = (payment: Partial<Payment>): any => ({
    tenantName: payment.tenantName || '',
    villaNumber: payment.villaNumber || '',
    amount: Number(payment.amount) || 0,
    month: payment.month || '',
    year: Number(payment.year) || 2026,
    status: payment.status || 'pending',
    paymentDate: payment.paymentDate ? new Date(payment.paymentDate).toISOString() : new Date().toISOString(),
    paymentMethod: payment.paymentMethod || 'cash'
  })

  const fetchPayments = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.getPayments()
      if (Array.isArray(data)) {
        setPayments(data.map(mapToFrontend))
      } else if (data && Array.isArray((data as any).payments)) {
        setPayments((data as any).payments.map(mapToFrontend))
      }
    } catch (err: any) {
      console.error('Fetch payments error:', err)
      setError(t('فشل تحميل بيانات المدفوعات', 'Failed to fetch payments'))
      setPayments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [])

  // Payment CRUD
  const handleAddPayment = () => {
    setEditingPayment(null)
    setPaymentFormData({ tenantName: '', villaNumber: '', amount: 0, month: '', year: 2026, status: 'pending', paymentMethod: 'cash' })
    setShowPaymentModal(true)
  }

  const handleEditPayment = (payment: Payment) => {
    setEditingPayment(payment)
    setPaymentFormData({ ...payment })
    setShowPaymentModal(true)
  }

  const handleViewPayment = (payment: Payment) => {
    setViewingPayment(payment)
    setShowPaymentView(true)
  }

  const handleDeletePayment = (id: string | number) => {
    if (window.confirm(t('هل أنت متأكد من الحذف؟', 'Are you sure you want to delete?'))) {
      setPayments(payments.filter(p => p.id !== id))
    }
  }

  const handleSavePayment = async () => {
    try {
      if (editingPayment) {
        const status = paymentFormData.status === 'paid' ? 'Paid' : paymentFormData.status === 'late' ? 'Late' : paymentFormData.status === 'cancelled' ? 'Cancelled' : 'Pending';
        await api.updatePaymentStatus(String(editingPayment.id), { status })
        setPayments(payments.map(p => p.id === editingPayment.id ? { ...p, ...paymentFormData } as Payment : p))
      } else {
        const payload = mapToBackend(paymentFormData)
        const newPaymentBackend = await api.createPayment(payload)
        const newPayment = mapToFrontend(newPaymentBackend)
        setPayments([...payments, newPayment])
      }
      setShowPaymentModal(false)
    } catch (err: any) {
      console.error('Save payment error:', err)
      alert(t('خطأ: ', 'Error: ') + err.message)
    }
  }

  const handleSendReminder = (payment: Payment) => {
    alert(t(`تم إرسال تذكير للدفع إلى ${payment.tenantName}`, `Payment reminder sent to ${payment.tenantName}`))
  }

  // Expense CRUD
  const getNextExpenseId = () => `EXP-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

  const handleAddExpense = () => {
    setEditingExpense(null)
    setExpenseFormData({
      description: '', amount: 0, category: EXPENSE_CATEGORIES[0].en,
      date: new Date().toISOString().split('T')[0], paymentMethod: 'cash', notes: ''
    })
    setShowExpenseModal(true)
  }

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense)
    setExpenseFormData({ ...expense })
    setShowExpenseModal(true)
  }

  const handleViewExpense = (expense: Expense) => {
    setViewingExpense(expense)
    setShowExpenseView(true)
  }

  const handleDeleteExpense = (id: string) => {
    if (window.confirm(t('هل أنت متأكد من حذف هذا المصروف؟', 'Are you sure you want to delete this expense?'))) {
      setExpenses(expenses.filter(e => e.id !== id))
    }
  }

  const handleSaveExpense = () => {
    if (!expenseFormData.description || !expenseFormData.amount) {
      alert(t('يرجى إدخال الوصف والمبلغ', 'Please enter description and amount'))
      return
    }
    if (editingExpense) {
      setExpenses(expenses.map(e => e.id === editingExpense.id ? { ...e, ...expenseFormData } as Expense : e))
    } else {
      setExpenses([{ ...expenseFormData as Expense, id: getNextExpenseId() } as Expense, ...expenses])
    }
    setShowExpenseModal(false)
  }

  // Company CRUD
  const getNextCompanyId = () => `CMP-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

  const handleAddCompany = () => {
    setEditingCompany(null)
    setCompanyFormData({ name: '', specialization: COMPANY_SPECIALIZATIONS[0].en, contactPerson: '', phone: '', email: '', notes: '', createdAt: new Date().toISOString().split('T')[0] })
    setShowCompanyModal(true)
  }

  const handleEditCompany = (company: Company) => {
    setEditingCompany(company)
    setCompanyFormData({ ...company })
    setShowCompanyModal(true)
  }

  const handleViewCompany = (company: Company) => {
    setViewingCompany(company)
    setShowCompanyView(true)
  }

  const handleDeleteCompany = (id: string) => {
    if (window.confirm(t('هل أنت متأكد من حذف هذه الشركة؟', 'Are you sure you want to delete this company?'))) {
      setCompanies(companies.filter(c => c.id !== id))
      setCompanyContracts(companyContracts.filter(c => c.companyId !== id))
    }
  }

  const handleSaveCompany = () => {
    if (!companyFormData.name) {
      alert(t('يرجى إدخال اسم الشركة', 'Please enter company name'))
      return
    }
    if (editingCompany) {
      setCompanies(companies.map(c => c.id === editingCompany.id ? { ...c, ...companyFormData } as Company : c))
    } else {
      setCompanies([{ ...companyFormData as Company, id: getNextCompanyId() } as Company, ...companies])
    }
    setShowCompanyModal(false)
  }

  const getCompanyName = (id: string) => companies.find(c => c.id === id)?.name || id

  // Contract CRUD
  const getNextContractId = () => `CTR-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  const getNextInstallmentId = () => `INST-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

  const generateInstallments = (totalAmount: number, count: number, startDate: string): ContractInstallment[] => {
    const amount = Math.round(totalAmount / count)
    const remainder = totalAmount - amount * count
    const installments: ContractInstallment[] = []
    const start = new Date(startDate)
    for (let i = 0; i < count; i++) {
      const due = new Date(start)
      due.setMonth(due.getMonth() + i)
      installments.push({
        id: getNextInstallmentId(),
        amount: i === count - 1 ? amount + remainder : amount,
        dueDate: due.toISOString().split('T')[0],
        status: 'pending',
      })
    }
    return installments
  }

  const handleAddContract = (companyId: string) => {
    setEditingContract(null)
    const startDate = new Date().toISOString().split('T')[0]
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + 12)
    setContractFormData({
      companyId,
      description: '', totalAmount: 0, paymentType: 'full',
      installmentCount: 6, startDate, endDate: endDate.toISOString().split('T')[0],
      status: 'active', installments: [],
    })
    setShowContractModal(true)
  }

  const handleDeleteContract = (id: string) => {
    if (window.confirm(t('هل أنت متأكد من حذف هذا العقد؟', 'Are you sure you want to delete this contract?'))) {
      setCompanyContracts(companyContracts.filter(c => c.id !== id))
    }
  }

  const handleSaveContract = () => {
    if (!contractFormData.description || !contractFormData.totalAmount) {
      alert(t('يرجى إدخال الوصف والمبلغ الإجمالي', 'Please enter description and total amount'))
      return
    }
    if (editingContract) {
      setCompanyContracts(companyContracts.map(c => c.id === editingContract.id ? { ...c, ...contractFormData } as CompanyContract : c))
    } else {
      const installments = contractFormData.paymentType === 'installment'
        ? generateInstallments(contractFormData.totalAmount || 0, contractFormData.installmentCount || 1, contractFormData.startDate || new Date().toISOString().split('T')[0])
        : [{ id: getNextInstallmentId(), amount: contractFormData.totalAmount || 0, dueDate: contractFormData.startDate || new Date().toISOString().split('T')[0], status: 'pending' as const }]
      setCompanyContracts([{
        ...contractFormData as CompanyContract,
        id: getNextContractId(),
        installments,
      } as CompanyContract, ...companyContracts])
    }
    setShowContractModal(false)
  }

  const handlePayInstallment = (contractId: string, installmentId: string) => {
    setCompanyContracts(companyContracts.map(c => {
      if (c.id !== contractId) return c
      return {
        ...c,
        installments: c.installments.map(inst => {
          if (inst.id !== installmentId) return inst
          return { ...inst, status: 'paid' as const, paidDate: new Date().toISOString().split('T')[0] }
        }),
        status: c.installments.every(i => i.id === installmentId ? true : i.status === 'paid') && c.installments.filter(i => i.id !== installmentId).every(i => i.status === 'paid')
          ? 'completed' as const
          : c.status,
      }
    }))
  }

  const handleToggleContractStatus = (contractId: string) => {
    setCompanyContracts(companyContracts.map(c => {
      if (c.id !== contractId) return c
      const newStatus = c.status === 'active' ? 'cancelled' : 'active'
      return { ...c, status: newStatus }
    }))
  }

  // Helpers
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = { paid: 'bg-green-100 text-green-700', pending: 'bg-amber-100 text-amber-700', late: 'bg-red-100 text-red-700', cancelled: 'bg-slate-100 text-slate-700', active: 'bg-blue-100 text-blue-700', completed: 'bg-green-100 text-green-700' }
    const labels: Record<string, string> = { paid: t('مدفوع', 'Paid'), pending: t('معلق', 'Pending'), late: t('متأخر', 'Late'), cancelled: t('ملغى', 'Cancelled'), active: t('نشط', 'Active'), completed: t('مكتمل', 'Completed') }
    return <span className={`px-2 py-1 rounded-full text-xs ${styles[status]}`}>{labels[status]}</span>
  }

  const getMethodLabel = (method: string) => {
    const labels: Record<string, string> = { cash: t('نقدي', 'Cash'), bank_transfer: t('تحويل بنكي', 'Bank Transfer'), card: t('بطاقة', 'Card') }
    return labels[method]
  }

  const getCategoryLabel = (cat: string) => {
    const found = EXPENSE_CATEGORIES.find(c => c.en === cat || c.ar === cat)
    return found ? (language === 'AR' ? found.ar : found.en) : cat
  }

  const getSpecializationLabel = (spec: string) => {
    const found = COMPANY_SPECIALIZATIONS.find(c => c.en === spec || c.ar === spec)
    return found ? (language === 'AR' ? found.ar : found.en) : spec
  }

  const getPaymentTypeLabel = (type: string) => {
    return type === 'full' ? t('دفعة كاملة', 'Full Payment') : t('أقساط', 'Installments')
  }

  const getContractPaidAmount = (contract: CompanyContract) =>
    contract.installments.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0)

  const getContractRemainingAmount = (contract: CompanyContract) =>
    contract.installments.filter(i => i.status !== 'paid').reduce((sum, i) => sum + i.amount, 0)

  const totalPaid = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0)
  const totalPending = payments.filter(p => p.status === 'pending' || p.status === 'late').reduce((sum, p) => sum + p.amount, 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

  const companyTotalPaid = companyContracts.reduce((sum, c) => sum + getContractPaidAmount(c), 0)
  const companyTotalRemaining = companyContracts.reduce((sum, c) => sum + getContractRemainingAmount(c), 0)
  const companyTotalContracts = companyContracts.reduce((sum, c) => sum + c.totalAmount, 0)

  // -------- RENDER --------
  return (
    <div className="bg-white rounded-2xl p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">
          {activeSection === 'payments' ? t('المدفوعات', 'Payments') : activeSection === 'expenses' ? t('المصروفات', 'Expenses') : t('الشركات', 'Companies')}
        </h2>
        <button
          onClick={activeSection === 'payments' ? handleAddPayment : activeSection === 'expenses' ? handleAddExpense : handleAddCompany}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {activeSection === 'payments' ? t('إضافة دفعة', 'Add Payment') : activeSection === 'expenses' ? t('إضافة مصروف', 'Add Expense') : t('إضافة شركة', 'Add Company')}
        </button>
      </div>

      {/* Section Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveSection('payments')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeSection === 'payments' ? 'bg-primary-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          <DollarSign className="w-4 h-4 inline mr-1" />
          {t('المدفوعات', 'Payments')}
        </button>
        <button
          onClick={() => setActiveSection('expenses')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeSection === 'expenses' ? 'bg-primary-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          <Tag className="w-4 h-4 inline mr-1" />
          {t('المصروفات', 'Expenses')}
        </button>
        <button
          onClick={() => setActiveSection('companies')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeSection === 'companies' ? 'bg-primary-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          <Building2 className="w-4 h-4 inline mr-1" />
          {t('الشركات', 'Companies')}
        </button>
      </div>

      {/* Summary Cards */}
      {activeSection === 'payments' ? (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-green-50 rounded-xl"><p className="text-sm text-green-600">{t('المدفوع', 'Paid')}</p><p className="text-xl font-bold text-green-700">{totalPaid.toLocaleString()} {t('ج.م', 'EGP')}</p></div>
          <div className="p-4 bg-amber-50 rounded-xl"><p className="text-sm text-amber-600">{t('المعلق', 'Pending')}</p><p className="text-xl font-bold text-amber-700">{totalPending.toLocaleString()} {t('ج.م', 'EGP')}</p></div>
          <div className="p-4 bg-blue-50 rounded-xl"><p className="text-sm text-blue-600">{t('الإجمالي', 'Total')}</p><p className="text-xl font-bold text-blue-700">{(totalPaid + totalPending).toLocaleString()} {t('ج.م', 'EGP')}</p></div>
        </div>
      ) : activeSection === 'expenses' ? (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-red-50 rounded-xl"><p className="text-sm text-red-600">{t('إجمالي المصروفات', 'Total Expenses')}</p><p className="text-xl font-bold text-red-700">{totalExpenses.toLocaleString()} {t('ج.م', 'EGP')}</p></div>
          <div className="p-4 bg-blue-50 rounded-xl"><p className="text-sm text-blue-600">{t('عدد المصروفات', 'Expense Count')}</p><p className="text-xl font-bold text-blue-700">{expenses.length}</p></div>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-xl"><p className="text-sm text-blue-600">{t('عدد الشركات', 'Companies')}</p><p className="text-xl font-bold text-blue-700">{companies.length}</p></div>
          <div className="p-4 bg-indigo-50 rounded-xl"><p className="text-sm text-indigo-600">{t('إجمالي العقود', 'Total Contracts')}</p><p className="text-xl font-bold text-indigo-700">{companyTotalContracts.toLocaleString()} {t('ج.م', 'EGP')}</p></div>
          <div className="p-4 bg-green-50 rounded-xl"><p className="text-sm text-green-600">{t('المدفوع للشركات', 'Paid')}</p><p className="text-xl font-bold text-green-700">{companyTotalPaid.toLocaleString()} {t('ج.م', 'EGP')}</p></div>
          <div className="p-4 bg-amber-50 rounded-xl"><p className="text-sm text-amber-600">{t('المتبقي', 'Remaining')}</p><p className="text-xl font-bold text-amber-700">{companyTotalRemaining.toLocaleString()} {t('ج.م', 'EGP')}</p></div>
        </div>
      )}

      {/* View Toggle */}
      {activeSection !== 'expenses' && (
        <div className="flex items-center gap-1 mb-4">
          <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`} title={t('عرض كقائمة', 'List view')}><LayoutList className="w-4 h-4" /></button>
          <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`} title={t('عرض كبطاقات', 'Grid view')}><Grid3X3 className="w-4 h-4" /></button>
        </div>
      )}

      {/* -------- PAYMENTS LIST -------- */}
      {activeSection === 'payments' && viewMode === 'list' && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('المستأجر', 'Tenant')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('الوحدة', 'Unit')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('المبلغ', 'Amount')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('الشهر', 'Month')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('الحالة', 'Status')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('الإجراءات', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(payment => (
                <tr key={payment.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 text-slate-700">{payment.tenantName}</td>
                  <td className="py-3 px-4 text-slate-700">{payment.villaNumber}</td>
                  <td className="py-3 px-4 text-slate-700 font-medium">{payment.amount.toLocaleString()} {t('ج.م', 'EGP')}</td>
                  <td className="py-3 px-4 text-slate-700">{payment.month} {payment.year}</td>
                  <td className="py-3 px-4">{getStatusBadge(payment.status)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleViewPayment(payment)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => handleEditPayment(payment)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleSendReminder(payment)} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg"><Send className="w-4 h-4" /></button>
                      <button onClick={() => handleDeletePayment(payment.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {payments.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-slate-400">{t('لا توجد مدفوعات', 'No payments yet')}</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {activeSection === 'payments' && viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {payments.map(payment => (
            <div key={payment.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-slate-800">{payment.tenantName}</p>
                  <p className="text-xs text-slate-400">{payment.villaNumber}</p>
                </div>
                {getStatusBadge(payment.status)}
              </div>
              <p className="text-2xl font-bold text-primary-700 mb-3">{payment.amount.toLocaleString()} {t('ج.م', 'EGP')}</p>
              <div className="space-y-2 text-sm text-slate-600 mb-3">
                <div className="flex justify-between"><span className="text-slate-400">{t('الشهر', 'Month')}</span><span>{payment.month} {payment.year}</span></div>
              </div>
              <div className="flex items-center justify-end gap-1 pt-3 border-t border-slate-100">
                <button onClick={() => handleViewPayment(payment)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Eye className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleEditPayment(payment)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg"><Edit className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleSendReminder(payment)} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg"><Send className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleDeletePayment(payment.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
          {payments.length === 0 && <div className="col-span-full text-center py-16 text-slate-400">{t('لا توجد مدفوعات', 'No payments yet')}</div>}
        </div>
      )}

      {/* -------- EXPENSES LIST -------- */}
      {activeSection === 'expenses' && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('الوصف', 'Description')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('التصنيف', 'Category')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('المبلغ', 'Amount')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('التاريخ', 'Date')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('الطريقة', 'Method')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('الإجراءات', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(expense => (
                <tr key={expense.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 text-slate-700 font-medium">{expense.description}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-600">{getCategoryLabel(expense.category)}</span>
                  </td>
                  <td className="py-3 px-4 text-red-600 font-medium">{expense.amount.toLocaleString()} {t('ج.م', 'EGP')}</td>
                  <td className="py-3 px-4 text-slate-600 text-sm">{expense.date}</td>
                  <td className="py-3 px-4 text-slate-600 text-xs">{getMethodLabel(expense.paymentMethod)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleViewExpense(expense)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => handleEditExpense(expense)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteExpense(expense.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-slate-400">{t('لا توجد مصروفات', 'No expenses yet')}</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* -------- COMPANIES LIST -------- */}
      {activeSection === 'companies' && viewMode === 'list' && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('اسم الشركة', 'Company')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('التخصص', 'Specialization')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('جهة الاتصال', 'Contact')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('الهاتف', 'Phone')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('إجمالي العقود', 'Contracts')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('الإجراءات', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {companies.map(company => {
                const contracts = companyContracts.filter(c => c.companyId === company.id)
                const totalContractValue = contracts.reduce((s, c) => s + c.totalAmount, 0)
                return (
                  <tr key={company.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium text-slate-800">{company.name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-600">{getSpecializationLabel(company.specialization)}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{company.contactPerson || '—'}</td>
                    <td className="py-3 px-4 text-slate-700">{company.phone || '—'}</td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{totalContractValue.toLocaleString()} {t('ج.م', 'EGP')}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleViewCompany(company)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => handleEditCompany(company)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteCompany(company.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {companies.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-slate-400">{t('لا توجد شركات', 'No companies yet')}</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {activeSection === 'companies' && viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map(company => {
            const contracts = companyContracts.filter(c => c.companyId === company.id)
            const totalPaidAmt = contracts.reduce((s, c) => s + getContractPaidAmount(c), 0)
            return (
              <div key={company.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{company.name}</p>
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-600">{getSpecializationLabel(company.specialization)}</span>
                    </div>
                  </div>
                </div>
                {company.contactPerson && (
                  <p className="text-xs text-slate-500 mb-1">{company.contactPerson}{company.phone ? ` - ${company.phone}` : ''}</p>
                )}
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
                  <div>
                    <p className="text-xs text-slate-400">{t('العقود', 'Contracts')}</p>
                    <p className="font-bold text-primary-700">{contracts.length}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">{t('المدفوع', 'Paid')}</p>
                    <p className="font-bold text-green-600">{totalPaidAmt.toLocaleString()}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleViewCompany(company)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Eye className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleEditCompany(company)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg"><Edit className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDeleteCompany(company.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            )
          })}
          {companies.length === 0 && <div className="col-span-full text-center py-16 text-slate-400">{t('لا توجد شركات', 'No companies yet')}</div>}
        </div>
      )}

      {/* -------- PAYMENT MODAL -------- */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">{editingPayment ? t('تعديل دفعة', 'Edit Payment') : t('إضافة دفعة', 'Add Payment')}</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">{t('اسم المستأجر', 'Tenant Name')}</label><input type="text" value={paymentFormData.tenantName || ''} onChange={e => setPaymentFormData({ ...paymentFormData, tenantName: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">{t('رقم الوحدة', 'Unit Number')}</label><input type="text" value={paymentFormData.villaNumber || ''} onChange={e => setPaymentFormData({ ...paymentFormData, villaNumber: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">{t('المبلغ', 'Amount')}</label><input type="number" value={paymentFormData.amount || ''} onChange={e => setPaymentFormData({ ...paymentFormData, amount: Number(e.target.value) })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">{t('الشهر', 'Month')}</label><input type="text" value={paymentFormData.month || ''} onChange={e => setPaymentFormData({ ...paymentFormData, month: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">{t('السنة', 'Year')}</label><input type="number" value={paymentFormData.year || ''} onChange={e => setPaymentFormData({ ...paymentFormData, year: Number(e.target.value) })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">{t('الحالة', 'Status')}</label>
                  <select value={paymentFormData.status || 'pending'} onChange={e => setPaymentFormData({ ...paymentFormData, status: e.target.value as any })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm">
                    <option value="paid">{t('مدفوع', 'Paid')}</option>
                    <option value="pending">{t('معلق', 'Pending')}</option>
                    <option value="late">{t('متأخر', 'Late')}</option>
                    <option value="cancelled">{t('ملغى', 'Cancelled')}</option>
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">{t('طريقة الدفع', 'Payment Method')}</label>
                  <select value={paymentFormData.paymentMethod || 'cash'} onChange={e => setPaymentFormData({ ...paymentFormData, paymentMethod: e.target.value as any })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm">
                    <option value="cash">{t('نقدي', 'Cash')}</option>
                    <option value="bank_transfer">{t('تحويل بنكي', 'Bank Transfer')}</option>
                    <option value="card">{t('بطاقة', 'Card')}</option>
                  </select>
                </div>
              </div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">{t('تاريخ الدفع', 'Payment Date')}</label><input type="date" value={paymentFormData.paymentDate || ''} onChange={e => setPaymentFormData({ ...paymentFormData, paymentDate: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" /></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSavePayment} className="flex-1 h-10 bg-primary-600 text-white rounded-xl hover:bg-primary-700">{t('حفظ', 'Save')}</button>
              <button onClick={() => setShowPaymentModal(false)} className="flex-1 h-10 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200">{t('إلغاء', 'Cancel')}</button>
            </div>
          </div>
        </div>
      )}

      {/* -------- EXPENSE MODAL -------- */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">{editingExpense ? t('تعديل مصروف', 'Edit Expense') : t('إضافة مصروف', 'Add Expense')}</h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">{t('الوصف', 'Description')} *</label><input type="text" value={expenseFormData.description || ''} onChange={e => setExpenseFormData({ ...expenseFormData, description: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" placeholder={t('مثال: فاتورة كهرباء', 'e.g. Electricity bill')} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">{t('المبلغ', 'Amount')} *</label><input type="number" value={expenseFormData.amount || ''} onChange={e => setExpenseFormData({ ...expenseFormData, amount: Number(e.target.value) })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">{t('التصنيف', 'Category')}</label>
                  <select value={expenseFormData.category || ''} onChange={e => setExpenseFormData({ ...expenseFormData, category: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm">
                    {EXPENSE_CATEGORIES.map(c => (
                      <option key={c.en} value={c.en}>{language === 'AR' ? c.ar : c.en}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">{t('التاريخ', 'Date')}</label><input type="date" value={expenseFormData.date || ''} onChange={e => setExpenseFormData({ ...expenseFormData, date: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">{t('طريقة الدفع', 'Payment Method')}</label>
                  <select value={expenseFormData.paymentMethod || 'cash'} onChange={e => setExpenseFormData({ ...expenseFormData, paymentMethod: e.target.value as any })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm">
                    <option value="cash">{t('نقدي', 'Cash')}</option>
                    <option value="bank_transfer">{t('تحويل بنكي', 'Bank Transfer')}</option>
                    <option value="card">{t('بطاقة', 'Card')}</option>
                  </select>
                </div>
              </div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">{t('ملاحظات', 'Notes')}</label><textarea value={expenseFormData.notes || ''} onChange={e => setExpenseFormData({ ...expenseFormData, notes: e.target.value })} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" /></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSaveExpense} className="flex-1 h-10 bg-primary-600 text-white rounded-xl hover:bg-primary-700">{t('حفظ', 'Save')}</button>
              <button onClick={() => setShowExpenseModal(false)} className="flex-1 h-10 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200">{t('إلغاء', 'Cancel')}</button>
            </div>
          </div>
        </div>
      )}

      {/* -------- COMPANY FORM MODAL -------- */}
      {showCompanyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">{editingCompany ? t('تعديل شركة', 'Edit Company') : t('إضافة شركة', 'Add Company')}</h3>
              <button onClick={() => setShowCompanyModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">{t('اسم الشركة', 'Company Name')} *</label><input type="text" value={companyFormData.name || ''} onChange={e => setCompanyFormData({ ...companyFormData, name: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" placeholder={t('مثال: شركة النظافة المتكاملة', 'e.g. Integrated Cleaning Co.')} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">{t('التخصص', 'Specialization')}</label>
                  <select value={companyFormData.specialization || COMPANY_SPECIALIZATIONS[0].en} onChange={e => setCompanyFormData({ ...companyFormData, specialization: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm">
                    {COMPANY_SPECIALIZATIONS.map(s => (
                      <option key={s.en} value={s.en}>{language === 'AR' ? s.ar : s.en}</option>
                    ))}
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">{t('جهة الاتصال', 'Contact Person')}</label><input type="text" value={companyFormData.contactPerson || ''} onChange={e => setCompanyFormData({ ...companyFormData, contactPerson: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">{t('الهاتف', 'Phone')}</label><input type="text" value={companyFormData.phone || ''} onChange={e => setCompanyFormData({ ...companyFormData, phone: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" dir="ltr" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">{t('الإيميل', 'Email')}</label><input type="email" value={companyFormData.email || ''} onChange={e => setCompanyFormData({ ...companyFormData, email: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" dir="ltr" /></div>
              </div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">{t('ملاحظات', 'Notes')}</label><textarea value={companyFormData.notes || ''} onChange={e => setCompanyFormData({ ...companyFormData, notes: e.target.value })} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" /></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSaveCompany} className="flex-1 h-10 bg-primary-600 text-white rounded-xl hover:bg-primary-700">{t('حفظ', 'Save')}</button>
              <button onClick={() => setShowCompanyModal(false)} className="flex-1 h-10 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200">{t('إلغاء', 'Cancel')}</button>
            </div>
          </div>
        </div>
      )}

      {/* -------- COMPANY VIEW MODAL -------- */}
      {showCompanyView && viewingCompany && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">{t('تفاصيل الشركة', 'Company Details')}</h3>
              <button onClick={() => setShowCompanyView(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            {/* Company Info */}
            <div className="p-4 bg-slate-50 rounded-xl mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <p className="font-bold text-lg text-slate-800">{viewingCompany.name}</p>
                  <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-xs">{getSpecializationLabel(viewingCompany.specialization)}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm mt-3">
                {viewingCompany.contactPerson && (
                  <div className="flex items-center gap-2"><User className="w-4 h-4 text-slate-400" /><span>{viewingCompany.contactPerson}</span></div>
                )}
                {viewingCompany.phone && (
                  <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400" /><span dir="ltr">{viewingCompany.phone}</span></div>
                )}
                {viewingCompany.email && (
                  <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-slate-400" /><span className="text-blue-600" dir="ltr">{viewingCompany.email}</span></div>
                )}
                <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-400" /><span>{t('تاريخ التسجيل', 'Registered')}: {viewingCompany.createdAt}</span></div>
              </div>
              {viewingCompany.notes && (
                <div className="mt-3 p-3 bg-white rounded-lg text-sm text-slate-600">{viewingCompany.notes}</div>
              )}
            </div>

            {/* Contracts Section */}
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-bold text-slate-700">{t('العقود', 'Contracts')}</h4>
              <button
                onClick={() => handleAddContract(viewingCompany.id)}
                className="flex items-center gap-1 px-3 py-1.5 bg-primary-600 text-white rounded-xl text-sm hover:bg-primary-700"
              >
                <Plus className="w-3.5 h-3.5" />
                {t('إضافة عقد', 'Add Contract')}
              </button>
            </div>

            {companyContracts.filter(c => c.companyId === viewingCompany.id).length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">{t('لا توجد عقود لهذه الشركة', 'No contracts for this company')}</div>
            ) : (
              <div className="space-y-3">
                {companyContracts.filter(c => c.companyId === viewingCompany.id).map(contract => {
                  const paid = getContractPaidAmount(contract)
                  const remaining = getContractRemainingAmount(contract)
                  return (
                    <div key={contract.id} className="border border-slate-200 rounded-xl p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-slate-800">{contract.description}</p>
                          <p className="text-xs text-slate-400">
                            {getPaymentTypeLabel(contract.paymentType)}
                            {contract.paymentType === 'installment' && ` (${contract.installments.length} ${t('قسط', 'installments')})`}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {getStatusBadge(contract.status)}
                          <button onClick={() => handleToggleContractStatus(contract.id)} className="p-1 text-slate-400 hover:text-slate-600" title={contract.status === 'active' ? t('إلغاء', 'Cancel') : t('تفعيل', 'Activate')}>
                            {contract.status === 'active' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4 text-green-600" />}
                          </button>
                          <button onClick={() => handleDeleteContract(contract.id)} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
                        <div><span className="text-slate-400">{t('الإجمالي', 'Total')}</span><p className="font-semibold text-slate-700">{contract.totalAmount.toLocaleString()} {t('ج.م', 'EGP')}</p></div>
                        <div><span className="text-green-600">{t('المدفوع', 'Paid')}</span><p className="font-semibold text-green-700">{paid.toLocaleString()} {t('ج.م', 'EGP')}</p></div>
                        <div><span className="text-amber-600">{t('المتبقي', 'Remaining')}</span><p className="font-semibold text-amber-700">{remaining.toLocaleString()} {t('ج.م', 'EGP')}</p></div>
                      </div>
                      <div className="text-xs text-slate-400 mb-2">
                        {contract.startDate} → {contract.endDate}
                      </div>

                      {/* Installments */}
                      {contract.paymentType === 'installment' && (
                        <div className="border-t border-slate-100 pt-2 mt-2">
                          <p className="text-xs font-semibold text-slate-500 mb-2">{t('الأقساط', 'Installments')}</p>
                          <div className="space-y-1.5">
                            {contract.installments.map((inst, idx) => (
                              <div key={inst.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="w-6 h-6 rounded-full bg-slate-200 text-xs flex items-center justify-center text-slate-600">{idx + 1}</span>
                                  <span className="font-medium text-slate-700">{inst.amount.toLocaleString()} {t('ج.م', 'EGP')}</span>
                                  <span className="text-slate-400 text-xs">{inst.dueDate}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {getStatusBadge(inst.status)}
                                  {inst.status !== 'paid' && contract.status === 'active' && (
                                    <button
                                      onClick={() => handlePayInstallment(contract.id, inst.id)}
                                      className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs hover:bg-green-200"
                                    >
                                      {t('دفع', 'Pay')}
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Full payment action */}
                      {contract.paymentType === 'full' && contract.status === 'active' && (
                        <div className="border-t border-slate-100 pt-3 mt-2">
                          {contract.installments[0]?.status === 'paid' ? (
                            <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                              <CheckCircle className="w-4 h-4" />
                              {t('تم الدفع كاملاً', 'Fully Paid')}
                            </div>
                          ) : (
                            <button
                              onClick={() => handlePayInstallment(contract.id, contract.installments[0]?.id)}
                              className="px-4 py-2 bg-green-100 text-green-700 rounded-xl text-sm hover:bg-green-200 font-medium"
                            >
                              {t('تسديد الدفعة كاملة', 'Pay Full Amount')} ({contract.installments[0]?.amount.toLocaleString()} {t('ج.م', 'EGP')})
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            <button onClick={() => setShowCompanyView(false)} className="w-full h-10 mt-4 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200">{t('إغلاق', 'Close')}</button>
          </div>
        </div>
      )}

      {/* -------- CONTRACT FORM MODAL -------- */}
      {showContractModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">{editingContract ? t('تعديل عقد', 'Edit Contract') : t('إضافة عقد', 'Add Contract')}</h3>
              <button onClick={() => setShowContractModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">{t('الشركة', 'Company')}</label>
                <input type="text" value={getCompanyName(contractFormData.companyId || '')} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50" readOnly />
              </div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">{t('وصف العقد', 'Contract Description')} *</label>
                <input type="text" value={contractFormData.description || ''} onChange={e => setContractFormData({ ...contractFormData, description: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" placeholder={t('مثال: عقد نظافة سنوي', 'e.g. Annual cleaning contract')} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">{t('المبلغ الإجمالي', 'Total Amount')} *</label>
                  <input type="number" value={contractFormData.totalAmount || ''} onChange={e => setContractFormData({ ...contractFormData, totalAmount: Number(e.target.value) })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
                </div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">{t('نوع الدفع', 'Payment Type')}</label>
                  <select value={contractFormData.paymentType || 'full'} onChange={e => setContractFormData({ ...contractFormData, paymentType: e.target.value as 'full' | 'installment' })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm">
                    <option value="full">{t('دفعة كاملة', 'Full Payment')}</option>
                    <option value="installment">{t('أقساط', 'Installments')}</option>
                  </select>
                </div>
              </div>
              {contractFormData.paymentType === 'installment' && (
                <div><label className="block text-sm font-medium text-slate-700 mb-1">{t('عدد الأقساط', 'Number of Installments')}</label>
                  <select value={contractFormData.installmentCount || 6} onChange={e => setContractFormData({ ...contractFormData, installmentCount: Number(e.target.value) })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm">
                    {[2, 3, 4, 6, 8, 12].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                  {contractFormData.totalAmount && contractFormData.installmentCount && (
                    <p className="text-xs text-slate-400 mt-1">
                      {t('قيمة كل قسط:', 'Each installment:')} {Math.round((contractFormData.totalAmount || 0) / (contractFormData.installmentCount || 1)).toLocaleString()} {t('ج.م', 'EGP')}
                    </p>
                  )}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">{t('تاريخ البداية', 'Start Date')}</label>
                  <input type="date" value={contractFormData.startDate || ''} onChange={e => setContractFormData({ ...contractFormData, startDate: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
                </div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">{t('تاريخ النهاية', 'End Date')}</label>
                  <input type="date" value={contractFormData.endDate || ''} onChange={e => setContractFormData({ ...contractFormData, endDate: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSaveContract} className="flex-1 h-10 bg-primary-600 text-white rounded-xl hover:bg-primary-700">{t('حفظ', 'Save')}</button>
              <button onClick={() => setShowContractModal(false)} className="flex-1 h-10 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200">{t('إلغاء', 'Cancel')}</button>
            </div>
          </div>
        </div>
      )}

      {/* -------- PAYMENT VIEW MODAL -------- */}
      {showPaymentView && viewingPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-slate-800">{t('تفاصيل الدفعة', 'Payment Details')}</h3><button onClick={() => setShowPaymentView(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button></div>
            <div className="space-y-3">
              <div className="flex items-center gap-2"><User className="w-4 h-4 text-slate-400" /><span className="text-sm">{viewingPayment.tenantName}</span></div>
              <div className="flex items-center gap-2"><Home className="w-4 h-4 text-slate-400" /><span className="text-sm">{t('وحدة', 'Unit')} {viewingPayment.villaNumber}</span></div>
              <div className="p-4 bg-primary-50 rounded-xl"><p className="text-sm text-slate-600">{t('المبلغ', 'Amount')}</p><p className="text-2xl font-bold text-primary-700">{viewingPayment.amount.toLocaleString()} {t('ج.م', 'EGP')}</p></div>
              <div className="grid grid-cols-2 gap-2 text-sm"><div><p className="text-slate-400">{t('الشهر', 'Month')}</p><p>{viewingPayment.month} {viewingPayment.year}</p></div><div><p className="text-slate-400">{t('الطريقة', 'Method')}</p><p>{getMethodLabel(viewingPayment.paymentMethod)}</p></div></div>
              {viewingPayment.paymentDate && <div className="text-sm"><p className="text-slate-400">{t('تاريخ الدفع', 'Payment Date')}</p><p>{viewingPayment.paymentDate}</p></div>}
              {getStatusBadge(viewingPayment.status)}
            </div>
            <button onClick={() => setShowPaymentView(false)} className="w-full h-10 mt-4 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200">{t('إغلاق', 'Close')}</button>
          </div>
        </div>
      )}

      {/* -------- EXPENSE VIEW MODAL -------- */}
      {showExpenseView && viewingExpense && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-slate-800">{t('تفاصيل المصروف', 'Expense Details')}</h3><button onClick={() => setShowExpenseView(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button></div>
            <div className="space-y-3">
              <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-slate-400" /><span className="text-sm font-medium">{viewingExpense.description}</span></div>
              <div className="flex items-center gap-2"><Tag className="w-4 h-4 text-slate-400" /><span className="px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-600">{getCategoryLabel(viewingExpense.category)}</span></div>
              <div className="p-4 bg-red-50 rounded-xl"><p className="text-sm text-slate-600">{t('المبلغ', 'Amount')}</p><p className="text-2xl font-bold text-red-700">{viewingExpense.amount.toLocaleString()} {t('ج.م', 'EGP')}</p></div>
              <div className="flex items-center gap-2 text-sm"><Calendar className="w-4 h-4 text-slate-400" /><span className="text-slate-600">{viewingExpense.date}</span></div>
              <div className="flex items-center gap-2 text-sm"><DollarSign className="w-4 h-4 text-slate-400" /><span className="text-slate-600">{getMethodLabel(viewingExpense.paymentMethod)}</span></div>
              {viewingExpense.notes && <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-600">{viewingExpense.notes}</div>}
            </div>
            <button onClick={() => setShowExpenseView(false)} className="w-full h-10 mt-4 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200">{t('إغلاق', 'Close')}</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Payments
