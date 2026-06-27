import { useState, useEffect, useRef } from 'react'
import { Plus, Edit, Trash2, Eye, X, Image, Upload, Loader2, AlertCircle } from 'lucide-react'
import { api, API_BASE_URL } from '../services/api'

interface Advertisement {
  id: string
  title: string
  description: string
  image?: string
  date?: string
  createdAt?: string
}

interface AdsProps {
  language: 'AR' | 'EN'
}

function Ads({ language }: AdsProps) {
  const [ads, setAds] = useState<Advertisement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null)
  const [viewingAd, setViewingAd] = useState<Advertisement | null>(null)
  const [formData, setFormData] = useState<Partial<Advertisement>>({})
  const [imagePreview, setImagePreview] = useState('')
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resolveImage = (item: any): string => {
    const raw = item.imageUrls?.[0] ?? item.imageUrl ?? (Array.isArray(item.images) ? item.images[0] : '') ?? item.image ?? ''
    if (raw && raw.startsWith('/')) return API_BASE_URL + raw
    return raw
  }

  const mapAnnouncement = (item: any): Advertisement => ({
    id: String(item.id ?? item.announcementId ?? Date.now()),
    title: item.title ?? '',
    description: item.description ?? item.content ?? '',
    image: resolveImage(item),
    date: item.announcementDate?.split('T')[0] ?? item.createdAt?.split('T')[0] ?? '',
    createdAt: item.createdAt,
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
      setError(language === 'AR'
        ? 'تعذر تحميل الإعلانات من الخادم'
        : 'Failed to load announcements from server')
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
    setFormData({ title: '', description: '', date: new Date().toISOString().split('T')[0] })
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
    setDeleting(id)
    try {
      const ad = ads.find(a => a.id === id)
      await api.deleteAnnouncement(id, ad ? {
        title: ad.title,
        description: ad.description,
        announcementDate: ad.date ? new Date(ad.date).toISOString() : new Date().toISOString(),
      } : undefined)
      setAds(ads.filter(a => a.id !== id))
    } catch (err: any) {
      console.error('Delete announcement error:', err)
      alert(language === 'AR' ? `خطأ: ${err.message}` : `Error: ${err.message}`)
    } finally {
      setDeleting(null)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload: Record<string, any> = {
        title: formData.title ?? '',
        description: formData.description ?? '',
        announcementDate: formData.date ? new Date(formData.date).toISOString() : new Date().toISOString(),
      }
      if (imageFiles.length > 0) {
        payload.images = imageFiles
      }

      if (editingAd) {
        await api.updateAnnouncement(editingAd.id, payload)
        setAds(ads.map(a => a.id === editingAd.id ? { ...a, ...formData } as Advertisement : a))
        setShowModal(false)
      } else {
        const created = await api.createAnnouncement(payload)
        const newAd = mapAnnouncement({ ...payload, ...created })
        setAds([newAd, ...ads])
        setShowModal(false)
      }
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

  const clearImage = () => {
    setImagePreview('')
    setImageFiles([])
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          <p className="text-sm text-slate-500">{language === 'AR' ? 'جارٍ تحميل الإعلانات...' : 'Loading announcements...'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-slate-800">{language === 'AR' ? 'الإعلانات' : 'Advertisements'}</h2>
        <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors">
          <Plus className="w-4 h-4" />{language === 'AR' ? 'إضافة إعلان' : 'Add Ad'}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ads.map(ad => (
          <div key={ad.id} className="border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-40 bg-slate-100">
              {ad.image
                ? <img src={ad.image} alt={ad.title} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center"><Image className="w-12 h-12 text-slate-300" /></div>}
            </div>
              <div className="p-4">
              <h3 className="font-bold text-slate-800 mb-1">{ad.title}</h3>
              <p className="text-sm text-slate-500 mb-3 line-clamp-2">{ad.description}</p>
              <div className="flex items-center text-xs text-slate-400">
                {ad.date && <span>{ad.date}</span>}
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => handleView(ad)} className="flex-1 py-2 text-blue-600 hover:bg-blue-50 rounded-lg text-sm"><Eye className="w-4 h-4 inline ml-1" />{language === 'AR' ? 'عرض' : 'View'}</button>
                <button onClick={() => handleEdit(ad)} className="flex-1 py-2 text-amber-600 hover:bg-amber-50 rounded-lg text-sm"><Edit className="w-4 h-4 inline ml-1" />{language === 'AR' ? 'تعديل' : 'Edit'}</button>
                <button
                  onClick={() => handleDelete(ad.id)}
                  disabled={deleting === ad.id}
                  className="flex-1 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm disabled:opacity-50"
                >
                  {deleting === ad.id ? <Loader2 className="w-4 h-4 inline ml-1 animate-spin" /> : <Trash2 className="w-4 h-4 inline ml-1" />}
                  {language === 'AR' ? 'حذف' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        ))}

        {ads.length === 0 && (
          <div className="col-span-2 text-center py-16 text-slate-400">
            <Image className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>{language === 'AR' ? 'لا توجد إعلانات بعد' : 'No announcements yet'}</p>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">{editingAd ? (language === 'AR' ? 'تعديل إعلان' : 'Edit Ad') : (language === 'AR' ? 'إضافة إعلان' : 'Add Ad')}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'العنوان' : 'Title'}</label>
                <input type="text" value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'الوصف' : 'Description'}</label>
                <textarea value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'التاريخ' : 'Date'}</label>
                <input type="date" value={formData.date || ''} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'الصور' : 'Images'}</label>
                <div className="flex items-center gap-2">
                  <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50">
                    <Upload className="w-4 h-4" />{language === 'AR' ? 'اختر صوراً' : 'Choose Images'}
                  </button>
                  {imageFiles.length > 0 && <span className="text-sm text-slate-500">{imageFiles.length} {language === 'AR' ? 'صور' : 'image(s)'}</span>}
                </div>
                {imagePreview && (
                  <div className="relative mt-2 inline-block">
                    <img src={imagePreview} alt="Preview" className="h-32 rounded-lg object-cover" />
                    <button type="button" onClick={clearImage} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"><X className="w-4 h-4" /></button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} disabled={saving} className="flex-1 h-10 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {language === 'AR' ? 'حفظ' : 'Save'}
              </button>
              <button onClick={() => setShowModal(false)} className="flex-1 h-10 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200">{language === 'AR' ? 'إلغاء' : 'Cancel'}</button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewingAd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">{viewingAd.title}</h3>
              <button onClick={() => setShowViewModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            {viewingAd.image && <img src={viewingAd.image} alt={viewingAd.title} className="w-full h-40 object-cover rounded-xl mb-4" />}
            <p className="text-sm text-slate-600 mb-4">{viewingAd.description}</p>
            {viewingAd.date && <p className="text-xs text-slate-400 mb-4">{viewingAd.date}</p>}
            <button onClick={() => setShowViewModal(false)} className="w-full h-10 mt-4 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200">{language === 'AR' ? 'إغلاق' : 'Close'}</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Ads