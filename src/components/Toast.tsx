import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react'
import { CheckCircle, XCircle, Info, AlertTriangle, X, Check } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info' | 'warning' | 'confirm'

interface ToastItem {
  id: number
  type: ToastType
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm?: () => void
  onCancel?: () => void
}

interface ToastContextValue {
  showToast: (type: ToastType, message: string) => void
  confirm: (message: string, onConfirm: () => void, options?: { confirmLabel?: string; cancelLabel?: string; onCancel?: () => void }) => void
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {}, confirm: () => {} })

export const useToast = () => useContext(ToastContext)

const ICONS: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
  confirm: AlertTriangle,
}

const STYLES: Record<ToastType, string> = {
  success: 'bg-green-50 border-green-200',
  error: 'bg-red-50 border-red-200',
  info: 'bg-blue-50 border-blue-200',
  warning: 'bg-amber-50 border-amber-200',
  confirm: 'bg-white border-slate-200',
}

const ICON_COLORS: Record<ToastType, string> = {
  success: 'text-green-500',
  error: 'text-red-500',
  info: 'text-blue-500',
  warning: 'text-amber-500',
  confirm: 'text-amber-500',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const idRef = useRef(1)

  const remove = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = idRef.current++
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => remove(id), 4000)
  }, [remove])

  const confirm = useCallback((message: string, onConfirm: () => void, options?: { confirmLabel?: string; cancelLabel?: string; onCancel?: () => void }) => {
    const id = idRef.current++
    setToasts(prev => [...prev, {
      id,
      type: 'confirm',
      message,
      confirmLabel: options?.confirmLabel,
      cancelLabel: options?.cancelLabel,
      onConfirm: () => { remove(id); onConfirm() },
      onCancel: () => { remove(id); options?.onCancel?.() },
    }])
  }, [remove])

  return (
    <ToastContext.Provider value={{ showToast, confirm }}>
      {children}
      <div className="fixed top-20 right-2 sm:right-4 z-[100] flex flex-col gap-2 w-[min(92vw,380px)] pointer-events-none">
        {toasts.map(t => {
          const Icon = ICONS[t.type]
          const isConfirm = t.type === 'confirm'
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg ${isConfirm ? 'animate-pop-in' : 'animate-toast-in'} ${STYLES[t.type]}`}
            >
              <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${ICON_COLORS[t.type]}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 leading-relaxed">{t.message}</p>
                {isConfirm && (
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={t.onConfirm}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      {t.confirmLabel || 'Confirm'}
                    </button>
                    <button
                      onClick={t.onCancel}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors"
                    >
                      {t.cancelLabel || 'Cancel'}
                    </button>
                  </div>
                )}
              </div>
              {!isConfirm && (
                <button onClick={() => remove(t.id)} className="text-slate-400 hover:text-slate-600 transition-colors" aria-label="Close">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
