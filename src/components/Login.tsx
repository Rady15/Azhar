import { useState } from 'react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { api } from '../services/api'

interface LoginProps {
  onLogin: (username: string) => void
}

function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await api.loginAdmin({ email: username, password })
      const loginName = result.displayName || result.fullName
      if (loginName) {
        localStorage.setItem('azhar_name', loginName)
      }
      const isAdmin = username === 'admin@azhar.com'
      const staffPerms = ['my-tasks']
      const allTabs = ['dashboard', 'tenants', 'villas', 'maintenance', 'complaints', 'payments', 'ads', 'reports', 'facilities', 'bookings', 'staff', 'my-tasks']
      localStorage.setItem('azhar_permissions', JSON.stringify(isAdmin ? allTabs : staffPerms))
      onLogin(username)
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'اسم المستخدم أو كلمة المرور غير صحيحة / Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-cover bg-center" style={{ backgroundImage: 'url(/Login.png)' }}>
      <div className="absolute inset-0 bg-black/60"></div>
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md p-8 relative z-10 border border-white/20">
        <div className="text-center mb-8">
          <div className="w-32 h-32 rounded-2xl flex items-center justify-center mx-auto mb-4 overflow-hidden">
            <img src="/logo.png" alt="Azhar" className="w-full h-full object-contain brightness-0 invert" />
          </div>
          <p className="text-white/70 text-sm mt-1">Housing Authority Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full h-12 px-4 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/50 transition-all"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 px-4 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/50 transition-all"
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-300 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-white/20 hover:bg-white/30 disabled:bg-white/10 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 border border-white/30"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-4 space-y-2">
          <button
            type="button"
            onClick={() => {
              setUsername('admin@azhar.com')
              setPassword('Admin@123')
              setTimeout(() => { document.querySelector('form')?.requestSubmit() }, 50)
            }}
            className="w-full h-10 border-2 border-dashed border-white/30 text-white/80 hover:bg-white/10 rounded-xl font-medium text-sm transition-colors"
          >
            ⚡ Quick Login — Admin
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={() => { setUsername('ahmed@azhar.com'); setPassword('Staff@123'); setTimeout(() => document.querySelector('form')?.requestSubmit(), 50) }} className="flex-1 h-9 border border-white/20 text-white/70 hover:bg-white/10 rounded-xl text-xs transition-colors truncate">Ahmed Ali</button>
            <button type="button" onClick={() => { setUsername('laila@azhar.com'); setPassword('Staff@123'); setTimeout(() => document.querySelector('form')?.requestSubmit(), 50) }} className="flex-1 h-9 border border-white/20 text-white/70 hover:bg-white/10 rounded-xl text-xs transition-colors truncate">Laila</button>
            <button type="button" onClick={() => { setUsername('faisal@azhar.com'); setPassword('Staff@123'); setTimeout(() => document.querySelector('form')?.requestSubmit(), 50) }} className="flex-1 h-9 border border-white/20 text-white/70 hover:bg-white/10 rounded-xl text-xs transition-colors truncate">Faisal</button>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => { setUsername('mohamed@azhar.com'); setPassword('Staff@123'); setTimeout(() => document.querySelector('form')?.requestSubmit(), 50) }} className="flex-1 h-9 border border-white/20 text-white/70 hover:bg-white/10 rounded-xl text-xs transition-colors truncate">Mohamed</button>
            <button type="button" onClick={() => { setUsername('sara@azhar.com'); setPassword('Staff@123'); setTimeout(() => document.querySelector('form')?.requestSubmit(), 50) }} className="flex-1 h-9 border border-white/20 text-white/70 hover:bg-white/10 rounded-xl text-xs transition-colors truncate">Sara</button>
            <button type="button" onClick={() => { setUsername('nora@azhar.com'); setPassword('Staff@123'); setTimeout(() => document.querySelector('form')?.requestSubmit(), 50) }} className="flex-1 h-9 border border-white/20 text-white/70 hover:bg-white/10 rounded-xl text-xs transition-colors truncate">Nora</button>
          </div>
        </div>

        <p className="text-center text-white/50 text-xs mt-4">
          admin: admin@azhar.com / Admin@123 &nbsp;|&nbsp; staff: *@azhar.com / Staff@123
        </p>
      </div>
    </div>
  )
}

export default Login