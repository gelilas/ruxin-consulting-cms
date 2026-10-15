import { Hono } from 'hono'
import { Role } from '@prisma/client'
import {
  assertPasswordPolicy,
  hashPassword,
  toPublicUser,
  verifyPassword,
} from '../auth'
import { prisma } from '../db'
import { requireAdmin, requireAuth, type AppVariables } from '../middleware'
import {
  createUserBodySchema,
  idParamSchema,
  parseOrError,
  updateUserBodySchema,
} from '../validation'

function publicUserRow(user: {
  id: string
  email: string
  name: string
  role: Role
  createdAt: Date
  updatedAt: Date
}) {
  return {
    ...toPublicUser(user),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }
}

export const usersRoutes = new Hono<{ Variables: AppVariables }>()

usersRoutes.use('*', requireAuth, requireAdmin)

usersRoutes.get('/', async (c) => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } })
  return c.json({ users: users.map(publicUserRow) })
})

usersRoutes.post('/', async (c) => {
  const parsed = parseOrError(
    createUserBodySchema,
    await c.req.json().catch(() => null),
    'Invalid user payload.',
  )
  if (!parsed.ok) {
    return c.json({ error: parsed.error }, 400)
  }

  try {
    assertPasswordPolicy(parsed.data.password)
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Invalid password.' }, 400)
  }

  const email = parsed.data.email
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return c.json({ error: 'A user with that email already exists.' }, 409)
  }

  const user = await prisma.user.create({
    data: {
      email,
      name: parsed.data.name,
      passwordHash: await hashPassword(parsed.data.password),
      role: parsed.data.role === 'ADMIN' ? Role.ADMIN : Role.EDITOR,
    },
  })

  return c.json({ user: publicUserRow(user) }, 201)
})

usersRoutes.get('/:id', async (c) => {
  const idParsed = parseOrError(idParamSchema, c.req.param('id'), 'Invalid user id.')
  if (!idParsed.ok) return c.json({ error: idParsed.error }, 400)

  const user = await prisma.user.findUnique({ where: { id: idParsed.data } })
  if (!user) return c.json({ error: 'User not found.' }, 404)
  return c.json({ user: publicUserRow(user) })
})

usersRoutes.patch('/:id', async (c) => {
  const idParsed = parseOrError(idParamSchema, c.req.param('id'), 'Invalid user id.')
  if (!idParsed.ok) return c.json({ error: idParsed.error }, 400)

  const id = idParsed.data
  const actor = c.get('user')
  const parsed = parseOrError(
    updateUserBodySchema,
    await c.req.json().catch(() => null),
    'Invalid update payload.',
  )
  if (!parsed.ok) {
    return c.json({ error: parsed.error }, 400)
  }

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) return c.json({ error: 'User not found.' }, 404)

  const data: { name?: string; role?: Role; passwordHash?: string } = {}

  if (parsed.data.name !== undefined) data.name = parsed.data.name
  if (parsed.data.role !== undefined) {
    data.role = parsed.data.role === 'ADMIN' ? Role.ADMIN : Role.EDITOR
  }

  if (parsed.data.password) {
    try {
      assertPasswordPolicy(parsed.data.password)
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : 'Invalid password.' }, 400)
    }

    if (actor.id === user.id) {
      if (!parsed.data.currentPassword) {
        return c.json({ error: 'Current password is required.' }, 400)
      }
      const ok = await verifyPassword(parsed.data.currentPassword, user.passwordHash)
      if (!ok) return c.json({ error: 'Current password is incorrect.' }, 401)
    }

    data.passwordHash = await hashPassword(parsed.data.password)
  }

  const updated = await prisma.user.update({ where: { id }, data })
  return c.json({ user: publicUserRow(updated) })
})

usersRoutes.delete('/:id', async (c) => {
  const idParsed = parseOrError(idParamSchema, c.req.param('id'), 'Invalid user id.')
  if (!idParsed.ok) return c.json({ error: idParsed.error }, 400)

  const id = idParsed.data
  const actor = c.get('user')

  if (actor.id === id) {
    return c.json({ error: 'You cannot delete your own account.' }, 400)
  }

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) return c.json({ error: 'User not found.' }, 404)

  await prisma.user.delete({ where: { id } })
  return c.json({ ok: true })
})
