import { useState, useRef, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, X, User, Home, Loader2, Send, Calendar, Tag, MessageSquare, CheckCircle, Upload, LayoutList, Grid3X3 } from 'lucide-react'
import { api, API_BASE_URL } from '../services/api'

interface Complaint {
  id: string
  title: string
  description: string
  details: string
  villaNumber: string
  houseNumber: string
  tenantName: string
  category: string
  status: string
  createdAt: string
  resolvedAt?: string
  reply: string
  adminReply: string
  images: string[]
}

interface ComplaintsProps {
  language: 'AR' | 'EN'
}

const STATUS_LABELS: Record<string, { ar: string, en: string }> = {
  Open: { ar: 'مفتوح', en: 'Open' },
  Pending: { ar: 'قيد الانتظار', en: 'Pending' },
  InProgress: { ar: 'قيد المعالجة', en: 'In Progress' },
  Resolved: { ar: 'تم الحل', en: 'Resolved' },
  Rejected: { ar: 'مرفوض', en: 'Rejected' }
}

const STATUS_STYLES: Record<string, string> = {
  Open: 'bg-blue-100 text-blue-700',
  Pending: 'bg-amber-100 text-amber-700',
  InProgress: 'bg-purple-100 text-purple-700',
  Resolved: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700'
}

