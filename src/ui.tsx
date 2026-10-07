import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'

const control =
  'mt-1.5 w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-ruxin'

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
  return (
    <label className="block text-sm">
      <span className="font-medium">{label}</span>
      {hint ? <span className="mt-0.5 block text-xs text-neutral-500">{hint}</span> : null}
      {multiline ? (
        <textarea className={`${control} min-h-28`} value={value} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input className={control} value={value} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
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
  return (
    <label className="block text-sm">
      <span className="font-medium">{label}</span>
      <span className="mt-0.5 block text-xs text-neutral-500">{hint}</span>
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
  return (
    <article className="rounded-2xl border border-ink/10 bg-white p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="truncate text-sm font-semibold">{title || 'Untitled'}</h3>
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
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`flex size-8 items-center justify-center rounded-full border border-ink/10 text-neutral-500 transition-colors hover:text-ink ${danger ? 'hover:border-ruxin hover:text-ruxin' : ''}`}
    >
      {icon}
    </button>
  )
}

export function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full border border-dashed border-ink/20 px-4 py-2 text-sm text-neutral-600 transition-colors hover:border-ink hover:text-ink"
    >
      <Plus className="size-4" />
      {label}
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
