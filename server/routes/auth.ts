import { Hono } from 'hono'
import { getUserFromRequest, signAccessToken, toPublicUser, verifyPassword } from '../auth'
import { prisma } from '../db'
import type { AppVariables } from '../middleware'
import { loginBodySchema, parseOrError } from '../validation'

const loginAttempts = new Map<string, { count: number; resetAt: number }>()

function rateLimitLogin(ip: string) {
  const now = Date.now()
  const entry = loginAttempts.get(ip)
  if (!entry || entry.resetAt <= now) {
    loginAttempts.set(ip, { count: 1, resetAt: now + 60_000 })
    return true
  }
  if (entry.count >= 5) return false
  entry.count += 1
  return true
}

export const authRoutes = new Hono<{ Variables: AppVariables }>()

authRoutes.post('/login', async (c) => {
  const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  if (!rateLimitLogin(ip)) {
    return c.json({ error: 'Too many login attempts. Try again in a minute.' }, 429)
  }

  const parsed = parseOrError(loginBodySchema, await c.req.json().catch(() => null), 'Email and password are required.')
  if (!parsed.ok) {
    return c.json({ error: parsed.error }, 400)
  }

  const { email, password } = parsed.data

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return c.json({ error: 'Incorrect email or password.' }, 401)
  }

  const publicUser = toPublicUser(user)
  const token = await signAccessToken(publicUser)
  return c.json({ ok: true, token, tokenType: 'Bearer', user: publicUser })
})

authRoutes.post('/logout', async (c) => {
  return c.json({ ok: true })
})

authRoutes.get('/session', async (c) => {
  const user = await getUserFromRequest(c)
  if (!user) return c.json({ ok: false }, 401)
  return c.json({ ok: true, user })
})
