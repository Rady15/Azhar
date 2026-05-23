import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, X, Image, Loader2, AlertCircle } from 'lucide-react'
import { api } from '../services/api'

interface Advertisement {
  id: string
  title: string
  description: string
  type: string
  image?: string
  link?: string
  target?: 'all' | 'tenants' | 'owners'
  status?: 'active' | 'inactive'
  startDate?: string
  endDate?: string
  views?: number
  createdAt?: string
}

interface AdsProps {
  language: 'AR' | 'EN'
}

const MOCK_ADS: Advertisement[] = [
  {
    id: '1',
    title: 'عرض خاص على الإيجار',
    description: 'خصم 10% على الإيجار السنوي',
    type: 'Offer',
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400',
    target: 'all',
    status: 'active',
    startDate: '2024-01-01',
    endDate: '2024-03-31',
    views: 150,
  },
  {
    id: '2',
    title: 'صيانة مجانية',
    description: 'صيانة مجانية لجميع الوحدات خلال فبراير',
    type: 'Announcement',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400',
    target: 'tenants',
    status: 'active',
    startDate: '2024-02-01',
    endDate: '2024-02-28',
    views: 80,
  },
]

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

  // Map backend announcement to local model
  const mapAnnouncement = (item: any): Advertisement => ({
    id: String(item.id ?? item.announcementId ?? Date.now()),
    title: item.title ?? '',
    description: item.description ?? item.content ?? '',
    type: item.type ?? 'Announcement',
    image: item.image ?? item.imageUrl ?? '',
    target: item.target ?? 'all',
    status: item.isActive === false ? 'inactive' : 'active',
    startDate: item.startDate ?? item.createdAt?.split('T')[0] ?? '',
    endDate: item.endDate ?? '',
    views: item.views ?? item.viewCount ?? 0,
    createdAt: item.createdAt,
  })

  const fetchAds = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.getAnnouncements()
      if (Array.isArray(data) && data.length > 0) {
        setAds(data.map(mapAnnouncement))
      } else {
        setAds(MOCK_ADS)
      }
    } catch (err: any) {
      console.warn('Announcements API failed, falling back to mock data:', err.message)
      setAds(MOCK_ADS)
      setError(language === 'AR'
        ? 'تعذر الاتصال بالخادم — يتم عرض بيانات تجريبية'
        : 'Could not reach server — showing sample data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAds()
  }, [])

  const handleAdd = () => {
    setEditingAd(null)
    setFormData({ title: '', description: '', type: 'Announcement', image: '', target: 'all', status: 'active', startDate: '', endDate: '', views: 0 })
    setImagePreview('')
    setShowModal(true)
  }

  const handleEdit = (ad: Advertisement) => {
    setEditingAd(ad)
    setFormData({ ...ad })
    setImagePreview(ad.image ?? '')
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
      await api.deleteAnnouncement(id)
      setAds(ads.filter(a => a.id !== id))
    } catch (err: any) {
      console.warn('Delete announcement failed:', err.message)
      // Fallback: remove locally even if API fails
      setAds(ads.filter(a => a.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        title: formData.title ?? '',
        description: formData.description ?? '',
        type: formData.type ?? 'Announcement',
      }

      if (editingAd) {
        // No dedicated PUT endpoint for announcements — update locally
        setAds(ads.map(a => a.id === editingAd.id ? { ...a, ...formData } as Advertisement : a))
      } else {
        try {
          const created = await api.createAnnouncement(payload)
          const newAd = mapAnnouncement({ ...payload, ...created })
          setAds([newAd, ...ads])
        } catch (err: any) {
          console.warn('Create announcement failed:', err.message)
          const newAd: Advertisement = { ...formData, id: String(Date.now()) } as Advertisement
          setAds([newAd, ...ads])
        }
      }
      setShowModal(false)
    } finally {
      setSaving(false)
    }
  }

  const handleImageUrlChange = (url: string) => {
    setImagePreview(url)
    setFormData({ ...formData, image: url })
  }

  const getStatusBadge = (status?: string) => {
    const styles: Record<string, string> = { active: 'bg-green-100 text-green-700', inactive: 'bg-slate-100 text-slate-700' }
    const labels: Record<string, string> = { active: language === 'AR' ? 'نشط' : 'Active', inactive: language === 'AR' ? 'غير نشط' : 'Inactive' }
    const s = status ?? 'active'
    return <span className={`px-2 py-1 rounded-full text-xs ${styles[s] ?? styles.active}`}>{labels[s] ?? labels.active}</span>
  }

  const getTargetBadge = (target?: string) => {
    const labels: Record<string, string> = { all: language === 'AR' ? 'الكل' : 'All', tenants: language === 'AR' ? 'المستأجرين' : 'Tenants', owners: language === 'AR' ? 'المالكين' : 'Owners' }
    return labels[target ?? 'all'] ?? (language === 'AR' ? 'الكل' : 'All')
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
            <div className="h-40 bg-slate-100 relative">
              {ad.image
                ? <img src={ad.image} alt={ad.title} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center"><Image className="w-12 h-12 text-slate-300" /></div>}
              <div className="absolute top-2 left-2">{getStatusBadge(ad.status)}</div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-slate-800 mb-1">{ad.title}</h3>
              <p className="text-sm text-slate-500 mb-3">{ad.description}</p>
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full">{ad.type}</span>
                <span>{getTargetBadge(ad.target)}</span>
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
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'النوع' : 'Type'}</label>
                <select value={formData.type || 'Announcement'} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm">
                  <option value="Announcement">{language === 'AR' ? 'إعلان' : 'Announcement'}</option>
                  <option value="Offer">{language === 'AR' ? 'عرض' : 'Offer'}</option>
                  <option value="News">{language === 'AR' ? 'أخبار' : 'News'}</option>
                  <option value="Alert">{language === 'AR' ? 'تنبيه' : 'Alert'}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'رابط الصورة' : 'Image URL'}</label>
                <input type="text" value={formData.image || ''} onChange={e => handleImageUrlChange(e.target.value)} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" placeholder="https://..." />
              </div>
              {imagePreview && <img src={imagePreview} alt="Preview" className="w-full h-32 object-cover rounded-lg" />}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'الجمهور المستهدف' : 'Target'}</label>
                  <select value={formData.target || 'all'} onChange={e => setFormData({ ...formData, target: e.target.value as any })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm">
                    <option value="all">{language === 'AR' ? 'الكل' : 'All'}</option>
                    <option value="tenants">{language === 'AR' ? 'المستأجرين' : 'Tenants'}</option>
                    <option value="owners">{language === 'AR' ? 'المالكين' : 'Owners'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'الحالة' : 'Status'}</label>
                  <select value={formData.status || 'active'} onChange={e => setFormData({ ...formData, status: e.target.value as any })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm">
                    <option value="active">{language === 'AR' ? 'نشط' : 'Active'}</option>
                    <option value="inactive">{language === 'AR' ? 'غير نشط' : 'Inactive'}</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'تاريخ البداية' : 'Start Date'}</label>
                  <input type="date" value={formData.startDate || ''} onChange={e => setFormData({ ...formData, startDate: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'تاريخ النهاية' : 'End Date'}</label>
                  <input type="date" value={formData.endDate || ''} onChange={e => setFormData({ ...formData, endDate: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
                </div>
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
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div><p className="text-slate-400">{language === 'AR' ? 'النوع' : 'Type'}</p><p>{viewingAd.type}</p></div>
              <div><p className="text-slate-400">{language === 'AR' ? 'الجمهور' : 'Target'}</p><p>{getTargetBadge(viewingAd.target)}</p></div>
              {viewingAd.startDate && <div><p className="text-slate-400">{language === 'AR' ? 'البداية' : 'Start'}</p><p>{viewingAd.startDate}</p></div>}
              {viewingAd.endDate && <div><p className="text-slate-400">{language === 'AR' ? 'النهاية' : 'End'}</p><p>{viewingAd.endDate}</p></div>}
            </div>
            {getStatusBadge(viewingAd.status)}
            <button onClick={() => setShowViewModal(false)} className="w-full h-10 mt-4 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200">{language === 'AR' ? 'إغلاق' : 'Close'}</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Ads