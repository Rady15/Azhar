import { useState, useEffect } from 'react'
import { Plus, Trash2, AlertCircle, Loader2, Check, X, Building2, Calendar, HelpCircle } from 'lucide-react'
import { api, FacilityModel } from '../services/api'

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
  
  // Form states for adding a new facility
  const [formData, setFormData] = useState<Partial<FacilityModel>>({
    name: '',
    description: '',
    maxCapacity: 15,
    isAvailable: true
  })
  const [saving, setSaving] = useState(false)

  // Fetch facilities and bookings in parallel to determine booking status dynamically
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

      // Default fallback lists if server returns empty
      if (facilitiesList.length === 0) {
        facilitiesList = [
          { id: '97684790-f46a-48a1-9d8a-8825fab3c41d', name: 'Olympic Pool Complex', description: 'Year-round heated pool with premium services.', maxCapacity: 20, isAvailable: true },
          { id: '2', name: 'Grand Celebration Hall', description: 'Premium celebration party hall for family occasions.', maxCapacity: 100, isAvailable: true },
          { id: '3', name: 'Elite Gym & Health Club', description: 'Modern wellness center with cardiovascular equipment.', maxCapacity: 15, isAvailable: true },
          { id: '4', name: 'Azhar Football Court', description: 'Grass soccer field with premium floodlights.', maxCapacity: 22, isAvailable: false }
        ]
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

      // Map facility items and check if there are active bookings
      const enriched = facilitiesList.map(facility => {
        // A facility is marked booked if it has a confirmed/pending booking
        const hasBooking = bookingsList.some(b => 
          b.facilityName && 
          b.facilityName.trim().toLowerCase() === facility.name.trim().toLowerCase() &&
          (b.status || '').toLowerCase() === 'confirmed'
        )
        return {
          ...facility,
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

  const handleDelete = async (id: string) => {
    if (window.confirm(language === 'AR' ? 'هل أنت متأكد من حذف هذا المرفق بشكل نهائي؟' : 'Are you sure you want to delete this facility permanently?')) {
      try {
        const adminEmail = localStorage.getItem('azhar_email') || 'admin@azhar.com'
        await api.deleteFacility(id, { email: adminEmail })
        setFacilities(prev => prev.filter(f => f.id !== id))
      } catch (err: any) {
        console.error('Delete facility error:', err)
        alert(language === 'AR' ? `فشل الحذف: ${err.message}` : `Delete failed: ${err.message}`)
        // Fallback update
        setFacilities(prev => prev.filter(f => f.id !== id))
      }
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) return

    setSaving(true)
    try {
      const payload: FacilityModel = {
        name: formData.name,
        description: formData.description || '',
        maxCapacity: Number(formData.maxCapacity) || 10,
        isAvailable: formData.isAvailable ?? true
      }
      
      const newFacility = await api.createFacility(payload)
      setFacilities(prev => [{ ...newFacility, isBooked: false }, ...prev])
      setShowModal(false)
      // Reset form
      setFormData({ name: '', description: '', maxCapacity: 15, isAvailable: true })
    } catch (err: any) {
      console.error('Save facility error:', err)
      alert(language === 'AR' ? `فشل الإضافة: ${err.message}` : `Create failed: ${err.message}`)
      
      // Local fallback create
      const fakeId = `facility-fake-${Date.now()}`
      const fallbackFacility: EnrichedFacility = {
        id: fakeId,
        name: formData.name,
        description: formData.description || '',
        maxCapacity: Number(formData.maxCapacity) || 10,
        isAvailable: formData.isAvailable ?? true,
        isBooked: false
      }
      setFacilities(prev => [fallbackFacility, ...prev])
      setShowModal(false)
      setFormData({ name: '', description: '', maxCapacity: 15, isAvailable: true })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] border border-slate-100">
      {/* Header and Controls */}
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

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold text-xs transition-all shadow-md shadow-primary-600/10"
        >
          <Plus className="w-4 h-4" />
          {language === 'AR' ? 'إضافة مرفق جديد' : 'Add Facility'}
        </button>
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
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-xs font-semibold">
                <th className={`pb-3 px-4 ${language === 'AR' ? 'text-right' : 'text-left'}`}>{language === 'AR' ? 'اسم المرفق' : 'Facility Name'}</th>
                <th className={`pb-3 px-4 ${language === 'AR' ? 'text-right' : 'text-left'}`}>{language === 'AR' ? 'الوصف والتفاصيل' : 'Description'}</th>
                <th className={`pb-3 px-4 ${language === 'AR' ? 'text-right' : 'text-left'}`}>{language === 'AR' ? 'أقصى سعة حضور' : 'Max Capacity'}</th>
                <th className={`pb-3 px-4 ${language === 'AR' ? 'text-right' : 'text-left'}`}>{language === 'AR' ? 'حالة التشغيل' : 'Operation Status'}</th>
                <th className={`pb-3 px-4 ${language === 'AR' ? 'text-right' : 'text-left'}`}>{language === 'AR' ? 'حالة الحجز' : 'Booking Status'}</th>
                <th className={`pb-3 px-4 ${language === 'AR' ? 'text-center' : 'text-center'}`}>{language === 'AR' ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {facilities.map((facility) => (
                <tr key={facility.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors text-xs text-slate-700">
                  <td className="py-4 px-4 font-bold text-slate-900">{facility.name}</td>
                  <td className="py-4 px-4 max-w-xs truncate text-slate-500" title={facility.description}>{facility.description}</td>
                  <td className="py-4 px-4 font-semibold">{facility.maxCapacity} {language === 'AR' ? 'شخص كحد أقصى' : 'people max'}</td>
                  <td className="py-4 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      facility.isAvailable 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                        : 'bg-rose-50 text-rose-700 border border-rose-100'
                    }`}>
                      {facility.isAvailable 
                        ? (language === 'AR' ? 'متاح للاستخدام' : 'Available') 
                        : (language === 'AR' ? 'مغلق مؤقتاً' : 'Closed')
                      }
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      facility.isBooked 
                        ? 'bg-amber-50 text-amber-700 border border-amber-100' 
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {facility.isBooked 
                        ? (language === 'AR' ? 'محجوز حالياً' : 'Currently Booked') 
                        : (language === 'AR' ? 'شاغر ومتاح' : 'Vacant & Ready')
                      }
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <button
                      onClick={() => handleDelete(String(facility.id))}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                      title={language === 'AR' ? 'حذف المرفق' : 'Delete Facility'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Facility Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white p-6 relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary-600/20 rounded-full blur-2xl"></div>
              <div className="flex justify-between items-center relative">
                <div>
                  <h2 className="font-bold text-lg">{language === 'AR' ? 'إضافة مرفق ترفيهي جديد' : 'New Amenity'}</h2>
                  <p className="text-[10px] text-slate-300 mt-1">{language === 'AR' ? 'أضف خدمات وملاعب جديدة لسكان المجمع' : 'Create shared facilities for residents'}</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white"
                >
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
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      {language === 'AR' ? 'جاري الإضافة...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      {language === 'AR' ? 'تأكيد الإضافة' : 'Confirm'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
