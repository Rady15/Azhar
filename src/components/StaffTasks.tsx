import { useState, useEffect } from 'react'
import { ClipboardList, CheckCircle, X, Play, Loader2, RefreshCw, Wrench, AlertCircle } from 'lucide-react'
import { api } from '../services/api'

interface StaffTaskModel {
  id: string
  requestId: string
  requestNumber?: string
  title?: string
  description?: string
  houseNumber?: string
  category?: string
  priority?: string
  status: string
}

interface StaffTasksProps {
  language: 'AR' | 'EN'
}

const statusLabels: Record<string, string> = {
  Submitted: 'مقدم',
  Assigned: 'تم التعيين',
  InProgress: 'قيد العمل',
  Completed: 'مكتمل',
  Cancelled: 'ملغى',
}

const statusLabelsEn: Record<string, string> = {
  Submitted: 'Submitted',
  Assigned: 'Assigned',
  InProgress: 'In Progress',
  Completed: 'Completed',
  Cancelled: 'Cancelled',
}

const statusColors: Record<string, string> = {
  Submitted: 'text-purple-600 bg-purple-50',
  Assigned: 'text-amber-600 bg-amber-50',
  InProgress: 'text-blue-600 bg-blue-50',
  Completed: 'text-emerald-600 bg-emerald-50',
  Cancelled: 'text-slate-500 bg-slate-50',
}

export default function StaffTasks({ language }: StaffTasksProps) {
  const [tasks, setTasks] = useState<StaffTaskModel[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingTask, setUpdatingTask] = useState<string | null>(null)
  const [error, setError] = useState('')

  const t = (ar: string, en: string) => language === 'AR' ? ar : en

  const fetchTasks = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.getStaffMyTasks()
      setTasks(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setError(err.message || t('فشل تحميل المهام', 'Failed to load tasks'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTasks() }, [])

  const updateStatus = async (taskId: string, requestId: string, newStatus: number) => {
    setUpdatingTask(taskId)
    try {
      await api.updateMaintenanceStatus(requestId, { Status: newStatus })
      const statusMap = ['Submitted', 'Assigned', 'InProgress', 'Completed', 'Cancelled']
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: statusMap[newStatus] } : t))
    } catch (err: any) {
      alert(err.message || t('فشل التحديث', 'Update failed'))
    } finally {
      setUpdatingTask(null)
    }
  }

  const pendingTasks = tasks.filter(t => t.status !== 'Completed' && t.status !== 'Cancelled')
  const completedTasks = tasks.filter(t => t.status === 'Completed' || t.status === 'Cancelled')

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-primary-600" />
            {t('مهامي', 'My Tasks')}
          </h1>
          <p className="text-sm text-slate-400 mt-1">{t('جميع المهام المسندة إليك', 'All tasks assigned to you')}</p>
        </div>
        <button onClick={fetchTasks} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {t('تحديث', 'Refresh')}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 border border-slate-100">
          <p className="text-xs text-slate-400 mb-1">{t('المجموع', 'Total')}</p>
          <p className="text-2xl font-bold text-slate-800">{tasks.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-amber-100">
          <p className="text-xs text-amber-600 mb-1">{t('قيد التنفيذ', 'Pending')}</p>
          <p className="text-2xl font-bold text-amber-600">{pendingTasks.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-emerald-100">
          <p className="text-xs text-emerald-600 mb-1">{t('مكتمل', 'Completed')}</p>
          <p className="text-2xl font-bold text-emerald-600">{completedTasks.length}</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl mb-4 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />{error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          {t('جاري تحميل المهام...', 'Loading tasks...')}
        </div>
      )}

      {/* Tasks List */}
      {!loading && tasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <ClipboardList className="w-12 h-12 mb-3 opacity-40" />
          <p>{t('لا توجد مهام مسندة إليك', 'No tasks assigned to you')}</p>
        </div>
      )}

      {!loading && tasks.length > 0 && (
        <div className="space-y-3">
          {tasks.map(task => {
            const lbl = language === 'AR' ? statusLabels : statusLabelsEn
            const color = statusColors[task.status] || 'bg-slate-50 text-slate-500'
            return (
              <div key={task.id} className="bg-white rounded-2xl p-4 md:p-5 border border-slate-100 hover:shadow-sm transition-shadow">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 w-full sm:w-auto">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold ${color}`}>{lbl[task.status] || task.status}</span>
                      {task.requestNumber && <span className="text-[11px] text-slate-400 font-mono">{task.requestNumber}</span>}
                      {task.priority && (
                        <span className={`text-[11px] font-semibold ${task.priority === 'Urgent' ? 'text-red-500' : task.priority === 'High' ? 'text-orange-500' : 'text-slate-400'}`}>
                          {task.priority}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-slate-800 mb-1">{task.title || task.description}</h3>
                    {task.title && task.description && (
                      <p className="text-sm text-slate-500 mb-2 line-clamp-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      {task.houseNumber && <span className="flex items-center gap-1">🏠 {task.houseNumber}</span>}
                      {task.category && <span className="flex items-center gap-1"><Wrench className="w-3 h-3" />{task.category}</span>}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {task.status !== 'Completed' && task.status !== 'Cancelled' && (
                    <div className="flex gap-1.5 shrink-0 self-end sm:self-center">
                      {(task.status === 'Submitted' || task.status === 'Assigned') && (
                        <button
                          onClick={() => updateStatus(task.id, task.requestId, 2)}
                          disabled={updatingTask === task.id}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors disabled:opacity-40"
                          title={t('بدء العمل', 'Start Progress')}
                        >
                          {updatingTask === task.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                        </button>
                      )}
                      <button
                        onClick={() => updateStatus(task.id, task.requestId, 3)}
                        disabled={updatingTask === task.id}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors disabled:opacity-40"
                        title={t('إكمال', 'Complete')}
                      >
                        {updatingTask === task.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => updateStatus(task.id, task.requestId, 4)}
                        disabled={updatingTask === task.id}
                        className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-40"
                        title={t('إلغاء', 'Cancel')}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  {task.status === 'Completed' && (
                    <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl shrink-0 self-end sm:self-center">
                      <CheckCircle className="w-3.5 h-3.5" />{t('مكتمل', 'Done')}
                    </span>
                  )}
                  {task.status === 'Cancelled' && (
                    <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl shrink-0 self-end sm:self-center">
                      <X className="w-3.5 h-3.5" />{t('ملغى', 'Cancelled')}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
