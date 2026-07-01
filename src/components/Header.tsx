import { useState, useMemo } from 'react'
import { Search, Bell, Globe, ChevronDown, LogOut, Users, Home, Wrench, AlertCircle, CreditCard, Megaphone, FileBarChart, CalendarCheck, Building2, Briefcase } from 'lucide-react'

interface Notification {
  id: number
  title: string
  message: string
  time: string
  unread: boolean
}

interface HeaderProps {
  language: 'AR' | 'EN'
  setLanguage: (lang: 'AR' | 'EN') => void
  notifications: Notification[]
  showNotifications: boolean
  setShowNotifications: (show: boolean) => void
  onLogout: () => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  setActiveTab: (tab: any) => void
}

interface SearchResult {
  id: string
  label: string
  icon: any
  category: string
}

function Header({ language, setLanguage, notifications, showNotifications, setShowNotifications, onLogout, searchQuery, setSearchQuery, setActiveTab }: HeaderProps) {
  const unreadCount = notifications.filter(n => n.unread).length
  const [showSuggestions, setShowSuggestions] = useState(false)

  const allResults: SearchResult[] = useMemo(() => [
    { id: 'tenants', label: language === 'AR' ? 'المستأجرين' : 'Tenants', icon: Users, category: language === 'AR' ? 'أقسام' : 'Sections' },
    { id: 'tenants-add', label: language === 'AR' ? 'إضافة مستأجر' : 'Add Tenant', icon: Users, category: language === 'AR' ? 'إجراءات' : 'Actions' },
    { id: 'villas', label: language === 'AR' ? 'الفلل' : 'Villas', icon: Home, category: language === 'AR' ? 'أقسام' : 'Sections' },
    { id: 'villas-add', label: language === 'AR' ? 'إضافة فيلا' : 'Add Villa', icon: Home, category: language === 'AR' ? 'إجراءات' : 'Actions' },
    { id: 'maintenance', label: language === 'AR' ? 'الصيانة' : 'Maintenance', icon: Wrench, category: language === 'AR' ? 'أقسام' : 'Sections' },
    { id: 'maintenance-add', label: language === 'AR' ? 'إضافة طلب صيانة' : 'Add Maintenance Request', icon: Wrench, category: language === 'AR' ? 'إجراءات' : 'Actions' },
    { id: 'complaints', label: language === 'AR' ? 'الشكاوى' : 'Complaints', icon: AlertCircle, category: language === 'AR' ? 'أقسام' : 'Sections' },
    { id: 'complaints-add', label: language === 'AR' ? 'إضافة شكوى' : 'Add Complaint', icon: AlertCircle, category: language === 'AR' ? 'إجراءات' : 'Actions' },
    { id: 'payments', label: language === 'AR' ? 'المدفوعات' : 'Payments', icon: CreditCard, category: language === 'AR' ? 'أقسام' : 'Sections' },
    { id: 'payments-add', label: language === 'AR' ? 'إضافة دفعة' : 'Add Payment', icon: CreditCard, category: language === 'AR' ? 'إجراءات' : 'Actions' },
    { id: 'ads', label: language === 'AR' ? 'الإعلانات' : 'Advertisements', icon: Megaphone, category: language === 'AR' ? 'أقسام' : 'Sections' },
    { id: 'ads-add', label: language === 'AR' ? 'إضافة إعلان' : 'Add Advertisement', icon: Megaphone, category: language === 'AR' ? 'إجراءات' : 'Actions' },
    { id: 'reports', label: language === 'AR' ? 'التقارير' : 'Reports', icon: FileBarChart, category: language === 'AR' ? 'أقسام' : 'Sections' },
    { id: 'bookings', label: language === 'AR' ? 'حجوزات المرافق' : 'Facility Bookings', icon: CalendarCheck, category: language === 'AR' ? 'أقسام' : 'Sections' },
    { id: 'bookings-add', label: language === 'AR' ? 'إضافة حجز' : 'Add Booking', icon: CalendarCheck, category: language === 'AR' ? 'إجراءات' : 'Actions' },
    { id: 'facilities', label: language === 'AR' ? 'المرافق' : 'Facilities', icon: Building2, category: language === 'AR' ? 'أقسام' : 'Sections' },
    { id: 'staff', label: language === 'AR' ? 'فريق العمل' : 'Staff', icon: Briefcase, category: language === 'AR' ? 'أقسام' : 'Sections' },
    { id: 'dashboard', label: language === 'AR' ? 'الرئيسية' : 'Dashboard', icon: Home, category: language === 'AR' ? 'أقسام' : 'Sections' },
  ], [language])

  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const query = searchQuery.toLowerCase()
    return allResults.filter(r => r.label.toLowerCase().includes(query)).slice(0, 8)
  }, [searchQuery, allResults])

  const handleSelectResult = (result: SearchResult) => {
    const tab = result.id.replace('-add', '')
    setActiveTab(tab)
    setSearchQuery('')
    setShowSuggestions(false)
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-50 flex items-center justify-between px-6">
      <div className="flex items-center gap-2">
        <img src="/logo.png" alt="Logo" className="h-10 w-auto rounded-lg object-contain" />
      </div>

      <div className="flex-1 max-w-xl mx-8 relative">
        <div className="relative">
          <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 ${language === 'AR' ? 'right-3' : 'left-3'}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setShowSuggestions(true)
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={language === 'AR' ? 'البحث في النظام...' : 'Search in system...'}
            className={`w-full h-10 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all ${language === 'AR' ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
          />
        </div>

        {showSuggestions && filteredResults.length > 0 && (
          <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50">
            {filteredResults.map((result) => (
              <button
                key={result.id}
                onClick={() => handleSelectResult(result)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-right"
              >
                <result.icon className="w-4 h-4 text-slate-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">{result.label}</p>
                  <p className="text-xs text-slate-400">{result.category}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={() => setLanguage(language === 'AR' ? 'EN' : 'AR')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
        >
          <Globe className="w-4 h-4" />
          <span>{language}</span>
          <ChevronDown className="w-3 h-3" />
        </button>

        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 left-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="p-3 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800">{language === 'AR' ? 'الإشعارات' : 'Notifications'}</h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.map((notif) => (
                  <div key={notif.id} className={`p-3 border-b border-slate-50 hover:bg-slate-50 ${notif.unread ? 'bg-primary-50' : ''}`}>
                    <p className="text-sm font-medium text-slate-700">{notif.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{notif.message}</p>
                    <p className="text-xs text-slate-400 mt-1">{notif.time}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <button 
          onClick={onLogout}
          className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
          title={language === 'AR' ? 'تسجيل الخروج' : 'Logout'}
        >
          <LogOut className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className={language === 'AR' ? 'text-right' : 'text-left'}>
            <p className="text-sm font-semibold text-slate-700">Ahmed Al-Ghamdi</p>
            <p className="text-xs text-slate-400">{language === 'AR' ? 'مدير النظام' : 'Admin'}</p>
          </div>
          <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center border-2 border-primary-200">
            <span className="text-primary-700 font-bold text-sm">أ.غ</span>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header