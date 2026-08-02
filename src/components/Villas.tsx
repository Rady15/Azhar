import { useState, useRef, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, X, Home, Maximize, Bed, Bath, Upload, Loader2, Building, Hash, Check, Square, Clock, LayoutList, Grid3X3, User } from 'lucide-react'
import { api, HouseModel, API_BASE_URL } from '../services/api'
import { useToast } from './Toast'

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
  hasCentralAirConditioning?: boolean
  isFurnished?: boolean
  hasInstalledKitchen?: boolean
  contractNumber?: string
  contractStartDate?: string
  contractEndDate?: string
  notes?: string
  images?: string[]
  userId?: string
  userDisplayName?: string
  userEmail?: string
  createdAt?: string
}

interface VillasProps {
  language: 'AR' | 'EN'
}

function Villas({ language }: VillasProps) {
  const { showToast } = useToast()
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
    hasCentralAirConditioning: item.hasCentralAirConditioning || false,
    isFurnished: item.isFurnished || false,
    hasInstalledKitchen: item.hasInstalledKitchen || false,
    contractNumber: item.contractNumber || '',
    contractStartDate: item.contractStartDate || '',
    contractEndDate: item.contractEndDate || '',
    notes: item.notes || '',
    images: (item.imageUrls || item.images || []).map(resolveImage),
    userId: item.userId || '',
    userDisplayName: item.userDisplayName || '',
    userEmail: item.userEmail || '',
    createdAt: item.createdAt || ''
  })

  const buildSavePayload = (villa: Partial<Villa>): Record<string, any> => {
    const base: Record<string, any> = {
      houseNumber: villa.houseNumber || '',
      buildingNumber: villa.buildingNumber || '',
      floorNumber: villa.floorNumber ?? 0,
      area: villa.area || 0,
      roomsCount: villa.roomsCount || 0,
      bathroomsCount: villa.bathroomsCount || 0,
      hasGarage: villa.hasGarage || false,
      hasGarden: villa.hasGarden || false,
      hasCentralAirConditioning: villa.hasCentralAirConditioning || false,
      isFurnished: villa.isFurnished || false,
      hasInstalledKitchen: villa.hasInstalledKitchen || false,
      contractNumber: villa.contractNumber || '',
      contractStartDate: villa.contractStartDate || '',
      contractEndDate: villa.contractEndDate || '',
      notes: villa.notes || ''
    }
    if (imageFile) {
      base.Images = [imageFile]
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
      hasGarage: false, hasGarden: false,
      hasCentralAirConditioning: false, isFurnished: false, hasInstalledKitchen: false,
      contractNumber: '', contractStartDate: '', contractEndDate: '',
      notes: '', images: []
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
        await api.deleteVilla(String(id))
        setVillas(villas.filter(v => v.id !== id))
        showToast('success', language === 'AR' ? 'تم حذف الفيلا بنجاح' : 'Villa deleted successfully')
      } catch (err: any) {
        console.error('Delete villa error:', err)
        showToast('error', language === 'AR' ? `تعذر حذف الفيلا: ${err.message}` : `Could not delete villa: ${err.message}`)
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
      showToast('success', language === 'AR' ? 'تم حفظ الفيلا بنجاح' : 'Villa saved successfully')
    } catch (err: any) {
      console.error('Save villa error:', err)
      showToast('error', language === 'AR' ? `تعذر حفظ الفيلا: ${err.message}` : `Could not save villa: ${err.message}`)
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
        <h2 className="text-xl font-bold text-slate-800">{t('الفلل', 'Villas')}</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 ml-2 border border-slate-200 rounded-lg p-0.5">
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-primary-100 text-primary-700' : 'text-slate-400 hover:text-slate-600'}`} title={t('عرض كقائمة', 'List view')}><LayoutList className="w-4 h-4" /></button>
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-primary-100 text-primary-700' : 'text-slate-400 hover:text-slate-600'}`} title={t('عرض كبطاقات', 'Grid view')}><Grid3X3 className="w-4 h-4" /></button>
          </div>
          <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors">
            <Plus className="w-4 h-4" />
            {t('إضافة فيلا', 'Add Villa')}
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
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('رقم الفيلا', 'Villa No.')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('المبنى', 'Building')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('الدور', 'Floor')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('المساحة', 'Area')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('غرف', 'Rooms')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('حمامات', 'Baths')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('الحالة', 'Status')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('عقد', 'Contract')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('المستأجر', 'Tenant')}</th>
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
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      villa.userId ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${villa.userId ? 'bg-blue-500' : 'bg-green-500'}`} />
                      {villa.userId ? t('مشغولة', 'Occupied') : t('متاحة', 'Available')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 text-xs">{villa.contractNumber || '—'}</td>
                  <td className="py-3 px-4 text-slate-600 text-xs">{villa.userDisplayName || '—'}</td>
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
                <tr><td colSpan={10} className="text-center py-12 text-slate-400">{t('لا توجد منازل مسجلة', 'No houses registered')}</td></tr>
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
                  <img src={villa.images[0]} alt={`Villa ${villa.houseNumber}`} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Home className="w-12 h-12 text-slate-300" />
                  </div>
                )}
                <span className={`absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold shadow-sm ${
                  villa.userId ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${villa.userId ? 'bg-white' : 'bg-white'}`} />
                  {villa.userId ? t('مشغولة', 'Occupied') : t('متاحة', 'Available')}
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-slate-800">{t('فيلا', 'Villa')} {villa.houseNumber}</h3>
                </div>
                {villa.userDisplayName && (
                  <p className="text-xs text-slate-400 mb-2 flex items-center gap-1">
                    <User className="w-3 h-3" /> {villa.userDisplayName}
                  </p>
                )}
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
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {villa.hasGarage && <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{t('جراج', 'Garage')}</span>}
                      {villa.hasGarden && <span className="text-[10px] px-2 py-0.5 bg-green-50 text-green-700 rounded-full">{t('حديقة', 'Garden')}</span>}
                      {villa.hasCentralAirConditioning && <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">{t('تكييف', 'AC')}</span>}
                      {villa.isFurnished && <span className="text-[10px] px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full">{t('مفروش', 'Furnished')}</span>}
                      {villa.hasInstalledKitchen && <span className="text-[10px] px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full">{t('مطبخ', 'Kitchen')}</span>}
                    </div>
                  </div>
                <div className="flex items-center justify-between mt-2">
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
                {editingVilla ? t('تعديل فيلا', 'Edit Villa') : t('إضافة فيلا', 'Add Villa')}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('رقم الفيلا', 'Villa Number')} *</label>
                  <input type="text" value={formData.houseNumber || ''} onChange={e => setFormData({ ...formData, houseNumber: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('رقم المبنى', 'Building Number')} *</label>
                  <input type="text" value={formData.buildingNumber || ''} onChange={e => setFormData({ ...formData, buildingNumber: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('الدور', 'Floor Number')} *</label>
                  <input type="number" value={formData.floorNumber ?? ''} onChange={e => setFormData({ ...formData, floorNumber: Number(e.target.value) })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('المساحة', 'Area')}</label>
                  <input type="number" value={formData.area || ''} onChange={e => setFormData({ ...formData, area: Number(e.target.value) })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('غرف النوم', 'Rooms')}</label>
                  <input type="number" value={formData.roomsCount || ''} onChange={e => setFormData({ ...formData, roomsCount: Number(e.target.value) })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('الحمامات', 'Bathrooms')}</label>
                  <input type="number" value={formData.bathroomsCount || ''} onChange={e => setFormData({ ...formData, bathroomsCount: Number(e.target.value) })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('عقد رقم', 'Contract #')}</label>
                  <input type="text" value={formData.contractNumber || ''} onChange={e => setFormData({ ...formData, contractNumber: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('بداية العقد', 'Contract Start')}</label>
                  <input type="date" value={formData.contractStartDate ? formData.contractStartDate.slice(0,10) : ''} onChange={e => setFormData({ ...formData, contractStartDate: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('نهاية العقد', 'Contract End')}</label>
                  <input type="date" value={formData.contractEndDate ? formData.contractEndDate.slice(0,10) : ''} onChange={e => setFormData({ ...formData, contractEndDate: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
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
              <div className="grid grid-cols-3 gap-4">
                <label className="flex items-center gap-2 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                  <input type="checkbox" checked={formData.hasCentralAirConditioning || false} onChange={e => setFormData({ ...formData, hasCentralAirConditioning: e.target.checked })} className="rounded" />
                  <Square className="w-4 h-4 text-slate-500" />
                  <span className="text-sm">{t('تكييف مركزي', 'Central AC')}</span>
                </label>
                <label className="flex items-center gap-2 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                  <input type="checkbox" checked={formData.isFurnished || false} onChange={e => setFormData({ ...formData, isFurnished: e.target.checked })} className="rounded" />
                  <Square className="w-4 h-4 text-slate-500" />
                  <span className="text-sm">{t('مفروش', 'Furnished')}</span>
                </label>
                <label className="flex items-center gap-2 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                  <input type="checkbox" checked={formData.hasInstalledKitchen || false} onChange={e => setFormData({ ...formData, hasInstalledKitchen: e.target.checked })} className="rounded" />
                  <Square className="w-4 h-4 text-slate-500" />
                  <span className="text-sm">{t('مطبخ راكب', 'Kitchen')}</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('الملاحظات', 'Notes')}</label>
                <textarea rows={2} value={formData.notes || ''} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              </div>
              {editingVilla && (formData.userDisplayName || formData.userEmail) && (
                <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-xl">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">{t('المستأجر', 'Tenant')}</label>
                    <p className="text-sm font-medium text-slate-800">{formData.userDisplayName}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">{t('البريد', 'Email')}</label>
                    <p className="text-sm text-slate-600">{formData.userEmail}</p>
                  </div>
                </div>
              )}
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
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">{t('فيلا', 'Villa')} {viewingVilla.houseNumber}</h3>
              <button onClick={() => setShowViewModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            {viewingVilla.images?.[0] && (
              <img src={viewingVilla.images[0]} alt={`House ${viewingVilla.houseNumber}`} className="w-full h-48 object-cover rounded-xl mb-4" />
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{t('مبنى', 'Bldg')} {viewingVilla.buildingNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{t('دور', 'Floor')} {viewingVilla.floorNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <Maximize className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{viewingVilla.area} {t('م²', 'm²')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Bed className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{viewingVilla.roomsCount} {t('غرف', 'rooms')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Bath className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{viewingVilla.bathroomsCount} {t('حمامات', 'baths')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{t('جراج', 'Garage')}: {viewingVilla.hasGarage ? t('نعم', 'Yes') : t('لا', 'No')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{t('حديقة', 'Garden')}: {viewingVilla.hasGarden ? t('نعم', 'Yes') : t('لا', 'No')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{t('تكييف مركزي', 'Central AC')}: {viewingVilla.hasCentralAirConditioning ? t('نعم', 'Yes') : t('لا', 'No')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{t('مفروش', 'Furnished')}: {viewingVilla.isFurnished ? t('نعم', 'Yes') : t('لا', 'No')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{t('مطبخ راكب', 'Kitchen')}: {viewingVilla.hasInstalledKitchen ? t('نعم', 'Yes') : t('لا', 'No')}</span>
              </div>
              {viewingVilla.contractNumber && (
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{t('عقد', 'Contract')}: {viewingVilla.contractNumber}</span>
                </div>
              )}
              {viewingVilla.contractStartDate && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{t('بداية العقد', 'Start')}: {new Date(viewingVilla.contractStartDate).toLocaleDateString()}</span>
                </div>
              )}
              {viewingVilla.contractEndDate && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{t('نهاية العقد', 'End')}: {new Date(viewingVilla.contractEndDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>
            {(viewingVilla.userDisplayName || viewingVilla.userEmail) && (
              <div className="mt-4 p-3 bg-primary-50 rounded-xl flex items-center gap-3 text-sm">
                <User className="w-5 h-5 text-primary-600 shrink-0" />
                <div>
                  <p className="font-medium text-slate-800">{viewingVilla.userDisplayName || '—'}</p>
                  <p className="text-slate-500 text-xs">{viewingVilla.userEmail || '—'}</p>
                </div>
              </div>
            )}
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
