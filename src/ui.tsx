import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { api } from './api'
import { useCmsCopy } from './i18n'

const control =
  'mt-1.5 w-full rounded-md border border-ink/10 bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-mute/70 focus:border-ruxin'

export function Logo({ light = false, mark = 'red' }: { light?: boolean; mark?: 'red' | 'white' }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="relative flex size-7 items-center justify-center" aria-hidden="true">
        <span className={`absolute inset-0 rounded-full border ${mark === 'white' ? 'border-white/80' : 'border-ruxin/70'}`} />
        <span className={`size-2 rounded-full ${mark === 'white' ? 'bg-white' : 'bg-ruxin'}`} />
      </span>
      <span className="flex flex-col leading-none">
        <span className={`font-heading text-[15px] font-bold tracking-[0.18em] ${light ? 'text-white' : 'text-ink'}`}>RUXIN</span>
        <span className={`mt-1 font-mono text-[8px] tracking-[0.42em] ${light ? 'text-white/70' : 'text-ink/45'}`}>CONSULTING</span>
      </span>
    </span>
  )
}

export function Field({
  label,
  value,
  onChange,
  multiline = false,
  hint,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  multiline?: boolean
  hint?: string
}) {
  const copy = useCmsCopy()
  return (
    <label className="block text-sm">
      <span className="font-medium">{copy.label(label)}</span>
      {hint ? <span className="mt-0.5 block text-xs text-mute">{copy.hint(hint)}</span> : null}
      {multiline ? (
        <textarea className={`${control} min-h-28`} value={value} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input className={control} value={value} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  )
}

const websiteOrigin = 'http://localhost:5173'

function previewSrc(value: string) {
  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/uploads/')) return value
  if (value.startsWith('/')) return `${websiteOrigin}${value}`
  return value
}

export function ImageField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  const copy = useCmsCopy()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  const upload = async (file: File | undefined) => {
    if (!file) return
    setPending(true)
    setError('')
    try {
      onChange(await api.upload(file))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload image.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="block text-sm">
      <span className="font-medium">{copy.label(label)}</span>
      <div className="mt-1.5 flex items-center gap-4">
        <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden border border-ink/10 bg-white">
          {value ? (
            <img src={previewSrc(value)} alt="" className="size-full object-contain" />
          ) : (
            <span className="px-2 text-center font-mono text-[9px] uppercase tracking-[0.14em] text-mute">{copy.uiLabels['No image'] || 'No image'}</span>
          )}
        </div>
        <div className="flex flex-col items-start gap-2">
          <label className="inline-flex h-10 cursor-pointer items-center rounded-full border border-ruxin px-4 text-sm font-medium text-ruxin transition-colors hover:bg-ruxin hover:text-white">
            {pending ? copy.uiLabels['Uploading…'] : value ? copy.uiLabels['Replace image'] : copy.uiLabels['Upload image']}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              disabled={pending}
              onChange={(event) => {
                const file = event.target.files?.[0]
                event.target.value = ''
                void upload(file)
              }}
            />
          </label>
          {value ? (
            <button type="button" onClick={() => onChange('')} className="text-xs text-mute transition-colors hover:text-ruxin">
              {copy.uiLabels.Remove}
            </button>
          ) : null}
        </div>
      </div>
      {error ? <p className="mt-1.5 text-xs text-ruxin">{error}</p> : null}
    </div>
  )
}

export function Lines({
  label,
  value,
  onChange,
  hint = 'One item per line',
}: {
  label: string
  value: string[]
  onChange: (value: string[]) => void
  hint?: string
}) {
  const copy = useCmsCopy()
  return (
    <label className="block text-sm">
      <span className="font-medium">{copy.label(label)}</span>
      <span className="mt-0.5 block text-xs text-mute">{copy.hint(hint)}</span>
      <textarea
        className={`${control} min-h-28`}
        value={value.join('\n')}
        onChange={(event) => onChange(event.target.value.split('\n'))}
        onBlur={(event) => onChange(event.target.value.split('\n').map((line) => line.trim()).filter(Boolean))}
      />
    </label>
  )
}

export function Card({
  title,
  children,
  onRemove,
  onUp,
  onDown,
}: {
  title: string
  children: ReactNode
  onRemove: () => void
  onUp?: () => void
  onDown?: () => void
}) {
  const copy = useCmsCopy()
  return (
    <article className="border border-ink/10 bg-cream p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="truncate text-sm font-semibold">{title || copy.uiLabels.Untitled}</h3>
        <div className="flex shrink-0 items-center gap-1">
          {onUp ? <IconButton label="Move up" onClick={onUp} icon={<ChevronUp className="size-4" />} /> : null}
          {onDown ? <IconButton label="Move down" onClick={onDown} icon={<ChevronDown className="size-4" />} /> : null}
          <IconButton label="Remove" onClick={onRemove} icon={<Trash2 className="size-4" />} danger />
        </div>
      </div>
      <div className="grid gap-4">{children}</div>
    </article>
  )
}

function IconButton({
  label,
  onClick,
  icon,
  danger = false,
}: {
  label: string
  onClick: () => void
  icon: ReactNode
  danger?: boolean
}) {
  const copy = useCmsCopy()
  return (
    <button
      type="button"
      aria-label={copy.uiLabels[label] || label}
      onClick={onClick}
      className={`flex size-8 items-center justify-center rounded-full border border-ink/10 text-mute transition-colors hover:text-ink ${danger ? 'hover:border-wine hover:text-wine' : ''}`}
    >
      {icon}
    </button>
  )
}

export function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  const copy = useCmsCopy()
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full border border-ruxin px-4 py-2 text-sm font-medium text-ruxin transition-colors hover:bg-ruxin hover:text-white"
    >
      <Plus className="size-4" />
      {copy.uiLabels[label] || label}
    </button>
  )
}

export function slug(value: string) {
  const next = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return next || 'item'
}
