import { createHash } from 'node:crypto'
import { Hono, type Context } from 'hono'
import { z } from 'zod'
import { prisma } from '../db'
import { requireAuth, type AppVariables } from '../middleware'

const eventNames = [
  'page_view',
  'section_viewed',
  'service_viewed',
  'service_interest',
  'cta_clicked',
  'contact_form_started',
  'contact_form_submitted',
  'phone_clicked',
  'email_clicked',
  'map_clicked',
  'engagement',
] as const

export const eventBodySchema = z
  .object({
    name: z.enum(eventNames),
    path: z.string().trim().startsWith('/').max(255),
    section: z.string().trim().max(100).optional(),
    service: z.string().trim().max(120).optional(),
    visitorId: z.string().trim().max(128).optional(),
    referrer: z.string().trim().max(500).optional(),
    value: z.number().int().min(0).max(86400).optional(),
  })
  .strict()

const rangeSchema = z
  .object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  })
  .strict()

const rateBuckets = new Map<string, { startedAt: number; count: number }>()
const RATE_WINDOW_MS = 60_000
const RATE_LIMIT = 120
type AnalyticsContext = Context<{ Variables: AppVariables }>
type AnalyticsRecord = {
  id: string
  name: string
  path: string
  section: string | null
  service: string | null
  referrer: string | null
  country: string | null
  city: string | null
  device: string | null
  visitorHash: string | null
  value: number | null
  createdAt: Date
}
type AnalyticsStore = {
  create(args: { data: Record<string, unknown> }): Promise<unknown>
  findMany(args: { where: Record<string, unknown>; orderBy: { createdAt: 'asc' }; take: number }): Promise<AnalyticsRecord[]>
}
// The generated Prisma client is refreshed by `prisma db push` in the deployment environment.
const analyticsDb = prisma as typeof prisma & { analyticsEvent: AnalyticsStore }

function clientAddress(c: AnalyticsContext) {
  return c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || c.req.header('x-real-ip') || 'unknown'
}

function allowed(c: AnalyticsContext) {
  const key = clientAddress(c)
  const now = Date.now()
  const bucket = rateBuckets.get(key)
  if (!bucket || now - bucket.startedAt >= RATE_WINDOW_MS) {
    rateBuckets.set(key, { startedAt: now, count: 1 })
    return true
  }
  if (bucket.count >= RATE_LIMIT) return false
  bucket.count += 1
  return true
}

function header(c: AnalyticsContext, names: string[]) {
  for (const name of names) {
    const value = c.req.header(name)
    if (value) return value.trim().slice(0, 120)
  }
  return null
}

function deviceFromUserAgent(userAgent: string | undefined) {
  if (!userAgent) return 'Unknown'
  if (/tablet|ipad/i.test(userAgent)) return 'Tablet'
  if (/mobile|android|iphone|ipod/i.test(userAgent)) return 'Mobile'
  return 'Desktop'
}

function referrerHost(value: string | undefined) {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.hostname.replace(/^www\./, '').slice(0, 120) || null
  } catch {
    return null
  }
}

function visitorHash(value: string | undefined) {
  if (!value) return null
  return createHash('sha256').update(`ruxin-analytics:${value}`).digest('hex')
}

function dayKey(value: Date) {
  return value.toISOString().slice(0, 10)
}

function countBy<T>(items: T[], getKey: (item: T) => string) {
  const counts = new Map<string, number>()
  for (const item of items) {
    const key = getKey(item) || 'Unknown'
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, count }))
}

