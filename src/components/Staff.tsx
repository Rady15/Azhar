import { useState, useEffect, useRef } from 'react'
import { Plus, Edit, Trash2, Eye, X, Users, Phone, Loader2, Check, BadgeCheck, BadgeX, Upload, ClipboardList, CheckCircle, LayoutList, Grid3X3, ShieldCheck, Play } from 'lucide-react'
import { api, API_BASE_URL, StaffModel, MaintenanceModel } from '../services/api'
import { useToast } from './Toast'

const ALL_PERMISSIONS: { key: string; labelAr: string; labelEn: string }[] = [
  { key: 'dashboard', labelAr: 'الرئيسية', labelEn: 'Dashboard' },
  { key: 'tenants', labelAr: 'المستأجرين', labelEn: 'Tenants' },
  { key: 'villas', labelAr: 'الفلل', labelEn: 'Villas' },
  { key: 'maintenance', labelAr: 'الصيانة', labelEn: 'Maintenance' },
  { key: 'maintenance.assign', labelAr: 'تعيين الصيانة', labelEn: 'Assign Maintenance' },
  { key: 'complaints', labelAr: 'الشكاوى', labelEn: 'Complaints' },
  { key: 'payments', labelAr: 'المدفوعات', labelEn: 'Payments' },
  { key: 'ads', labelAr: 'الخطابات', labelEn: 'Letters' },
  { key: 'reports', labelAr: 'التقارير', labelEn: 'Reports' },
  { key: 'facilities', labelAr: 'إدارة المرافق', labelEn: 'Facilities' },
  { key: 'bookings', labelAr: 'حجوزات المرافق', labelEn: 'Bookings' },
  { key: 'staff', labelAr: 'فريق العمل', labelEn: 'Staff' },
]

interface StaffProps {
  language: 'AR' | 'EN'
}

