import { BarChart3, RefreshCw } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { api } from './api'
import { useCmsCopy } from './i18n'
import type { AnalyticsBucket, AnalyticsSummary } from './types'

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

function serviceLabel(value: string, locale: string) {
  const labels: Record<string, string> = {
    consulting: locale === 'am' ? 'የኢንቨስትመንት ምክር' : locale === 'zh' ? '投资咨询' : 'Investment consultancy',
    logistics: locale === 'am' ? 'የጉምሩክ ክሊራንስ' : locale === 'zh' ? '海关清关' : 'Customs clearing',
    finance: locale === 'am' ? 'የፋይናንስ ሪፖርት' : locale === 'zh' ? '财务报告' : 'Financial reporting',
    recruitment: locale === 'am' ? 'ምልመላ' : locale === 'zh' ? '招聘服务' : 'Recruitment',
    legal: locale === 'am' ? 'የሕግ ምክር' : locale === 'zh' ? '法律咨询' : 'Legal advisory',
  }
  return labels[value] || value.replace(/[-_]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function Breakdown({ items, total, empty = 'No data yet.' }: { items: AnalyticsBucket[]; total: number; empty?: string }) {
  const copy = useCmsCopy()
  if (!items.length) return <p className="text-sm text-mute">{empty === 'No data yet.' ? copy.analytics.noData : empty}</p>
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
  const copy = useCmsCopy()
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
      setError(err instanceof Error ? err.message : copy.analytics.couldNotLoad)
    } finally {
      setPending(false)
    }
  }

  useEffect(() => {
    void load(days)
  }, [days])

  if (pending && !summary) {
    return <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mute">{copy.loading}</p>
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
            <p className="font-medium">{copy.analytics.title}</p>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-mute">{copy.analytics.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select value={days} onChange={(event) => setDays(Number(event.target.value))} className="rounded-full border border-ink/10 bg-white px-4 py-2 text-sm outline-none focus:border-ruxin">
            {[{ label: copy.analytics.last7, days: 7 }, { label: copy.analytics.last30, days: 30 }, { label: copy.analytics.last90, days: 90 }].map((range) => <option key={range.days} value={range.days}>{range.label}</option>)}
          </select>
          <button type="button" onClick={() => void load(days)} className="inline-flex size-9 items-center justify-center rounded-full border border-ink/10 bg-white text-ink/60 hover:border-ruxin hover:text-ruxin" aria-label={copy.analytics.refresh}>
            <RefreshCw className={`size-3.5 ${pending ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error ? <p className="border border-ruxin/20 bg-ruxin/5 p-4 text-sm text-ruxin">{error}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [copy.analytics.visitors, totals?.visitors || 0],
          [copy.analytics.visits, totals?.visits || 0],
          [copy.analytics.pageViews, totals?.pageViews || 0],
          [copy.analytics.contactSubmissions, totals?.contactFormSubmissions || 0],
        ].map(([label, value]) => (
          <div key={label} className="border border-ink/10 bg-cream p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute">{label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight">{number(Number(value))}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title={copy.analytics.locations}><Breakdown items={summary?.locations || []} total={locationTotal} /></Panel>
        <Panel title={copy.analytics.cities}><Breakdown items={summary?.cities || []} total={locationTotal} /></Panel>
        <Panel title={copy.analytics.sources}><Breakdown items={summary?.sources || []} total={sourceTotal} /></Panel>
        <Panel title={copy.analytics.sections}><Breakdown items={summary?.sections || []} total={sectionTotal} /></Panel>
        <Panel title={copy.analytics.devices}><Breakdown items={summary?.devices || []} total={deviceTotal} /></Panel>
        <Panel title={copy.analytics.topPages}><Breakdown items={summary?.topPaths || []} total={totals?.pageViews || 0} /></Panel>
      </div>

      <Panel title={copy.analytics.serviceInterest}>
        {summary?.services.length ? (
          <div className="grid gap-3">
            {summary.services.slice(0, 8).map((service) => (
              <div key={service.label} className="flex items-center justify-between gap-4 border-b border-ink/8 pb-3 last:border-0 last:pb-0">
                <span className="truncate text-sm">{serviceLabel(service.label, copy.locale)}</span>
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-mute">{service.views} {copy.analytics.views} · {service.interactions} {copy.analytics.interactions}</span>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-mute">{copy.analytics.noServiceData}</p>}
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title={copy.analytics.contactActions}><Breakdown items={summary?.actions || []} total={totals?.contactActions || 0} /></Panel>
        <Panel title={copy.analytics.engagement}>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div><dt className="text-mute">{copy.analytics.averageEngagement}</dt><dd className="mt-1 text-xl font-semibold">{totals?.averageEngagementSeconds ? `${totals.averageEngagementSeconds}s` : copy.analytics.notTracked}</dd></div>
            <div><dt className="text-mute">{copy.analytics.formStarts}</dt><dd className="mt-1 text-xl font-semibold">{number(totals?.contactFormStarts || 0)}</dd></div>
            <div><dt className="text-mute">{copy.analytics.formSubmissions}</dt><dd className="mt-1 text-xl font-semibold">{number(totals?.contactFormSubmissions || 0)}</dd></div>
            <div><dt className="text-mute">{copy.analytics.submissionRate}</dt><dd className="mt-1 text-xl font-semibold">{percentage(totals?.contactFormSubmissions || 0, totals?.contactFormStarts || 0)}</dd></div>
          </dl>
        </Panel>
      </div>
    </div>
  )
}
