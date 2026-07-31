import { 
  LayoutDashboard, 
  Users, 
  Home, 
  Wrench, 
  AlertCircle, 
  CreditCard, 
  Mail, 
  FileBarChart,
  CalendarCheck,
  Building2,
  Briefcase,
  ListChecks
} from 'lucide-react'

type TabType = 'dashboard' | 'tenants' | 'villas' | 'maintenance' | 'complaints' | 'payments' | 'ads' | 'reports' | 'facilities' | 'bookings' | 'staff' | 'my-tasks' | 'profile'

interface SidebarProps {
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
  language: 'AR' | 'EN'
  userName?: string
  permissions: string[]
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

const tabLabels: Record<TabType, { AR: string; EN: string }> = {
  dashboard: { AR: 'الرئيسية', EN: 'Dashboard' },
  tenants: { AR: 'المستأجرين', EN: 'Tenants' },
  villas: { AR: 'الفلل', EN: 'Villas' },
  maintenance: { AR: 'الصيانة', EN: 'Maintenance' },
  complaints: { AR: 'الشكاوى', EN: 'Complaints' },
  payments: { AR: 'المدفوعات', EN: 'Payments' },
  ads: { AR: 'الخطابات', EN: 'Letters' },
  reports: { AR: 'التقارير', EN: 'Reports' },
  facilities: { AR: 'إدارة المرافق', EN: 'Communal Facilities' },
  bookings: { AR: 'حجوزات المرافق', EN: 'Facility Bookings' },
  staff: { AR: 'فريق العمل', EN: 'Staff' },
  'my-tasks': { AR: 'مهامي', EN: 'My Tasks' },
  profile: { AR: 'الملف الشخصي', EN: 'Profile' }
}

const navItems: { icon: typeof LayoutDashboard; tab: TabType }[] = [
  { icon: LayoutDashboard, tab: 'dashboard' },
  { icon: Users, tab: 'tenants' },
  { icon: Home, tab: 'villas' },
  { icon: Wrench, tab: 'maintenance' },
  { icon: AlertCircle, tab: 'complaints' },
  { icon: CreditCard, tab: 'payments' },
  { icon: Mail, tab: 'ads' },
  { icon: FileBarChart, tab: 'reports' },
  { icon: Building2, tab: 'facilities' },
  { icon: CalendarCheck, tab: 'bookings' },
  { icon: Briefcase, tab: 'staff' },
  { icon: ListChecks, tab: 'my-tasks' },
]

function Sidebar({ activeTab, setActiveTab, language, userName, permissions, sidebarOpen, setSidebarOpen }: SidebarProps) {
  const getLabel = (tab: TabType) => tabLabels[tab][language]
  const visibleNavItems = navItems.filter(item => permissions.includes(item.tab))
  const isAdmin = permissions.length > 1

  const handleTabClick = (tab: TabType) => {
    setActiveTab(tab)
    setSidebarOpen(false)
  }

  if (visibleNavItems.length === 0) return null

  const content = (
    <>
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {visibleNavItems.map((item) => (
            <li key={item.tab}>
              <button
                onClick={() => handleTabClick(item.tab)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === item.tab
                    ? 'bg-primary-50 text-primary-700 shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <item.icon className={`w-5 h-5 ${activeTab === item.tab ? 'text-primary-600' : ''}`} />
                <span>{getLabel(item.tab)}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-100">
        <button
          onClick={() => handleTabClick('profile')}
          className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
            activeTab === 'profile' ? 'bg-primary-50' : 'bg-slate-50 hover:bg-slate-100'
          }`}
          title={language === 'AR' ? 'الملف الشخصي' : 'Profile'}
        >
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-700 font-bold text-xs">{isAdmin ? 'A' : 'S'}</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-700">{userName || 'Admin'}</p>
            <p className="text-xs text-slate-400">{isAdmin ? (language === 'AR' ? 'مدير النظام' : 'System Admin') : (language === 'AR' ? 'موظف' : 'Staff Member')}</p>
          </div>
        </button>
      </div>
    </>
  )

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`hidden lg:flex fixed top-16 bottom-0 w-72 bg-white border-slate-200 flex-col z-40 ${
        language === 'AR' ? 'right-0 border-l' : 'left-0 border-r'
      }`}>
        {content}
      </aside>

      {sidebarOpen && (
        <aside className={`fixed top-16 bottom-0 w-72 bg-white border-slate-200 z-40 lg:hidden flex flex-col ${
          language === 'AR' ? 'right-0 border-l' : 'left-0 border-r'
        }`}>
          {content}
        </aside>
      )}
    </>
  )
}

export default Sidebar