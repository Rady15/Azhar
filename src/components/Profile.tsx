import { useState, useEffect } from 'react'
import { User, Mail, Shield, KeyRound, Eye, EyeOff, Loader2, Save, Calendar, CheckCircle, XCircle } from 'lucide-react'
import { api } from '../services/api'

interface ProfileData {
  displayName: string
  email?: string
  phoneNumber?: string | null
  createdAt?: string
  role?: string
}

interface ProfileProps {
  language: 'AR' | 'EN'
}

function Profile({ language }: ProfileProps) {
  const t = (ar: string, en: string) => language === 'AR' ? ar : en

  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // General info form
  const [displayName, setDisplayName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Security form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchProfile = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.getProfile()
      setProfile(data)
      setDisplayName(data.displayName || '')
      setPhoneNumber(data.phoneNumber || '')
    } catch (err: any) {
      setError(err.message || t('تعذر تحميل الملف الشخصي', 'Failed to load profile'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      setProfileMessage({ type: 'error', text: t('يرجى إدخال الاسم', 'Please enter your name') })
      return
    }
    setSavingProfile(true)
    setProfileMessage(null)
    try {
      await api.updateProfile({ displayName: displayName.trim(), phoneNumber: phoneNumber.trim() })
      const next: ProfileData = {
        ...(profile || {}),
        displayName: displayName.trim(),
        phoneNumber: phoneNumber.trim(),
      }
      setProfile(next)
      localStorage.setItem('azhar_name', next.displayName)
      setProfileMessage({ type: 'success', text: t('تم حفظ الملف الشخصي بنجاح', 'Profile updated successfully') })
    } catch (err: any) {
      setProfileMessage({ type: 'error', text: err.message || t('تعذر حفظ الملف الشخصي', 'Failed to update profile') })
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordMessage({ type: 'error', text: t('يرجى ملء جميع الحقول', 'Please fill in all fields') })
      return
    }
    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: t('كلمة المرور الجديدة يجب ألا تقل عن 6 أحرف', 'New password must be at least 6 characters') })
      return
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordMessage({ type: 'error', text: t('كلمتا المرور غير متطابقتين', 'Passwords do not match') })
      return
    }
    setChangingPassword(true)
    setPasswordMessage(null)
    try {
      await api.changePassword({ currentPassword, newPassword, confirmNewPassword })
      setPasswordMessage({ type: 'success', text: t('تم تغيير كلمة المرور بنجاح', 'Password changed successfully') })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
    } catch (err: any) {
      setPasswordMessage({ type: 'error', text: err.message || t('تعذر تغيير كلمة المرور', 'Failed to change password') })
    } finally {
      setChangingPassword(false)
    }
  }

  const inputClass = (extra?: string) =>
    `w-full h-10 px-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all ${extra || ''}`

  const roleLabel = profile?.role
    ? profile.role.toLowerCase() === 'admin'
      ? t('مدير النظام', 'System Admin')
      : t('موظف', 'Staff Member')
    : ''

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    )
  }

  if (error && !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-red-500">
        <XCircle className="w-8 h-8 mb-2" />
        <p className="text-sm">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">{t('الملف الشخصي', 'Profile')}</h1>
        <p className="text-sm text-slate-400">{t('إدارة معلوماتك الشخصية وكلمة المرور', 'Manage your personal information and password')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal info card */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-primary-700" />
              </div>
              <h2 className="font-semibold text-slate-800">{t('المعلومات الشخصية', 'Personal Information')}</h2>
            </div>
            <span className="text-xs px-2.5 py-1 bg-primary-50 text-primary-700 rounded-full font-medium">{roleLabel}</span>
          </div>

          <div className="p-5 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('الاسم', 'Full Name')}</label>
                <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className={inputClass()} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('رقم الهاتف', 'Phone Number')}</label>
                <input type="text" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className={inputClass()} placeholder={t('05xxxxxxxx', '05xxxxxxxx')} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <Mail className="w-5 h-5 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-slate-400">{t('البريد الإلكتروني', 'Email')}</p>
                  <p className="text-sm font-medium text-slate-700 truncate" dir="ltr">{profile?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <Calendar className="w-5 h-5 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-slate-400">{t('عضو منذ', 'Member Since')}</p>
                  <p className="text-sm font-medium text-slate-700">
                    {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString(language === 'AR' ? 'ar-EG' : 'en-US') : '—'}
                  </p>
                </div>
              </div>
            </div>

            {profileMessage && (
              <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-xl ${profileMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                {profileMessage.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
                <span>{profileMessage.text}</span>
              </div>
            )}

            <button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="h-10 px-5 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {savingProfile ? t('جاري الحفظ...', 'Saving...') : t('حفظ التغييرات', 'Save Changes')}
            </button>
          </div>
        </div>

        {/* Security card */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="p-5 border-b border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="font-semibold text-slate-800">{t('الأمان', 'Security')}</h2>
          </div>

          <div className="p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <KeyRound className="w-4 h-4 text-slate-400" />
              <span>{t('تغيير كلمة المرور', 'Change Password')}</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('كلمة المرور الحالية', 'Current Password')}</label>
              <div className="relative">
                <input type={showCurrent ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className={inputClass('pr-10')} />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute top-1/2 -translate-y-1/2 right-3 text-slate-400 hover:text-slate-600">
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('كلمة المرور الجديدة', 'New Password')}</label>
              <div className="relative">
                <input type={showNew ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} className={inputClass('pr-10')} />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute top-1/2 -translate-y-1/2 right-3 text-slate-400 hover:text-slate-600">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('تأكيد كلمة المرور الجديدة', 'Confirm New Password')}</label>
              <div className="relative">
                <input type={showConfirm ? 'text' : 'password'} value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} className={inputClass('pr-10')} />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute top-1/2 -translate-y-1/2 right-3 text-slate-400 hover:text-slate-600">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {passwordMessage && (
              <div className={`flex items-start gap-2 text-sm px-4 py-3 rounded-xl ${passwordMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                {passwordMessage.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                <span>{passwordMessage.text}</span>
              </div>
            )}

            <button
              onClick={handleChangePassword}
              disabled={changingPassword}
              className="w-full h-10 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              {changingPassword ? t('جاري التغيير...', 'Changing...') : t('تغيير كلمة المرور', 'Change Password')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
