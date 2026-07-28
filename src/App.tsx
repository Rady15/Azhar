import { useState, useEffect } from 'react'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import StatsCards from './components/StatsCards'
import ChartSection from './components/ChartSection'
import RecentUpdates from './components/RecentUpdates'
import PropertyCard from './components/PropertyCard'
import MaintenanceChart from './components/MaintenanceChart'
import Login from './components/Login'
import Tenants from './components/Tenants'
import Villas from './components/Villas'
import Maintenance from './components/Maintenance'
import Complaints from './components/Complaints'
import Payments from './components/Payments'
import Ads from './components/Ads'
import Reports from './components/Reports'
import Bookings from './components/Bookings'
import Facilities from './components/Facilities'
import Staff from './components/Staff'
import { api } from './services/api'

type TabType = 'dashboard' | 'tenants' | 'villas' | 'maintenance' | 'complaints' | 'payments' | 'ads' | 'reports' | 'facilities' | 'bookings' | 'staff'

const ALL_TABS: TabType[] = ['dashboard', 'tenants', 'villas', 'maintenance', 'complaints', 'payments', 'ads', 'reports', 'facilities', 'bookings', 'staff']

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [language, setLanguage] = useState<'AR' | 'EN'>('EN')
  const [showNotifications, setShowNotifications] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [userName, setUserName] = useState(localStorage.getItem('azhar_name') || localStorage.getItem('azhar_email') || 'Admin')
  const [userPermissions, setUserPermissions] = useState<string[]>(ALL_TABS)

  const [notifications, setNotifications] = useState<Array<{ id: number; title: string; message: string; time: string; unread: boolean }>>([])

  useEffect(() => {
    if (!isLoggedIn) return
    Promise.allSettled([
      api.getComplaints(),
      api.getMaintenance(),
      api.getAnnouncements()
    ]).then(([complaintsRes, maintenanceRes, announcementsRes]) => {
      const items: Array<{ id: number; title: string; message: string; time: string; unread: boolean }> = []
      let id = 1

      if (announcementsRes.status === 'fulfilled') {
        const list = Array.isArray(announcementsRes.value) ? announcementsRes.value : []
        list.slice(0, 3).forEach((a: any) => {
          items.push({ id: id++, title: a.title || (language === 'AR' ? 'إعلان' : 'Announcement'), message: a.description || a.content || '', time: a.createdAt || '', unread: true })
        })
      }
      if (complaintsRes.status === 'fulfilled') {
        const list = Array.isArray(complaintsRes.value) ? complaintsRes.value : (complaintsRes.value as any)?.data ?? []
        list.slice(0, 3).forEach((c: any) => {
          items.push({ id: id++, title: c.title || (language === 'AR' ? 'شكوى' : 'Complaint'), message: c.description || `${language === 'AR' ? 'فيلا' : 'Villa'} ${c.villaNumber || ''}`, time: c.createdAt || '', unread: true })
        })
      }
      if (maintenanceRes.status === 'fulfilled') {
        const list = Array.isArray(maintenanceRes.value) ? maintenanceRes.value : (maintenanceRes.value as any)?.data ?? []
        list.slice(0, 3).forEach((m: any) => {
          items.push({ id: id++, title: m.category || (language === 'AR' ? 'صيانة' : 'Maintenance'), message: m.description || `${language === 'AR' ? 'وحدة' : 'Unit'} ${m.villaNumber || ''}`, time: m.createdAt || '', unread: true })
        })
      }

      setNotifications(items.slice(0, 5))
    })
  }, [isLoggedIn, language])

  const handleLogin = (_username: string) => {
    setIsLoggedIn(true)
    setUserName(localStorage.getItem('azhar_name') || localStorage.getItem('azhar_email') || _username || 'Admin')
    const stored = localStorage.getItem('azhar_permissions')
    if (stored) {
      try { setUserPermissions(JSON.parse(stored)) } catch { setUserPermissions(ALL_TABS) }
    }
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setActiveTab('dashboard')
  }

  const renderContent = () => {
    const hasAccess = (tab: TabType) => userPermissions.includes(tab)
    const noAccess = (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <p className="text-lg">{language === 'AR' ? 'ليس لديك صلاحية للوصول إلى هذه الصفحة' : 'You do not have permission to access this page'}</p>
      </div>
    )

    switch (activeTab) {
      case 'dashboard':
        return (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-800 mb-1">
                {language === 'AR' ? `مرحباً بك، ${userName}` : `Welcome, ${userName}`}
              </h1>
              <p className="text-slate-500 text-sm">
                {language === 'AR' ? 'نظرة عامة على حالة المجمع السكني لهذا اليوم' : 'Overview of the residential complex status for today'}
              </p>
            </div>
            <StatsCards language={language} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 mt-6">
              <div className="lg:col-span-2">
                <ChartSection language={language} />
              </div>
              <div>
                <RecentUpdates language={language} />
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PropertyCard language={language} />
              <MaintenanceChart language={language} />
            </div>
          </>
        )
      case 'tenants':
        return hasAccess('tenants') ? <Tenants language={language} /> : noAccess
      case 'villas':
        return hasAccess('villas') ? <Villas language={language} /> : noAccess
      case 'maintenance':
        return hasAccess('maintenance') ? <Maintenance language={language} /> : noAccess
      case 'complaints':
        return hasAccess('complaints') ? <Complaints language={language} /> : noAccess
      case 'payments':
        return hasAccess('payments') ? <Payments language={language} /> : noAccess
      case 'ads':
        return hasAccess('ads') ? <Ads language={language} /> : noAccess
      case 'reports':
        return hasAccess('reports') ? <Reports language={language} /> : noAccess
      case 'facilities':
        return hasAccess('facilities') ? <Facilities language={language} /> : noAccess
      case 'bookings':
        return hasAccess('bookings') ? <Bookings language={language} /> : noAccess
      case 'staff':
        return hasAccess('staff') ? <Staff language={language} /> : noAccess
      default:
        return null
    }
  }

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div data-lang={language} className={`min-h-screen bg-slate-50 ${language === 'AR' ? 'font-arabic' : ''}`}>
      <Header 
        language={language} 
        setLanguage={setLanguage} 
        notifications={notifications}
        showNotifications={showNotifications}
        setShowNotifications={setShowNotifications}
        onLogout={handleLogout}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setActiveTab={setActiveTab}
        userName={userName}
        permissions={userPermissions}
      />

      <div className="flex">
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} language={language} userName={userName} permissions={userPermissions} />

          <main className={`flex-1 ${language === 'AR' ? 'mr-72' : 'ml-72'} p-6 pt-24`}>
            {renderContent()}
          </main>
        </div>
    </div>
  )
}

export default App