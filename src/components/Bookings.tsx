import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, X, CalendarCheck, User, Home, Clock, CheckCircle, Loader2 } from 'lucide-react'
import { api, FacilityModel } from '../services/api'

interface Booking {
  id: string | number
  facilityId: string
  facilityName: string
  tenantName: string
  villaNumber: string
  date: string
  time: string
  duration: number
  status: 'confirmed' | 'pending' | 'cancelled'
  notes: string
}

interface BookingsProps {
  language: 'AR' | 'EN'
}

function Bookings({ language }: BookingsProps) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [facilities, setFacilities] = useState<FacilityModel[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null)
  const [viewingBooking, setViewingBooking] = useState<Booking | null>(null)
  const [formData, setFormData] = useState<Partial<Booking>>({})

  // Map Backend API model to Frontend Booking model
  const mapToFrontend = (item: any): Booking => ({
    id: item.id || String(Date.now()),
    facilityId: item.facilityId || '',
    facilityName: item.facilityName || 'نادي الرياضي',
    tenantName: item.tenantName || 'أحمد محمد',
    villaNumber: item.villaNumber || '12',
    date: item.date ? item.date.split('T')[0] : '2024-01-20',
    time: item.time || '18:00',
    duration: item.duration || 2,
    status: (item.status || 'Pending').toLowerCase() as any,
    notes: item.notes || ''
  })

  const mapStatusToBackend = (status: string): string => {
    switch (status) {
      case 'confirmed': return 'Confirmed'
      case 'cancelled': return 'Cancelled'
      default: return 'Pending'
    }
  }

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const [bookingsRes, facilitiesRes] = await Promise.allSettled([
        api.getAllBookings(),
        api.getFacilities()
      ])

      if (bookingsRes.status === 'fulfilled') {
        const data = bookingsRes.value
        if (data && Array.isArray((data as any).bookings)) {
          setBookings((data as any).bookings.map(mapToFrontend))
        } else if (data && Array.isArray((data as any).data)) {
          setBookings((data as any).data.map(mapToFrontend))
        } else if (Array.isArray(data)) {
          setBookings(data.map(mapToFrontend))
        }
      }

      if (facilitiesRes.status === 'fulfilled') {
        const data = facilitiesRes.value
        if (data && Array.isArray((data as any).facilities)) {
          setFacilities((data as any).facilities)
        } else if (Array.isArray(data)) {
          setFacilities(data)
        }
      }
    } catch (err: any) {
      console.error('Fetch data error:', err)
      setError(language === 'AR' ? 'فشل تحميل البيانات من الخادم' : 'Failed to fetch data from server')
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleAdd = () => {
    setEditingBooking(null)
    setFormData({ facilityId: '', facilityName: '', tenantName: '', villaNumber: '', date: '', time: '', duration: 1, status: 'pending', notes: '' })
    setShowModal(true)
  }

  const handleEdit = (booking: Booking) => {
    setEditingBooking(booking)
    setFormData({ ...booking })
    setShowModal(true)
  }

  const handleView = (booking: Booking) => {
    setViewingBooking(booking)
    setShowViewModal(true)
  }

  const handleDelete = async (id: string | number) => {
    if (!window.confirm(language === 'AR' ? 'هل أنت متأكد من الحذف؟' : 'Are you sure you want to delete?')) return
    try {
      await api.cancelBooking(String(id))
      setBookings(bookings.filter(b => b.id !== id))
    } catch (err: any) {
      console.error('Cancel booking error:', err)
      alert(language === 'AR' ? `خطأ: ${err.message}` : `Error: ${err.message}`)
    }
  }

  const handleSave = async () => {
    try {
      const statusStr = mapStatusToBackend(formData.status || 'pending')
      const targetId = editingBooking ? String(editingBooking.id) : 'sample-booking-id'
      
      if (editingBooking) {
        // Send state status changes directly to live update booking status endpoint
        await api.updateBookingStatus(targetId, statusStr)
        setBookings(bookings.map(b => b.id === editingBooking.id ? { ...b, ...formData } as Booking : b))
      } else {
        const created = await api.createBooking({
          facilityId: formData.facilityId ?? '',
          bookingDate: formData.date ?? '',
          startTime: formData.time ?? '',
          endTime: '',
          guestsCount: formData.duration ?? 1,
        })
        const newBooking = mapToFrontend(created ?? { ...formData, id: String(Date.now()) })
        setBookings([newBooking, ...bookings])
      }
      setShowModal(false)
    } catch (err: any) {
      console.error('Update status API error:', err)
      alert(language === 'AR' ? `خطأ: ${err.message}` : `Error: ${err.message}`)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      confirmed: 'bg-green-100 text-green-700',
      pending: 'bg-amber-100 text-amber-700',
      cancelled: 'bg-red-100 text-red-700'
    }
    const labels: Record<string, string> = {
      confirmed: language === 'AR' ? 'مؤكد' : 'Confirmed',
      pending: language === 'AR' ? 'قيد الانتظار' : 'Pending',
      cancelled: language === 'AR' ? 'ملغى' : 'Cancelled'
    }
    return <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${styles[status]}`}><CheckCircle className="w-3 h-3" />{labels[status]}</span>
  }

  return (
    <div className="bg-white rounded-2xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">{language === 'AR' ? 'حجوزات المرافق' : 'Facility Bookings'}</h2>
        <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors">
          <Plus className="w-4 h-4" />
          {language === 'AR' ? 'إضافة حجز' : 'Add Booking'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={fetchData} className="underline text-xs hover:text-red-900">{language === 'AR' ? 'إعادة المحاولة' : 'Retry'}</button>
        </div>
      )}

      {loading && bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin mb-2" />
          <p className="text-slate-500 text-sm">{language === 'AR' ? 'جاري تحميل البيانات...' : 'Loading bookings...'}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{language === 'AR' ? 'المرفق' : 'Facility'}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{language === 'AR' ? 'المستأجر' : 'Tenant'}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{language === 'AR' ? 'الفلا' : 'Villa'}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{language === 'AR' ? 'التاريخ' : 'Date'}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{language === 'AR' ? 'الوقت' : 'Time'}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{language === 'AR' ? 'الحالة' : 'Status'}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{language === 'AR' ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(booking => (
                <tr key={booking.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 text-slate-700">{booking.facilityName}</td>
                  <td className="py-3 px-4 text-slate-700">{booking.tenantName}</td>
                  <td className="py-3 px-4 text-slate-700">{booking.villaNumber}</td>
                  <td className="py-3 px-4 text-slate-700">{booking.date}</td>
                  <td className="py-3 px-4 text-slate-700">{booking.time}</td>
                  <td className="py-3 px-4">{getStatusBadge(booking.status)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleView(booking)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleEdit(booking)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(booking.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">
                {editingBooking ? (language === 'AR' ? 'تعديل حجز' : 'Edit Booking') : (language === 'AR' ? 'إضافة حجز' : 'Add Booking')}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'المرفق' : 'Facility'}</label>
                <select value={formData.facilityId || ''} onChange={e => {
                  const selected = facilities.find(f => f.id === e.target.value)
                  setFormData({ ...formData, facilityId: e.target.value, facilityName: selected?.name || '' })
                }} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm">
                  <option value="">{language === 'AR' ? 'اختر المرفق' : 'Select Facility'}</option>
                  {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'اسم المستأجر' : 'Tenant Name'}</label>
                  <input type="text" value={formData.tenantName || ''} onChange={e => setFormData({ ...formData, tenantName: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'رقم الفلا' : 'Villa Number'}</label>
                  <input type="text" value={formData.villaNumber || ''} onChange={e => setFormData({ ...formData, villaNumber: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'التاريخ' : 'Date'}</label>
                  <input type="date" value={formData.date || ''} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'الوقت' : 'Time'}</label>
                  <input type="time" value={formData.time || ''} onChange={e => setFormData({ ...formData, time: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'المدة (ساعات)' : 'Duration (hours)'}</label>
                  <input type="number" min="1" max="8" value={formData.duration || ''} onChange={e => setFormData({ ...formData, duration: Number(e.target.value) })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'الحالة' : 'Status'}</label>
                  <select value={formData.status || 'pending'} onChange={e => setFormData({ ...formData, status: e.target.value as any })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm">
                    <option value="pending">{language === 'AR' ? 'قيد الانتظار' : 'Pending'}</option>
                    <option value="confirmed">{language === 'AR' ? 'مؤكد' : 'Confirmed'}</option>
                    <option value="cancelled">{language === 'AR' ? 'ملغى' : 'Cancelled'}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'ملاحظات' : 'Notes'}</label>
                <textarea value={formData.notes || ''} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} className="flex-1 h-10 bg-primary-600 text-white rounded-xl hover:bg-primary-700">{language === 'AR' ? 'حفظ' : 'Save'}</button>
              <button onClick={() => setShowModal(false)} className="flex-1 h-10 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200">{language === 'AR' ? 'إلغاء' : 'Cancel'}</button>
            </div>
          </div>
        </div>
      )}

      {showViewModal && viewingBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">{language === 'AR' ? 'تفاصيل الحجز' : 'Booking Details'}</h3>
              <button onClick={() => setShowViewModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2"><CalendarCheck className="w-4 h-4 text-primary-600" /><span className="text-sm font-medium">{viewingBooking.facilityName}</span></div>
              <div className="flex items-center gap-2"><User className="w-4 h-4 text-slate-400" /><span className="text-sm">{viewingBooking.tenantName}</span></div>
              <div className="flex items-center gap-2"><Home className="w-4 h-4 text-slate-400" /><span className="text-sm">{language === 'AR' ? 'فلا رقم' : 'Villa'} {viewingBooking.villaNumber}</span></div>
              <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-slate-400" /><span className="text-sm">{viewingBooking.date} - {viewingBooking.time} ({viewingBooking.duration} {language === 'AR' ? 'ساعات' : 'hours'})</span></div>
              <div className="mt-2">{getStatusBadge(viewingBooking.status)}</div>
              {viewingBooking.notes && <p className="text-sm text-slate-600 p-3 bg-slate-50 rounded-lg">{viewingBooking.notes}</p>}
            </div>
            <button onClick={() => setShowViewModal(false)} className="w-full h-10 mt-4 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200">{language === 'AR' ? 'إغلاق' : 'Close'}</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Bookings