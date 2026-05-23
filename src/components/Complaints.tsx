import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, X, AlertCircle, User, Home, Send, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { api } from '../services/api'

interface Complaint {
  id: string | number
  title: string
  description: string
  villaNumber: string
  tenantName: string
  category: 'noise' | 'maintenance' | 'behavior' | 'other'
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected'
  createdAt: string
  resolvedAt?: string
  reply?: string
}

interface ComplaintsProps {
  language: 'AR' | 'EN'
}

function Complaints({ language }: ComplaintsProps) {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingComplaint, setEditingComplaint] = useState<Complaint | null>(null)
  const [viewingComplaint, setViewingComplaint] = useState<Complaint | null>(null)
  const [formData, setFormData] = useState<Partial<Complaint>>({})

  // Map Backend API model to Frontend Complaint UI model
  const mapToFrontend = (item: any): Complaint => ({
    id: item.id || String(Date.now()),
    title: item.title || '',
    description: item.description || item.details || '',
    villaNumber: item.villaNumber || item.houseNumber || '',
    tenantName: item.tenantName || '',
    category: item.category || 'other',
    status: item.status?.toLowerCase() === 'resolved' ? 'resolved' : item.status?.toLowerCase() === 'rejected' ? 'rejected' : item.status?.toLowerCase() === 'in_progress' ? 'in_progress' : 'pending',
    createdAt: item.createdAt ? item.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
    resolvedAt: item.resolvedAt ? item.resolvedAt.split('T')[0] : undefined,
    reply: item.reply || ''
  })

  const fetchComplaints = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.getComplaints()
      if (Array.isArray(data)) {
        setComplaints(data.map(mapToFrontend))
      } else if (data && Array.isArray((data as any).complaints)) {
        setComplaints((data as any).complaints.map(mapToFrontend))
      }
    } catch (err: any) {
      console.error('Fetch complaints error:', err)
      setError(language === 'AR' ? 'فشل تحميل الشكاوى من الخادم' : 'Failed to fetch complaints from server')
      // Fallback mock data
      setComplaints([
        { id: '1', title: 'ضوضاء مزعجة', description: 'الجيران يقومون بأعمال بناء في وقت متأخر', villaNumber: '5', tenantName: 'أحمد محمد', category: 'noise', status: 'pending', createdAt: '2024-01-15' },
        { id: '2', title: 'مشكلة مياه', description: 'انقطاع المياه بشكل متكرر', villaNumber: '12', tenantName: 'خالد الغامدي', category: 'maintenance', status: 'in_progress', createdAt: '2024-01-14' },
        { id: '3', title: 'مخالفة قواعد', description: 'تستخدم الفلا لأغراض تجارية', villaNumber: '8', tenantName: 'عبدالله الزهراني', category: 'behavior', status: 'resolved', createdAt: '2024-01-10', resolvedAt: '2024-01-12' },
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComplaints()
  }, [])

  const handleAdd = () => {
    setEditingComplaint(null)
    setFormData({ title: '', description: '', villaNumber: '', tenantName: '', category: 'other', status: 'pending', createdAt: new Date().toISOString().split('T')[0], reply: '' })
    setShowModal(true)
  }

  const handleEdit = (complaint: Complaint) => {
    setEditingComplaint(complaint)
    setFormData({ ...complaint })
    setShowModal(true)
  }

  const handleView = (complaint: Complaint) => {
    setViewingComplaint(complaint)
    setShowViewModal(true)
  }

  const handleDelete = (id: string | number) => {
    if (window.confirm(language === 'AR' ? 'هل أنت متأكد من الحذف؟' : 'Are you sure you want to delete?')) {
      setComplaints(complaints.filter(c => c.id !== id))
    }
  }

  const handleSave = async () => {
    try {
      if (editingComplaint) {
        const reply = formData.reply || 'Processed by admin';
        const status = formData.status === 'resolved' ? 'Resolved' : formData.status === 'rejected' ? 'Rejected' : formData.status === 'in_progress' ? 'InProgress' : 'Pending';
        await api.replyComplaint(String(editingComplaint.id), { reply, status })
        setComplaints(complaints.map(c => c.id === editingComplaint.id ? { ...c, ...formData } as Complaint : c))
      } else {
        const newComplaint: Complaint = { ...formData, id: String(Date.now()) } as Complaint
        setComplaints([...complaints, newComplaint])
      }
      setShowModal(false)
    } catch (err: any) {
      console.error('Save complaint error:', err)
      alert(language === 'AR' ? `فشل حفظ الرد: ${err.message}` : `Failed to save reply: ${err.message}`)
      // Fallback
      if (editingComplaint) {
        setComplaints(complaints.map(c => c.id === editingComplaint.id ? { ...c, ...formData } as Complaint : c))
      } else {
        const newComplaint: Complaint = { ...formData, id: String(Date.now()) } as Complaint
        setComplaints([...complaints, newComplaint])
      }
      setShowModal(false)
    }
  }

  const handleSendToTenant = (complaint: Complaint) => {
    alert(language === 'AR' ? `تم إرسال تحديث الشكوى إلى ${complaint.tenantName}` : `Update sent to ${complaint.tenantName}`)
  }

  const getCategoryBadge = (category: string) => {
    const styles: Record<string, string> = {
      noise: 'bg-purple-100 text-purple-700',
      maintenance: 'bg-blue-100 text-blue-700',
      behavior: 'bg-orange-100 text-orange-700',
      other: 'bg-slate-100 text-slate-700'
    }
    const labels: Record<string, string> = {
      noise: language === 'AR' ? 'ضوضاء' : 'Noise',
      maintenance: language === 'AR' ? 'صيانة' : 'Maintenance',
      behavior: language === 'AR' ? 'سلوك' : 'Behavior',
      other: language === 'AR' ? 'أخرى' : 'Other'
    }
    return <span className={`px-2 py-1 rounded-full text-xs ${styles[category]}`}>{labels[category]}</span>
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-700',
      in_progress: 'bg-blue-100 text-blue-700',
      resolved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700'
    }
    const labels: Record<string, string> = {
      pending: language === 'AR' ? 'قيد الانتظار' : 'Pending',
      in_progress: language === 'AR' ? 'قيد المعالجة' : 'In Progress',
      resolved: language === 'AR' ? 'تم الحل' : 'Resolved',
      rejected: language === 'AR' ? 'مرفوض' : 'Rejected'
    }
    return <span className={`px-2 py-1 rounded-full text-xs ${styles[status]}`}>{labels[status]}</span>
  }

  return (
    <div className="bg-white rounded-2xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">{language === 'AR' ? 'الشكاوى' : 'Complaints'}</h2>
        <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors">
          <Plus className="w-4 h-4" />
          {language === 'AR' ? 'إضافة شكوى' : 'Add Complaint'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={fetchComplaints} className="underline text-xs hover:text-red-900">{language === 'AR' ? 'إعادة المحاولة' : 'Retry'}</button>
        </div>
      )}

      {loading && complaints.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin mb-2" />
          <p className="text-slate-500 text-sm">{language === 'AR' ? 'جاري تحميل البيانات...' : 'Loading complaints...'}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{language === 'AR' ? 'العنوان' : 'Title'}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{language === 'AR' ? 'الفلا' : 'Villa'}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{language === 'AR' ? 'النوع' : 'Category'}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{language === 'AR' ? 'الحالة' : 'Status'}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{language === 'AR' ? 'التاريخ' : 'Date'}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{language === 'AR' ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map(complaint => (
                <tr key={complaint.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 text-slate-700">{complaint.title}</td>
                  <td className="py-3 px-4 text-slate-700">{complaint.villaNumber}</td>
                  <td className="py-3 px-4">{getCategoryBadge(complaint.category)}</td>
                  <td className="py-3 px-4">{getStatusBadge(complaint.status)}</td>
                  <td className="py-3 px-4 text-slate-500 text-sm">{complaint.createdAt}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleView(complaint)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => handleEdit(complaint)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleSendToTenant(complaint)} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg"><Send className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(complaint.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">{editingComplaint ? (language === 'AR' ? 'تعديل شكوى' : 'Edit Complaint') : (language === 'AR' ? 'إضافة شكوى' : 'Add Complaint')}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'العنوان' : 'Title'}</label><input type="text" value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'الوصف' : 'Description'}</label><textarea value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'رقم الفلا' : 'Villa Number'}</label><input type="text" value={formData.villaNumber || ''} onChange={e => setFormData({ ...formData, villaNumber: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'اسم المستأجر' : 'Tenant Name'}</label><input type="text" value={formData.tenantName || ''} onChange={e => setFormData({ ...formData, tenantName: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'النوع' : 'Category'}</label><select value={formData.category || 'other'} onChange={e => setFormData({ ...formData, category: e.target.value as any })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm"><option value="noise">{language === 'AR' ? 'ضوضاء' : 'Noise'}</option><option value="maintenance">{language === 'AR' ? 'صيانة' : 'Maintenance'}</option><option value="behavior">{language === 'AR' ? 'سلوك' : 'Behavior'}</option><option value="other">{language === 'AR' ? 'أخرى' : 'Other'}</option></select></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'الحالة' : 'Status'}</label><select value={formData.status || 'pending'} onChange={e => setFormData({ ...formData, status: e.target.value as any })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm"><option value="pending">{language === 'AR' ? 'قيد الانتظار' : 'Pending'}</option><option value="in_progress">{language === 'AR' ? 'قيد المعالجة' : 'In Progress'}</option><option value="resolved">{language === 'AR' ? 'تم الحل' : 'Resolved'}</option><option value="rejected">{language === 'AR' ? 'مرفوض' : 'Rejected'}</option></select></div>
              </div>
              {editingComplaint && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'رد الإدارة' : 'Admin Reply'}</label>
                  <textarea value={formData.reply || ''} onChange={e => setFormData({ ...formData, reply: e.target.value })} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" placeholder={language === 'AR' ? 'اكتب ردك هنا...' : 'Type your reply here...'} />
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6"><button onClick={handleSave} className="flex-1 h-10 bg-primary-600 text-white rounded-xl hover:bg-primary-700">{language === 'AR' ? 'حفظ' : 'Save'}</button><button onClick={() => setShowModal(false)} className="flex-1 h-10 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200">{language === 'AR' ? 'إلغاء' : 'Cancel'}</button></div>
          </div>
        </div>
      )}

      {showViewModal && viewingComplaint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-slate-800">{viewingComplaint.title}</h3><button onClick={() => setShowViewModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button></div>
            <div className="space-y-3">
              <div className="flex items-center gap-2"><User className="w-4 h-4 text-slate-400" /><span className="text-sm">{viewingComplaint.tenantName}</span></div>
              <div className="flex items-center gap-2"><Home className="w-4 h-4 text-slate-400" /><span className="text-sm">{language === 'AR' ? 'فلا رقم' : 'Villa'} {viewingComplaint.villaNumber}</span></div>
              <p className="text-sm text-slate-600 p-3 bg-slate-50 rounded-lg">{viewingComplaint.description}</p>
              <div className="flex gap-2">{getCategoryBadge(viewingComplaint.category)}{getStatusBadge(viewingComplaint.status)}</div>
              {viewingComplaint.reply && (
                <div className="mt-3 p-3 bg-primary-50 rounded-lg border border-primary-100 text-right" dir={language === 'AR' ? 'rtl' : 'ltr'}>
                  <p className="text-xs font-semibold text-primary-700 mb-1">{language === 'AR' ? 'رد الإدارة:' : 'Admin Reply:'}</p>
                  <p className="text-sm text-slate-700">{viewingComplaint.reply}</p>
                </div>
              )}
            </div>
            <button onClick={() => setShowViewModal(false)} className="w-full h-10 mt-4 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200">{language === 'AR' ? 'إغلاق' : 'Close'}</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Complaints