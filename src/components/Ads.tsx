import { useState, useEffect, useRef } from 'react'
import { Plus, Edit, Trash2, Eye, X, Image, Upload, Loader2, Calendar, Clock, LayoutList, Grid3X3 } from 'lucide-react'
import { api, API_BASE_URL } from '../services/api'

interface Advertisement {
  id: string
  title: string
  description: string
  image: string
  imageUrls: string[]
  date?: string
  createdAt?: string
  isActive: boolean
}

interface AdsProps {
  language: 'AR' | 'EN'
}

function Ads({ language }: AdsProps) {
  const [ads, setAds] = useState<Advertisement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null)
  const [viewingAd, setViewingAd] = useState<Advertisement | null>(null)
  const [formData, setFormData] = useState<Partial<Advertisement>>({})
  const [imagePreview, setImagePreview] = useState('')
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid')

  const resolveImageUrl = (item: any): string => {
    const urls = item.imageUrls ?? item.images ?? []
    const raw = Array.isArray(urls) ? urls[0] : (item.imageUrl ?? item.image ?? '')
    if (raw && typeof raw === 'string' && raw.startsWith('/')) return API_BASE_URL + raw
    return raw || ''
  }

  const resolveImageUrls = (item: any): string[] => {
    const urls = item.imageUrls ?? item.images ?? []
    if (Array.isArray(urls)) return urls.map((u: string) => u?.startsWith('http') ? u : `${API_BASE_URL}${u}`)
    const single = item.imageUrl ?? item.image ?? ''
    return single ? [single?.startsWith('http') ? single : `${API_BASE_URL}${single}`] : []
  }

  const mapAnnouncement = (item: any): Advertisement => ({
    id: String(item.id ?? item.announcementId ?? Date.now()),
    title: item.title ?? '',
    description: item.description ?? item.content ?? '',
    image: resolveImageUrl(item),
    imageUrls: resolveImageUrls(item),
    date: item.announcementDate?.split('T')[0] ?? item.createdAt?.split('T')[0] ?? '',
    createdAt: item.createdAt,
    isActive: item.isActive !== false
  })

  const fetchAds = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.getAnnouncements()
      if (Array.isArray(data)) {
        setAds(data.map(mapAnnouncement))
      } else {
        setAds([])
      }
    } catch (err: any) {
      console.error('Announcements API error:', err)
      setError(language === 'AR' ? 'تعذر تحميل الإعلانات من الخادم' : 'Failed to load announcements from server')
      setAds([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAds()
  }, [])

  const handleAdd = () => {
    setEditingAd(null)
    setFormData({ title: '', description: '', date: new Date().toISOString().split('T')[0], isActive: true })
    setImagePreview('')
    setImageFiles([])
    setShowModal(true)
  }

  const handleEdit = (ad: Advertisement) => {
    setEditingAd(ad)
    setFormData({ ...ad })
    setImagePreview(ad.image ?? '')
    setImageFiles([])
    setShowModal(true)
  }

  const handleView = (ad: Advertisement) => {
    setViewingAd(ad)
    setShowViewModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm(language === 'AR' ? 'هل أنت متأكد من الحذف؟' : 'Are you sure you want to delete?')) return
    try {
      await api.deleteAnnouncement(id)
      setAds(ads.filter(a => a.id !== id))
    } catch (err: any) {
      console.error('Delete announcement error:', err)
      alert(language === 'AR' ? `خطأ: ${err.message}` : `Error: ${err.message}`)
    }
  }

  const handleToggleActive = async (ad: Advertisement) => {
    try {
      const payload: Record<string, any> = {
        title: ad.title,
        description: ad.description,
        announcementDate: ad.date ? new Date(ad.date).toISOString() : new Date().toISOString(),
        isActive: !ad.isActive
      }
      await api.updateAnnouncement(ad.id, payload)
      setAds(ads.map(a => a.id === ad.id ? { ...a, isActive: !a.isActive } : a))
    } catch (err: any) {
      console.error('Toggle active error:', err)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload: Record<string, any> = {
        title: formData.title ?? '',
        description: formData.description ?? '',
        announcementDate: formData.date ? new Date(formData.date).toISOString() : new Date().toISOString(),
        isActive: formData.isActive !== false
      }
      if (imageFiles.length > 0) {
        payload.images = imageFiles
      }

      if (editingAd) {
        await api.updateAnnouncement(editingAd.id, payload)
        setAds(ads.map(a => a.id === editingAd.id ? { ...a, ...formData } as Advertisement : a))
      } else {
        const created = await api.createAnnouncement(payload)
        const newAd = mapAnnouncement({ ...payload, ...created })
        setAds([newAd, ...ads])
      }
      setShowModal(false)
    } catch (err: any) {
      console.error('Save announcement error:', err)
      alert(language === 'AR' ? `خطأ: ${err.message}` : `Error: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      setImagePreview(URL.createObjectURL(files[0]))
      setImageFiles(Array.from(files))
    }
  }

  const t = (ar: string, en: string) => language === 'AR' ? ar : en

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          <p className="text-sm text-slate-500">{t('جارٍ تحميل الإعلانات...', 'Loading announcements...')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-slate-800">{t('الإعلانات', 'Announcements')}</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-0.5">
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-primary-100 text-primary-700' : 'text-slate-400 hover:text-slate-600'}`} title={t('عرض كقائمة', 'List view')}><LayoutList className="w-4 h-4" /></button>
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-primary-100 text-primary-700' : 'text-slate-400 hover:text-slate-600'}`} title={t('عرض كبطاقات', 'Grid view')}><Grid3X3 className="w-4 h-4" /></button>
          </div>
          <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors">
            <Plus className="w-4 h-4" />{t('إضافة إعلان', 'Add Announcement')}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={fetchAds} className="underline text-xs hover:text-red-900">{t('إعادة المحاولة', 'Retry')}</button>
        </div>
      )}

      {viewMode === 'list' ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('العنوان', 'Title')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('التاريخ', 'Date')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('الحالة', 'Status')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('تم الإنشاء', 'Created')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('الإجراءات', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {ads.map(ad => (
                <tr key={ad.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {ad.image && <img src={ad.image} alt="" className="w-8 h-8 rounded object-cover" />}
                      <span className="text-slate-700 font-medium">{ad.title}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 text-xs">{ad.date || '-'}</td>
                  <td className="py-3 px-4">
                    <button onClick={() => handleToggleActive(ad)} className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ad.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                      {ad.isActive ? t('نشط', 'Active') : t('غير نشط', 'Inactive')}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-xs">{ad.createdAt ? new Date(ad.createdAt).toLocaleDateString() : '-'}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleView(ad)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => handleEdit(ad)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(ad.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {ads.length === 0 && (
                <tr><td colSpan={5} className="text-center py-12 text-slate-400">{t('لا توجد إعلانات بعد', 'No announcements yet')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ads.map(ad => (
            <div key={ad.id} className={`border rounded-xl overflow-hidden hover:shadow-lg transition-shadow ${ad.isActive ? 'border-slate-200' : 'border-slate-200 opacity-70'}`}>
              <div className="h-40 bg-slate-100 relative">
                {ad.image
                  ? <img src={ad.image} alt={ad.title} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><Image className="w-12 h-12 text-slate-300" /></div>}
                {!ad.isActive && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-slate-800/70 text-white text-xs rounded-full">{t('غير نشط', 'Inactive')}</span>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-slate-800 mb-1">{ad.title}</h3>
                <p className="text-sm text-slate-500 mb-3 line-clamp-2">{ad.description}</p>
                <div className="flex items-center gap-3 text-xs text-slate-400 mb-2">
                  {ad.date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{ad.date}</span>}
                  {ad.createdAt && (
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(ad.createdAt).toLocaleDateString()}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleToggleActive(ad)} className={`px-2.5 py-1 rounded-full text-xs font-semibold ${ad.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    {ad.isActive ? t('نشط', 'Active') : t('غير نشط', 'Inactive')}
                  </button>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => handleView(ad)} className="flex-1 py-2 text-blue-600 hover:bg-blue-50 rounded-lg text-sm flex items-center justify-center gap-1">
                    <Eye className="w-4 h-4" />{t('عرض', 'View')}
                  </button>
                  <button onClick={() => handleEdit(ad)} className="flex-1 py-2 text-amber-600 hover:bg-amber-50 rounded-lg text-sm flex items-center justify-center gap-1">
                    <Edit className="w-4 h-4" />{t('تعديل', 'Edit')}
                  </button>
                  <button onClick={() => handleDelete(ad.id)} className="flex-1 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm flex items-center justify-center gap-1">
                    <Trash2 className="w-4 h-4" />{t('حذف', 'Delete')}
                  </button>
                </div>
              </div>
            </div>
          ))}
          {ads.length === 0 && (
            <div className="col-span-2 text-center py-16 text-slate-400">
              <Image className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>{t('لا توجد إعلانات بعد', 'No announcements yet')}</p>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">{editingAd ? t('تعديل إعلان', 'Edit Announcement') : t('إضافة إعلان', 'Add Announcement')}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('العنوان', 'Title')}</label>
                <input type="text" value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('الوصف', 'Description')}</label>
                <textarea value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('التاريخ', 'Date')}</label>
                <input type="date" value={formData.date || ''} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('الحالة', 'Status')}</label>
                <select value={formData.isActive ? 'true' : 'false'} onChange={e => setFormData({ ...formData, isActive: e.target.value === 'true' })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm">
                  <option value="true">{t('نشط', 'Active')}</option>
                  <option value="false">{t('غير نشط', 'Inactive')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('الصور', 'Images')}</label>
                <div className="flex items-center gap-2">
                  <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50">
                    <Upload className="w-4 h-4" />{t('اختر صوراً', 'Choose Images')}
                  </button>
                  {imageFiles.length > 0 && <span className="text-sm text-slate-500">{imageFiles.length} {t('صور', 'image(s)')}</span>}
                </div>
                {imagePreview && (
                  <div className="relative mt-2 inline-block">
                    <img src={imagePreview} alt="Preview" className="h-32 rounded-lg object-cover" />
                    <button type="button" onClick={() => { setImagePreview(''); setImageFiles([]) }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"><X className="w-4 h-4" /></button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} disabled={saving} className="flex-1 h-10 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {t('حفظ', 'Save')}
              </button>
              <button onClick={() => setShowModal(false)} className="flex-1 h-10 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200">{t('إلغاء', 'Cancel')}</button>
            </div>
          </div>
        </div>
      )}

      {showViewModal && viewingAd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">{viewingAd.title}</h3>
              <button onClick={() => setShowViewModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            {viewingAd.image && <img src={viewingAd.image} alt={viewingAd.title} className="w-full h-48 object-cover rounded-xl mb-4" />}
            <p className="text-sm text-slate-600 mb-4">{viewingAd.description}</p>
            <div className="flex items-center gap-4 text-xs text-slate-400 mb-2">
              {viewingAd.date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{viewingAd.date}</span>}
              {viewingAd.createdAt && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(viewingAd.createdAt).toLocaleDateString()}</span>}
            </div>
            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${viewingAd.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
              {viewingAd.isActive ? t('نشط', 'Active') : t('غير نشط', 'Inactive')}
            </span>
            <button onClick={() => setShowViewModal(false)} className="w-full h-10 mt-4 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200">{t('إغلاق', 'Close')}</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Ads
