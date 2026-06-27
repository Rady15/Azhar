import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, X, User, Phone, Home, Calendar, Loader2, Hash } from 'lucide-react'
import { api } from '../services/api'

interface Tenant {
  id: string | number
  fullName: string
  email: string
  password?: string
  phoneNumber: string
  houseNumber: string
  contractNumber: string
  contractEndDate: string
  isActive: boolean
}

interface TenantsProps {
  language: 'AR' | 'EN'
}

function Tenants({ language }: TenantsProps) {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null)
  const [viewingTenant, setViewingTenant] = useState<Tenant | null>(null)
  const [formData, setFormData] = useState<Partial<Tenant>>({})

  const mapToFrontend = (item: any): Tenant => ({
    id: item.id || String(Date.now()),
    fullName: item.fullName || '',
    email: item.email || '',
    phoneNumber: item.phoneNumber || '',
    houseNumber: item.houseNumber || '',
    contractNumber: item.contractNumber || '',
    contractEndDate: item.contractEndDate ? item.contractEndDate.split('T')[0] : '',
    isActive: item.isActive !== false
  })

  const mapToBackend = (tenant: Partial<Tenant>): any => ({
    fullName: (tenant.fullName || '').replace(/\s+/g, ''),
    email: tenant.email || '',
    userName: (tenant.email || '').split('@')[0].replace(/[^a-zA-Z0-9]/g, ''),
    password: tenant.password || 'Default@123',
    phoneNumber: tenant.phoneNumber || '',
    houseNumber: tenant.houseNumber || '',
    contractNumber: tenant.contractNumber || '',
    contractEndDate: tenant.contractEndDate ? new Date(tenant.contractEndDate).toISOString() : new Date().toISOString(),
    isActive: tenant.isActive ?? true
  })

  const fetchTenants = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.getTenants()
      if (data && Array.isArray((data as any).tenants)) {
        setTenants((data as any).tenants.map(mapToFrontend))
      } else if (Array.isArray(data)) {
        setTenants(data.map(mapToFrontend))
      }
    } catch (err: any) {
      console.error('Fetch tenants error:', err)
      setError(language === 'AR' ? 'فشل تحميل بيانات المستأجرين من الخادم' : 'Failed to fetch tenants from server')
      setTenants([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTenants()
  }, [])

  const handleAdd = () => {
    setEditingTenant(null)
    setFormData({ fullName: '', email: '', password: '', phoneNumber: '', houseNumber: '', contractNumber: '', contractEndDate: '', isActive: true })
    setShowModal(true)
  }

  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant)
    setFormData({ ...tenant, password: '' })
    setShowModal(true)
  }

  const handleView = (tenant: Tenant) => {
    setViewingTenant(tenant)
    setShowViewModal(true)
  }

  const handleDelete = async (id: string | number) => {
    if (window.confirm(language === 'AR' ? 'هل أنت متأكد من الحذف؟' : 'Are you sure you want to delete?')) {
      const target = tenants.find(t => t.id === id)
      if (!target) return

      try {
        await api.deleteTenant(String(id), mapToBackend(target))
        setTenants(tenants.filter(t => t.id !== id))
      } catch (err: any) {
        console.error('Delete tenant error:', err)
        alert(language === 'AR' ? `فشل الحذف: ${err.message}` : `Delete failed: ${err.message}`)
        setTenants(tenants.filter(t => t.id !== id))
      }
    }
  }

  const handleToggleActive = async (tenant: Tenant) => {
    const updated: Tenant = { ...tenant, isActive: !tenant.isActive }
    try {
      await api.toggleActiveTenant(String(tenant.id), mapToBackend(updated))
      setTenants(tenants.map(t => t.id === tenant.id ? updated : t))
    } catch (err: any) {
      console.error('Toggle status error:', err)
      setTenants(tenants.map(t => t.id === tenant.id ? updated : t))
    }
  }

  const handleSave = async () => {
    try {
      if (editingTenant) {
        const payload = mapToBackend({ ...editingTenant, ...formData })
        await api.updateTenant(String(editingTenant.id), payload)
        setTenants(tenants.map(t => t.id === editingTenant.id ? { ...t, ...formData } as Tenant : t))
      } else {
        const payload = mapToBackend(formData)
        const newTenantBackend = await api.createTenant(payload)
        const newTenant = mapToFrontend(newTenantBackend)
        if (formData.fullName) newTenant.fullName = formData.fullName
        setTenants([...tenants, newTenant])
      }
      setShowModal(false)
    } catch (err: any) {
      console.error('Save tenant error:', err)
      alert(language === 'AR' ? `خطأ: ${err.message}` : `Error: ${err.message}`)
    }
  }

  const t = (ar: string, en: string) => language === 'AR' ? ar : en

  return (
    <div className="bg-white rounded-2xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">{t('المستأجرين', 'Tenants')}</h2>
        <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors">
          <Plus className="w-4 h-4" />
          {t('إضافة مستأجر', 'Add Tenant')}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={fetchTenants} className="underline text-xs hover:text-red-900">{t('إعادة المحاولة', 'Retry')}</button>
        </div>
      )}

      {loading && tenants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin mb-2" />
          <p className="text-slate-500 text-sm">{t('جاري تحميل البيانات...', 'Loading tenants...')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('الاسم', 'Name')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('الهاتف', 'Phone')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('المنزل', 'House')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('العقد', 'Contract')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('الحالة', 'Status')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('الإجراءات', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map(tenant => (
                <tr key={tenant.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 text-slate-700">{tenant.fullName}</td>
                  <td className="py-3 px-4 text-slate-700">{tenant.phoneNumber}</td>
                  <td className="py-3 px-4 text-slate-700">{tenant.houseNumber}</td>
                  <td className="py-3 px-4 text-slate-700">{tenant.contractNumber}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleToggleActive(tenant)}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-200 hover:scale-105 active:scale-95 ${tenant.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                      title={t('اضغط لتغيير الحالة', 'Click to toggle status')}
                    >
                      {tenant.isActive ? t('نشط', 'Active') : t('غير نشط', 'Inactive')}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleView(tenant)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title={t('عرض', 'View')}>
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleEdit(tenant)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg" title={t('تعديل', 'Edit')}>
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(tenant.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title={t('حذف', 'Delete')}>
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
                {editingTenant ? t('تعديل مستأجر', 'Edit Tenant') : t('إضافة مستأجر', 'Add Tenant')}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('الاسم الكامل', 'Full Name')} *</label>
                <input type="text" value={formData.fullName || ''} onChange={e => setFormData({ ...formData, fullName: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('البريد الإلكتروني', 'Email')} *</label>
                  <input type="email" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('كلمة المرور', 'Password')}</label>
                  <input type="text" value={formData.password || ''} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" placeholder={editingTenant ? t('اتركه فارغاً', 'Leave blank') : ''} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('رقم الهاتف', 'Phone Number')} *</label>
                <input type="text" value={formData.phoneNumber || ''} onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('رقم المنزل', 'House Number')} *</label>
                  <input type="text" value={formData.houseNumber || ''} onChange={e => setFormData({ ...formData, houseNumber: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('رقم العقد', 'Contract Number')} *</label>
                  <input type="text" value={formData.contractNumber || ''} onChange={e => setFormData({ ...formData, contractNumber: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('تاريخ انتهاء العقد', 'Contract End Date')} *</label>
                <input type="date" value={formData.contractEndDate || ''} onChange={e => setFormData({ ...formData, contractEndDate: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('الحالة', 'Status')}</label>
                <select value={formData.isActive ? 'true' : 'false'} onChange={e => setFormData({ ...formData, isActive: e.target.value === 'true' })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm">
                  <option value="true">{t('نشط', 'Active')}</option>
                  <option value="false">{t('غير نشط', 'Inactive')}</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} className="flex-1 h-10 bg-primary-600 text-white rounded-xl hover:bg-primary-700">
                {t('حفظ', 'Save')}
              </button>
              <button onClick={() => setShowModal(false)} className="flex-1 h-10 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200">
                {t('إلغاء', 'Cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showViewModal && viewingTenant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">{t('بيانات المستأجر', 'Tenant Details')}</h3>
              <button onClick={() => setShowViewModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{viewingTenant.fullName}</p>
                  <p className="text-sm text-slate-500">{viewingTenant.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-600">{viewingTenant.phoneNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-600">{t('منزل', 'House')} {viewingTenant.houseNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-600">{t('عقد', 'Contract')}: {viewingTenant.contractNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-600">{viewingTenant.contractEndDate}</span>
                </div>
              </div>
            </div>
            <button onClick={() => setShowViewModal(false)} className="w-full h-10 mt-4 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200">
              {t('إغلاق', 'Close')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Tenants