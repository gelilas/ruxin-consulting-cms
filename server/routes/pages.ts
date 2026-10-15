import { Hono } from 'hono'
import type { Prisma } from '@prisma/client'
import { getUserFromRequest } from '../auth'
import { prisma } from '../db'
import { requireAuth, type AppVariables } from '../middleware'
import {
  createPageBodySchema,
  idParamSchema,
  pageSlugSchema,
  parseOrError,
  updatePageBodySchema,
} from '../validation'

const MAX_BODY_JSON_BYTES = 512_000

function assertBodySize(body: unknown): string | null {
  if (body === undefined) return null
  try {
    if (JSON.stringify(body).length > MAX_BODY_JSON_BYTES) {
      return 'Page body is too large.'
    }
  } catch {
    return 'Invalid page body.'
  }
  return null
}

export const pagesRoutes = new Hono<{ Variables: AppVariables }>()

pagesRoutes.get('/', requireAuth, async (c) => {
  const pages = await prisma.page.findMany({ orderBy: { updatedAt: 'desc' } })
  return c.json({
    pages: pages.map((page) => ({
      id: page.id,
      slug: page.slug,
      title: page.title,
      status: page.status,
      body: page.body,
      createdAt: page.createdAt.toISOString(),
      updatedAt: page.updatedAt.toISOString(),
      createdById: page.createdById,
    })),
  })
})

pagesRoutes.get('/:slug', async (c) => {
  const slugParsed = parseOrError(pageSlugSchema, c.req.param('slug'), 'Invalid page slug.')
  if (!slugParsed.ok) return c.json({ error: slugParsed.error }, 400)

  const page = await prisma.page.findUnique({ where: { slug: slugParsed.data } })
  if (!page) return c.json({ error: 'Page not found.' }, 404)

  const user = await getUserFromRequest(c)
  if (page.status !== 'published' && !user) {
    return c.json({ error: 'Page not found.' }, 404)
  }

  return c.json({
    id: page.id,
    slug: page.slug,
    title: page.title,
    status: page.status,
    body: page.body,
    createdAt: page.createdAt.toISOString(),
    updatedAt: page.updatedAt.toISOString(),
  })
})

pagesRoutes.post('/', requireAuth, async (c) => {
  const parsed = parseOrError(
    createPageBodySchema,
    await c.req.json().catch(() => null),
    'Invalid page payload.',
  )
  if (!parsed.ok) {
    return c.json({ error: parsed.error }, 400)
  }

  const sizeError = assertBodySize(parsed.data.body)
  if (sizeError) return c.json({ error: sizeError }, 400)

  const existing = await prisma.page.findUnique({ where: { slug: parsed.data.slug } })
  if (existing) {
    return c.json({ error: 'A page with that slug already exists.' }, 409)
  }

  const user = c.get('user')
  const page = await prisma.page.create({
    data: {
      slug: parsed.data.slug,
      title: parsed.data.title,
      status: parsed.data.status ?? 'draft',
      body: (parsed.data.body ?? {}) as Prisma.InputJsonValue,
      createdById: user.id,
    },
  })

  return c.json({ page }, 201)
})

pagesRoutes.put('/:id', requireAuth, async (c) => {
  const idParsed = parseOrError(idParamSchema, c.req.param('id'), 'Invalid page id.')
  if (!idParsed.ok) return c.json({ error: idParsed.error }, 400)

  const parsed = parseOrError(
    updatePageBodySchema,
    await c.req.json().catch(() => null),
    'Invalid page payload.',
  )
  if (!parsed.ok) {
    return c.json({ error: parsed.error }, 400)
  }

  const sizeError = assertBodySize(parsed.data.body)
  if (sizeError) return c.json({ error: sizeError }, 400)

  const id = idParsed.data
  const existing = await prisma.page.findUnique({ where: { id } })
  if (!existing) return c.json({ error: 'Page not found.' }, 404)

  if (parsed.data.slug && parsed.data.slug !== existing.slug) {
    const clash = await prisma.page.findUnique({ where: { slug: parsed.data.slug } })
    if (clash) return c.json({ error: 'A page with that slug already exists.' }, 409)
  }

  const page = await prisma.page.update({
    where: { id },
    data: {
      slug: parsed.data.slug,
      title: parsed.data.title,
      status: parsed.data.status,
      body: parsed.data.body === undefined ? undefined : (parsed.data.body as Prisma.InputJsonValue),
    },
  })

  return c.json({ page })
})

pagesRoutes.delete('/:id', requireAuth, async (c) => {
  const idParsed = parseOrError(idParamSchema, c.req.param('id'), 'Invalid page id.')
  if (!idParsed.ok) return c.json({ error: idParsed.error }, 400)

  const id = idParsed.data
  const existing = await prisma.page.findUnique({ where: { id } })
  if (!existing) return c.json({ error: 'Page not found.' }, 404)
  await prisma.page.delete({ where: { id } })
  return c.json({ ok: true })
})
