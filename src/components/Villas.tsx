import { useState, useRef, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, X, Home, MapPin, Maximize, Bed, Bath, Calendar, Upload, Loader2 } from 'lucide-react'
import { api } from '../services/api'

interface Villa {
  id: string | number
  name: string
  number: string
  address: string
  size: number
  bedrooms: number
  bathrooms: number
  rent: number
  status: 'available' | 'occupied' | 'maintenance'
  image: string
  description: string
}

interface VillasProps {
  language: 'AR' | 'EN'
}

function Villas({ language }: VillasProps) {
  const [villas, setVillas] = useState<Villa[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingVilla, setEditingVilla] = useState<Villa | null>(null)
  const [viewingVilla, setViewingVilla] = useState<Villa | null>(null)
  const [formData, setFormData] = useState<Partial<Villa>>({})
  const [imagePreview, setImagePreview] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Map Backend API model to Frontend Villa UI model
  const mapToFrontend = (item: any): Villa => ({
    id: item.id || String(Date.now()),
    name: item.name || `فيلا رقم ${item.number || ''}`,
    number: item.number || '',
    address: item.address || '',
    size: Number(item.size) || 300,
    bedrooms: Number(item.bedrooms) || 3,
    bathrooms: Number(item.bathrooms) || 3,
    rent: Number(item.rent) || 5000,
    status: item.status?.toLowerCase() === 'occupied' ? 'occupied' : item.status?.toLowerCase() === 'maintenance' ? 'maintenance' : 'available',
    image: item.image || '',
    description: item.description || ''
  })

  // Map Frontend UI model to Backend API model
  const mapToBackend = (villa: Partial<Villa>): any => ({
    name: villa.name || '',
    number: villa.number || '',
    address: villa.address || '',
    size: Number(villa.size) || 0,
    bedrooms: Number(villa.bedrooms) || 0,
    bathrooms: Number(villa.bathrooms) || 0,
    rent: Number(villa.rent) || 0,
    status: villa.status || 'available',
    image: villa.image || '',
    description: villa.description || ''
  })

  const fetchVillas = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.getVillas()
      if (Array.isArray(data)) {
        setVillas(data.map(mapToFrontend))
      } else if (data && Array.isArray((data as any).villas)) {
        setVillas((data as any).villas.map(mapToFrontend))
      }
    } catch (err: any) {
      console.error('Fetch villas error:', err)
      setError(language === 'AR' ? 'فشل تحميل بيانات الفلل من الخادم' : 'Failed to fetch villas from server')
      // Graceful fallback to mock data on offline/connection failure
      setVillas([
        { id: '1', name: 'فلا رقم 1', number: '1', address: 'الحي الشرقي', size: 350, bedrooms: 4, bathrooms: 3, rent: 5000, status: 'occupied', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400', description: 'فلا كبيرة مع حديقة' },
        { id: '2', name: 'فلا رقم 2', number: '2', address: 'الحي الغربي', size: 280, bedrooms: 3, bathrooms: 2, rent: 4500, status: 'available', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400', description: 'فلا وسط مع garage' },
        { id: '3', name: 'فلا رقم 3', number: '3', address: 'الحي الشمالي', size: 400, bedrooms: 5, bathrooms: 4, rent: 6500, status: 'maintenance', image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400', description: 'فلا فاخرة مع pool' },
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVillas()
  }, [])

  const handleAdd = () => {
    setEditingVilla(null)
    setFormData({ name: '', number: '', address: '', size: 0, bedrooms: 0, bathrooms: 0, rent: 0, status: 'available', image: '', description: '' })
    setImagePreview('')
    setShowModal(true)
  }

  const handleEdit = (villa: Villa) => {
    setEditingVilla(villa)
    setFormData({ ...villa })
    setImagePreview(villa.image)
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
      } catch (err: any) {
        console.error('Delete villa error:', err)
        alert(language === 'AR' ? `فشل الحذف: ${err.message}` : `Delete failed: ${err.message}`)
        // Fallback update
        setVillas(villas.filter(v => v.id !== id))
      }
    }
  }

  const handleSave = async () => {
    try {
      if (editingVilla) {
        const payload = mapToBackend({ ...editingVilla, ...formData })
        await api.updateVilla(String(editingVilla.id), payload)
        setVillas(villas.map(v => v.id === editingVilla.id ? { ...v, ...formData } as Villa : v))
      } else {
        const payload = mapToBackend(formData)
        const newVillaBackend = await api.createVilla(payload)
        const newVilla = mapToFrontend(newVillaBackend)
        setVillas([...villas, newVilla])
      }
      setShowModal(false)
    } catch (err: any) {
      console.error('Save villa error:', err)
      alert(language === 'AR' ? `فشل الحفظ: ${err.message}` : `Save failed: ${err.message}`)
      
      // Fallback
      if (editingVilla) {
        setVillas(villas.map(v => v.id === editingVilla.id ? { ...v, ...formData } as Villa : v))
      } else {
        const newVilla: Villa = { ...formData, id: String(Date.now()) } as Villa
        setVillas([...villas, newVilla])
      }
      setShowModal(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
        setFormData({ ...formData, image: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImageUrlChange = (url: string) => {
    setImagePreview(url)
    setFormData({ ...formData, image: url })
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      available: 'bg-green-100 text-green-700',
      occupied: 'bg-blue-100 text-blue-700',
      maintenance: 'bg-amber-100 text-amber-700'
    }
    const labels: Record<string, string> = {
      available: language === 'AR' ? 'متاحة' : 'Available',
      occupied: language === 'AR' ? 'مؤجرة' : 'Occupied',
      maintenance: language === 'AR' ? 'صيانة' : 'Maintenance'
    }
    return <span className={`px-2 py-1 rounded-full text-xs ${styles[status]}`}>{labels[status]}</span>
  }

  return (
    <div className="bg-white rounded-2xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">{language === 'AR' ? 'الفلل' : 'Villas'}</h2>
        <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors">
          <Plus className="w-4 h-4" />
          {language === 'AR' ? 'إضافة فيلا' : 'Add Villa'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={fetchVillas} className="underline text-xs hover:text-red-900">{language === 'AR' ? 'إعادة المحاولة' : 'Retry'}</button>
        </div>
      )}

      {loading && villas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin mb-2" />
          <p className="text-slate-500 text-sm">{language === 'AR' ? 'جاري تحميل البيانات...' : 'Loading villas...'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {villas.map(villa => (
          <div key={villa.id} className="border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
            <div className="h-48 bg-slate-100 relative">
              {villa.image ? (
                <img src={villa.image} alt={villa.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Home className="w-12 h-12 text-slate-300" />
                </div>
              )}
              <div className="absolute top-2 left-2">
                {getStatusBadge(villa.status)}
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-slate-800 mb-2">{villa.name}</h3>
              <div className="space-y-1 text-sm text-slate-500 mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{villa.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Maximize className="w-4 h-4" />
                  <span>{villa.size} {language === 'AR' ? 'م²' : 'm²'}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1"><Bed className="w-4 h-4" /> {villa.bedrooms}</span>
                  <span className="flex items-center gap-1"><Bath className="w-4 h-4" /> {villa.bathrooms}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-primary-700">{villa.rent} {language === 'AR' ? 'ريال/شهر' : 'SAR/month'}</span>
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
                {editingVilla ? (language === 'AR' ? 'تعديل فيلا' : 'Edit Villa') : (language === 'AR' ? 'إضافة فيلا' : 'Add Villa')}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'اسم الفلا' : 'Villa Name'}</label>
                <input type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'رقم الفلا' : 'Villa Number'}</label>
                  <input type="text" value={formData.number || ''} onChange={e => setFormData({ ...formData, number: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'العنوان' : 'Address'}</label>
                  <input type="text" value={formData.address || ''} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'المساحة' : 'Size'}</label>
                  <input type="number" value={formData.size || ''} onChange={e => setFormData({ ...formData, size: Number(e.target.value) })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'غرف النوم' : 'Bedrooms'}</label>
                  <input type="number" value={formData.bedrooms || ''} onChange={e => setFormData({ ...formData, bedrooms: Number(e.target.value) })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'الحمامات' : 'Bathrooms'}</label>
                  <input type="number" value={formData.bathrooms || ''} onChange={e => setFormData({ ...formData, bathrooms: Number(e.target.value) })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'الإيجار الشهري' : 'Monthly Rent'}</label>
                <input type="number" value={formData.rent || ''} onChange={e => setFormData({ ...formData, rent: Number(e.target.value) })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'الحالة' : 'Status'}</label>
                <select value={formData.status || 'available'} onChange={e => setFormData({ ...formData, status: e.target.value as 'available' | 'occupied' | 'maintenance' })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm">
                  <option value="available">{language === 'AR' ? 'متاحة' : 'Available'}</option>
                  <option value="occupied">{language === 'AR' ? 'مؤجرة' : 'Occupied'}</option>
                  <option value="maintenance">{language === 'AR' ? 'صيانة' : 'Maintenance'}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'الوصف' : 'Description'}</label>
                <textarea value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'الصورة' : 'Image'}</label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4">
                  {imagePreview ? (
                    <div className="relative mb-3">
                      <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
                      <button onClick={() => { setImagePreview(''); setFormData({ ...formData, image: '' }) }} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : null}
                  <div className="flex gap-3">
                    <button onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 py-2 border border-slate-200 rounded-lg hover:bg-slate-50">
                      <Upload className="w-4 h-4" />
                      {language === 'AR' ? 'رفع صورة' : 'Upload'}
                    </button>
                    <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageUpload} className="hidden" />
                    <input type="text" placeholder={language === 'AR' ? 'أو رابط الصورة' : 'Or image URL'} onChange={e => handleImageUrlChange(e.target.value)} className="flex-1 h-10 px-3 border border-slate-200 rounded-lg text-sm" />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} className="flex-1 h-10 bg-primary-600 text-white rounded-xl hover:bg-primary-700">
                {language === 'AR' ? 'حفظ' : 'Save'}
              </button>
              <button onClick={() => setShowModal(false)} className="flex-1 h-10 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200">
                {language === 'AR' ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showViewModal && viewingVilla && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">{viewingVilla.name}</h3>
              <button onClick={() => setShowViewModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            {viewingVilla.image && (
              <img src={viewingVilla.image} alt={viewingVilla.name} className="w-full h-48 object-cover rounded-xl mb-4" />
            )}
            <div className="flex gap-2 mb-4">
              {getStatusBadge(viewingVilla.status)}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>{viewingVilla.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Maximize className="w-4 h-4 text-slate-400" />
                <span>{viewingVilla.size} {language === 'AR' ? 'م²' : 'm²'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Bed className="w-4 h-4 text-slate-400" />
                <span>{viewingVilla.bedrooms} {language === 'AR' ? 'غرف' : 'beds'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Bath className="w-4 h-4 text-slate-400" />
                <span>{viewingVilla.bathrooms} {language === 'AR' ? 'حمامات' : 'baths'}</span>
              </div>
            </div>
            {viewingVilla.description && (
              <p className="mt-4 p-3 bg-slate-50 rounded-lg text-sm text-slate-600">{viewingVilla.description}</p>
            )}
            <div className="mt-4 p-4 bg-primary-50 rounded-xl">
              <p className="text-sm text-slate-600">{language === 'AR' ? 'الإيجار الشهري' : 'Monthly Rent'}</p>
              <p className="text-2xl font-bold text-primary-700">{viewingVilla.rent} {language === 'AR' ? 'ريال' : 'SAR'}</p>
            </div>
            <button onClick={() => setShowViewModal(false)} className="w-full h-10 mt-4 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200">
              {language === 'AR' ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Villas