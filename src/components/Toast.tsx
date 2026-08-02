import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react'
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastItem {
  id: number
  type: ToastType
  message: string
}

interface ToastContextValue {
  showToast: (type: ToastType, message: string) => void
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} })

export const useToast = () => useContext(ToastContext)

const ICONS: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
}

const STYLES: Record<ToastType, string> = {
  success: 'bg-green-50 border-green-200',
  error: 'bg-red-50 border-red-200',
  info: 'bg-blue-50 border-blue-200',
  warning: 'bg-amber-50 border-amber-200',
}

const ICON_COLORS: Record<ToastType, string> = {
  success: 'text-green-500',
  error: 'text-red-500',
  info: 'text-blue-500',
  warning: 'text-amber-500',
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

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-20 right-2 sm:right-4 z-[100] flex flex-col gap-2 w-[min(92vw,380px)] pointer-events-none">
        {toasts.map(t => {
          const Icon = ICONS[t.type]
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg animate-toast-in ${STYLES[t.type]}`}
            >
              <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${ICON_COLORS[t.type]}`} />
              <p className="flex-1 text-sm font-medium text-slate-700 leading-relaxed">{t.message}</p>
              <button onClick={() => remove(t.id)} className="text-slate-400 hover:text-slate-600 transition-colors" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
