import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, X, User, Home, Send } from 'lucide-react'
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

interface PaymentsProps {
  language: 'AR' | 'EN'
}

function Payments({ language }: PaymentsProps) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [, setLoading] = useState(false)
  const [, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null)
  const [viewingPayment, setViewingPayment] = useState<Payment | null>(null)
  const [formData, setFormData] = useState<Partial<Payment>>({})

  // Map Backend API model to Frontend Payment UI model
  const mapToFrontend = (item: any): Payment => ({
    id: item.id || String(Date.now()),
    tenantName: item.tenantName || item.fullName || '',
    villaNumber: item.villaNumber || item.houseNumber || '',
    amount: Number(item.amount) || 0,
    month: item.month || 'يناير',
    year: Number(item.year) || 2026,
    status: item.status?.toLowerCase() === 'paid' ? 'paid' : item.status?.toLowerCase() === 'late' ? 'late' : item.status?.toLowerCase() === 'cancelled' ? 'cancelled' : 'pending',
    paymentDate: item.paymentDate ? item.paymentDate.split('T')[0] : undefined,
    paymentMethod: item.paymentMethod || 'cash'
  })

  // Map Frontend UI model to Backend API model
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
      setError(language === 'AR' ? 'فشل تحميل بيانات المدفوعات من الخادم' : 'Failed to fetch payments from server')
      setPayments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [])

  const handleAdd = () => {
    setEditingPayment(null)
    setFormData({ tenantName: '', villaNumber: '', amount: 0, month: '', year: 2026, status: 'pending', paymentMethod: 'cash' })
    setShowModal(true)
  }

  const handleEdit = (payment: Payment) => {
    setEditingPayment(payment)
    setFormData({ ...payment })
    setShowModal(true)
  }

  const handleView = (payment: Payment) => {
    setViewingPayment(payment)
    setShowViewModal(true)
  }

  const handleDelete = (id: string | number) => {
    if (window.confirm(language === 'AR' ? 'هل أنت متأكد من الحذف؟' : 'Are you sure you want to delete?')) {
      setPayments(payments.filter(p => p.id !== id))
    }
  }

  const handleSave = async () => {
    try {
      if (editingPayment) {
        const status = formData.status === 'paid' ? 'Paid' : formData.status === 'late' ? 'Late' : formData.status === 'cancelled' ? 'Cancelled' : 'Pending';
        await api.updatePaymentStatus(String(editingPayment.id), { status })
        setPayments(payments.map(p => p.id === editingPayment.id ? { ...p, ...formData } as Payment : p))
      } else {
        const payload = mapToBackend(formData)
        const newPaymentBackend = await api.createPayment(payload)
        const newPayment = mapToFrontend(newPaymentBackend)
        setPayments([...payments, newPayment])
      }
      setShowModal(false)
    } catch (err: any) {
      console.error('Save payment error:', err)
      alert(language === 'AR' ? `خطأ: ${err.message}` : `Error: ${err.message}`)
    }
  }

  const handleSendReminder = (payment: Payment) => {
    alert(language === 'AR' ? `تم إرسال تذكير للدفع إلى ${payment.tenantName}` : `Payment reminder sent to ${payment.tenantName}`)
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = { paid: 'bg-green-100 text-green-700', pending: 'bg-amber-100 text-amber-700', late: 'bg-red-100 text-red-700', cancelled: 'bg-slate-100 text-slate-700' }
    const labels: Record<string, string> = { paid: language === 'AR' ? 'مدفوع' : 'Paid', pending: language === 'AR' ? 'معلق' : 'Pending', late: language === 'AR' ? 'متأخر' : 'Late', cancelled: language === 'AR' ? 'ملغى' : 'Cancelled' }
    return <span className={`px-2 py-1 rounded-full text-xs ${styles[status]}`}>{labels[status]}</span>
  }

  const getMethodLabel = (method: string) => {
    const labels: Record<string, string> = { cash: language === 'AR' ? 'نقدي' : 'Cash', bank_transfer: language === 'AR' ? 'تحويل بنكي' : 'Bank Transfer', card: language === 'AR' ? 'بطاقة' : 'Card' }
    return labels[method]
  }

  const totalPaid = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0)
  const totalPending = payments.filter(p => p.status === 'pending' || p.status === 'late').reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="bg-white rounded-2xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">{language === 'AR' ? 'المدفوعات' : 'Payments'}</h2>
        <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"><Plus className="w-4 h-4" />{language === 'AR' ? 'إضافة دفعة' : 'Add Payment'}</button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-green-50 rounded-xl"><p className="text-sm text-green-600">{language === 'AR' ? 'المدفوع' : 'Paid'}</p><p className="text-xl font-bold text-green-700">{totalPaid} {language === 'AR' ? 'ريال' : 'SAR'}</p></div>
        <div className="p-4 bg-amber-50 rounded-xl"><p className="text-sm text-amber-600">{language === 'AR' ? 'المعلق' : 'Pending'}</p><p className="text-xl font-bold text-amber-700">{totalPending} {language === 'AR' ? 'ريال' : 'SAR'}</p></div>
        <div className="p-4 bg-blue-50 rounded-xl"><p className="text-sm text-blue-600">{language === 'AR' ? 'الإجمالي' : 'Total'}</p><p className="text-xl font-bold text-blue-700">{totalPaid + totalPending} {language === 'AR' ? 'ريال' : 'SAR'}</p></div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-right py-3 px-4 font-semibold text-slate-600">{language === 'AR' ? 'المستأجر' : 'Tenant'}</th>
              <th className="text-right py-3 px-4 font-semibold text-slate-600">{language === 'AR' ? 'الفلا' : 'Villa'}</th>
              <th className="text-right py-3 px-4 font-semibold text-slate-600">{language === 'AR' ? 'المبلغ' : 'Amount'}</th>
              <th className="text-right py-3 px-4 font-semibold text-slate-600">{language === 'AR' ? 'الشهر' : 'Month'}</th>
              <th className="text-right py-3 px-4 font-semibold text-slate-600">{language === 'AR' ? 'الحالة' : 'Status'}</th>
              <th className="text-right py-3 px-4 font-semibold text-slate-600">{language === 'AR' ? 'الإجراءات' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(payment => (
              <tr key={payment.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-3 px-4 text-slate-700">{payment.tenantName}</td>
                <td className="py-3 px-4 text-slate-700">{payment.villaNumber}</td>
                <td className="py-3 px-4 text-slate-700 font-medium">{payment.amount} {language === 'AR' ? 'ريال' : 'SAR'}</td>
                <td className="py-3 px-4 text-slate-700">{payment.month} {payment.year}</td>
                <td className="py-3 px-4">{getStatusBadge(payment.status)}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleView(payment)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Eye className="w-4 h-4" /></button>
                    <button onClick={() => handleEdit(payment)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleSendReminder(payment)} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg"><Send className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(payment.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-slate-800">{editingPayment ? (language === 'AR' ? 'تعديل دفعة' : 'Edit Payment') : (language === 'AR' ? 'إضافة دفعة' : 'Add Payment')}</h3><button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button></div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'اسم المستأجر' : 'Tenant Name'}</label><input type="text" value={formData.tenantName || ''} onChange={e => setFormData({ ...formData, tenantName: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'رقم الفلا' : 'Villa Number'}</label><input type="text" value={formData.villaNumber || ''} onChange={e => setFormData({ ...formData, villaNumber: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'المبلغ' : 'Amount'}</label><input type="number" value={formData.amount || ''} onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'الشهر' : 'Month'}</label><input type="text" value={formData.month || ''} onChange={e => setFormData({ ...formData, month: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'السنة' : 'Year'}</label><input type="number" value={formData.year || ''} onChange={e => setFormData({ ...formData, year: Number(e.target.value) })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'الحالة' : 'Status'}</label><select value={formData.status || 'pending'} onChange={e => setFormData({ ...formData, status: e.target.value as any })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm"><option value="paid">{language === 'AR' ? 'مدفوع' : 'Paid'}</option><option value="pending">{language === 'AR' ? 'معلق' : 'Pending'}</option><option value="late">{language === 'AR' ? 'متأخر' : 'Late'}</option><option value="cancelled">{language === 'AR' ? 'ملغى' : 'Cancelled'}</option></select></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'طريقة الدفع' : 'Payment Method'}</label><select value={formData.paymentMethod || 'cash'} onChange={e => setFormData({ ...formData, paymentMethod: e.target.value as any })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm"><option value="cash">{language === 'AR' ? 'نقدي' : 'Cash'}</option><option value="bank_transfer">{language === 'AR' ? 'تحويل بنكي' : 'Bank Transfer'}</option><option value="card">{language === 'AR' ? 'بطاقة' : 'Card'}</option></select></div>
              </div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'تاريخ الدفع' : 'Payment Date'}</label><input type="date" value={formData.paymentDate || ''} onChange={e => setFormData({ ...formData, paymentDate: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" /></div>
            </div>
            <div className="flex gap-3 mt-6"><button onClick={handleSave} className="flex-1 h-10 bg-primary-600 text-white rounded-xl hover:bg-primary-700">{language === 'AR' ? 'حفظ' : 'Save'}</button><button onClick={() => setShowModal(false)} className="flex-1 h-10 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200">{language === 'AR' ? 'إلغاء' : 'Cancel'}</button></div>
          </div>
        </div>
      )}

      {showViewModal && viewingPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-slate-800">{language === 'AR' ? 'تفاصيل الدفعة' : 'Payment Details'}</h3><button onClick={() => setShowViewModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button></div>
            <div className="space-y-3">
              <div className="flex items-center gap-2"><User className="w-4 h-4 text-slate-400" /><span className="text-sm">{viewingPayment.tenantName}</span></div>
              <div className="flex items-center gap-2"><Home className="w-4 h-4 text-slate-400" /><span className="text-sm">{language === 'AR' ? 'فلا رقم' : 'Villa'} {viewingPayment.villaNumber}</span></div>
              <div className="p-4 bg-primary-50 rounded-xl"><p className="text-sm text-slate-600">{language === 'AR' ? 'المبلغ' : 'Amount'}</p><p className="text-2xl font-bold text-primary-700">{viewingPayment.amount} {language === 'AR' ? 'ريال' : 'SAR'}</p></div>
              <div className="grid grid-cols-2 gap-2 text-sm"><div><p className="text-slate-400">{language === 'AR' ? 'الشهر' : 'Month'}</p><p>{viewingPayment.month} {viewingPayment.year}</p></div><div><p className="text-slate-400">{language === 'AR' ? 'الطريقة' : 'Method'}</p><p>{getMethodLabel(viewingPayment.paymentMethod)}</p></div></div>
              {getStatusBadge(viewingPayment.status)}
            </div>
            <button onClick={() => setShowViewModal(false)} className="w-full h-10 mt-4 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200">{language === 'AR' ? 'إغلاق' : 'Close'}</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Payments