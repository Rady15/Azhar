import { useState, useEffect } from 'react'
import { Plus, Trash2, Eye, X, Send, LayoutList, Grid3X3, Mail, Users, User, Calendar, Clock, CheckCircle, Loader2 } from 'lucide-react'
import { api } from '../services/api'

interface Tenant {
  id: string
  fullName: string
  email: string
  houseNumber: string
  phoneNumber: string
}

interface Letter {
  id: string
  title: string
  content: string
  recipientType: 'all' | 'specific'
  recipientId?: string
  recipientName?: string
  sentDate: string
  status: 'sent' | 'draft'
}

interface AdsProps {
  language: 'AR' | 'EN'
}

function Ads({ language }: AdsProps) {
  const t = (ar: string, en: string) => language === 'AR' ? ar : en
  const [letters, setLetters] = useState<Letter[]>(() => {
    const stored = localStorage.getItem('azhar_letters')
    return stored ? JSON.parse(stored) : []
  })
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loadingTenants, setLoadingTenants] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewingLetter, setViewingLetter] = useState<Letter | null>(null)
  const [formData, setFormData] = useState<Partial<Letter>>({})
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    localStorage.setItem('azhar_letters', JSON.stringify(letters))
  }, [letters])

  useEffect(() => {
    api.getLetters().then((data: any) => {
      if (Array.isArray(data) && data.length > 0) {
        const serverLetters: Letter[] = data.map((l: any) => ({
          id: l.id || `LET-${Date.now()}`,
          title: l.title || '',
          content: l.content || '',
          recipientType: l.recipientType === 1 ? 'specific' : 'all',
          recipientId: l.recipientId || '',
          recipientName: l.recipientName || '',
          sentDate: l.sentDate ? l.sentDate.split('T')[0] : new Date().toISOString().split('T')[0],
          status: 'sent' as const,
        }))
        setLetters(prev => {
          const existingIds = new Set(prev.map(p => p.id))
          const existingKeys = new Set(prev.map(p => `${p.title}|${p.content}|${p.recipientName}`))
          const newOnes = serverLetters.filter(s => !existingIds.has(s.id) && !existingKeys.has(`${s.title}|${s.content}|${s.recipientName}`))
          return [...newOnes, ...prev]
        })
      }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    setLoadingTenants(true)
    api.getTenants()
      .then((data: any) => {
        const raw = Array.isArray(data) ? data : Array.isArray(data?.tenants) ? data.tenants : Array.isArray(data?.data) ? data.data : []
        setTenants(raw.map((t: any) => ({ id: String(t.id || t.tenantId || ''), fullName: t.fullName || t.name || '', email: t.email || '', houseNumber: t.houseNumber || t.villaNumber || '', phoneNumber: t.phoneNumber || '' })))
      })
      .catch(() => {})
      .finally(() => setLoadingTenants(false))
  }, [])

  const getNextId = () => `LET-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

  const handleAdd = () => {
    setFormData({ title: '', content: '', recipientType: 'all', recipientId: '', recipientName: '', sentDate: new Date().toISOString().split('T')[0], status: 'draft' })
    setShowModal(true)
  }

  const handleView = (letter: Letter) => {
    setViewingLetter(letter)
    setShowViewModal(true)
  }

  const handleDelete = (id: string) => {
    if (window.confirm(t('هل أنت متأكد من حذف هذا الخطاب؟', 'Are you sure you want to delete this letter?'))) {
      setLetters(letters.filter(l => l.id !== id))
    }
  }

  const handleSend = async (id: string) => {
    if (saving) return
    const letter = letters.find(l => l.id === id)
    if (!letter) return
    setSaving(true)
    try {
      const recipientType = letter.recipientType === 'all' ? 0 : 1
      await api.sendLetter({
        title: letter.title,
        content: letter.content,
        recipientType,
        recipientId: letter.recipientType === 'specific' ? letter.recipientId : undefined,
      })
      setLetters(letters.map(l => l.id === id ? { ...l, status: 'sent' as const, sentDate: new Date().toISOString().split('T')[0] } : l))
    } catch (err: any) {
      console.error('Send letter error:', err)
      alert(t('فشل إرسال الخطاب', 'Failed to send letter'))
    }
    setSaving(false)
  }

  const handleSave = async () => {
    if (saving) return
    if (!formData.title || !formData.content) {
      alert(t('يرجى إدخال عنوان الخطاب والمحتوى', 'Please enter letter title and content'))
      return
    }
    if (formData.recipientType === 'specific' && !formData.recipientId) {
      alert(t('يرجى اختيار المستلم', 'Please select a recipient'))
      return
    }

    const recipientName = formData.recipientType === 'all'
      ? t('جميع المستأجرين', 'All Tenants')
      : tenants.find(tt => tt.id === formData.recipientId)?.fullName || formData.recipientName || ''

    setSaving(true)
    try {
      const recipientType = formData.recipientType === 'all' ? 0 : 1
      await api.sendLetter({
        title: formData.title || '',
        content: formData.content || '',
        recipientType,
        recipientId: formData.recipientType === 'specific' ? formData.recipientId : undefined,
      })
    } catch (err: any) {
      console.error('Send letter error:', err)
      alert(t('فشل إرسال الخطاب', 'Failed to send letter'))
      setSaving(false)
      return
    }

    setLetters([{
      id: getNextId(),
      title: formData.title || '',
      content: formData.content || '',
      recipientType: formData.recipientType === 'specific' ? 'specific' : 'all',
      recipientId: formData.recipientId || '',
      recipientName,
      sentDate: new Date().toISOString().split('T')[0],
      status: 'sent',
    }, ...letters])
    setShowModal(false)
    setSaving(false)
  }

  const draftCount = letters.filter(l => l.status === 'draft').length
  const sentCount = letters.filter(l => l.status === 'sent').length

  return (
    <div className="bg-white rounded-2xl p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">{t('الخطابات', 'Letters')}</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-0.5">
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400 hover:text-slate-600'}`} title={t('عرض كقائمة', 'List view')}><LayoutList className="w-4 h-4" /></button>
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400 hover:text-slate-600'}`} title={t('عرض كبطاقات', 'Grid view')}><Grid3X3 className="w-4 h-4" /></button>
          </div>
          <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors">
            <Plus className="w-4 h-4" />{t('خطاب جديد', 'New Letter')}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-indigo-50 rounded-xl">
          <p className="text-sm text-indigo-600">{t('إجمالي الخطابات', 'Total Letters')}</p>
          <p className="text-xl font-bold text-indigo-700">{letters.length}</p>
        </div>
        <div className="p-4 bg-green-50 rounded-xl">
          <p className="text-sm text-green-600">{t('مرسلة', 'Sent')}</p>
          <p className="text-xl font-bold text-green-700">{sentCount}</p>
        </div>
        <div className="p-4 bg-amber-50 rounded-xl">
          <p className="text-sm text-amber-600">{t('مسودة', 'Drafts')}</p>
          <p className="text-xl font-bold text-amber-700">{draftCount}</p>
        </div>
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('العنوان', 'Title')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('المستلم', 'Recipient')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('تاريخ الإرسال', 'Sent Date')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('الحالة', 'Status')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('الإجراءات', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {letters.map(letter => (
                <tr key={letter.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <Mail className="w-4 h-4 text-indigo-600" />
                      </div>
                      <span className="text-slate-700 font-medium">{letter.title}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                      {letter.recipientType === 'all' ? (
                        <><Users className="w-3.5 h-3.5 text-slate-400" />{t('جميع المستأجرين', 'All Tenants')}</>
                      ) : (
                        <><User className="w-3.5 h-3.5 text-slate-400" />{letter.recipientName || letter.recipientId}</>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-500">{letter.sentDate}</td>
                  <td className="py-3 px-4">
                    {letter.status === 'sent' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium"><CheckCircle className="w-3 h-3" />{t('مرسل', 'Sent')}</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium"><Clock className="w-3 h-3" />{t('مسودة', 'Draft')}</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleView(letter)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Eye className="w-4 h-4" /></button>
                      {letter.status === 'draft' && (
                        <button onClick={() => handleSend(letter.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"><Send className="w-4 h-4" /></button>
                      )}
                      <button onClick={() => handleDelete(letter.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {letters.length === 0 && (
                <tr><td colSpan={5} className="text-center py-12 text-slate-400">{t('لا توجد خطابات بعد', 'No letters yet')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {letters.map(letter => (
            <div key={letter.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <Mail className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{letter.title}</p>
                    <p className="text-xs text-slate-400">
                      {letter.recipientType === 'all' ? t('إلى الكل', 'To All') : letter.recipientName}
                    </p>
                  </div>
                </div>
                {letter.status === 'sent' ? (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">{t('مرسل', 'Sent')}</span>
                ) : (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">{t('مسودة', 'Draft')}</span>
                )}
              </div>
              <p className="text-sm text-slate-500 line-clamp-3 mb-3">{letter.content}</p>
              <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100">
                <span>{letter.sentDate}</span>
                <div className="flex gap-1">
                  <button onClick={() => handleView(letter)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Eye className="w-3.5 h-3.5" /></button>
                  {letter.status === 'draft' && (
                    <button onClick={() => handleSend(letter.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"><Send className="w-3.5 h-3.5" /></button>
                  )}
                  <button onClick={() => handleDelete(letter.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
          {letters.length === 0 && (
            <div className="col-span-full text-center py-16 text-slate-400">
              <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>{t('لا توجد خطابات بعد', 'No letters yet')}</p>
            </div>
          )}
        </div>
      )}

      {/* Letter Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">{t('خطاب جديد', 'New Letter')}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('عنوان الخطاب', 'Letter Title')} *</label>
                <input type="text" value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm" placeholder={t('مثال: تجديد عقد النظافة', 'e.g. Cleaning contract renewal')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('المستلم', 'Recipient')} *</label>
                <select
                  value={formData.recipientType || 'all'}
                  onChange={e => {
                    const val = e.target.value as 'all' | 'specific'
                    setFormData({ ...formData, recipientType: val, recipientId: val === 'all' ? '' : formData.recipientId })
                  }}
                  className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm"
                >
                  <option value="all">{t('جميع المستأجرين', 'All Tenants')}</option>
                  <option value="specific">{t('مستأجر محدد', 'Specific Tenant')}</option>
                </select>
              </div>
              {formData.recipientType === 'specific' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('اختر المستأجر', 'Select Tenant')} *</label>
                  <select
                    value={formData.recipientId || ''}
                    onChange={e => {
                      const tenant = tenants.find(tt => tt.id === e.target.value)
                      setFormData({ ...formData, recipientId: e.target.value, recipientName: tenant?.fullName || '' })
                    }}
                    className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value="">{t('-- اختر مستأجر --', '-- Select Tenant --')}</option>
                    {tenants.map(tt => (
                      <option key={tt.id} value={tt.id}>{tt.fullName} - {tt.houseNumber}</option>
                    ))}
                  </select>
                  {loadingTenants && (
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />{t('جارٍ تحميل المستأجرين...', 'Loading tenants...')}</p>
                  )}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('محتوى الخطاب', 'Letter Content')} *</label>
                <textarea
                  value={formData.content || ''}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                  rows={6}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm resize-none"
                  placeholder={t('اكتب محتوى الخطاب هنا...', 'Write the letter content here...')}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} disabled={saving} className={`flex-1 h-10 flex items-center justify-center gap-2 rounded-xl transition-colors ${saving ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}{saving ? t('جارٍ الإرسال...', 'Sending...') : t('إرسال', 'Send')}
              </button>
              <button onClick={() => setShowModal(false)} className="flex-1 h-10 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200">{t('إلغاء', 'Cancel')}</button>
            </div>
          </div>
        </div>
      )}

      {/* View Letter Modal */}
      {showViewModal && viewingLetter && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">{viewingLetter.title}</h3>
              <button onClick={() => setShowViewModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 bg-indigo-50 rounded-xl mb-4">
              <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                {viewingLetter.recipientType === 'all' ? (
                  <><Users className="w-4 h-4 text-slate-400" /><span>{t('المستلم: جميع المستأجرين', 'Recipient: All Tenants')}</span></>
                ) : (
                  <><User className="w-4 h-4 text-slate-400" /><span>{t('المستلم:', 'Recipient:')} {viewingLetter.recipientName || viewingLetter.recipientId}</span></>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>{t('تاريخ الإرسال:', 'Sent Date:')} {viewingLetter.sentDate}</span>
              </div>
              <div className="mt-2">
                {viewingLetter.status === 'sent' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium"><CheckCircle className="w-3 h-3" />{t('مرسل', 'Sent')}</span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium"><Clock className="w-3 h-3" />{t('مسودة', 'Draft')}</span>
                )}
              </div>
            </div>
            <div className="p-4 bg-white border border-slate-200 rounded-xl whitespace-pre-wrap text-sm text-slate-700 leading-relaxed min-h-[120px]">
              {viewingLetter.content}
            </div>
            <div className="flex gap-3 mt-4">
              {viewingLetter.status === 'draft' && (
                <button onClick={() => { handleSend(viewingLetter.id); setViewingLetter({ ...viewingLetter, status: 'sent' }) }} className="flex-1 h-10 bg-green-600 text-white rounded-xl hover:bg-green-700 flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" />{t('إرسال', 'Send')}
                </button>
              )}
              <button onClick={() => setShowViewModal(false)} className={`h-10 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 ${viewingLetter.status === 'draft' ? 'flex-1' : 'w-full'}`}>{t('إغلاق', 'Close')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Ads