function Complaints({ language }: ComplaintsProps) {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingComplaint, setEditingComplaint] = useState<Complaint | null>(null)
  const [viewingComplaint, setViewingComplaint] = useState<Complaint | null>(null)
  const [formData, setFormData] = useState<Partial<Complaint>>({})
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [replyText, setReplyText] = useState('')
  const [replyStatus, setReplyStatus] = useState('Resolved')
  const [sendingReply, setSendingReply] = useState(false)

  const resolveImage = (url: string) =>
    url?.startsWith('http') ? url : `${API_BASE_URL}${url}`

  const normalizeStatus = (s: string): string => {
    const status = s || 'Open'
    if (status === 'in_progress' || status === 'In Progress') return 'InProgress'
    if (status === 'pending' || status === 'Pending') return 'Pending'
    if (status === 'resolved' || status === 'Resolved') return 'Resolved'
    if (status === 'rejected' || status === 'Rejected') return 'Rejected'
    return 'Open'
  }

  const mapToFrontend = (item: any): Complaint => ({
    id: item.id || String(Date.now()),
    title: item.title || '',
    description: item.description || item.details || '',
    details: item.details || '',
    villaNumber: item.villaNumber || '',
    houseNumber: item.houseNumber || item.villaNumber || '',
    tenantName: item.tenantName || '',
    category: item.category || 'other',
    status: normalizeStatus(item.status),
    createdAt: item.createdAt ? item.createdAt.split('T')[0] : '',
    resolvedAt: item.resolvedAt ? item.resolvedAt.split('T')[0] : undefined,
    reply: item.reply || item.adminReply || '',
    adminReply: item.adminReply || item.reply || '',
    images: (item.images || []).map(resolveImage)
  })

  const getCategoryBadge = (category: string) => {
    const labels: Record<string, { ar: string, en: string }> = {
      noise: { ar: 'ضوضاء', en: 'Noise' },
      maintenance: { ar: 'صيانة', en: 'Maintenance' },
      behavior: { ar: 'سلوك', en: 'Behavior' },
      facilities: { ar: 'مرافق', en: 'Facilities' },
      other: { ar: 'أخرى', en: 'Other' }
    }
    const c = category?.toLowerCase() || 'other'
    const label = labels[c] || { ar: category, en: category }
    const colors: Record<string, string> = {
      noise: 'bg-purple-100 text-purple-700',
      maintenance: 'bg-blue-100 text-blue-700',
      behavior: 'bg-orange-100 text-orange-700',
      facilities: 'bg-teal-100 text-teal-700',
      other: 'bg-slate-100 text-slate-700'
    }
    return <span className={`px-2 py-1 rounded-full text-xs ${colors[c] || colors.other}`}>{language === 'AR' ? label.ar : label.en}</span>
  }

  const getStatusBadge = (status: string) => {
    const label = STATUS_LABELS[status] || { ar: status, en: status }
    const style = STATUS_STYLES[status] || 'bg-slate-100 text-slate-700'
    return <span className={`px-2 py-1 rounded-full text-xs ${style}`}>{language === 'AR' ? label.ar : label.en}</span>
  }

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
      setComplaints([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComplaints()
  }, [])

  const handleAdd = () => {
    setEditingComplaint(null)
    setFormData({
      title: '', description: '', details: '', villaNumber: '', houseNumber: '',
      tenantName: '', category: 'other', status: 'Open'
    })
    setImagePreview('')
    setImageFile(null)
    setShowModal(true)
  }

  const handleEdit = (complaint: Complaint) => {
    setEditingComplaint(complaint)
    setFormData({ ...complaint })
    setImagePreview(complaint.images?.[0] || '')
    setImageFile(null)
    setShowModal(true)
  }

  const handleView = (complaint: Complaint) => {
    setViewingComplaint(complaint)
    setReplyText(complaint.adminReply || complaint.reply || '')
    setReplyStatus(
      complaint.status === 'Resolved' || complaint.status === 'Rejected'
        ? complaint.status
        : 'Resolved'
    )
    setShowViewModal(true)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm(language === 'AR' ? 'هل أنت متأكد من الحذف؟' : 'Are you sure you want to delete?')) {
      try {
        await api.deleteComplaint(id)
        setComplaints(complaints.filter(c => c.id !== id))
      } catch (err: any) {
        console.error('Delete complaint error:', err)
        alert(language === 'AR' ? `فشل الحذف: ${err.message}` : `Delete failed: ${err.message}`)
      }
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (editingComplaint) {
        const payload: Record<string, any> = {
          reply: formData.reply || editingComplaint.reply || 'Processed by admin',
          adminReply: formData.adminReply || editingComplaint.adminReply || 'Processed by admin',
          status: formData.status || editingComplaint.status
        }
        if (imageFile) payload.images = [imageFile]
        await api.replyComplaint(String(editingComplaint.id), payload)
        setComplaints(complaints.map(c => c.id === editingComplaint.id ? { ...c, ...formData } as Complaint : c))
      } else {
        const payload: Record<string, any> = {
          title: formData.title || '',
          description: formData.description || formData.details || '',
          details: formData.details || '',
          villaNumber: formData.villaNumber || '',
          houseNumber: formData.houseNumber || formData.villaNumber || '',
          tenantName: formData.tenantName || '',
          category: formData.category || 'other',
          status: formData.status || 'Open'
        }
        if (imageFile) payload.images = [imageFile]
        const created = await api.createComplaint(payload)
        const newComplaint = mapToFrontend(created ?? { ...formData, id: String(Date.now()) })
        setComplaints([newComplaint, ...complaints])
      }
      setShowModal(false)
    } catch (err: any) {
      console.error('Save complaint error:', err)
      alert(language === 'AR' ? `خطأ: ${err.message}` : `Error: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleSendReply = async () => {
    if (!viewingComplaint) return
    setSendingReply(true)
    try {
      await api.replyComplaint(viewingComplaint.id, {
        reply: replyText || 'No reply',
        adminReply: replyText || 'No reply',
        status: replyStatus
      })
      const updated = { ...viewingComplaint, reply: replyText, adminReply: replyText, status: replyStatus }
      setViewingComplaint(updated)
      setComplaints(complaints.map(c => c.id === updated.id ? updated : c))
    } catch (err: any) {
      console.error('Reply error:', err)
      alert(language === 'AR' ? `فشل إرسال الرد: ${err.message}` : `Reply failed: ${err.message}`)
    } finally {
      setSendingReply(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImagePreview(URL.createObjectURL(file))
      setImageFile(file)
    }
  }

  const t = (ar: string, en: string) => language === 'AR' ? ar : en

  return (
    <div className="bg-white rounded-2xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">{t('الشكاوى', 'Complaints')}</h2>
        <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors">
          <Plus className="w-4 h-4" />
          {t('إضافة شكوى', 'Add Complaint')}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={fetchComplaints} className="underline text-xs hover:text-red-900">{t('إعادة المحاولة', 'Retry')}</button>
        </div>
      )}

      <div className="flex items-center gap-1 mb-4">
        <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`} title={t('عرض كقائمة', 'List view')}><LayoutList className="w-4 h-4" /></button>
        <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`} title={t('عرض كبطاقات', 'Grid view')}><Grid3X3 className="w-4 h-4" /></button>
      </div>

      {loading && complaints.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin mb-2" />
          <p className="text-slate-500 text-sm">{t('جاري تحميل البيانات...', 'Loading complaints...')}</p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('العنوان', 'Title')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('المستأجر', 'Tenant')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('المنزل', 'House')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('النوع', 'Category')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('الحالة', 'Status')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('التاريخ', 'Date')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('الإجراءات', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map(complaint => (
                <tr key={complaint.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 text-slate-700">{complaint.title || '—'}</td>
                  <td className="py-3 px-4 text-slate-700">{complaint.tenantName || '—'}</td>
                  <td className="py-3 px-4 text-slate-700">{complaint.houseNumber || complaint.villaNumber || '—'}</td>
                  <td className="py-3 px-4">{getCategoryBadge(complaint.category)}</td>
                  <td className="py-3 px-4">{getStatusBadge(complaint.status)}</td>
                  <td className="py-3 px-4 text-slate-500 text-sm">{complaint.createdAt}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleView(complaint)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title={t('عرض', 'View')}><Eye className="w-4 h-4" /></button>
                      <button onClick={() => handleEdit(complaint)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg" title={t('تعديل', 'Edit')}><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(complaint.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title={t('حذف', 'Delete')}><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {complaints.map(complaint => (
            <div key={complaint.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-slate-800 truncate">{complaint.title || '—'}</h3>
                <div className="flex gap-1 shrink-0">{getCategoryBadge(complaint.category)}</div>
              </div>
              <p className="text-xs text-slate-400 mb-1">{complaint.tenantName || '—'} {complaint.createdAt ? `· ${complaint.createdAt}` : ''}</p>
              <div className="space-y-2 text-sm text-slate-600 mb-3">
                <div className="flex justify-between"><span className="text-slate-400">{t('المنزل', 'House')}</span><span>{complaint.houseNumber || complaint.villaNumber || '—'}</span></div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                {getStatusBadge(complaint.status)}
                <div className="flex items-center gap-1">
                  <button onClick={() => handleView(complaint)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Eye className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleEdit(complaint)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(complaint.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">
                {editingComplaint ? t('تعديل شكوى', 'Edit Complaint') : t('إضافة شكوى', 'Add Complaint')}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('العنوان', 'Title')}</label>
                <input type="text" value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('الوصف', 'Description')}</label>
                <textarea value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('رقم المنزل', 'House Number')}</label>
                  <input type="text" value={formData.houseNumber || ''} onChange={e => setFormData({ ...formData, houseNumber: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('اسم المستأجر', 'Tenant Name')}</label>
                  <input type="text" value={formData.tenantName || ''} onChange={e => setFormData({ ...formData, tenantName: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('النوع', 'Category')}</label>
                  <select value={formData.category || 'other'} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm">
                    <option value="noise">{t('ضوضاء', 'Noise')}</option>
                    <option value="maintenance">{t('صيانة', 'Maintenance')}</option>
                    <option value="behavior">{t('سلوك', 'Behavior')}</option>
                    <option value="facilities">{t('مرافق', 'Facilities')}</option>
                    <option value="other">{t('أخرى', 'Other')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('الحالة', 'Status')}</label>
                  <select value={formData.status || 'Open'} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm">
                    {Object.entries(STATUS_LABELS).map(([key, val]) => (
                      <option key={key} value={key}>{language === 'AR' ? val.ar : val.en}</option>
                    ))}
                  </select>
                </div>
              </div>
              {editingComplaint && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('رد الإدارة', 'Admin Reply')}</label>
                  <textarea value={formData.adminReply || formData.reply || ''} onChange={e => setFormData({ ...formData, adminReply: e.target.value, reply: e.target.value })} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" placeholder={t('اكتب ردك هنا...', 'Type your reply here...')} />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('الصورة', 'Image')}</label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4">
                  {imagePreview ? (
                    <div className="relative mb-3">
                      <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
                      <button onClick={() => { setImagePreview(''); setImageFile(null) }} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : editingComplaint?.images?.[0] && !imageFile ? (
                    <div className="relative mb-3">
                      <img src={editingComplaint.images[0]} alt="Current" className="w-full h-40 object-cover rounded-lg" />
                    </div>
                  ) : null}
                  <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 py-2 w-full border border-slate-200 rounded-lg hover:bg-slate-50">
                    <Upload className="w-4 h-4" />
                    {t('رفع صورة', 'Upload')}
                  </button>
                  <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageUpload} className="hidden" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} disabled={saving} className="flex-1 h-10 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? t('جاري الحفظ...', 'Saving...') : t('حفظ', 'Save')}
              </button>
              <button onClick={() => setShowModal(false)} disabled={saving} className="flex-1 h-10 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 disabled:opacity-50">
                {t('إلغاء', 'Cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showViewModal && viewingComplaint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">{t('تفاصيل الشكوى', 'Complaint Details')}</h3>
              <button onClick={() => setShowViewModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {(viewingComplaint.images?.length ?? 0) > 0 && (
              <div className="mb-4">
                {viewingComplaint.images?.map((img, i) => (
                  <img key={i} src={img} alt={`Complaint ${i + 1}`} className="w-full h-48 object-cover rounded-xl" />
                ))}
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <MessageSquare className="w-5 h-5 text-primary-600" />
                <div>
                  <p className="font-semibold text-slate-800">{viewingComplaint.title || t('شكوى', 'Complaint')}</p>
                  <p className="text-xs text-slate-500">{viewingComplaint.tenantName || ''}</p>
                </div>
              </div>

              <p className="text-sm text-slate-600 p-3 bg-slate-50 rounded-lg">{viewingComplaint.description || '—'}</p>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">{t('منزل', 'House')}: {viewingComplaint.houseNumber || viewingComplaint.villaNumber || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">{viewingComplaint.tenantName || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">{viewingComplaint.createdAt || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">{viewingComplaint.category || '—'}</span>
                </div>
                {viewingComplaint.resolvedAt && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-slate-600">{t('تم الحل', 'Resolved')}: {viewingComplaint.resolvedAt}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {getCategoryBadge(viewingComplaint.category)}
                {getStatusBadge(viewingComplaint.status)}
              </div>

              {(viewingComplaint.adminReply || viewingComplaint.reply) ? (
                <div className="p-3 bg-primary-50 rounded-lg border border-primary-100">
                  <p className="text-xs font-semibold text-primary-700 mb-1">{t('رد الإدارة:', 'Admin Reply:')}</p>
                  <p className="text-sm text-slate-700">{viewingComplaint.adminReply || viewingComplaint.reply}</p>
                </div>
              ) : viewingComplaint.status !== 'Resolved' && viewingComplaint.status !== 'Rejected' ? (
                <div className="border-t border-slate-200 pt-4">
                  <p className="text-sm font-medium text-slate-700 mb-2">{t('الرد على الشكوى', 'Reply to Complaint')}</p>
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm mb-2"
                    placeholder={t('اكتب ردك هنا...', 'Type your reply here...')}
                  />
                  <div className="flex gap-2">
                    <select value={replyStatus} onChange={e => setReplyStatus(e.target.value)} className="h-10 px-3 border border-slate-200 rounded-xl text-sm flex-1">
                      <option value="Resolved">{t('تم الحل', 'Resolved')}</option>
                      <option value="Rejected">{t('مرفوض', 'Rejected')}</option>
                      <option value="InProgress">{t('قيد المعالجة', 'In Progress')}</option>
                    </select>
                    <button onClick={handleSendReply} disabled={sendingReply} className="h-10 px-4 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
                      {sendingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      {t('إرسال', 'Send')}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
            <button onClick={() => setShowViewModal(false)} className="w-full h-10 mt-4 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200">
              {t('إغلاق', 'Close')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Complaints
