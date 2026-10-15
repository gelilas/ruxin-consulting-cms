import bcrypt from 'bcryptjs'
import type { Context } from 'hono'
import { sign, verify } from 'hono/jwt'
import type { Role, User } from '@prisma/client'
import { prisma } from './db'

const JWT_DAYS = 7
const JWT_MAX_AGE = 60 * 60 * 24 * JWT_DAYS

export type PublicUser = {
  id: string
  email: string
  name: string
  role: Role
}

export type JwtPayload = {
  sub: string
  email: string
  name: string
  role: Role
  exp: number
}

export function toPublicUser(user: Pick<User, 'id' | 'email' | 'name' | 'role'>): PublicUser {
  return { id: user.id, email: user.email, name: user.name, role: user.role }
}

function jwtSecret() {
  const secret = process.env.JWT_SECRET || process.env.SESSION_SECRET
  if (!secret) throw new Error('JWT_SECRET (or SESSION_SECRET) is not set.')
  return secret
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash)
}

export function assertPasswordPolicy(password: string) {
  if (typeof password !== 'string' || !password.trim()) {
    throw new Error('Password cannot be empty or whitespace-only.')
  }
  if (password.length < 10) {
    throw new Error('Password must be at least 10 characters.')
  }
}

export async function signAccessToken(user: PublicUser) {
  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + JWT_MAX_AGE,
  }
  return sign(payload, jwtSecret(), 'HS256')
}

export function getBearerToken(c: Context) {
  const header = c.req.header('authorization')
  if (!header) return undefined
  const [scheme, token] = header.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) return undefined
  return token
}

export async function getUserFromRequest(c: Context): Promise<PublicUser | null> {
  const token = getBearerToken(c)
  if (!token) return null

  try {
    const payload = (await verify(token, jwtSecret(), 'HS256')) as JwtPayload
    if (!payload?.sub || !payload.email || !payload.role) return null

    // Ensure user still exists (revoked / deleted accounts)
    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user) return null

    return toPublicUser(user)
  } catch {
    return null
  }
}
