import { Hono } from 'hono'
import type { Prisma } from '@prisma/client'
import { fillSiteContent } from '../content-defaults'
import { siteContentSchema } from '../content-schema'
import { contentLocaleSchema, localizedContent, splitStoredContent, storedContent, type ContentLocale } from '../content-localization'
import { prisma } from '../db'
import { requireAuth, type AppVariables } from '../middleware'
import { contentSectionSchema, parseOrError } from '../validation'

export const contentRoutes = new Hono<{ Variables: AppVariables }>()

function requestedLocale(value: string | undefined): ContentLocale {
  const parsed = contentLocaleSchema.safeParse(value || 'en')
  return parsed.success ? parsed.data : 'en'
}

contentRoutes.get('/', async (c) => {
  const doc = await prisma.siteDocument.findUnique({ where: { id: 'main' } })
  if (!doc) return c.json({ error: 'Content not found.' }, 404)
  const filled = fillSiteContent(localizedContent(doc.content, requestedLocale(c.req.query('lang'))))
  const parsed = siteContentSchema.safeParse(filled)
  return c.json(parsed.success ? parsed.data : filled)
})

contentRoutes.put('/', requireAuth, async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = siteContentSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Content is missing a required section.' }, 400)
  }

  const user = c.get('user')
  const locale = requestedLocale(c.req.query('lang'))
  const existing = await prisma.siteDocument.findUnique({ where: { id: 'main' } })
  const stored = splitStoredContent(existing?.content)
  const base = locale === 'en' ? parsed.data : stored.base
  const locales = { ...stored.locales, ...(locale === 'en' ? {} : { [locale]: parsed.data }) }
  const documentContent = storedContent(base, locales)
  await prisma.siteDocument.upsert({
    where: { id: 'main' },
    create: {
      id: 'main',
      content: documentContent as Prisma.InputJsonValue,
      updatedBy: user.id,
    },
    update: {
      content: documentContent as Prisma.InputJsonValue,
      updatedBy: user.id,
    },
  })

  return c.json({ ok: true })
})

contentRoutes.patch('/:section', requireAuth, async (c) => {
  const sectionParsed = parseOrError(
    contentSectionSchema,
    c.req.param('section'),
    'Unknown content section.',
  )
  if (!sectionParsed.ok) {
    return c.json({ error: sectionParsed.error }, 400)
  }
  const section = sectionParsed.data

  const patch = await c.req.json().catch(() => null)
  if (patch === null || typeof patch !== 'object' || Array.isArray(patch)) {
    return c.json({ error: 'Invalid section payload.' }, 400)
  }

  const doc = await prisma.siteDocument.findUnique({ where: { id: 'main' } })
  if (!doc || typeof doc.content !== 'object' || doc.content === null) {
    return c.json({ error: 'Content not found.' }, 404)
  }

  const locale = requestedLocale(c.req.query('lang'))
  const current = { ...(localizedContent(doc.content, locale) as Record<string, unknown>), [section]: patch }
  const parsed = siteContentSchema.safeParse(current)
  if (!parsed.success) {
    return c.json({ error: 'Updated content failed validation.' }, 400)
  }

  const user = c.get('user')
  const stored = splitStoredContent(doc.content)
  const base = locale === 'en' ? parsed.data : stored.base
  const locales = { ...stored.locales, ...(locale === 'en' ? {} : { [locale]: parsed.data }) }
  await prisma.siteDocument.update({
    where: { id: 'main' },
    data: {
      content: storedContent(base, locales) as Prisma.InputJsonValue,
      updatedBy: user.id,
    },
  })

  return c.json({ ok: true, content: parsed.data })
})
