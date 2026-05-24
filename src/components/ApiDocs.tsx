import { useState, useEffect } from 'react'
import { Copy, Check, Settings, Play, BookOpen } from 'lucide-react'
import { api } from '../services/api'

interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  descriptionAR: string
  descriptionEN: string
  defaultPayload?: any
  sampleResponse?: any
}

interface ApiDocsProps {
  language: 'AR' | 'EN'
}

export default function ApiDocs({ language }: ApiDocsProps) {
  const [selectedEndpoint, setSelectedEndpoint] = useState<number>(0)
  const [sandboxMethod, setSandboxMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('POST')
  const [sandboxPath, setSandboxPath] = useState<string>('/api/Account/login')
  const [customPayload, setCustomPayload] = useState<string>('')
  const [responseOutput, setResponseOutput] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const endpoints: ApiEndpoint[] = [
    // ── Account ─────────────────────────────────────────────
    {
      method: 'POST',
      path: '/api/Account/login',
      descriptionAR: 'تسجيل دخول مسؤول النظام والحصول على رمز التحقق Bearer Token.',
      descriptionEN: 'Authenticate administrator and acquire JWT Bearer Token.',
      defaultPayload: { email: 'admin@azhar.com', password: 'Admin@123' },
      sampleResponse: { token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', expiration: '2026-12-31T23:59:59Z', role: 'Admin' }
    },
    // ── Dashboard ────────────────────────────────────────────
    {
      method: 'GET',
      path: '/api/Dashboard',
      descriptionAR: 'جلب ملخص إحصائيات لوحة التحكم (مستأجرون، فلل، مدفوعات، صيانة).',
      descriptionEN: 'Retrieve dashboard summary statistics (tenants, villas, payments, maintenance).',
      sampleResponse: { totalTenants: 45, totalVillas: 50, pendingMaintenance: 8, totalRevenue: 185000 }
    },
    // ── Announcements ────────────────────────────────────────
    {
      method: 'GET',
      path: '/api/Announcements',
      descriptionAR: 'جلب قائمة جميع الإعلانات المنشورة.',
      descriptionEN: 'Retrieve all published announcements.',
      sampleResponse: [{ id: 'ann-uuid-1', title: 'عرض خاص', description: 'خصم 10%', type: 'Offer', createdAt: '2026-05-01T10:00:00Z' }]
    },
    {
      method: 'POST',
      path: '/api/Announcements',
      descriptionAR: 'إنشاء إعلان جديد وإرساله لجميع المستأجرين.',
      descriptionEN: 'Create and publish a new announcement to all tenants.',
      defaultPayload: { title: 'إعلان مهم', description: 'تفاصيل الإعلان', type: 'Announcement' },
      sampleResponse: { id: 'ann-uuid-new', title: 'إعلان مهم', createdAt: '2026-05-24T00:00:00Z' }
    },
    {
      method: 'DELETE',
      path: '/api/Announcements/ann-uuid-1',
      descriptionAR: 'حذف إعلان محدد بواسطة معرفه.',
      descriptionEN: 'Delete a specific announcement by ID.',
      sampleResponse: { success: true, message: 'Announcement deleted' }
    },
    // ── Complaints ───────────────────────────────────────────
    {
      method: 'GET',
      path: '/api/Complaints',
      descriptionAR: 'جلب قائمة جميع الشكاوى المقدمة من المستأجرين.',
      descriptionEN: 'Retrieve all tenant complaints with their current status.',
      sampleResponse: [{ id: 'cmp-uuid-1', subject: 'ضوضاء', description: 'ضوضاء ليلية', status: 'Pending', tenantName: 'Aya Ahmed' }]
    },
    {
      method: 'PUT',
      path: '/api/Complaints/cmp-uuid-1/reply',
      descriptionAR: 'الرد على شكوى مستأجر وتحديث حالتها.',
      descriptionEN: 'Reply to a tenant complaint and update its resolution status.',
      defaultPayload: { reply: 'تم التعامل مع الشكوى', status: 'Resolved' },
      sampleResponse: { id: 'cmp-uuid-1', status: 'Resolved', reply: 'تم التعامل مع الشكوى' }
    },
    // ── Villas ───────────────────────────────────────────────
    {
      method: 'GET',
      path: '/api/Villas',
      descriptionAR: 'جلب قائمة جميع الفلل مع بياناتها التفصيلية.',
      descriptionEN: 'Retrieve all villas with their detailed information.',
      sampleResponse: [{ id: 'villa-uuid-1', name: 'فلا رقم 1', number: '1', status: 'available', rent: 5000 }]
    },
    {
      method: 'POST',
      path: '/api/Villas',
      descriptionAR: 'إضافة فيلا جديدة للنظام.',
      descriptionEN: 'Add a new villa to the system.',
      defaultPayload: { name: 'فلا رقم 10', number: '10', address: 'الحي الشرقي', size: 350, bedrooms: 4, bathrooms: 3, rent: 5500, status: 'available', description: 'فلا فاخرة' },
      sampleResponse: { id: 'villa-uuid-new', name: 'فلا رقم 10', status: 'available' }
    },
    {
      method: 'PUT',
      path: '/api/Villas/villa-uuid-1',
      descriptionAR: 'تحديث بيانات فيلا محددة.',
      descriptionEN: 'Update details of a specific villa.',
      defaultPayload: { name: 'فلا رقم 1 (محدّثة)', rent: 5200, status: 'occupied' },
      sampleResponse: { id: 'villa-uuid-1', name: 'فلا رقم 1 (محدّثة)', rent: 5200, status: 'occupied' }
    },
    {
      method: 'DELETE',
      path: '/api/Villas/villa-uuid-1',
      descriptionAR: 'حذف فيلا من النظام نهائياً.',
      descriptionEN: 'Permanently remove a villa from the system.',
      sampleResponse: { success: true, message: 'Villa deleted successfully' }
    },
    // ── Payments ─────────────────────────────────────────────
    {
      method: 'GET',
      path: '/api/Payments',
      descriptionAR: 'جلب سجل جميع المدفوعات وحالاتها.',
      descriptionEN: 'Retrieve the full payment records and their statuses.',
      sampleResponse: [{ id: 'pay-uuid-1', tenantName: 'Aya Ahmed', amount: 5000, status: 'Paid', dueDate: '2026-05-01' }]
    },
    {
      method: 'POST',
      path: '/api/Payments',
      descriptionAR: 'تسجيل دفعة جديدة لمستأجر.',
      descriptionEN: 'Record a new payment for a tenant.',
      defaultPayload: { tenantId: 'tenant-uuid-123', amount: 5000, dueDate: '2026-06-01', description: 'إيجار يونيو' },
      sampleResponse: { id: 'pay-uuid-new', status: 'Pending', amount: 5000 }
    },
    {
      method: 'PUT',
      path: '/api/Payments/pay-uuid-1/status',
      descriptionAR: 'تحديث حالة دفعة محددة (مدفوعة / معلقة / متأخرة).',
      descriptionEN: 'Update the status of a specific payment record.',
      defaultPayload: { status: 'Paid' },
      sampleResponse: { id: 'pay-uuid-1', status: 'Paid' }
    },
    // ── Maintenance ──────────────────────────────────────────
    {
      method: 'GET',
      path: '/api/Maintenance',
      descriptionAR: 'جلب قائمة طلبات الصيانة وتصفيتها بحسب الفئة أو الوصف.',
      descriptionEN: 'Retrieve all maintenance requests, with optional category/description filtering.',
      defaultPayload: { category: 'Electrical', description: 'Low Power' },
      sampleResponse: [{ id: '334d5f2f-633e-416b-9448-f75c7ebece39', category: 'Electrical', description: 'Low Power in living room', status: 'Pending', createdAt: '2026-05-17T12:00:00Z' }]
    },
    {
      method: 'PUT',
      path: '/api/Maintenance/334d5f2f-633e-416b-9448-f75c7ebece39/status',
      descriptionAR: 'تحديث حالة طلب صيانة محدد مع كتابة ملاحظات المشرف.',
      descriptionEN: 'Update status of a specific maintenance request with administrator notes.',
      defaultPayload: { status: 'Completed', adminNotes: 'Main breaker reset successfully' },
      sampleResponse: { success: true, message: 'Status updated successfully' }
    },
    // ── Facilities ───────────────────────────────────────────
    {
      method: 'GET',
      path: '/api/Facilities/bookings',
      descriptionAR: 'جلب قائمة حجوزات المرافق والفلل مع التصفية الاختيارية.',
      descriptionEN: 'Retrieve club and amenity reservations, with optional filter parameters.',
      defaultPayload: { email: 'ayaahmed29392@gmail.com' },
      sampleResponse: [{ id: 'booking-789', facilityName: 'Swimming Pool', tenantName: 'Aya Ahmed', date: '2026-05-20', time: '14:00', status: 'Confirmed' }]
    },
    {
      method: 'POST',
      path: '/api/Facilities',
      descriptionAR: 'إضافة مرفق ترفيهي جديد مثل مسبح، صالة مناسبات أو ملعب.',
      descriptionEN: 'Create a new communal facility or amenity within the housing complex.',
      defaultPayload: { name: 'Olympic Pool Complex', description: 'Year-round heated pool', maxCapacity: 20, isAvailable: true },
      sampleResponse: { id: 'facility-uuid-555', name: 'Olympic Pool Complex', isAvailable: true }
    },
    {
      method: 'DELETE',
      path: '/api/Facilities/facility-uuid-555',
      descriptionAR: 'حذف مرفق ترفيهي من النظام وتصفية حجوزاته.',
      descriptionEN: 'Delete a facility by ID.',
      defaultPayload: { email: 'ayaahmed29392@gmail.com' },
      sampleResponse: { success: true, message: 'Facility removed successfully' }
    },
    {
      method: 'PUT',
      path: '/api/Facilities/bookings/booking-789/status',
      descriptionAR: 'الموافقة على الحجز أو إلغائه (تأكيد الحالة).',
      descriptionEN: 'Approve, confirm, or decline a facility booking status.',
      defaultPayload: { status: 'Confirmed' },
      sampleResponse: { id: 'booking-789', status: 'Confirmed' }
    },
    // ── Reports ──────────────────────────────────────────────
    {
      method: 'GET',
      path: '/api/Reports/financial',
      descriptionAR: 'جلب التقرير المالي الشامل (إيرادات، مدفوعات، نسب التحصيل).',
      descriptionEN: 'Retrieve the full financial report (revenue, payments, collection rates).',
      sampleResponse: { monthlyRevenue: 185000, yearlyRevenue: 2220000, totalPaid: 142000, totalPending: 14000, collectionRate: 91, growth: 8.5 }
    },
    {
      method: 'GET',
      path: '/api/Reports/maintenance',
      descriptionAR: 'جلب تقرير الصيانة (طلبات، حالات، تكاليف).',
      descriptionEN: 'Retrieve the maintenance summary report (requests, statuses, costs).',
      sampleResponse: { totalRequests: 28, pending: 8, inProgress: 5, completed: 15, totalCost: 12500, averageCost: 446 }
    },
    // ── Tenants ──────────────────────────────────────────────
    {
      method: 'GET',
      path: '/api/Tenants',
      descriptionAR: 'جلب قائمة جميع المستأجرين مع التصفية بالبريد الإلكتروني.',
      descriptionEN: 'Get list of all tenants, with optional email filtering.',
      defaultPayload: { email: 'ayaahmed29392@gmail.com' },
      sampleResponse: [{ id: 'tenant-uuid-123', fullName: 'Aya Ahmed', email: 'ayaahmed29392@gmail.com', phoneNumber: '011', houseNumber: '123', isActive: true }]
    },
    {
      method: 'POST',
      path: '/api/Tenants',
      descriptionAR: 'إضافة مستأجر جديد للنظام مع تحديد تفاصيل العقد والسكن.',
      descriptionEN: 'Register a new tenant in the system with tenancy details.',
      defaultPayload: { fullName: 'Aya Ahmed', email: 'aya1@example.com', password: 'Aya@29', phoneNumber: '011', houseNumber: '123', contractNumber: '1212', contractEndDate: '2026-12-31' },
      sampleResponse: { id: 'new-tenant-uuid', fullName: 'Aya Ahmed', email: 'aya1@example.com', isActive: true }
    },
    {
      method: 'GET',
      path: '/api/Tenants/tenant-uuid-123',
      descriptionAR: 'عرض الملف التعريفي والبيانات التفصيلية لمستأجر معين بواسطة معرفه.',
      descriptionEN: 'Retrieve deep profile details for a specific tenant by ID.',
      sampleResponse: { id: 'tenant-uuid-123', fullName: 'Aya Ahmed', email: 'ayaahmed29392@gmail.com', phoneNumber: '011', houseNumber: '123', contractNumber: '1212', contractEndDate: '2026-12-31' }
    },
    {
      method: 'PUT',
      path: '/api/Tenants/tenant-uuid-123',
      descriptionAR: 'تحديث بيانات السكن أو الهاتف لمستأجر مسجل.',
      descriptionEN: 'Update profile or tenancy parameters of an existing tenant.',
      defaultPayload: { fullName: 'Aya Ahmed Updated', phoneNumber: '0554433221', houseNumber: '124' },
      sampleResponse: { success: true, message: 'Tenant profile updated successfully' }
    },
    {
      method: 'DELETE',
      path: '/api/Tenants/tenant-uuid-123',
      descriptionAR: 'حذف مستأجر بشكل نهائي من قاعدة البيانات.',
      descriptionEN: 'Permanently remove a tenant record from the system.',
      defaultPayload: { fullName: 'Aya Ahmed' },
      sampleResponse: { success: true, message: 'Tenant deleted successfully' }
    },
    {
      method: 'PUT',
      path: '/api/Tenants/tenant-uuid-123/toggle-active',
      descriptionAR: 'تجميد أو تنشيط حالة حساب مستأجر.',
      descriptionEN: 'Toggle activation state of a tenant (Suspend / Activate).',
      defaultPayload: { fullName: 'Aya Ahmed' },
      sampleResponse: { id: 'tenant-uuid-123', isActive: false }
    }
  ]

  // Synchronize custom sandbox fields when an endpoint is selected
  useEffect(() => {
    const ep = endpoints[selectedEndpoint]
    setSandboxMethod(ep.method)
    setSandboxPath(ep.path)
    setCustomPayload(ep.defaultPayload ? JSON.stringify(ep.defaultPayload, null, 2) : '')
    setResponseOutput('')
  }, [selectedEndpoint])

  const handleSelectEndpoint = (index: number) => {
    setSelectedEndpoint(index)
  }

  // Auto trigger curl syntax
  const getCurlString = (method: string, path: string) => {
    const baseUrl = 'https://azhar.runasp.net'
    const token = localStorage.getItem('azhar_token') || 'YOUR_BEARER_TOKEN'
    let cmd = `curl -X ${method} "${baseUrl}${path}" \\\n`
    cmd += `  -H "Content-Type: application/json" \\\n`
    if (path !== '/api/Account/login') {
      cmd += `  -H "Authorization: Bearer ${token}"`
    }
    if (customPayload && method !== 'GET') {
      cmd += ` \\\n  -d '${customPayload.replace(/\n/g, '')}'`
    }
    return cmd
  }

  const handleCopyCurl = (index: number, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const handleRunTest = async () => {
    setLoading(true)
    setResponseOutput('')
    try {
      let payloadObj = null
      if (customPayload) {
        payloadObj = JSON.parse(customPayload)
      }

      // Live api wrapper request execution!
      const data = await api.customRequest(sandboxMethod, sandboxPath, payloadObj)
      setResponseOutput(JSON.stringify(data, null, 2))
    } catch (err: any) {
      console.error(err)
      setResponseOutput(`Error: ${err.message || 'Network error / CORS block'}\n\nNote: If this call failed due to CORS on localhost, the endpoint is correctly configured but the server must explicitly accept requests from your local hostname.`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Title Header */}
      {/* <div className="bg-slate-900 text-white rounded-3xl p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl -ml-20 -mb-20"></div>
        
        <div className="relative flex items-center gap-4 mb-4">
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
            <Terminal className="w-8 h-8 text-primary-400" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-widest text-primary-400 font-semibold">Sandbox Portal</span>
            <h1 className="text-2xl font-bold">
              {language === 'AR' ? 'بوابة المطورين - Sandbox & Interactive API' : 'Developer Hub - Interactive API Sandbox'}
            </h1>
          </div>
        </div>
        <p className="text-slate-300 text-sm max-w-3xl leading-relaxed">
          {language === 'AR' 
            ? 'مرحباً بك في مركز المطورين التفاعلي. استعرض نهايات الخدمة (Endpoints) البالغ عددها 28، اختبر الاستدعاءات مباشرة على الخادم الحي، وانسخ الأكواد البرمجية الجاهزة للتكامل الفوري.'
            : 'Welcome to the interactive developer suite. Explore all 28 REST API endpoints, trigger real live test runs against the production server, and copy complete cURL commands.'
          }
        </p>
      </div> */}

      {/* Recommended Adjustments to Backend Developer */}
      {/* <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold text-amber-800 mb-1">
              {language === 'AR' ? 'توصيات فنية لمطور الخلفية (Backend Developer Updates)' : 'Technical Recommendations for the Backend Dev'}
            </h3>
            <ul className="text-xs text-amber-700 list-disc list-inside space-y-2 mt-2 leading-relaxed">
              {language === 'AR' ? (
                <>
                  <li><strong>استعلامات GET مع JSON Body:</strong> تستخدم بعض العمليات مثل <code className="bg-amber-100 px-1 py-0.5 rounded">GET /api/Tenants</code> أجسام JSON للفلترة في أمثلة curl. نوصي بتحويل هذه الفلاتر إلى Query Parameters لضمان توافقها الكامل مع المتصفحات حيث تمنع بعض جدران الحماية أجسام البيانات في طلبات GET.</li>
                  <li><strong>إعدادات CORS:</strong> تأكد من تمكين <code className="bg-amber-100 px-1 py-0.5 rounded">Access-Control-Allow-Origin</code> للخادم لكي يتمكن المسؤولون من استدعاء API مباشرة من لوحة التحكم المحلية.</li>
                  <li><strong>هيكل استجابة تسجيل الدخول:</strong> يفضل إرجاع دور المستخدم وتاريخ انتهاء الرمز لتمكين التجديد التلقائي للرموز دون انقطاع الجلسة.</li>
                </>
              ) : (
                <>
                  <li><strong>GET Requests with Bodies:</strong> Standard browser environments sometimes strip bodies from HTTP GET requests (like <code className="bg-amber-100 px-1 py-0.5 rounded">GET /api/Tenants</code>). We advise transforming filter objects into URL Query Parameters.</li>
                  <li><strong>CORS Headers:</strong> Ensure the ASP.NET backend configures wildcard or dynamic local origins to allow smooth integration directly from custom clients.</li>
                  <li><strong>JWT Schema:</strong> It is highly recommended to append token expiration and authorization role fields directly in the auth response payloads.</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div> */}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Endpoints List */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-[650px]">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-slate-500" />
              <span className="font-semibold text-slate-800 text-sm">{language === 'AR' ? 'نهايات الخدمة (28)' : 'Endpoints Registry (28)'}</span>
            </div>
            <span className="text-xs bg-primary-100 text-primary-700 font-bold px-2 py-0.5 rounded-full">v1.0.0</span>
          </div>

          <div className="overflow-y-auto divide-y divide-slate-100 flex-1">
            {endpoints.map((ep, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectEndpoint(idx)}
                className={`w-full text-right p-4 transition-all hover:bg-slate-50 flex flex-col gap-1.5 ${selectedEndpoint === idx ? 'bg-primary-50/50 border-r-4 border-primary-600' : ''}`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${ep.method === 'GET' ? 'bg-blue-100 text-blue-700' :
                      ep.method === 'POST' ? 'bg-green-100 text-green-700' :
                        ep.method === 'PUT' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                    }`}>
                    {ep.method}
                  </span>
                  <code className="text-xs font-mono text-slate-700 text-left truncate max-w-[200px]" dir="ltr">{ep.path}</code>
                </div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  {language === 'AR' ? ep.descriptionAR : ep.descriptionEN}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Right Sandbox & Playground */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col h-[650px]">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-800 text-base">{language === 'AR' ? 'لوحة الاختبار التفاعلية' : 'Interactive Sandbox Playground'}</h3>
              <p className="text-xs text-slate-500">{language === 'AR' ? 'اختبر الاستدعاءات الحية مباشرة على الخادم' : 'Execute live requests with custom data'}</p>
            </div>

            <button
              onClick={handleRunTest}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 font-medium text-xs disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <>
                  <Settings className="w-3.5 h-3.5 animate-spin" />
                  {language === 'AR' ? 'جاري الاستدعاء...' : 'Executing...'}
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {language === 'AR' ? 'استدعاء الآن' : 'Run Query'}
                </>
              )}
            </button>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto pr-1">
            {/* Target Path View */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Request Destination</label>
              <div className="flex gap-2">
                <select
                  value={sandboxMethod}
                  onChange={e => setSandboxMethod(e.target.value as any)}
                  className="text-xs font-bold uppercase px-3 py-2 bg-slate-100 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
                <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                  <span className="text-xs text-slate-400 font-mono select-none mr-1">https://azhar.runasp.net</span>
                  <input
                    type="text"
                    value={sandboxPath}
                    onChange={e => setSandboxPath(e.target.value)}
                    className="flex-1 bg-transparent text-xs font-mono text-slate-700 focus:outline-none"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>

            {/* Custom JSON Payload Input */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  {language === 'AR' ? 'جسم الطلب (JSON Body)' : 'Request Payload (JSON)'}
                </label>
                {sandboxMethod === 'GET' && (
                  <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded font-medium border border-amber-100">
                    {language === 'AR' ? 'سيتم تحويله تلقائياً لـ Query Parameters' : 'Auto-converted to Query Params'}
                  </span>
                )}
              </div>
              <textarea
                value={customPayload}
                onChange={e => setCustomPayload(e.target.value)}
                className="w-full h-32 p-3 font-mono text-xs text-slate-800 border border-slate-200 rounded-xl focus:ring-1 focus:ring-primary-500 focus:border-primary-500 bg-slate-50"
                dir="ltr"
                placeholder="{}"
              />
            </div>

            {/* Live Copyable cURL Console */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-slate-700">cURL Command String</label>
                <button
                  onClick={() => handleCopyCurl(99, getCurlString(sandboxMethod, sandboxPath))}
                  className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1 font-medium"
                >
                  {copiedIndex === 99 ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      {language === 'AR' ? 'تم النسخ!' : 'Copied!'}
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      {language === 'AR' ? 'نسخ الأمر' : 'Copy cURL'}
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl text-[10px] font-mono overflow-x-auto leading-normal select-all" dir="ltr">
                {getCurlString(sandboxMethod, sandboxPath)}
              </pre>
            </div>

            {/* JSON Response Panel */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {language === 'AR' ? 'الاستجابة الفعلية من الخادم (Response Payload)' : 'Server Response Payload'}
              </label>
              {responseOutput ? (
                <pre className={`p-4 rounded-xl text-xs font-mono overflow-x-auto h-48 border max-h-48 overflow-y-auto ${responseOutput.startsWith('Error')
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-emerald-950 text-emerald-400 border-emerald-900'
                  }`} dir="ltr">
                  {responseOutput}
                </pre>
              ) : (
                <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400 text-xs">
                  {language === 'AR'
                    ? 'اضغط على زر "استدعاء الآن" بالأعلى لبدء الفحص وجلب الاستجابة الحية من خادم ASP.NET.'
                    : 'Click "Run Query" above to execute and retrieve live responses from the ASP.NET production server.'
                  }
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
