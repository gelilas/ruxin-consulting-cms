import { createMiddleware } from 'hono/factory'
import type { PublicUser } from './auth'
import { getUserFromRequest } from './auth'

export type AppVariables = {
  user: PublicUser
}

export const requireAuth = createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
  const user = await getUserFromRequest(c)
  if (!user) {
    return c.json({ error: 'Sign in required.' }, 401)
  }
  c.set('user', user)
  await next()
})

export const requireAdmin = createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
  const user = c.get('user')
  if (!user || user.role !== 'ADMIN') {
    return c.json({ error: 'Admin access required.' }, 403)
  }
  await next()
})
