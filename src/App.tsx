import { useState } from 'react'
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
import ApiDocs from './components/ApiDocs'
import Facilities from './components/Facilities'

type TabType = 'dashboard' | 'tenants' | 'villas' | 'maintenance' | 'complaints' | 'payments' | 'ads' | 'reports' | 'facilities' | 'bookings' | 'apiDocs'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [language, setLanguage] = useState<'AR' | 'EN'>('EN')
  const [showNotifications, setShowNotifications] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const notifications = [
    { id: 1, title: 'صيانة طارئة', message: 'تسرب مياه في فيلا رقم 12', time: 'منذ 5 دقائق', unread: true },
    { id: 2, title: 'دفعة جديدة', message: 'تم سداد إيجار فيلا رقم 8', time: 'منذ ساعة', unread: true },
    { id: 3, title: 'شكوى جديدة', message: 'تم تقديم شكوى من المستأجر رقم 15', time: 'منذ ساعتين', unread: false },
  ]

  const handleLogin = (_username: string) => {
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setActiveTab('dashboard')
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-800 mb-1">
                {language === 'AR' ? 'مرحباً بك، أحمد' : 'Welcome, Ahmed'}
              </h1>
              <p className="text-slate-500 text-sm">
                {language === 'AR' ? 'نظرة عامة على حالة المجمع السكني لهذا اليوم' : 'Overview of the residential complex status for today'}
              </p>
            </div>
            <StatsCards />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 mt-6">
              <div className="lg:col-span-2">
                <ChartSection />
              </div>
              <div>
                <RecentUpdates />
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PropertyCard />
              <MaintenanceChart />
            </div>
          </>
        )
      case 'tenants':
        return <Tenants language={language} />
      case 'villas':
        return <Villas language={language} />
      case 'maintenance':
        return <Maintenance language={language} />
      case 'complaints':
        return <Complaints language={language} />
      case 'payments':
        return <Payments language={language} />
      case 'ads':
        return <Ads language={language} />
      case 'reports':
        return <Reports language={language} />
      case 'facilities':
        return <Facilities language={language} />
      case 'bookings':
        return <Bookings language={language} />
      case 'apiDocs':
        return <ApiDocs language={language} />
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
      />

      <div className="flex">
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} language={language} />

          <main className={`flex-1 ${language === 'AR' ? 'mr-72' : 'ml-72'} p-6 pt-24`}>
            {renderContent()}
          </main>
        </div>
    </div>
  )
}

export default App