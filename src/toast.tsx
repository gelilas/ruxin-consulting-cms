import { CheckCircle2, CircleAlert, Info, X } from 'lucide-react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type ToastTone = 'success' | 'error' | 'info'

type ToastItem = {
  id: string
  message: string
  tone: ToastTone
}

type ToastContextValue = {
  toast: (message: string, tone?: ToastTone) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const AUTO_DISMISS_MS = 4200

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const toast = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    setItems((prev) => [...prev.slice(-4), { id, message, tone }])
  }, [])

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (message) => toast(message, 'success'),
      error: (message) => toast(message, 'error'),
      info: (message) => toast(message, 'info'),
    }),
    [toast],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-end gap-2 p-4 sm:p-6"
        aria-live="polite"
        aria-relevant="additions"
      >
        {items.map((item) => (
          <ToastCard key={item.id} item={item} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(item.id), AUTO_DISMISS_MS)
    return () => window.clearTimeout(timer)
  }, [item.id, onDismiss])

  const Icon = item.tone === 'success' ? CheckCircle2 : item.tone === 'error' ? CircleAlert : Info
  const toneClass =
    item.tone === 'success'
      ? 'border-emerald-200 bg-white text-ink'
      : item.tone === 'error'
        ? 'border-ruxin/25 bg-white text-ink'
        : 'border-ink/10 bg-white text-ink'

  const iconClass =
    item.tone === 'success' ? 'text-emerald-600' : item.tone === 'error' ? 'text-ruxin' : 'text-neutral-500'

  return (
    <div
      role="status"
      className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg shadow-ink/10 animate-toast-in ${toneClass}`}
    >
      <Icon className={`mt-0.5 size-4 shrink-0 ${iconClass}`} aria-hidden />
      <p className="flex-1 text-sm leading-snug">{item.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(item.id)}
        className="rounded-lg p-1 text-neutral-400 transition-colors hover:bg-paper hover:text-ink"
        aria-label="Dismiss notification"
      >
        <X className="size-3.5" />
      </button>
    </div>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