function parseDate(value: string | undefined, endOfDay = false) {
  if (!value) return null
  const date = new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`)
  return Number.isNaN(date.getTime()) ? null : date
}

function getRange(query: Record<string, string | undefined>) {
  const parsed = rangeSchema.safeParse(query)
  if (!parsed.success) return null
  const now = new Date()
  const to = parseDate(parsed.data.to, true) || now
  const from = parseDate(parsed.data.from) || new Date(to.getTime() - 6 * 86400000)
  if (from > to || to.getTime() - from.getTime() > 90 * 86400000) return null
  return { from, to }
}

export const analyticsRoutes = new Hono<{ Variables: AppVariables }>()

analyticsRoutes.post('/events', async (c) => {
  if (!allowed(c)) return c.json({ error: 'Too many analytics events.' }, 429)

  const body = await c.req.json().catch(() => null)
  const parsed = eventBodySchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Invalid analytics event.' }, 400)

  const event = parsed.data
  await analyticsDb.analyticsEvent.create({
    data: {
      name: event.name,
      path: event.path,
      section: event.section || null,
      service: event.service || null,
      referrer: referrerHost(event.referrer),
      country: header(c, ['cf-ipcountry', 'x-vercel-ip-country', 'x-appengine-country']),
      city: header(c, ['x-vercel-ip-city', 'cf-ipcity']),
      device: deviceFromUserAgent(c.req.header('user-agent')),
      visitorHash: visitorHash(event.visitorId),
      value: event.value ?? null,
    },
  })

  return c.json({ ok: true })
})

analyticsRoutes.get('/summary', requireAuth, async (c) => {
  const range = getRange({ from: c.req.query('from'), to: c.req.query('to') })
  if (!range) return c.json({ error: 'Choose a date range of 90 days or less.' }, 400)

  const events = await analyticsDb.analyticsEvent.findMany({
    where: { createdAt: { gte: range.from, lte: range.to } },
    orderBy: { createdAt: 'asc' },
    take: 100_000,
  })

  const pageViews = events.filter((event) => event.name === 'page_view')
  const pageViewVisitors = new Set(pageViews.map((event) => event.visitorHash || event.id))
  const visits = new Set(pageViews.map((event) => `${event.visitorHash || event.id}:${dayKey(event.createdAt)}`))
  const engagement = events.filter((event) => event.name === 'engagement' && event.value !== null)
  const averageEngagement = engagement.length
    ? Math.round(engagement.reduce((total, event) => total + (event.value || 0), 0) / engagement.length)
    : null
  const contactEvents = events.filter((event) => ['contact_form_started', 'contact_form_submitted', 'phone_clicked', 'email_clicked', 'map_clicked'].includes(event.name))

  return c.json({
    range: { from: range.from.toISOString().slice(0, 10), to: range.to.toISOString().slice(0, 10) },
    totals: {
      visitors: pageViewVisitors.size,
      visits: visits.size,
      pageViews: pageViews.length,
      averageEngagementSeconds: averageEngagement,
      contactActions: contactEvents.length,
      contactFormStarts: events.filter((event) => event.name === 'contact_form_started').length,
      contactFormSubmissions: events.filter((event) => event.name === 'contact_form_submitted').length,
    },
    locations: countBy(pageViews, (event) => event.country || 'Unknown'),
    cities: countBy(pageViews, (event) => event.city || 'Unknown'),
    sections: countBy(events.filter((event) => event.name === 'section_viewed'), (event) => event.section || 'Unknown'),
    services: Object.values(
      events
        .filter((event) => event.service)
        .reduce<Record<string, { label: string; views: number; interactions: number }>>((result, event) => {
          const key = event.service as string
          result[key] ||= { label: key, views: 0, interactions: 0 }
          if (event.name === 'service_viewed') result[key].views += 1
          if (event.name === 'service_interest') result[key].interactions += 1
          return result
        }, {}),
    ).sort((a, b) => b.views + b.interactions - (a.views + a.interactions)),
    sources: countBy(pageViews, (event) => event.referrer || 'Direct'),
    devices: countBy(pageViews, (event) => event.device || 'Unknown'),
    actions: countBy(contactEvents, (event) => event.name),
    dailyPageViews: countBy(pageViews, (event) => dayKey(event.createdAt)),
    topPaths: countBy(pageViews, (event) => event.path),
  })
})
