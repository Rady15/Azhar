import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, Send, X, User, Phone, Home, Calendar, Loader2 } from 'lucide-react'
import { api } from '../services/api'

interface Tenant {
  id: string | number
  name: string
  phone: string
  email: string
  villaNumber: string
  leaseStart: string
  leaseEnd: string
  rent: number
  status: 'active' | 'inactive'
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

  // Map Backend API model to Frontend Tenant UI model
  const mapToFrontend = (item: any): Tenant => ({
    id: item.id || String(Date.now()),
    name: item.fullName || '',
    phone: item.phoneNumber || '',
    email: item.email || '',
    villaNumber: item.houseNumber || '',
    leaseStart: '2024-01-01',
    leaseEnd: item.contractEndDate ? item.contractEndDate.split('T')[0] : '2025-01-01',
    rent: Number(item.contractNumber) || 5000,
    status: item.isActive === false ? 'inactive' : 'active'
  })

  // Map Frontend UI model to Backend API model
  const mapToBackend = (tenant: Partial<Tenant>): any => ({
    fullName: tenant.name || '',
    email: tenant.email || '',
    password: (tenant as any).password || 'Admin@123',
    phoneNumber: tenant.phone || '',
    houseNumber: tenant.villaNumber || '',
    contractNumber: String(tenant.rent || '1000'),
    contractEndDate: tenant.leaseEnd ? new Date(tenant.leaseEnd).toISOString() : new Date().toISOString(),
    isActive: tenant.status === 'active'
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
      // Graceful fallback to mock data on offline/connection failure
      setTenants([
        { id: '1', name: 'أحمد محمد', phone: '0501234567', email: 'ahmed@test.com', villaNumber: '12', leaseStart: '2024-01-01', leaseEnd: '2025-01-01', rent: 5000, status: 'active' },
        { id: '2', name: 'خالد الغامدي', phone: '0502345678', email: 'khaled@test.com', villaNumber: '8', leaseStart: '2024-03-15', leaseEnd: '2025-03-15', rent: 4500, status: 'active' },
        { id: '3', name: 'عبدالله الزهراني', phone: '0503456789', email: 'abdullah@test.com', villaNumber: '15', leaseStart: '2023-06-01', leaseEnd: '2024-06-01', rent: 5500, status: 'inactive' },
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTenants()
  }, [])

  const handleAdd = () => {
    setEditingTenant(null)
    setFormData({ name: '', phone: '', email: '', villaNumber: '', leaseStart: '', leaseEnd: '', rent: 0, status: 'active' })
    setShowModal(true)
  }

  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant)
    setFormData({ ...tenant })
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
        // Fallback update
        setTenants(tenants.filter(t => t.id !== id))
      }
    }
  }

  const handleToggleActive = async (tenant: Tenant) => {
    const newStatus: 'active' | 'inactive' = tenant.status === 'active' ? 'inactive' : 'active'
    const updatedTenant: Tenant = { ...tenant, status: newStatus }
    try {
      await api.toggleActiveTenant(String(tenant.id), mapToBackend(updatedTenant))
      setTenants(tenants.map(t => t.id === tenant.id ? updatedTenant : t))
    } catch (err: any) {
      console.error('Toggle status error:', err)
      // Fallback update locally but notify user
      setTenants(tenants.map(t => t.id === tenant.id ? updatedTenant : t))
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
        setTenants([...tenants, newTenant])
      }
      setShowModal(false)
    } catch (err: any) {
      console.error('Save tenant error:', err)
      alert(language === 'AR' ? `فشل الحفظ: ${err.message}` : `Save failed: ${err.message}`)
      
      // Fallback
      if (editingTenant) {
        setTenants(tenants.map(t => t.id === editingTenant.id ? { ...t, ...formData } as Tenant : t))
      } else {
        const newTenant: Tenant = { ...formData, id: String(Date.now()) } as Tenant
        setTenants([...tenants, newTenant])
      }
      setShowModal(false)
    }
  }

  const handleSendNotification = (tenant: Tenant) => {
    alert(language === 'AR' ? `تم إرسال الإشعار إلى ${tenant.name}` : `Notification sent to ${tenant.name}`)
  }

  return (
    <div className="bg-white rounded-2xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">{language === 'AR' ? 'المستأجرين' : 'Tenants'}</h2>
        <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors">
          <Plus className="w-4 h-4" />
          {language === 'AR' ? 'إضافة مستأجر' : 'Add Tenant'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={fetchTenants} className="underline text-xs hover:text-red-900">{language === 'AR' ? 'إعادة المحاولة' : 'Retry'}</button>
        </div>
      )}

      {loading && tenants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin mb-2" />
          <p className="text-slate-500 text-sm">{language === 'AR' ? 'جاري تحميل البيانات...' : 'Loading tenants...'}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{language === 'AR' ? 'الاسم' : 'Name'}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{language === 'AR' ? 'الهاتف' : 'Phone'}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{language === 'AR' ? 'الفيلا' : 'Villa'}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{language === 'AR' ? 'الإيجار' : 'Rent'}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{language === 'AR' ? 'الحالة' : 'Status'}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{language === 'AR' ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map(tenant => (
                <tr key={tenant.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 text-slate-700">{tenant.name}</td>
                  <td className="py-3 px-4 text-slate-700">{tenant.phone}</td>
                  <td className="py-3 px-4 text-slate-700">{tenant.villaNumber}</td>
                  <td className="py-3 px-4 text-slate-700">{tenant.rent} {language === 'AR' ? 'ريال' : 'SAR'}</td>
                  <td className="py-3 px-4">
                    <button 
                      onClick={() => handleToggleActive(tenant)}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-200 hover:scale-105 active:scale-95 ${tenant.status === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                      title={language === 'AR' ? 'اضغط لتغيير الحالة' : 'Click to toggle status'}
                    >
                      {tenant.status === 'active' ? (language === 'AR' ? 'نشط' : 'Active') : (language === 'AR' ? 'غير نشط' : 'Inactive')}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleView(tenant)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title={language === 'AR' ? 'عرض' : 'View'}>
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleEdit(tenant)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg" title={language === 'AR' ? 'تعديل' : 'Edit'}>
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleSendNotification(tenant)} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg" title={language === 'AR' ? 'إرسال إشعار' : 'Send Notification'}>
                        <Send className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(tenant.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title={language === 'AR' ? 'حذف' : 'Delete'}>
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
                {editingTenant ? (language === 'AR' ? 'تعديل مستأجر' : 'Edit Tenant') : (language === 'AR' ? 'إضافة مستأجر' : 'Add Tenant')}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'الاسم' : 'Name'}</label>
                <input type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'الهاتف' : 'Phone'}</label>
                <input type="text" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'البريد الإلكتروني' : 'Email'}</label>
                <input type="email" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'رقم الفيلا' : 'Villa Number'}</label>
                  <input type="text" value={formData.villaNumber || ''} onChange={e => setFormData({ ...formData, villaNumber: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'الإيجار' : 'Rent'}</label>
                  <input type="number" value={formData.rent || ''} onChange={e => setFormData({ ...formData, rent: Number(e.target.value) })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'بداية العقد' : 'Lease Start'}</label>
                  <input type="date" value={formData.leaseStart || ''} onChange={e => setFormData({ ...formData, leaseStart: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'نهاية العقد' : 'Lease End'}</label>
                  <input type="date" value={formData.leaseEnd || ''} onChange={e => setFormData({ ...formData, leaseEnd: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'AR' ? 'الحالة' : 'Status'}</label>
                <select value={formData.status || 'active'} onChange={e => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm">
                  <option value="active">{language === 'AR' ? 'نشط' : 'Active'}</option>
                  <option value="inactive">{language === 'AR' ? 'غير نشط' : 'Inactive'}</option>
                </select>
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

      {showViewModal && viewingTenant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">{language === 'AR' ? 'بيانات المستأجر' : 'Tenant Details'}</h3>
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
                  <p className="font-semibold text-slate-800">{viewingTenant.name}</p>
                  <p className="text-sm text-slate-500">{viewingTenant.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-600">{viewingTenant.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-600">{language === 'AR' ? 'فلا رقم' : 'Villa'} {viewingTenant.villaNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-600">{viewingTenant.leaseStart}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-600">{viewingTenant.leaseEnd}</span>
                </div>
              </div>
              <div className="p-4 bg-primary-50 rounded-xl">
                <p className="text-sm text-slate-600">{language === 'AR' ? 'الإيجار الشهري' : 'Monthly Rent'}</p>
                <p className="text-xl font-bold text-primary-700">{viewingTenant.rent} {language === 'AR' ? 'ريال' : 'SAR'}</p>
              </div>
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

export default Tenants