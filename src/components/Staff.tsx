import { useState, useEffect, useRef } from 'react'
import { Plus, Edit, Trash2, Eye, X, Users, Phone, Loader2, Check, BadgeCheck, BadgeX, Upload, ClipboardList, CheckCircle, LayoutList, Grid3X3 } from 'lucide-react'
import { api, API_BASE_URL, StaffModel } from '../services/api'

interface StaffProps {
  language: 'AR' | 'EN'
}

export default function Staff({ language }: StaffProps) {
  const [staff, setStaff] = useState<StaffModel[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffModel | null>(null)
  const [viewingStaff, setViewingStaff] = useState<StaffModel | null>(null)

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    isActive: true
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  const resolveImage = (url?: string | null): string => {
    if (url && url.startsWith('/')) return API_BASE_URL + url
    return url || ''
  }

  const fetchStaff = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.getStaff()
      let list: StaffModel[] = []
      if (res && Array.isArray((res as any).staff)) {
        list = (res as any).staff
      } else if (res && Array.isArray((res as any).data)) {
        list = (res as any).data
      } else if (res && Array.isArray((res as any).items)) {
        list = (res as any).items
      } else if (Array.isArray(res)) {
        list = res
      }
      setStaff(list)
    } catch (err: any) {
      console.error('Fetch staff error:', err)
      setError(language === 'AR' ? 'فشل تحميل بيانات فريق العمل' : 'Failed to fetch staff')
      setStaff([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStaff()
  }, [])

  const openCreate = () => {
    setEditingStaff(null)
    setFormData({ fullName: '', email: '', phoneNumber: '', isActive: true })
    setImageFile(null)
    setImagePreview('')
    setShowModal(true)
  }

  const openEdit = (member: StaffModel) => {
    setEditingStaff(member)
    setFormData({
      fullName: member.fullName,
      email: member.email,
      phoneNumber: member.phoneNumber || '',
      isActive: member.isActive ?? true
    })
    setImageFile(null)
    setImagePreview(member.profileImageUrl ? resolveImage(member.profileImageUrl) : '')
    setShowModal(true)
  }

  const handleView = (member: StaffModel) => {
    setViewingStaff(member)
    setShowViewModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm(language === 'AR' ? 'هل أنت متأكد من حذف هذا العضو؟' : 'Are you sure you want to delete this staff member?')) return
    try {
      await api.deleteStaff(id)
      setStaff(prev => prev.filter(m => m.id !== id))
    } catch (err: any) {
      console.error('Delete staff error:', err)
      alert(language === 'AR' ? `خطأ: ${err.message}` : `Error: ${err.message}`)
    }
  }

  const handleSave = async () => {
    if (!formData.fullName || !formData.email) return

    setSaving(true)
    try {
      const payload: Record<string, any> = {
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        isActive: formData.isActive
      }
      if (imageFile) {
        payload.profileImage = imageFile
      }
      if (editingStaff && editingStaff.id) {
        const updated = await api.updateStaff(editingStaff.id, payload)
        setStaff(prev => prev.map(m => m.id === editingStaff.id ? { ...m, ...updated } : m))
      } else {
        const created = await api.createStaff(payload)
        setStaff(prev => [created, ...prev])
      }

      setShowModal(false)
      setEditingStaff(null)
    } catch (err: any) {
      console.error('Save staff error:', err)
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
            <Users className="w-5 h-5 text-primary-600" />
            {language === 'AR' ? 'إدارة فريق العمل' : 'Staff Management'}
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            {language === 'AR' ? 'إدارة أعضاء فريق العمل وصلاحيات النظام' : 'Manage team members and system access'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-0.5">
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-primary-100 text-primary-700' : 'text-slate-400 hover:text-slate-600'}`} title={language === 'AR' ? 'عرض كقائمة' : 'List view'}><LayoutList className="w-4 h-4" /></button>
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-primary-100 text-primary-700' : 'text-slate-400 hover:text-slate-600'}`} title={language === 'AR' ? 'عرض كبطاقات' : 'Grid view'}><Grid3X3 className="w-4 h-4" /></button>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold text-xs transition-all shadow-md shadow-primary-600/10">
            <Plus className="w-4 h-4" />
            {language === 'AR' ? 'إضافة عضو جديد' : 'Add Member'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs flex justify-between items-center">
          <span>{error}</span>
          <button onClick={fetchStaff} className="underline text-xs hover:text-red-900 font-semibold">{language === 'AR' ? 'إعادة المحاولة' : 'Retry'}</button>
        </div>
      )}

      {loading && staff.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          <p className="text-slate-400 text-xs font-medium">{language === 'AR' ? 'جاري تحميل فريق العمل...' : 'Loading staff...'}</p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{language === 'AR' ? 'الاسم' : 'Name'}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{language === 'AR' ? 'البريد' : 'Email'}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{language === 'AR' ? 'الهاتف' : 'Phone'}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{language === 'AR' ? 'المهام المعلقة' : 'Pending Tasks'}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{language === 'AR' ? 'المهام المنجزة' : 'Completed Tasks'}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{language === 'AR' ? 'الحالة' : 'Status'}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{language === 'AR' ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {staff.map(member => (
                <tr key={member.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center overflow-hidden">
                        {member.profileImageUrl ? (
                          <img src={resolveImage(member.profileImageUrl)} alt={member.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-primary-700 font-bold text-xs">{member.fullName?.charAt(0)}</span>
                        )}
                      </div>
                      <span className="text-slate-700 font-medium">{member.fullName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 text-xs">{member.email}</td>
                  <td className="py-3 px-4 text-slate-600 text-xs">{member.phoneNumber || '-'}</td>
                  <td className="py-3 px-4">
                    <span className="flex items-center gap-1 text-xs text-amber-600">
                      <ClipboardList className="w-3.5 h-3.5" />
                      {member.pendingTasksCount ?? 0}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="flex items-center gap-1 text-xs text-emerald-600">
                      <CheckCircle className="w-3.5 h-3.5" />
                      {member.completedTasksCount ?? 0}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {member.isActive
                      ? <span className="flex items-center gap-1 text-xs text-emerald-600"><BadgeCheck className="w-3.5 h-3.5" />{language === 'AR' ? 'نشط' : 'Active'}</span>
                      : <span className="flex items-center gap-1 text-xs text-red-500"><BadgeX className="w-3.5 h-3.5" />{language === 'AR' ? 'غير نشط' : 'Inactive'}</span>
                    }
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleView(member)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => openEdit(member)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(String(member.id))} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {staff.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400">{language === 'AR' ? 'لا يوجد أعضاء بعد' : 'No staff members yet'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {staff.map(member => (
            <div key={member.id} className="border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center overflow-hidden">
                    {member.profileImageUrl ? (
                      <img src={resolveImage(member.profileImageUrl)} alt={member.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-primary-700 font-bold text-lg">{member.fullName?.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 truncate">{member.fullName}</h3>
                    <p className="text-xs text-slate-400 truncate">{member.email}</p>
                  </div>
                  {member.isActive
                    ? <BadgeCheck className="w-5 h-5 text-emerald-500" />
                    : <BadgeX className="w-5 h-5 text-red-400" />
                  }
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                  {member.phoneNumber && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{member.phoneNumber}</span>}
                </div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="p-2 bg-amber-50 rounded-lg text-center">
                    <p className="text-xs text-amber-600">{language === 'AR' ? 'معلقة' : 'Pending'}</p>
                    <p className="font-bold text-amber-700">{member.pendingTasksCount ?? 0}</p>
                  </div>
                  <div className="p-2 bg-emerald-50 rounded-lg text-center">
                    <p className="text-xs text-emerald-600">{language === 'AR' ? 'منجزة' : 'Completed'}</p>
                    <p className="font-bold text-emerald-700">{member.completedTasksCount ?? 0}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleView(member)} className="flex-1 py-2 text-blue-600 hover:bg-blue-50 rounded-lg text-sm flex items-center justify-center gap-1"><Eye className="w-4 h-4" />{language === 'AR' ? 'عرض' : 'View'}</button>
                  <button onClick={() => openEdit(member)} className="flex-1 py-2 text-amber-600 hover:bg-amber-50 rounded-lg text-sm flex items-center justify-center gap-1"><Edit className="w-4 h-4" />{language === 'AR' ? 'تعديل' : 'Edit'}</button>
                  <button onClick={() => handleDelete(String(member.id))} className="flex-1 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm flex items-center justify-center gap-1"><Trash2 className="w-4 h-4" />{language === 'AR' ? 'حذف' : 'Delete'}</button>
                </div>
              </div>
            </div>
          ))}
          {staff.length === 0 && (
            <div className="col-span-full text-center py-16 text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>{language === 'AR' ? 'لا يوجد أعضاء بعد' : 'No staff members yet'}</p>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">
                {editingStaff ? (language === 'AR' ? 'تعديل عضو' : 'Edit Member') : (language === 'AR' ? 'إضافة عضو جديد' : 'Add Member')}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'الاسم الكامل' : 'Full Name'} *</label>
                <input type="text" value={formData.fullName} onChange={e => setFormData(prev => ({ ...prev, fullName: e.target.value }))} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'البريد الإلكتروني' : 'Email'} *</label>
                <input type="email" value={formData.email} onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'رقم الهاتف' : 'Phone Number'}</label>
                <input type="tel" value={formData.phoneNumber} onChange={e => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'الصورة الشخصية' : 'Profile Image'}</label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4">
                  {imagePreview ? (
                    <div className="relative mb-3">
                      <img src={imagePreview} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
                      <button type="button" onClick={() => { setImagePreview(''); setImageFile(null) }} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"><X className="w-3 h-3" /></button>
                    </div>
                  ) : null}
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 w-full py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-xs">
                    <Upload className="w-4 h-4" />{language === 'AR' ? 'رفع صورة' : 'Upload Image'}
                  </button>
                  <input type="file" ref={fileInputRef} accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) { setImagePreview(URL.createObjectURL(file)); setImageFile(file) }
                  }} className="hidden" />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.isActive} onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.checked }))} className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500" />
                <span className="text-sm font-medium text-slate-700">{language === 'AR' ? 'عضو نشط' : 'Active Member'}</span>
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} disabled={saving || !formData.fullName || !formData.email} className="flex-1 h-10 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" />{language === 'AR' ? 'جاري الحفظ...' : 'Saving...'}</> : <><Check className="w-4 h-4" />{language === 'AR' ? 'حفظ' : 'Save'}</>}
              </button>
              <button onClick={() => setShowModal(false)} className="flex-1 h-10 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200">{language === 'AR' ? 'إلغاء' : 'Cancel'}</button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewingStaff && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">{language === 'AR' ? 'تفاصيل العضو' : 'Member Details'}</h3>
              <button onClick={() => setShowViewModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center overflow-hidden">
                  {viewingStaff.profileImageUrl ? (
                    <img src={resolveImage(viewingStaff.profileImageUrl)} alt={viewingStaff.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-primary-700 font-bold text-lg">{viewingStaff.fullName?.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <p className="font-bold text-slate-800">{viewingStaff.fullName}</p>
                  <p className="text-xs text-slate-400">{viewingStaff.email}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
                  <span className="text-sm text-amber-700 flex items-center gap-2"><ClipboardList className="w-4 h-4" />{language === 'AR' ? 'المهام المعلقة' : 'Pending Tasks'}</span>
                  <span className="font-bold text-amber-700">{viewingStaff.pendingTasksCount ?? 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
                  <span className="text-sm text-emerald-700 flex items-center gap-2"><CheckCircle className="w-4 h-4" />{language === 'AR' ? 'المهام المنجزة' : 'Completed Tasks'}</span>
                  <span className="font-bold text-emerald-700">{viewingStaff.completedTasksCount ?? 0}</span>
                </div>
                {viewingStaff.phoneNumber && (
                  <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400" /><span className="text-sm text-slate-600">{viewingStaff.phoneNumber}</span></div>
                )}
                <div className="flex items-center gap-2">
                  {viewingStaff.isActive
                    ? <BadgeCheck className="w-4 h-4 text-emerald-500" />
                    : <BadgeX className="w-4 h-4 text-red-500" />
                  }
                  <span className="text-sm">{viewingStaff.isActive ? (language === 'AR' ? 'نشط' : 'Active') : (language === 'AR' ? 'غير نشط' : 'Inactive')}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowViewModal(false); openEdit(viewingStaff) }} className="flex-1 h-10 bg-amber-600 text-white rounded-xl hover:bg-amber-700 flex items-center justify-center gap-2">
                <Edit className="w-4 h-4" />{language === 'AR' ? 'تعديل' : 'Edit'}
              </button>
              <button onClick={() => setShowViewModal(false)} className="flex-1 h-10 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200">{language === 'AR' ? 'إغلاق' : 'Close'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
