import { 
  LayoutDashboard, 
  Users, 
  Home, 
  Wrench, 
  AlertCircle, 
  CreditCard, 
  Megaphone, 
  FileBarChart,
  CalendarCheck,
  Building2,
  Briefcase
} from 'lucide-react'

type TabType = 'dashboard' | 'tenants' | 'villas' | 'maintenance' | 'complaints' | 'payments' | 'ads' | 'reports' | 'facilities' | 'bookings' | 'staff'

interface SidebarProps {
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
  language: 'AR' | 'EN'
}

const tabLabels: Record<TabType, { AR: string; EN: string }> = {
  dashboard: { AR: 'الرئيسية', EN: 'Dashboard' },
  tenants: { AR: 'المستأجرين', EN: 'Tenants' },
  villas: { AR: 'الفلل', EN: 'Villas' },
  maintenance: { AR: 'الصيانة', EN: 'Maintenance' },
  complaints: { AR: 'الشكاوى', EN: 'Complaints' },
  payments: { AR: 'المدفوعات', EN: 'Payments' },
  ads: { AR: 'الإعلانات', EN: 'Advertisements' },
  reports: { AR: 'التقارير', EN: 'Reports' },
  facilities: { AR: 'إدارة المرافق', EN: 'Communal Facilities' },
  bookings: { AR: 'حجوزات المرافق', EN: 'Facility Bookings' },
  staff: { AR: 'فريق العمل', EN: 'Staff' }
}

const navItems: { icon: typeof LayoutDashboard; tab: TabType }[] = [
  { icon: LayoutDashboard, tab: 'dashboard' },
  { icon: Users, tab: 'tenants' },
  { icon: Home, tab: 'villas' },
  { icon: Wrench, tab: 'maintenance' },
  { icon: AlertCircle, tab: 'complaints' },
  { icon: CreditCard, tab: 'payments' },
  { icon: Megaphone, tab: 'ads' },
  { icon: FileBarChart, tab: 'reports' },
  { icon: Building2, tab: 'facilities' },
  { icon: CalendarCheck, tab: 'bookings' },
  { icon: Briefcase, tab: 'staff' },
]

function Sidebar({ activeTab, setActiveTab, language }: SidebarProps) {
  const getLabel = (tab: TabType) => tabLabels[tab][language]
  
  return (
    <aside className={`fixed top-16 bottom-0 w-72 bg-white border-slate-200 flex flex-col z-40 ${language === 'AR' ? 'right-0 border-l' : 'left-0 border-r'}`}>
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.tab}>
              <button
                onClick={() => setActiveTab(item.tab)}
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
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-700 font-bold text-xs">Admin</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-700">{language === 'AR' ? 'أحمد الغامدي' : 'Ahmed Al-Ghamdi'}</p>
            <p className="text-xs text-slate-400">{language === 'AR' ? 'مدير النظام' : 'System Admin'}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar