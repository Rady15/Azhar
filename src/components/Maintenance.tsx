import { useState, useRef, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, X, Home, Loader2, Calendar, DollarSign, Wrench, Star, Upload, Flag, UserCircle, LayoutList, Grid3X3 } from 'lucide-react'
import { api, MaintenanceModel, API_BASE_URL } from '../services/api'

interface MaintenanceRequest extends MaintenanceModel {
  _priority: 'low' | 'medium' | 'high' | 'urgent'
}

interface MaintenanceProps {
  language: 'AR' | 'EN'
}

const STATUS_LABELS: Record<string, { ar: string, en: string }> = {
  'Submitted': { ar: 'مقدم', en: 'Submitted' },
  'Pending': { ar: 'قيد الانتظار', en: 'Pending' },
  'In Progress': { ar: 'قيد العمل', en: 'In Progress' },
  'Completed': { ar: 'مكتمل', en: 'Completed' },
  'Cancelled': { ar: 'ملغى', en: 'Cancelled' }
}

const STATUS_STYLES: Record<string, string> = {
  'Submitted': 'bg-purple-100 text-purple-700',
  'Pending': 'bg-amber-100 text-amber-700',
  'In Progress': 'bg-blue-100 text-blue-700',
  'Completed': 'bg-green-100 text-green-700',
  'Cancelled': 'bg-slate-100 text-slate-700'
}

