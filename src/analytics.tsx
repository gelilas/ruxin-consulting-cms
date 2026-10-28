import { BarChart3, RefreshCw } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { api } from './api'
import type { AnalyticsBucket, AnalyticsSummary } from './types'

const ranges = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
] as const

function dateRange(days: number) {
  const to = new Date()
  const from = new Date(to.getTime() - (days - 1) * 86400000)
  const format = (value: Date) => value.toISOString().slice(0, 10)
  return { from: format(from), to: format(to) }
}

function number(value: number) {
  return new Intl.NumberFormat().format(value)
}

function percentage(value: number, total: number) {
  return total ? `${Math.round((value / total) * 100)}%` : '0%'
}

function serviceLabel(value: string) {
  const labels: Record<string, string> = {
    consulting: 'Investment consultancy',
    logistics: 'Customs clearing',
    finance: 'Financial reporting',
    recruitment: 'Recruitment',
    legal: 'Legal advisory',
  }
  return labels[value] || value.replace(/[-_]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function Breakdown({ items, total, empty = 'No data yet.' }: { items: AnalyticsBucket[]; total: number; empty?: string }) {
  if (!items.length) return <p className="text-sm text-mute">{empty}</p>
  return (
    <div className="grid gap-3">
      {items.slice(0, 8).map((item) => (
        <div key={item.label}>
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="truncate">{item.label}</span>
            <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-mute">
              {number(item.count)} · {percentage(item.count, total)}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-stone">
            <div className="h-full rounded-full bg-ruxin" style={{ width: `${total ? Math.max(3, (item.count / total) * 100) : 0}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border border-ink/10 bg-cream p-5 md:p-6">
      <h2 className="mb-5 font-mono text-[10.5px] uppercase tracking-[0.2em] text-ruxin">{title}</h2>
      {children}
    </section>
  )
}

export function AnalyticsDashboard() {
  const [days, setDays] = useState(7)
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [pending, setPending] = useState(true)
  const [error, setError] = useState('')

  const load = async (selectedDays: number) => {
    setPending(true)
    setError('')
    try {
      setSummary(await api.analytics(dateRange(selectedDays)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load analytics.')
    } finally {
      setPending(false)
    }
  }

  useEffect(() => {
    void load(days)
  }, [days])

  if (pending && !summary) {
    return <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mute">Loading analytics</p>
  }

  const totals = summary?.totals
  const sourceTotal = summary?.sources.reduce((sum, item) => sum + item.count, 0) || 0
  const locationTotal = summary?.locations.reduce((sum, item) => sum + item.count, 0) || 0
  const deviceTotal = summary?.devices.reduce((sum, item) => sum + item.count, 0) || 0
  const sectionTotal = summary?.sections.reduce((sum, item) => sum + item.count, 0) || 0

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-4 border border-ink/10 bg-cream p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-ruxin text-white"><BarChart3 className="size-4" /></span>
          <div>
            <p className="font-medium">Anonymous website analytics</p>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-mute">Aggregate visits, locations, sections, service interest, and contact actions. No form names, emails, phone numbers, or messages are stored here. Form submissions are successful validations until delivery is connected.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select value={days} onChange={(event) => setDays(Number(event.target.value))} className="rounded-full border border-ink/10 bg-white px-4 py-2 text-sm outline-none focus:border-ruxin">
            {ranges.map((range) => <option key={range.days} value={range.days}>{range.label}</option>)}
          </select>
          <button type="button" onClick={() => void load(days)} className="inline-flex size-9 items-center justify-center rounded-full border border-ink/10 bg-white text-ink/60 hover:border-ruxin hover:text-ruxin" aria-label="Refresh analytics">
            <RefreshCw className={`size-3.5 ${pending ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error ? <p className="border border-ruxin/20 bg-ruxin/5 p-4 text-sm text-ruxin">{error}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Visitors', totals?.visitors || 0],
          ['Visits', totals?.visits || 0],
          ['Page views', totals?.pageViews || 0],
          ['Contact submissions', totals?.contactFormSubmissions || 0],
        ].map(([label, value]) => (
          <div key={label} className="border border-ink/10 bg-cream p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute">{label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight">{number(Number(value))}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Visitors by location"><Breakdown items={summary?.locations || []} total={locationTotal} /></Panel>
        <Panel title="Cities when available"><Breakdown items={summary?.cities || []} total={locationTotal} /></Panel>
        <Panel title="Traffic sources"><Breakdown items={summary?.sources || []} total={sourceTotal} /></Panel>
        <Panel title="Website sections reached"><Breakdown items={summary?.sections || []} total={sectionTotal} /></Panel>
        <Panel title="Device mix"><Breakdown items={summary?.devices || []} total={deviceTotal} /></Panel>
        <Panel title="Top pages"><Breakdown items={summary?.topPaths || []} total={totals?.pageViews || 0} /></Panel>
      </div>

      <Panel title="Service interest">
        {summary?.services.length ? (
          <div className="grid gap-3">
            {summary.services.slice(0, 8).map((service) => (
              <div key={service.label} className="flex items-center justify-between gap-4 border-b border-ink/8 pb-3 last:border-0 last:pb-0">
                <span className="truncate text-sm">{serviceLabel(service.label)}</span>
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-mute">{service.views} views · {service.interactions} interactions</span>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-mute">No service interest recorded yet.</p>}
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Contact actions"><Breakdown items={summary?.actions || []} total={totals?.contactActions || 0} /></Panel>
        <Panel title="Engagement and form activity">
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div><dt className="text-mute">Average engagement</dt><dd className="mt-1 text-xl font-semibold">{totals?.averageEngagementSeconds ? `${totals.averageEngagementSeconds}s` : 'Not tracked yet'}</dd></div>
            <div><dt className="text-mute">Form starts</dt><dd className="mt-1 text-xl font-semibold">{number(totals?.contactFormStarts || 0)}</dd></div>
            <div><dt className="text-mute">Form submissions</dt><dd className="mt-1 text-xl font-semibold">{number(totals?.contactFormSubmissions || 0)}</dd></div>
            <div><dt className="text-mute">Submission rate</dt><dd className="mt-1 text-xl font-semibold">{percentage(totals?.contactFormSubmissions || 0, totals?.contactFormStarts || 0)}</dd></div>
          </dl>
        </Panel>
      </div>
    </div>
  )
}