export default function Staff({ language }: StaffProps) {
  const { showToast, confirm } = useToast()
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
    password: '',
    isActive: true,
    permissions: [] as string[]
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [staffTasks, setStaffTasks] = useState<MaintenanceModel[]>([])
  const [tasksLoading, setTasksLoading] = useState(false)
  const [updatingTask, setUpdatingTask] = useState<string | null>(null)

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
    setFormData({ fullName: '', email: '', phoneNumber: '', password: '', isActive: true, permissions: ALL_PERMISSIONS.map(p => p.key) })
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
      password: '',
      isActive: member.isActive ?? true,
      permissions: member.permissions ?? ALL_PERMISSIONS.map(p => p.key)
    })
    setImageFile(null)
    setImagePreview(member.profileImageUrl ? resolveImage(member.profileImageUrl) : '')
    setShowModal(true)
  }

  const handleView = async (member: StaffModel) => {
    setViewingStaff(member)
    setShowViewModal(true)
    setTasksLoading(true)
    try {
      const data = await api.getMaintenance()
      const list: MaintenanceModel[] = Array.isArray(data) ? data : (data as any)?.maintenances ?? (data as any)?.data ?? []
      setStaffTasks(list.filter(t => t.assignedToId === member.id))
    } catch {
      setStaffTasks([])
    } finally {
      setTasksLoading(false)
    }
  }

  const handleUpdateTaskStatus = async (taskId: string, newStatus: number, notes?: string) => {
    setUpdatingTask(taskId)
    try {
      await api.updateMaintenanceStatus(taskId, { Status: newStatus, AdminNotes: notes || '' })
      setStaffTasks(prev => prev.map(t => {
        if (t.id === taskId) {
          const statusMap = ['Submitted', 'Assigned', 'InProgress', 'Completed', 'Cancelled']
          return { ...t, status: statusMap[newStatus] || t.status }
        }
        return t
      }))
      showToast('success', language === 'AR' ? 'تم تحديث حالة المهمة بنجاح' : 'Task status updated successfully')
    } catch (err: any) {
      showToast('error', err.message || (language === 'AR' ? 'تعذر تحديث المهمة' : 'Failed to update task'))
    } finally {
      setUpdatingTask(null)
    }
  }

  const handleDelete = async (id: string) => {
    confirm(
      language === 'AR' ? 'هل أنت متأكد من حذف هذا العضو؟' : 'Are you sure you want to delete this staff member?',
      async () => {
        try {
          await api.deleteStaff(id)
          setStaff(prev => prev.filter(m => m.id !== id))
          showToast('success', language === 'AR' ? 'تم حذف العضو بنجاح' : 'Staff member deleted successfully')
        } catch (err: any) {
          console.error('Delete staff error:', err)
          showToast('error', language === 'AR' ? `تعذر حذف العضو: ${err.message}` : `Could not delete staff member: ${err.message}`)
        }
      },
      {
        confirmLabel: language === 'AR' ? 'حذف' : 'Delete',
        cancelLabel: language === 'AR' ? 'إلغاء' : 'Cancel',
      },
    )
  }

  const handleSave = async () => {
    if (!formData.fullName || (!editingStaff && !formData.email)) return

    setSaving(true)
    try {
      if (editingStaff && editingStaff.id) {
        const payload: Record<string, any> = {
          FullName: formData.fullName,
        }
        if (imageFile) {
          payload.ProfileImage = imageFile
        }
        if (formData.email) payload.Email = formData.email
        if (formData.phoneNumber) payload.PhoneNumber = formData.phoneNumber
        payload.isActive = formData.isActive
        payload.permissions = formData.permissions
        const updated = await api.updateStaff(editingStaff.id, payload)
        setStaff(prev => prev.map(m => m.id === editingStaff.id ? { ...m, ...updated } : m))
      } else {
        const payload: Record<string, any> = {
          FullName: formData.fullName,
          Email: formData.email,
          PhoneNumber: formData.phoneNumber,
          Password: formData.password,
        }
        if (imageFile) {
          payload.ProfileImage = imageFile
        }
        payload.isActive = formData.isActive
        payload.permissions = formData.permissions
        const created = await api.createStaff(payload)
        setStaff(prev => [created, ...prev])
      }

      setShowModal(false)
      setEditingStaff(null)
      showToast('success', language === 'AR' ? 'تم حفظ العضو بنجاح' : 'Staff member saved successfully')
    } catch (err: any) {
      console.error('Save staff error:', err)
      showToast('error', language === 'AR' ? `تعذر حفظ العضو: ${err.message}` : `Could not save staff member: ${err.message}`)
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
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{language === 'AR' ? 'المهام المعلقة' : 'Pending'}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{language === 'AR' ? 'المهام المنجزة' : 'Completed'}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{language === 'AR' ? 'الصلاحيات' : 'Permissions'}</th>
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
                    <div className="flex flex-wrap gap-1">
                      {(member.permissions ?? []).length === ALL_PERMISSIONS.length ? (
                        <span className="px-1.5 py-0.5 bg-primary-50 text-primary-600 rounded text-xs">{language === 'AR' ? 'الكل' : 'All'}</span>
                      ) : (member.permissions ?? []).length === 0 ? (
                        <span className="text-xs text-slate-400">—</span>
                      ) : (
                        (member.permissions ?? []).slice(0, 3).map(p => {
                          const perm = ALL_PERMISSIONS.find(x => x.key === p)
                          return <span key={p} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">{perm ? (language === 'AR' ? perm.labelAr : perm.labelEn) : p}</span>
                        })
                      )}
                      {(member.permissions ?? []).length > 3 && (
                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded text-xs">+{(member.permissions ?? []).length - 3}</span>
                      )}
                    </div>
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
                <tr><td colSpan={8} className="text-center py-12 text-slate-400">{language === 'AR' ? 'لا يوجد أعضاء بعد' : 'No staff members yet'}</td></tr>
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
                <div className="flex flex-wrap gap-1 mb-3">
                  {(member.permissions ?? []).length === ALL_PERMISSIONS.length ? (
                    <span className="px-2 py-0.5 bg-primary-50 text-primary-600 rounded text-xs font-medium">{language === 'AR' ? 'جميع الصلاحيات' : 'All Permissions'}</span>
                  ) : (member.permissions ?? []).map(p => {
                    const perm = ALL_PERMISSIONS.find(x => x.key === p)
                    return perm ? <span key={p} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">{language === 'AR' ? perm.labelAr : perm.labelEn}</span> : null
                  })}
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
              {!editingStaff && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'كلمة المرور' : 'Password'} *</label>
                  <input type="password" value={formData.password} onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
                </div>
              )}
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

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-primary-600" />
                  {language === 'AR' ? 'الصلاحيات' : 'Permissions'}
                </label>
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl">
                  {ALL_PERMISSIONS.map(p => (
                    <label key={p.key} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(p.key)}
                        onChange={e => {
                          if (e.target.checked) {
                            setFormData(prev => ({ ...prev, permissions: [...prev.permissions, p.key] }))
                          } else {
                            setFormData(prev => ({ ...prev, permissions: prev.permissions.filter(k => k !== p.key) }))
                          }
                        }}
                        className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-slate-600">{language === 'AR' ? p.labelAr : p.labelEn}</span>
                    </label>
                  ))}
                </div>
              </div>
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
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">{language === 'AR' ? 'تفاصيل العضو' : 'Member Details'}</h3>
              <button onClick={() => setShowViewModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            {/* Profile Card */}
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl mb-4">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                {viewingStaff.profileImageUrl ? (
                  <img src={resolveImage(viewingStaff.profileImageUrl)} alt={viewingStaff.fullName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-primary-700 font-bold text-lg">{viewingStaff.fullName?.charAt(0)}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 truncate">{viewingStaff.fullName}</p>
                <p className="text-xs text-slate-400 truncate">{viewingStaff.email}</p>
              </div>
              {viewingStaff.isActive
                ? <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full"><BadgeCheck className="w-3 h-3" />{language === 'AR' ? 'نشط' : 'Active'}</span>
                : <span className="flex items-center gap-1 text-xs text-red-500 bg-red-50 px-2 py-1 rounded-full"><BadgeX className="w-3 h-3" />{language === 'AR' ? 'غير نشط' : 'Inactive'}</span>
              }
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-amber-50 rounded-xl flex items-center justify-between">
                <span className="text-sm text-amber-700 flex items-center gap-2"><ClipboardList className="w-4 h-4" />{language === 'AR' ? 'معلقة' : 'Pending'}</span>
                <span className="font-bold text-amber-700">{viewingStaff.pendingTasksCount ?? 0}</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl flex items-center justify-between">
                <span className="text-sm text-emerald-700 flex items-center gap-2"><CheckCircle className="w-4 h-4" />{language === 'AR' ? 'منجزة' : 'Completed'}</span>
                <span className="font-bold text-emerald-700">{viewingStaff.completedTasksCount ?? 0}</span>
              </div>
            </div>

            {viewingStaff.phoneNumber && (
              <div className="flex items-center gap-2 mb-3 text-sm text-slate-600">
                <Phone className="w-4 h-4 text-slate-400" /><span>{viewingStaff.phoneNumber}</span>
              </div>
            )}

            {/* Permissions */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {(viewingStaff.permissions ?? []).length === ALL_PERMISSIONS.length ? (
                <span className="px-2 py-1 bg-primary-50 text-primary-600 rounded-lg text-xs font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />{language === 'AR' ? 'جميع الصلاحيات' : 'All Permissions'}
                </span>
              ) : (viewingStaff.permissions ?? []).map(p => {
                const perm = ALL_PERMISSIONS.find(x => x.key === p)
                return perm ? (
                  <span key={p} className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs">{language === 'AR' ? perm.labelAr : perm.labelEn}</span>
                ) : null
              })}
            </div>

            {/* Tasks Section */}
            <div className="border-t border-slate-100 pt-4">
              <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-primary-600" />
                {language === 'AR' ? 'المهام المسندة' : 'Assigned Tasks'}
                {tasksLoading && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
              </h4>
              {tasksLoading ? (
                <div className="text-center py-6 text-slate-400 text-sm">{language === 'AR' ? 'جاري تحميل المهام...' : 'Loading tasks...'}</div>
              ) : staffTasks.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-sm">{language === 'AR' ? 'لا توجد مهام مسندة لهذا العضو' : 'No tasks assigned to this member'}</div>
              ) : (
                <div className="space-y-2">
                  {staffTasks.map(task => {
                    const statusColors: Record<string, string> = { Submitted: 'text-purple-600 bg-purple-50', Assigned: 'text-amber-600 bg-amber-50', InProgress: 'text-blue-600 bg-blue-50', Completed: 'text-emerald-600 bg-emerald-50', Cancelled: 'text-slate-500 bg-slate-50' }
                    const statusLabels: Record<string, string> = {
                      Submitted: language === 'AR' ? 'مقدم' : 'Submitted',
                      Assigned: language === 'AR' ? 'تم التعيين' : 'Assigned',
                      InProgress: language === 'AR' ? 'قيد العمل' : 'In Progress',
                      Completed: language === 'AR' ? 'مكتمل' : 'Completed',
                      Cancelled: language === 'AR' ? 'ملغى' : 'Cancelled',
                    }
                    return (
                      <div key={task.id} className="p-3 bg-white border border-slate-100 rounded-xl hover:shadow-sm transition-shadow">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-slate-800 truncate">{task.category || language === 'AR' ? 'صيانة' : 'Maintenance'}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusColors[task.status || ''] || 'bg-slate-50 text-slate-500'}`}>
                                {statusLabels[task.status || ''] || task.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 truncate">{task.description}</p>
                            <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400">
                              {task.houseNumber && <span>{'🏠'} {task.houseNumber}</span>}
                              {task.priority && <span className={`font-medium ${task.priority === 'Urgent' ? 'text-red-500' : task.priority === 'High' ? 'text-orange-500' : 'text-slate-500'}`}>{task.priority}</span>}
                              {task.createdAt && <span>{new Date(task.createdAt).toLocaleDateString()}</span>}
                            </div>
                          </div>
                          {/* Status actions */}
                          <div className="flex gap-1 shrink-0">
                            {task.status !== 'Completed' && task.status !== 'Cancelled' && (
                              <>
                                {(task.status === 'Submitted' || task.status === 'Assigned') && (
                                  <button onClick={() => handleUpdateTaskStatus(task.id!, 2, 'Started working')} disabled={updatingTask === task.id} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-40" title={language === 'AR' ? 'بدء العمل' : 'Start Progress'}>
                                    {updatingTask === task.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                                  </button>
                                )}
                                <button onClick={() => handleUpdateTaskStatus(task.id!, 3, 'Completed')} disabled={updatingTask === task.id} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg disabled:opacity-40" title={language === 'AR' ? 'إكمال' : 'Complete'}>
                                  {updatingTask === task.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                </button>
                                <button onClick={() => handleUpdateTaskStatus(task.id!, 4, 'Cancelled')} disabled={updatingTask === task.id} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg disabled:opacity-40" title={language === 'AR' ? 'إلغاء' : 'Cancel'}>
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-4">
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