function Maintenance({ language }: MaintenanceProps) {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingRequest, setEditingRequest] = useState<MaintenanceRequest | null>(null)
  const [viewingRequest, setViewingRequest] = useState<MaintenanceRequest | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [formData, setFormData] = useState<Partial<MaintenanceRequest>>({})
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resolveImage = (url: string) =>
    url?.startsWith('http') ? url : `${API_BASE_URL}${url}`

  const mapPriority = (p: string | undefined): 'low' | 'medium' | 'high' | 'urgent' => {
    const s = (p || '').toLowerCase()
    if (s === 'low' || s === 'medium' || s === 'high' || s === 'urgent') return s
    return 'medium'
  }

  const mapToFrontend = (item: MaintenanceModel): MaintenanceRequest => ({
    id: item.id || String(Date.now()),
    requestNumber: item.requestNumber || '',
    title: item.title || '',
    category: item.category || '',
    description: item.description || '',
    priority: item.priority || 'Medium',
    status: item.status || 'Submitted',
    adminNotes: item.adminNotes || '',
    createdAt: item.createdAt || '',
    cost: item.cost || 0,
    villaNumber: item.villaNumber || '',
    houseNumber: item.houseNumber || '',
    tenantName: item.tenantName || '',
    images: (item.images || []).map(resolveImage),
    assignedToId: item.assignedToId || '',
    assignedToName: item.assignedToName || '',
    rating: item.rating || 0,
    ratingComment: item.ratingComment || '',
    _priority: mapPriority(item.priority)
  })

  const fetchRequests = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.getMaintenance()
      if (data && Array.isArray((data as any).maintenances)) {
        setRequests((data as any).maintenances.map(mapToFrontend))
      } else if (data && Array.isArray((data as any).data)) {
        setRequests((data as any).data.map(mapToFrontend))
      } else if (Array.isArray(data)) {
        setRequests(data.map(mapToFrontend))
      }
    } catch (err: any) {
      console.error('Fetch maintenance error:', err)
      setError(language === 'AR' ? 'فشل تحميل طلبات الصيانة من الخادم' : 'Failed to fetch maintenance requests')
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const handleAdd = () => {
    setEditingRequest(null)
    setFormData({
      title: '', category: '', description: '', houseNumber: '',
      priority: 'Medium', status: 'Submitted', cost: 0, adminNotes: ''
    })
    setImagePreview('')
    setImageFile(null)
    setShowModal(true)
  }

  const handleEdit = (request: MaintenanceRequest) => {
    setEditingRequest(request)
    setFormData({ ...request })
    setImagePreview(request.images?.[0] || '')
    setImageFile(null)
    setShowModal(true)
  }

  const handleView = (request: MaintenanceRequest) => {
    setViewingRequest(request)
    setShowViewModal(true)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm(language === 'AR' ? 'هل أنت متأكد من الحذف؟' : 'Are you sure you want to delete?')) {
      try {
        await api.deleteMaintenance(id)
        setRequests(requests.filter(r => r.id !== id))
      } catch (err: any) {
        console.error('Delete maintenance error:', err)
        alert(language === 'AR' ? `فشل الحذف: ${err.message}` : `Delete failed: ${err.message}`)
      }
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload: Record<string, any> = {
        title: formData.title || '',
        category: formData.category || '',
        description: formData.description || '',
        houseNumber: formData.houseNumber || '',
        priority: formData.priority || 'Medium',
        status: formData.status || 'Submitted',
        cost: formData.cost || 0,
        adminNotes: formData.adminNotes || ''
      }
      if (imageFile) {
        payload.images = [imageFile]
      }

      if (editingRequest) {
        await api.updateMaintenanceStatus(String(editingRequest.id), {
          status: formData.status || 'Submitted',
          adminNotes: formData.adminNotes || ''
        })
        setRequests(requests.map(r => r.id === editingRequest.id ? { ...r, ...formData } as MaintenanceRequest : r))
      } else {
        const newBackend = await api.createMaintenance(payload)
        const newRequest = mapToFrontend(newBackend)
        setRequests([...requests, newRequest])
      }
      setShowModal(false)
    } catch (err: any) {
      console.error('Save maintenance error:', err)
      alert(language === 'AR' ? `خطأ: ${err.message}` : `Error: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImagePreview(URL.createObjectURL(file))
      setImageFile(file)
    }
  }

  const getStatusBadge = (status: string) => {
    const label = STATUS_LABELS[status] || { ar: status, en: status }
    const style = STATUS_STYLES[status] || 'bg-slate-100 text-slate-700'
    return <span className={`px-2 py-1 rounded-full text-xs ${style}`}>{language === 'AR' ? label.ar : label.en}</span>
  }

  const getPriorityBadge = (priority: string) => {
    const s = priority.toLowerCase()
    const styles: Record<string, string> = {
      low: 'bg-slate-100 text-slate-700',
      medium: 'bg-blue-100 text-blue-700',
      high: 'bg-orange-100 text-orange-700',
      urgent: 'bg-red-100 text-red-700'
    }
    const labels: Record<string, string> = {
      low: language === 'AR' ? 'منخفض' : 'Low',
      medium: language === 'AR' ? 'متوسط' : 'Medium',
      high: language === 'AR' ? 'عالي' : 'High',
      urgent: language === 'AR' ? 'عاجل' : 'Urgent'
    }
    return <span className={`px-2 py-1 rounded-full text-xs ${styles[s] || styles.medium}`}>{labels[s] || labels.medium}</span>
  }

  const t = (ar: string, en: string) => language === 'AR' ? ar : en

  return (
    <div className="bg-white rounded-2xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">{t('الصيانة', 'Maintenance')}</h2>
        <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors">
          <Plus className="w-4 h-4" />
          {t('إضافة طلب', 'Add Request')}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={fetchRequests} className="underline text-xs hover:text-red-900">{t('إعادة المحاولة', 'Retry')}</button>
        </div>
      )}

      <div className="flex items-center gap-1 mb-4">
        <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`} title={t('عرض كقائمة', 'List view')}><LayoutList className="w-4 h-4" /></button>
        <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`} title={t('عرض كبطاقات', 'Grid view')}><Grid3X3 className="w-4 h-4" /></button>
      </div>

      {loading && requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin mb-2" />
          <p className="text-slate-500 text-sm">{t('جاري تحميل البيانات...', 'Loading requests...')}</p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('الرقم', 'No.')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('العنوان', 'Title')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('التصنيف', 'Category')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('المنزل', 'House')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('الأولوية', 'Priority')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('الحالة', 'Status')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('التكلفة', 'Cost')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('الإجراءات', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(request => (
                <tr key={request.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 text-xs font-mono text-slate-500">{request.requestNumber || '—'}</td>
                  <td className="py-3 px-4 text-slate-700">{request.title || request.category || '—'}</td>
                  <td className="py-3 px-4 text-slate-700">{request.category || '—'}</td>
                  <td className="py-3 px-4 text-slate-700">{request.houseNumber || request.villaNumber || '—'}</td>
                  <td className="py-3 px-4">{getPriorityBadge(request.priority || 'Medium')}</td>
                  <td className="py-3 px-4">{getStatusBadge(request.status)}</td>
                  <td className="py-3 px-4 text-slate-700">{request.cost ? `${request.cost} ${t('ج.م', 'EGP')}` : '—'}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleView(request)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title={t('عرض', 'View')}><Eye className="w-4 h-4" /></button>
                      <button onClick={() => handleEdit(request)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg" title={t('تعديل', 'Edit')}><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(request.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title={t('حذف', 'Delete')}><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {requests.map(request => (
            <div key={request.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-slate-400">{request.requestNumber || '—'}</span>
                <div className="flex gap-1">
                  {getPriorityBadge(request.priority || 'Medium')}
                  {getStatusBadge(request.status)}
                </div>
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">{request.title || request.category || '—'}</h3>
              <div className="space-y-2 text-sm text-slate-600 mb-3">
                <div className="flex justify-between"><span className="text-slate-400">{t('التصنيف', 'Category')}</span><span>{request.category || '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">{t('المنزل', 'House')}</span><span>{request.houseNumber || request.villaNumber || '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">{t('التكلفة', 'Cost')}</span><span className="font-medium">{request.cost ? `${request.cost} ${t('ج.م', 'EGP')}` : '—'}</span></div>
              </div>
              <div className="flex items-center justify-end gap-1 pt-3 border-t border-slate-100">
                <button onClick={() => handleView(request)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Eye className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleEdit(request)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg"><Edit className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleDelete(request.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
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
                {editingRequest ? t('تعديل طلب صيانة', 'Edit Request') : t('إضافة طلب صيانة', 'Add Request')}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('العنوان', 'Title')}</label>
                  <input type="text" value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('التصنيف', 'Category')}</label>
                  <select value={formData.category || ''} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm">
                    <option value="">-- {t('اختر', 'Select')} --</option>
                    <option value="كهرباء">{t('كهرباء', 'Electrical')}</option>
                    <option value="سباكة">{t('سباكة', 'Plumbing')}</option>
                    <option value="تكييف">{t('تكييف', 'AC')}</option>
                    <option value="نجارة">{t('نجارة', 'Carpentry')}</option>
                    <option value="دهان">{t('دهان', 'Painting')}</option>
                    <option value="أرضيات">{t('أرضيات', 'Flooring')}</option>
                    <option value="حدادة">{t('حدادة', 'Metalwork')}</option>
                    <option value="أخرى">{t('أخرى', 'Other')}</option>
                  </select>
                </div>
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('الأولوية', 'Priority')}</label>
                  <select value={formData.priority || 'Medium'} onChange={e => setFormData({ ...formData, priority: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm">
                    <option value="Low">{t('منخفض', 'Low')}</option>
                    <option value="Medium">{t('متوسط', 'Medium')}</option>
                    <option value="High">{t('عالي', 'High')}</option>
                    <option value="Urgent">{t('عاجل', 'Urgent')}</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('الحالة', 'Status')}</label>
                  <select value={formData.status || 'Submitted'} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm">
                    {Object.entries(STATUS_LABELS).map(([key, val]) => (
                      <option key={key} value={key}>{language === 'AR' ? val.ar : val.en}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('التكلفة', 'Cost')}</label>
                  <input type="number" value={formData.cost || ''} onChange={e => setFormData({ ...formData, cost: Number(e.target.value) })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('ملاحظات الإدارة', 'Admin Notes')}</label>
                <textarea value={formData.adminNotes || ''} onChange={e => setFormData({ ...formData, adminNotes: e.target.value })} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              </div>
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
                  ) : editingRequest?.images?.[0] && !imageFile ? (
                    <div className="relative mb-3">
                      <img src={editingRequest.images[0]} alt="Current" className="w-full h-40 object-cover rounded-lg" />
                    </div>
                  ) : null}
                  <div className="flex gap-3">
                    <button onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 py-2 border border-slate-200 rounded-lg hover:bg-slate-50">
                      <Upload className="w-4 h-4" />
                      {t('رفع صورة', 'Upload')}
                    </button>
                    <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </div>
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

      {showViewModal && viewingRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">{t('تفاصيل طلب الصيانة', 'Maintenance Details')}</h3>
              <button onClick={() => setShowViewModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {(viewingRequest.images?.length ?? 0) > 0 && (
              <div className="mb-4 flex gap-2 overflow-x-auto">
                {viewingRequest.images?.map((img, i) => (
                  <img key={i} src={img} alt={`Maintenance ${i + 1}`} className="w-full h-48 object-cover rounded-xl" />
                ))}
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <Wrench className="w-5 h-5 text-primary-600" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-800">{viewingRequest.title || viewingRequest.category || t('صيانة', 'Maintenance')}</p>
                    {viewingRequest.requestNumber && (
                      <span className="text-xs font-mono text-slate-400">{viewingRequest.requestNumber}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{viewingRequest.category || ''}</p>
                </div>
              </div>

              <p className="text-sm text-slate-600 p-3 bg-slate-50 rounded-lg">{viewingRequest.description || '—'}</p>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">{t('منزل', 'House')}: {viewingRequest.houseNumber || viewingRequest.villaNumber || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">{t('تكلفة', 'Cost')}: {viewingRequest.cost ? `${viewingRequest.cost} ${t('ج.م', 'EGP')}` : '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">{viewingRequest.createdAt ? new Date(viewingRequest.createdAt).toLocaleDateString() : '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Flag className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">{t('أولوية', 'Priority')}: {viewingRequest.priority || '—'}</span>
                </div>
              </div>

              <div className="flex gap-2">
                {getPriorityBadge(viewingRequest.priority || 'Medium')}
                {getStatusBadge(viewingRequest.status)}
              </div>

              {viewingRequest.assignedToName && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <UserCircle className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">{viewingRequest.assignedToName}</p>
                    <p className="text-xs text-blue-500">{t('مسؤول الصيانة', 'Assigned To')}</p>
                  </div>
                </div>
              )}

              {viewingRequest.adminNotes && (
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-1">{t('ملاحظات الإدارة', 'Admin Notes')}</p>
                  <p className="text-sm text-slate-600 p-3 bg-primary-50 rounded-lg">{viewingRequest.adminNotes}</p>
                </div>
              )}

              {viewingRequest.rating ? (
                <div className="p-3 bg-amber-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span className="text-sm font-semibold text-amber-800">{viewingRequest.rating}/5</span>
                  </div>
                  {viewingRequest.ratingComment && (
                    <p className="text-sm text-amber-700">{viewingRequest.ratingComment}</p>
                  )}
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

export default Maintenance
