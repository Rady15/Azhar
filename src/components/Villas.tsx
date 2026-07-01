import { useState, useRef, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, X, Home, Maximize, Bed, Bath, Upload, Loader2, Building, Hash, Check, Square, Clock, LayoutList, Grid3X3 } from 'lucide-react'
import { api, HouseModel, API_BASE_URL } from '../services/api'

interface Villa {
  id: string | number
  houseNumber: string
  buildingNumber: string
  floorNumber: number
  area?: number
  roomsCount?: number
  bathroomsCount?: number
  hasGarage?: boolean
  hasGarden?: boolean
  notes?: string
  images?: string[]
  createdAt?: string
}

interface VillasProps {
  language: 'AR' | 'EN'
}

function Villas({ language }: VillasProps) {
  const [villas, setVillas] = useState<Villa[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingVilla, setEditingVilla] = useState<Villa | null>(null)
  const [viewingVilla, setViewingVilla] = useState<Villa | null>(null)
  const [formData, setFormData] = useState<Partial<Villa>>({})
  const [imagePreview, setImagePreview] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid')

  const resolveImage = (url: string) =>
    url?.startsWith('http') ? url : `${API_BASE_URL}${url}`

  const mapToFrontend = (item: HouseModel): Villa => ({
    id: item.id || String(Date.now()),
    houseNumber: item.houseNumber || '',
    buildingNumber: item.buildingNumber || '',
    floorNumber: item.floorNumber || 0,
    area: item.area || 0,
    roomsCount: item.roomsCount || 0,
    bathroomsCount: item.bathroomsCount || 0,
    hasGarage: item.hasGarage || false,
    hasGarden: item.hasGarden || false,
    notes: item.notes || '',
    images: (item.imageUrls || item.images || []).map(resolveImage),
    createdAt: item.createdAt || ''
  })

  const mapToBackend = (villa: Partial<Villa>): HouseModel => ({
    houseNumber: villa.houseNumber || '',
    buildingNumber: villa.buildingNumber || '',
    floorNumber: villa.floorNumber ?? 0,
    area: villa.area || 0,
    roomsCount: villa.roomsCount || 0,
    bathroomsCount: villa.bathroomsCount || 0,
    hasGarage: villa.hasGarage || false,
    hasGarden: villa.hasGarden || false,
    notes: villa.notes || '',
    images: villa.images?.length ? villa.images : []
  })

  const buildSavePayload = (villa: Partial<Villa>): Record<string, any> => {
    const base = mapToBackend(villa) as any
    if (imageFile) {
      base.images = [imageFile]
    }
    return base
  }

  const fetchVillas = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.getVillas()
      if (Array.isArray(data)) {
        setVillas(data.map(mapToFrontend))
      } else if (data && Array.isArray((data as any).houses)) {
        setVillas((data as any).houses.map(mapToFrontend))
      }
    } catch (err: any) {
      console.error('Fetch villas error:', err)
      setError(language === 'AR' ? 'فشل تحميل البيانات من الخادم' : 'Failed to fetch houses from server')
      setVillas([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVillas()
  }, [])

  const handleAdd = async () => {
    setEditingVilla(null)
    setFormData({
      houseNumber: '', buildingNumber: '', floorNumber: 0,
      area: 0, roomsCount: 0, bathroomsCount: 0,
      hasGarage: false, hasGarden: false, notes: '', images: []
    })
    setImagePreview('')
    setImageFile(null)
    setShowModal(true)
  }

  const handleEdit = async (villa: Villa) => {
    setEditingVilla(villa)
    setFormData({ ...villa })
    setImagePreview(villa.images?.[0] || '')
    setImageFile(null)
    setShowModal(true)
  }

  const handleView = (villa: Villa) => {
    setViewingVilla(villa)
    setShowViewModal(true)
  }

  const handleDelete = async (id: string | number) => {
    if (window.confirm(language === 'AR' ? 'هل أنت متأكد من الحذف؟' : 'Are you sure you want to delete?')) {
      try {
        const villa = villas.find(v => v.id === id)
        await api.deleteVilla(String(id), villa ? mapToBackend(villa) : {} as HouseModel)
        setVillas(villas.filter(v => v.id !== id))
      } catch (err: any) {
        console.error('Delete villa error:', err)
        alert(language === 'AR' ? `خطأ: ${err.message}` : `Error: ${err.message}`)
      }
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = buildSavePayload(formData)
      if (editingVilla) {
        await api.updateVilla(String(editingVilla.id), payload as any)
        setVillas(villas.map(v => v.id === editingVilla.id ? { ...v, ...formData } as Villa : v))
      } else {
        const newVillaBackend = await api.createVilla(payload as any)
        const newVilla = mapToFrontend(newVillaBackend)
        setVillas([...villas, newVilla])
      }
      setShowModal(false)
    } catch (err: any) {
      console.error('Save villa error:', err)
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
      setFormData({ ...formData, images: [] })
    }
  }

  const handleImageUrlChange = (url: string) => {
    setImagePreview(url)
    setImageFile(null)
    setFormData({ ...formData, images: url ? [url] : [] })
  }

  const t = (ar: string, en: string) => language === 'AR' ? ar : en

  return (
    <div className="bg-white rounded-2xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">{t('المنازل', 'Houses')}</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 ml-2 border border-slate-200 rounded-lg p-0.5">
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-primary-100 text-primary-700' : 'text-slate-400 hover:text-slate-600'}`} title={t('عرض كقائمة', 'List view')}><LayoutList className="w-4 h-4" /></button>
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-primary-100 text-primary-700' : 'text-slate-400 hover:text-slate-600'}`} title={t('عرض كبطاقات', 'Grid view')}><Grid3X3 className="w-4 h-4" /></button>
          </div>
          <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors">
            <Plus className="w-4 h-4" />
            {t('إضافة منزل', 'Add House')}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={fetchVillas} className="underline text-xs hover:text-red-900">{t('إعادة المحاولة', 'Retry')}</button>
        </div>
      )}

      {loading && villas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin mb-2" />
          <p className="text-slate-500 text-sm">{t('جاري تحميل البيانات...', 'Loading houses...')}</p>
        </div>
      ) : villas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <Home className="w-12 h-12 mb-2" />
          <p>{t('لا توجد منازل مسجلة', 'No houses registered')}</p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('رقم المنزل', 'House No.')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('المبنى', 'Building')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('الدور', 'Floor')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('المساحة', 'Area')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('غرف', 'Rooms')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('حمامات', 'Baths')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('الإجراءات', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {villas.map(villa => (
                <tr key={villa.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 text-slate-700 font-medium">{villa.houseNumber}</td>
                  <td className="py-3 px-4 text-slate-600">{villa.buildingNumber}</td>
                  <td className="py-3 px-4 text-slate-600">{villa.floorNumber}</td>
                  <td className="py-3 px-4 text-slate-600">{villa.area} m²</td>
                  <td className="py-3 px-4 text-slate-600">{villa.roomsCount}</td>
                  <td className="py-3 px-4 text-slate-600">{villa.bathroomsCount}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleView(villa)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => handleEdit(villa)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(villa.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {villas.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400">{t('لا توجد منازل مسجلة', 'No houses registered')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {villas.map(villa => (
            <div key={villa.id} className="border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-48 bg-slate-100 relative">
                {villa.images?.[0] ? (
                  <img src={villa.images[0]} alt={`House ${villa.houseNumber}`} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Home className="w-12 h-12 text-slate-300" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-slate-800 mb-2">{t('منزل', 'House')} {villa.houseNumber}</h3>
                  <div className="space-y-1 text-sm text-slate-500 mb-3">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      <span>{t('مبنى', 'Bldg')} {villa.buildingNumber} - {t('دور', 'Floor')} {villa.floorNumber}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Maximize className="w-4 h-4" />
                      <span>{villa.area} {t('م²', 'm²')}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1"><Bed className="w-4 h-4" /> {villa.roomsCount}</span>
                      <span className="flex items-center gap-1"><Bath className="w-4 h-4" /> {villa.bathroomsCount}</span>
                    </div>
                  </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    <button onClick={() => handleView(villa)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleEdit(villa)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(villa.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
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
                {editingVilla ? t('تعديل منزل', 'Edit House') : t('إضافة منزل', 'Add House')}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('رقم المنزل', 'House Number')} *</label>
                  <input type="text" value={formData.houseNumber || ''} onChange={e => setFormData({ ...formData, houseNumber: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('رقم المبنى', 'Building Number')} *</label>
                  <input type="text" value={formData.buildingNumber || ''} onChange={e => setFormData({ ...formData, buildingNumber: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('الدور', 'Floor Number')} *</label>
                  <input type="number" value={formData.floorNumber ?? ''} onChange={e => setFormData({ ...formData, floorNumber: Number(e.target.value) })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('المساحة', 'Area')}</label>
                  <input type="number" value={formData.area || ''} onChange={e => setFormData({ ...formData, area: Number(e.target.value) })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('غرف النوم', 'Rooms')}</label>
                  <input type="number" value={formData.roomsCount || ''} onChange={e => setFormData({ ...formData, roomsCount: Number(e.target.value) })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('الحمامات', 'Bathrooms')}</label>
                  <input type="number" value={formData.bathroomsCount || ''} onChange={e => setFormData({ ...formData, bathroomsCount: Number(e.target.value) })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('الملاحظات', 'Notes')}</label>
                  <input type="text" value={formData.notes || ''} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                  <input type="checkbox" checked={formData.hasGarage || false} onChange={e => setFormData({ ...formData, hasGarage: e.target.checked })} className="rounded" />
                  <Square className="w-4 h-4 text-slate-500" />
                  <span className="text-sm">{t('جراج', 'Garage')}</span>
                </label>
                <label className="flex items-center gap-2 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                  <input type="checkbox" checked={formData.hasGarden || false} onChange={e => setFormData({ ...formData, hasGarden: e.target.checked })} className="rounded" />
                  <Square className="w-4 h-4 text-slate-500" />
                  <span className="text-sm">{t('حديقة', 'Garden')}</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('الصورة', 'Image')}</label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4">
                  {imagePreview ? (
                    <div className="relative mb-3">
                      <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
                      <button onClick={() => { setImagePreview(''); setImageFile(null); setFormData({ ...formData, images: [] }) }} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : null}
                  <div className="flex gap-3">
                    <button onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 py-2 border border-slate-200 rounded-lg hover:bg-slate-50">
                      <Upload className="w-4 h-4" />
                      {t('رفع صورة', 'Upload')}
                    </button>
                    <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageUpload} className="hidden" />
                    <input type="text" placeholder={t('أو رابط الصورة', 'Or image URL')} onChange={e => handleImageUrlChange(e.target.value)} className="flex-1 h-10 px-3 border border-slate-200 rounded-lg text-sm" />
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

      {showViewModal && viewingVilla && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">{t('منزل', 'House')} {viewingVilla.houseNumber}</h3>
              <button onClick={() => setShowViewModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            {viewingVilla.images?.[0] && (
              <img src={viewingVilla.images[0]} alt={`House ${viewingVilla.houseNumber}`} className="w-full h-48 object-cover rounded-xl mb-4" />
            )}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-slate-400" />
                <span>{t('مبنى', 'Bldg')} {viewingVilla.buildingNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-slate-400" />
                <span>{t('دور', 'Floor')} {viewingVilla.floorNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <Maximize className="w-4 h-4 text-slate-400" />
                <span>{viewingVilla.area} {t('م²', 'm²')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Bed className="w-4 h-4 text-slate-400" />
                <span>{viewingVilla.roomsCount} {t('غرف', 'rooms')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Bath className="w-4 h-4 text-slate-400" />
                <span>{viewingVilla.bathroomsCount} {t('حمامات', 'baths')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-slate-400" />
                <span>{t('جراج', 'Garage')}: {viewingVilla.hasGarage ? t('نعم', 'Yes') : t('لا', 'No')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-slate-400" />
                <span>{t('حديقة', 'Garden')}: {viewingVilla.hasGarden ? t('نعم', 'Yes') : t('لا', 'No')}</span>
              </div>
            </div>
            {viewingVilla.notes && (
              <p className="mt-3 p-3 bg-slate-50 rounded-lg text-sm text-slate-600">{viewingVilla.notes}</p>
            )}
            {viewingVilla.createdAt && (
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                <Clock className="w-3 h-3" />
                <span>{t('تم الإنشاء', 'Created')}: {new Date(viewingVilla.createdAt).toLocaleDateString()}</span>
              </div>
            )}
            <button onClick={() => setShowViewModal(false)} className="w-full h-10 mt-4 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200">
              {t('إغلاق', 'Close')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Villas
