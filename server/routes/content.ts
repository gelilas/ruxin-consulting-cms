import { Hono } from 'hono'
import type { Prisma } from '@prisma/client'
import { siteContentSchema } from '../content-schema'
import { prisma } from '../db'
import { requireAuth, type AppVariables } from '../middleware'
import { contentSectionSchema, parseOrError } from '../validation'

export const contentRoutes = new Hono<{ Variables: AppVariables }>()

contentRoutes.get('/', async (c) => {
  const doc = await prisma.siteDocument.findUnique({ where: { id: 'main' } })
  if (!doc) return c.json({ error: 'Content not found.' }, 404)
  return c.json(doc.content)
})

contentRoutes.put('/', requireAuth, async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = siteContentSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Content is missing a required section.' }, 400)
  }

  const user = c.get('user')
  await prisma.siteDocument.upsert({
    where: { id: 'main' },
    create: {
      id: 'main',
      content: parsed.data as Prisma.InputJsonValue,
      updatedBy: user.id,
    },
    update: {
      content: parsed.data as Prisma.InputJsonValue,
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

  const current = { ...(doc.content as Record<string, unknown>), [section]: patch }
  const parsed = siteContentSchema.safeParse(current)
  if (!parsed.success) {
    return c.json({ error: 'Updated content failed validation.' }, 400)
  }

  const user = c.get('user')
  await prisma.siteDocument.update({
    where: { id: 'main' },
    data: {
      content: parsed.data as Prisma.InputJsonValue,
      updatedBy: user.id,
    },
  })

  return c.json({ ok: true, content: parsed.data })
})
