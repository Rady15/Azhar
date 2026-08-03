import { useState, useEffect, useRef, useCallback } from 'react'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
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
import StaffTasks from './components/StaffTasks'
import Profile from './components/Profile'
import { api } from './services/api'
import { buildAdminAlerts } from './services/alerts'

type TabType = 'dashboard' | 'tenants' | 'villas' | 'maintenance' | 'complaints' | 'payments' | 'ads' | 'reports' | 'facilities' | 'bookings' | 'staff' | 'my-tasks' | 'profile'

const ALL_TABS: TabType[] = ['dashboard', 'tenants', 'villas', 'maintenance', 'complaints', 'payments', 'ads', 'reports', 'facilities', 'bookings', 'staff', 'my-tasks', 'profile']

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [language, setLanguage] = useState<'AR' | 'EN'>('EN')
  const [showNotifications, setShowNotifications] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [userName, setUserName] = useState(localStorage.getItem('azhar_name') || localStorage.getItem('azhar_email') || 'Admin')
  const [userPermissions, setUserPermissions] = useState<string[]>(ALL_TABS)

  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [notifications, setNotifications] = useState<Array<{ id: number; title: string; message: string; time: string; unread: boolean }>>([])
  const prevIdsRef = useRef<Set<number>>(new Set())
  const [hasNewNotification, setHasNewNotification] = useState(false)
  const notifIdRef = useRef(1)

  const fetchNotifications = useCallback(() => {
    if (!isLoggedIn) return
    const prevIds = prevIdsRef.current
    Promise.allSettled([
      api.getComplaints(),
      api.getMaintenance(),
      api.getAnnouncements(),
      buildAdminAlerts(language)
    ]).then(([complaintsRes, maintenanceRes, announcementsRes, alertsRes]) => {
      const items: Array<{ id: number; title: string; message: string; time: string; unread: boolean }> = []
      let added = false

      if (alertsRes.status === 'fulfilled' && alertsRes.value.length) {
        alertsRes.value.slice(0, 4).forEach((a) => {
          const id = notifIdRef.current++
          items.push({ id, title: a.title, message: a.message, time: a.time, unread: !prevIds.has(id) })
          if (!prevIds.has(id)) added = true
        })
      }

      if (announcementsRes.status === 'fulfilled') {
        const list = Array.isArray(announcementsRes.value) ? announcementsRes.value : []
        list.slice(0, 3).forEach((a: any) => {
          const id = notifIdRef.current++
          items.push({ id, title: a.title || (language === 'AR' ? 'إعلان' : 'Announcement'), message: a.description || a.content || '', time: a.createdAt || '', unread: !prevIds.has(id) })
          if (!prevIds.has(id)) added = true
        })
      }
      if (complaintsRes.status === 'fulfilled') {
        const list = Array.isArray(complaintsRes.value) ? complaintsRes.value : (complaintsRes.value as any)?.data ?? []
        list.slice(0, 3).forEach((c: any) => {
          const id = notifIdRef.current++
          items.push({ id, title: c.title || (language === 'AR' ? 'شكوى' : 'Complaint'), message: c.description || `${language === 'AR' ? 'فيلا' : 'Villa'} ${c.villaNumber || ''}`, time: c.createdAt || '', unread: !prevIds.has(id) })
          if (!prevIds.has(id)) added = true
        })
      }
      if (maintenanceRes.status === 'fulfilled') {
        const list = Array.isArray(maintenanceRes.value) ? maintenanceRes.value : (maintenanceRes.value as any)?.data ?? []
        list.slice(0, 3).forEach((m: any) => {
          const id = notifIdRef.current++
          items.push({ id, title: m.category || (language === 'AR' ? 'صيانة' : 'Maintenance'), message: m.description || `${language === 'AR' ? 'وحدة' : 'Unit'} ${m.villaNumber || ''}`, time: m.createdAt || '', unread: !prevIds.has(id) })
          if (!prevIds.has(id)) added = true
        })
      }

      const result = items.slice(0, 5)
      prevIdsRef.current = new Set(result.map(n => n.id))
      setNotifications(result)
      if (added) setHasNewNotification(true)
    })
  }, [isLoggedIn, language])

  useEffect(() => {
    if (!isLoggedIn) return
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [isLoggedIn, language, fetchNotifications])

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })))
    setHasNewNotification(false)
  }, [])

  const handleLogin = (_username: string) => {
    setIsLoggedIn(true)
    setUserName(localStorage.getItem('azhar_name') || localStorage.getItem('azhar_email') || _username || 'Admin')
    const stored = localStorage.getItem('azhar_permissions')
    if (stored) {
      try {
        const perms: string[] = JSON.parse(stored)
        setUserPermissions(perms)
        if (perms.length === 1 && perms[0] === 'my-tasks') setActiveTab('my-tasks')
      } catch { setUserPermissions(ALL_TABS) }
    }
  }

  useEffect(() => {
    if (!isLoggedIn) return
    api.getProfile()
      .then((p: any) => {
        const name = p?.displayName || p?.fullName
        if (name) {
          localStorage.setItem('azhar_name', name)
          setUserName(name)
        }
      })
      .catch(() => {})
  }, [isLoggedIn])

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
        return <Dashboard language={language} userName={userName} />
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
      case 'my-tasks':
        return <StaffTasks language={language} />
      case 'profile':
        return <Profile language={language} />
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
        hasNewNotification={hasNewNotification}
        onMarkRead={markAllRead}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <div className="flex w-full">
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} language={language} userName={userName} permissions={userPermissions} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

          <main className={`flex-1 min-w-0 max-w-full ${language === 'AR' ? 'mr-0 lg:mr-72' : 'ml-0 lg:ml-72'} p-4 md:p-6 pt-20 md:pt-24`}>
            {renderContent()}
          </main>
        </div>
    </div>
  )
}

export default App