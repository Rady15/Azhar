import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Edit, Eye, Loader2, Check, X, Building2, Upload, Image as ImageIcon, LayoutList, Grid3X3 } from 'lucide-react'
import { api, API_BASE_URL, FacilityModel } from '../services/api'

interface FacilitiesProps {
  language: 'AR' | 'EN'
}

interface EnrichedFacility extends FacilityModel {
  isBooked?: boolean
}

export default function Facilities({ language }: FacilitiesProps) {
  const [facilities, setFacilities] = useState<EnrichedFacility[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingFacility, setEditingFacility] = useState<FacilityModel | null>(null)
  const [viewingFacility, setViewingFacility] = useState<EnrichedFacility | null>(null)

  const [formData, setFormData] = useState<Partial<FacilityModel>>({
    name: '',
    description: '',
    maxCapacity: 15,
    isAvailable: true
  })
  const [saving, setSaving] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid')

  const resolveImage = (url?: string | null): string => {
    if (url && url.startsWith('/')) return API_BASE_URL + url
    return url || ''
  }

  const fetchFacilities = async () => {
    setLoading(true)
    setError('')
    try {
      const [facilitiesRes, bookingsRes] = await Promise.allSettled([
        api.getFacilities(),
        api.getAllBookings()
      ])

      let facilitiesList: FacilityModel[] = []
      if (facilitiesRes.status === 'fulfilled') {
        const data = facilitiesRes.value
        if (data && Array.isArray((data as any).facilities)) {
          facilitiesList = (data as any).facilities
        } else if (data && Array.isArray((data as any).data)) {
          facilitiesList = (data as any).data
        } else if (Array.isArray(data)) {
          facilitiesList = data
        }
      }

      let bookingsList: any[] = []
      if (bookingsRes.status === 'fulfilled') {
        const data = bookingsRes.value
        if (data && Array.isArray((data as any).bookings)) {
          bookingsList = (data as any).bookings
        } else if (data && Array.isArray((data as any).data)) {
          bookingsList = (data as any).data
        } else if (Array.isArray(data)) {
          bookingsList = data
        }
      }

      const enriched = facilitiesList.map((facility: any) => {
        const hasBooking = bookingsList.some(b =>
          b.facilityName &&
          b.facilityName.trim().toLowerCase() === facility.name.trim().toLowerCase() &&
          (b.status || '').toLowerCase() === 'confirmed'
        )
        return {
          ...facility,
          image: facility.image || facility.imageUrl || '',
          isBooked: hasBooking
        }
      })

      setFacilities(enriched)
    } catch (err: any) {
      console.error('Fetch facilities error:', err)
      setError(language === 'AR' ? 'فشل تحميل بيانات المرافق من الخادم' : 'Failed to fetch facilities from server')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFacilities()
  }, [])

  const openCreate = () => {
    setEditingFacility(null)
    setFormData({ name: '', description: '', maxCapacity: 15, isAvailable: true })
    setImageFile(null)
    setImagePreview('')
    setShowModal(true)
  }

  const openEdit = (facility: EnrichedFacility) => {
    setEditingFacility(facility)
    setFormData({
      name: facility.name,
      description: facility.description,
      maxCapacity: facility.maxCapacity,
      isAvailable: facility.isAvailable
    })
    setImageFile(null)
    setImagePreview(facility.image ? resolveImage(facility.image as string) : '')
    setShowModal(true)
  }

  const handleView = (facility: EnrichedFacility) => {
    setViewingFacility(facility)
    setShowViewModal(true)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm(language === 'AR' ? 'هل أنت متأكد من حذف هذا المرفق بشكل نهائي؟' : 'Are you sure you want to delete this facility permanently?')) {
      try {
        const adminEmail = localStorage.getItem('azhar_email') || 'admin@azhar.com'
        await api.deleteFacility(id, { email: adminEmail })
        setFacilities(prev => prev.filter(f => f.id !== id))
      } catch (err: any) {
        console.error('Delete facility error:', err)
        alert(language === 'AR' ? `خطأ: ${err.message}` : `Error: ${err.message}`)
      }
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) return

    setSaving(true)
    try {
      const payload: any = {
        name: formData.name,
        description: formData.description || '',
        maxCapacity: Number(formData.maxCapacity) || 10,
        isAvailable: formData.isAvailable ?? true
      }
      if (imageFile) {
        payload.image = imageFile
      }

      if (editingFacility && editingFacility.id) {
        const updated = await api.updateFacility(editingFacility.id, payload)
        setFacilities(prev => prev.map(f => f.id === editingFacility.id ? { ...f, ...updated, image: updated.image || imagePreview || f.image, isBooked: f.isBooked } : f))
      } else {
        const newFacility = await api.createFacility(payload)
        setFacilities(prev => [{ ...newFacility, isBooked: false }, ...prev])
      }

      setShowModal(false)
      setEditingFacility(null)
      setFormData({ name: '', description: '', maxCapacity: 15, isAvailable: true })
      setImageFile(null)
      setImagePreview('')
    } catch (err: any) {
      console.error('Save facility error:', err)
      alert(language === 'AR' ? `خطأ: ${err.message}` : `Error: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] border border-slate-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-600" />
            {language === 'AR' ? 'إدارة المرافق السكنية' : 'Facilities Management'}
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            {language === 'AR' ? 'عرض وحذف وإضافة كافة المرافق المشتركة ومتابعة حالة حجزها الفعلي.' : 'View, create, and audit residential amenities and their real-time booking status.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-0.5">
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-primary-100 text-primary-700' : 'text-slate-400 hover:text-slate-600'}`} title={language === 'AR' ? 'عرض كقائمة' : 'List view'}><LayoutList className="w-4 h-4" /></button>
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-primary-100 text-primary-700' : 'text-slate-400 hover:text-slate-600'}`} title={language === 'AR' ? 'عرض كبطاقات' : 'Grid view'}><Grid3X3 className="w-4 h-4" /></button>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold text-xs transition-all shadow-md shadow-primary-600/10">
            <Plus className="w-4 h-4" />
            {language === 'AR' ? 'إضافة مرفق جديد' : 'Add Facility'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs flex justify-between items-center">
          <span>{error}</span>
          <button onClick={fetchFacilities} className="underline text-xs hover:text-red-900 font-semibold">{language === 'AR' ? 'إعادة المحاولة' : 'Retry'}</button>
        </div>
      )}

      {loading && facilities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          <p className="text-slate-400 text-xs font-medium">{language === 'AR' ? 'جاري تحميل قائمة المرافق...' : 'Loading housing facilities...'}</p>
        </div>
      ) : viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-right py-3 px-4 font-semibold text-slate-600">{language === 'AR' ? 'الاسم' : 'Name'}</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-600">{language === 'AR' ? 'الوصف' : 'Description'}</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-600">{language === 'AR' ? 'السعة' : 'Capacity'}</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-600">{language === 'AR' ? 'متاح' : 'Available'}</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-600">{language === 'AR' ? 'حالة الحجز' : 'Booking'}</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-600">{language === 'AR' ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {facilities.map(facility => (
                  <tr key={facility.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {facility.image && <img src={resolveImage(facility.image)} alt="" className="w-8 h-8 rounded object-cover" />}
                        <span className="text-slate-700 font-medium">{facility.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-xs max-w-[200px] truncate">{facility.description || '-'}</td>
                    <td className="py-3 px-4 text-slate-600 text-xs">{facility.maxCapacity}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${facility.isAvailable ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        {facility.isAvailable ? (language === 'AR' ? 'متاح' : 'Yes') : (language === 'AR' ? 'مغلق' : 'No')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${facility.isBooked ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                        {facility.isBooked ? (language === 'AR' ? 'محجوز' : 'Booked') : (language === 'AR' ? 'شاغر' : 'Vacant')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleView(facility)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => openEdit(facility)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(String(facility.id))} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {facilities.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-12 text-slate-400">{language === 'AR' ? 'لا توجد مرافق بعد' : 'No facilities yet'}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {facilities.map((facility) => (
              <div key={facility.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow group">
                <div className="h-40 bg-slate-100 relative">
                  {resolveImage(facility.image) ? (
                    <img src={resolveImage(facility.image)} alt={facility.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-slate-300" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${facility.isAvailable ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                      {facility.isAvailable ? (language === 'AR' ? 'متاح' : 'Available') : (language === 'AR' ? 'مغلق' : 'Closed')}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${facility.isBooked ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                      {facility.isBooked ? (language === 'AR' ? 'محجوز' : 'Booked') : (language === 'AR' ? 'شاغر' : 'Vacant')}
                    </span>
                  </div>
                  <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleView(facility)} className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg text-blue-600 hover:bg-blue-50 shadow-sm" title={language === 'AR' ? 'عرض' : 'View'}>
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => openEdit(facility)} className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg text-amber-600 hover:bg-amber-50 shadow-sm" title={language === 'AR' ? 'تعديل' : 'Edit'}>
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-slate-800 mb-1">{facility.name}</h3>
                  <p className="text-sm text-slate-500 mb-3 line-clamp-2">{facility.description}</p>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{facility.maxCapacity} {language === 'AR' ? 'شخص' : 'people max'}</span>
                    <button onClick={() => handleDelete(String(facility.id))} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title={language === 'AR' ? 'حذف المرفق' : 'Delete Facility'}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {facilities.length === 0 && (
              <div className="col-span-full text-center py-16 text-slate-400">
                <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>{language === 'AR' ? 'لا توجد مرافق بعد' : 'No facilities yet'}</p>
              </div>
            )}
          </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white p-6 relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary-600/20 rounded-full blur-2xl"></div>
              <div className="flex justify-between items-center relative">
                <div>
                  <h2 className="font-bold text-lg">
                    {editingFacility
                      ? (language === 'AR' ? 'تعديل المرفق' : 'Edit Facility')
                      : (language === 'AR' ? 'إضافة مرفق ترفيهي جديد' : 'New Amenity')}
                  </h2>
                  <p className="text-[10px] text-slate-300 mt-1">
                    {editingFacility
                      ? (language === 'AR' ? 'تحديث بيانات المرفق' : 'Update facility details')
                      : (language === 'AR' ? 'أضف خدمات وملاعب جديدة لسكان المجمع' : 'Create shared facilities for residents')}
                  </p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'AR' ? 'اسم المرفق بالكامل' : 'Facility Name'} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={language === 'AR' ? 'مثال: مسبح الأولمبي، ملعب التنس' : 'e.g. Olympic Pool Complex, Tennis Court'}
                  value={formData.name || ''}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-primary-500 focus:border-primary-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'AR' ? 'الوصف والتفاصيل' : 'Description'}
                </label>
                <textarea
                  placeholder={language === 'AR' ? 'اكتب تفاصيل المرفق وموقعه وشروط حجزه...' : 'Specify location, rules, and timings...'}
                  value={formData.description || ''}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-primary-500 focus:border-primary-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'AR' ? 'أقصى سعة حضور' : 'Max Capacity'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxCapacity || 15}
                    onChange={e => setFormData(prev => ({ ...prev, maxCapacity: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-primary-500 focus:border-primary-500 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer pb-2">
                    <input
                      type="checkbox"
                      checked={formData.isAvailable ?? true}
                      onChange={e => setFormData(prev => ({ ...prev, isAvailable: e.target.checked }))}
                      className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-xs font-bold text-slate-700">
                      {language === 'AR' ? 'متاح للاستخدام فوراً' : 'Is Available'}
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'AR' ? 'صورة المرفق' : 'Facility Image'}
                </label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4">
                  {imagePreview ? (
                    <div className="relative mb-3">
                      <img src={imagePreview} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
                      <button type="button" onClick={() => { setImagePreview(''); setImageFile(null) }} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : null}
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 w-full py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-xs">
                    <Upload className="w-4 h-4" />
                    {language === 'AR' ? 'رفع صورة' : 'Upload Image'}
                  </button>
                  <input type="file" ref={fileInputRef} accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setImagePreview(URL.createObjectURL(file))
                      setImageFile(file)
                    }
                  }} className="hidden" />
                </div>
              </div>

              <div className="flex gap-3 border-t border-slate-100 pt-5 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-50 text-slate-600 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-semibold"
                >
                  {language === 'AR' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 text-xs font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" />{language === 'AR' ? 'جاري الحفظ...' : 'Saving...'}</>
                  ) : (
                    <><Check className="w-3.5 h-3.5" />{editingFacility ? (language === 'AR' ? 'تحديث' : 'Update') : (language === 'AR' ? 'تأكيد الإضافة' : 'Confirm')}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewingFacility && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100">
            <div className="bg-slate-900 text-white p-6 relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary-600/20 rounded-full blur-2xl"></div>
              <div className="flex justify-between items-center relative">
                <div>
                  <h2 className="font-bold text-lg">{language === 'AR' ? 'تفاصيل المرفق' : 'Facility Details'}</h2>
                  <p className="text-[10px] text-slate-300 mt-1">{viewingFacility.name}</p>
                </div>
                <button onClick={() => setShowViewModal(false)} className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="h-48 bg-slate-100 rounded-xl mb-4 overflow-hidden">
                {resolveImage(viewingFacility.image) ? (
                  <img src={resolveImage(viewingFacility.image)} alt={viewingFacility.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-16 h-16 text-slate-300" />
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-800">{viewingFacility.name}</h3>
                  <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${viewingFacility.isAvailable ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                      {viewingFacility.isAvailable ? (language === 'AR' ? 'متاح' : 'Available') : (language === 'AR' ? 'مغلق' : 'Closed')}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${viewingFacility.isBooked ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                      {viewingFacility.isBooked ? (language === 'AR' ? 'محجوز' : 'Booked') : (language === 'AR' ? 'شاغر' : 'Vacant')}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-slate-600">{viewingFacility.description || (language === 'AR' ? 'لا يوجد وصف' : 'No description')}</p>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Building2 className="w-4 h-4" />
                  <span>{viewingFacility.maxCapacity} {language === 'AR' ? 'شخص كحد أقصى' : 'max capacity'}</span>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowViewModal(false)
                    openEdit(viewingFacility)
                  }}
                  className="flex-1 px-4 py-2.5 bg-amber-600 text-white rounded-xl hover:bg-amber-700 text-xs font-semibold flex items-center justify-center gap-2"
                >
                  <Edit className="w-3.5 h-3.5" />
                  {language === 'AR' ? 'تعديل' : 'Edit'}
                </button>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 text-xs font-semibold"
                >
                  {language === 'AR' ? 'إغلاق' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
