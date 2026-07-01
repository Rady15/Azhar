import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, X, CalendarCheck, User, Home, Clock, CheckCircle, Loader2, Mail, LayoutList, Grid3X3 } from 'lucide-react'
import { api, BookingModel, FacilityModel } from '../services/api'

interface BookingsProps {
  language: 'AR' | 'EN'
}

const STATUS_LABELS: Record<string, { ar: string, en: string }> = {
  Pending: { ar: 'قيد الانتظار', en: 'Pending' },
  Confirmed: { ar: 'مؤكد', en: 'Confirmed' },
  Cancelled: { ar: 'ملغى', en: 'Cancelled' }
}

const STATUS_STYLES: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-700',
  Confirmed: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-700'
}

function Bookings({ language }: BookingsProps) {
  const [bookings, setBookings] = useState<BookingModel[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingBooking, setEditingBooking] = useState<BookingModel | null>(null)
  const [viewingBooking, setViewingBooking] = useState<BookingModel | null>(null)

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [facilities, setFacilities] = useState<FacilityModel[]>([])
  const [formData, setFormData] = useState({
    facilityId: '',
    bookingDate: '',
    startTime: '',
    endTime: '',
    guestsCount: 1,
    status: 'Pending' as string
  })

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const [bookingsRes, facilitiesRes] = await Promise.allSettled([
        api.getAllBookings(),
        api.getFacilities()
      ])

      if (bookingsRes.status === 'fulfilled') {
        const res = bookingsRes.value
        let list: BookingModel[] = []
        if (res && Array.isArray((res as any).bookings)) {
          list = (res as any).bookings
        } else if (res && Array.isArray((res as any).data)) {
          list = (res as any).data
        } else if (Array.isArray(res)) {
          list = res
        }
        setBookings(list)
      }

      if (facilitiesRes.status === 'fulfilled') {
        const data = facilitiesRes.value
        if (data && Array.isArray((data as any).facilities)) {
          setFacilities((data as any).facilities)
        } else if (data && Array.isArray((data as any).data)) {
          setFacilities((data as any).data)
        } else if (Array.isArray(data)) {
          setFacilities(data)
        }
      }
    } catch (err: any) {
      console.error('Fetch bookings error:', err)
      setError(language === 'AR' ? 'فشل تحميل بيانات الحجوزات' : 'Failed to fetch bookings')
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const openCreate = () => {
    setEditingBooking(null)
    setFormData({ facilityId: '', bookingDate: '', startTime: '', endTime: '', guestsCount: 1, status: 'Pending' })
    setShowModal(true)
  }

  const openEdit = (booking: BookingModel) => {
    setEditingBooking(booking)
    setFormData({
      facilityId: booking.facilityId || '',
      bookingDate: booking.date || '',
      startTime: booking.time || '',
      endTime: '',
      guestsCount: booking.duration || 1,
      status: booking.status || 'Pending'
    })
    setShowModal(true)
  }

  const handleView = (booking: BookingModel) => {
    setViewingBooking(booking)
    setShowViewModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm(language === 'AR' ? 'هل أنت متأكد من إلغاء هذا الحجز؟' : 'Are you sure you want to cancel this booking?')) return
    try {
      await api.cancelBooking(id)
      setBookings(prev => prev.filter(b => b.id !== id))
    } catch (err: any) {
      console.error('Cancel booking error:', err)
      alert(language === 'AR' ? `خطأ: ${err.message}` : `Error: ${err.message}`)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (editingBooking) {
        await api.updateBookingStatus(editingBooking.id, { status: formData.status })
        setBookings(prev => prev.map(b => b.id === editingBooking.id ? { ...b, status: formData.status as 'Pending' | 'Confirmed' | 'Cancelled' } : b))
      } else {
        const created = await api.createBooking({
          facilityId: formData.facilityId,
          bookingDate: formData.bookingDate,
          startTime: formData.startTime,
          endTime: formData.endTime || formData.startTime,
          guestsCount: formData.guestsCount
        })
        setBookings(prev => [created as BookingModel, ...prev])
      }
      setShowModal(false)
      setEditingBooking(null)
    } catch (err: any) {
      console.error('Save booking error:', err)
      alert(language === 'AR' ? `خطأ: ${err.message}` : `Error: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const getStatusBadge = (status: string) => (
    <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 w-fit ${STATUS_STYLES[status] || STATUS_STYLES.Pending}`}>
      <CheckCircle className="w-3 h-3" />
      {language === 'AR' ? (STATUS_LABELS[status]?.ar || status) : (STATUS_LABELS[status]?.en || status)}
    </span>
  )

  return (
    <div className="bg-white rounded-2xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">{language === 'AR' ? 'حجوزات المرافق' : 'Facility Bookings'}</h2>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors">
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

      <div className="flex items-center gap-1 mb-4">
        <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`} title={language === 'AR' ? 'عرض كقائمة' : 'List view'}><LayoutList className="w-4 h-4" /></button>
        <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`} title={language === 'AR' ? 'عرض كبطاقات' : 'Grid view'}><Grid3X3 className="w-4 h-4" /></button>
      </div>

      {loading && bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin mb-2" />
          <p className="text-slate-500 text-sm">{language === 'AR' ? 'جاري تحميل البيانات...' : 'Loading bookings...'}</p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{language === 'AR' ? 'المرفق' : 'Facility'}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{language === 'AR' ? 'المستأجر' : 'Tenant'}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{language === 'AR' ? 'البريد' : 'Email'}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{language === 'AR' ? 'الفيلا' : 'Villa'}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{language === 'AR' ? 'التاريخ' : 'Date'}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{language === 'AR' ? 'الوقت' : 'Time'}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{language === 'AR' ? 'المدة' : 'Duration'}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{language === 'AR' ? 'الحالة' : 'Status'}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{language === 'AR' ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(booking => (
                <tr key={booking.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 text-slate-700">{booking.facilityName}</td>
                  <td className="py-3 px-4 text-slate-700">{booking.tenantName}</td>
                  <td className="py-3 px-4 text-slate-500 text-xs">{booking.email}</td>
                  <td className="py-3 px-4 text-slate-700">{booking.villaNumber}</td>
                  <td className="py-3 px-4 text-slate-700">{booking.date ? booking.date.split('T')[0] : ''}</td>
                  <td className="py-3 px-4 text-slate-700">{booking.time}</td>
                  <td className="py-3 px-4 text-slate-700">{booking.duration}{language === 'AR' ? 'س' : 'h'}</td>
                  <td className="py-3 px-4">{getStatusBadge(booking.status)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleView(booking)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => openEdit(booking)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(booking.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr><td colSpan={9} className="text-center py-12 text-slate-400">{language === 'AR' ? 'لا توجد حجوزات' : 'No bookings found'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bookings.map(booking => (
            <div key={booking.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-slate-800">{booking.facilityName}</h3>
                {getStatusBadge(booking.status)}
              </div>
              <p className="text-xs text-slate-400 mb-3">{booking.tenantName}</p>
              <div className="space-y-2 text-sm text-slate-600 mb-3">
                <div className="flex justify-between"><span className="text-slate-400">{language === 'AR' ? 'الفيلا' : 'Villa'}</span><span>{booking.villaNumber || '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">{language === 'AR' ? 'التاريخ' : 'Date'}</span><span>{booking.date ? booking.date.split('T')[0] : '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">{language === 'AR' ? 'الوقت' : 'Time'}</span><span>{booking.time} ({booking.duration}{language === 'AR' ? 'س' : 'h'})</span></div>
              </div>
              <div className="flex items-center justify-end gap-1 pt-3 border-t border-slate-100">
                <button onClick={() => handleView(booking)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Eye className="w-3.5 h-3.5" /></button>
                <button onClick={() => openEdit(booking)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg"><Edit className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleDelete(booking.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">
                {editingBooking
                  ? (language === 'AR' ? 'تحديث حالة الحجز' : 'Update Booking Status')
                  : (language === 'AR' ? 'إضافة حجز' : 'Add Booking')}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            {editingBooking ? (
              <div className="space-y-4">
                <p className="text-sm text-slate-500">
                  {language === 'AR'
                    ? `تغيير حالة الحجز لـ ${editingBooking.facilityName} - ${editingBooking.tenantName}`
                    : `Change status for ${editingBooking.facilityName} - ${editingBooking.tenantName}`}
                </p>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'الحالة' : 'Status'}</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value="Pending">{language === 'AR' ? 'قيد الانتظار' : 'Pending'}</option>
                    <option value="Confirmed">{language === 'AR' ? 'مؤكد' : 'Confirmed'}</option>
                    <option value="Cancelled">{language === 'AR' ? 'ملغى' : 'Cancelled'}</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'المرفق' : 'Facility'}</label>
                  <select
                    value={formData.facilityId}
                    onChange={e => setFormData(prev => ({ ...prev, facilityId: e.target.value }))}
                    className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value="">{language === 'AR' ? 'اختر المرفق' : 'Select Facility'}</option>
                    {facilities.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'التاريخ' : 'Date'}</label>
                    <input type="date" value={formData.bookingDate} onChange={e => setFormData(prev => ({ ...prev, bookingDate: e.target.value }))} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'وقت البداية' : 'Start Time'}</label>
                    <input type="time" value={formData.startTime} onChange={e => setFormData(prev => ({ ...prev, startTime: e.target.value }))} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'وقت النهاية' : 'End Time'}</label>
                    <input type="time" value={formData.endTime} onChange={e => setFormData(prev => ({ ...prev, endTime: e.target.value }))} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'عدد الضيوف' : 'Guests'}</label>
                    <input type="number" min="1" value={formData.guestsCount} onChange={e => setFormData(prev => ({ ...prev, guestsCount: Number(e.target.value) }))} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 h-10 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" />{language === 'AR' ? 'جاري الحفظ...' : 'Saving...'}</> : (language === 'AR' ? 'حفظ' : 'Save')}
              </button>
              <button onClick={() => setShowModal(false)} className="flex-1 h-10 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200">{language === 'AR' ? 'إلغاء' : 'Cancel'}</button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
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
              {viewingBooking.email && <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-slate-400" /><span className="text-sm">{viewingBooking.email}</span></div>}
              <div className="flex items-center gap-2"><Home className="w-4 h-4 text-slate-400" /><span className="text-sm">{language === 'AR' ? 'فيلا رقم' : 'Villa'} {viewingBooking.villaNumber}</span></div>
              <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-slate-400" /><span className="text-sm">{viewingBooking.date ? viewingBooking.date.split('T')[0] : ''} - {viewingBooking.time} ({viewingBooking.duration} {language === 'AR' ? 'ساعات' : 'hours'})</span></div>
              <div className="mt-2">{getStatusBadge(viewingBooking.status)}</div>
              {viewingBooking.notes && <p className="text-sm text-slate-600 p-3 bg-slate-50 rounded-lg">{viewingBooking.notes}</p>}
            </div>
            <button onClick={() => { setShowViewModal(false); openEdit(viewingBooking) }} className="w-full h-10 mt-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 flex items-center justify-center gap-2">
              <Edit className="w-3.5 h-3.5" />{language === 'AR' ? 'تغيير الحالة' : 'Change Status'}
            </button>
            <button onClick={() => setShowViewModal(false)} className="w-full h-10 mt-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200">{language === 'AR' ? 'إغلاق' : 'Close'}</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Bookings
