/** @deprecated Replaced by `server/index.ts` (Hono + Prisma). Kept for reference only. */
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import fs from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import path from 'node:path'
import { loadEnv, type Plugin } from 'vite'
import type { SiteContent } from '../src/types'

const KEYS = [
  'company',
  'navLinks',
  'hero',
  'about',
  'services',
  'clients',
  'testimonials',
  'team',
  'careers',
  'insightCategories',
  'insights',
  'assistant',
] as const

function isContent(value: unknown): value is SiteContent {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  if (!KEYS.every((key) => key in record)) return false
  const lists = ['navLinks', 'services', 'clients', 'testimonials', 'team', 'insightCategories', 'insights'] as const
  if (!lists.every((key) => Array.isArray(record[key]))) return false
  const company = record.company as Record<string, unknown>
  const hero = record.hero as Record<string, unknown>
  const about = record.about as Record<string, unknown>
  const careers = record.careers as Record<string, unknown>
  const assistant = record.assistant as Record<string, unknown>
  return (
    typeof company?.name === 'string' &&
    Array.isArray(company.socials) &&
    Array.isArray(hero?.headline) &&
    typeof hero?.body === 'string' &&
    Array.isArray(about?.stats) &&
    Array.isArray(about?.stages) &&
    Array.isArray(careers?.jobs) &&
    Array.isArray(careers?.benefits) &&
    typeof assistant?.welcome === 'string' &&
    Array.isArray(assistant?.suggestions)
  )
}

function readBody(req: IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0
    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > 1_500_000) {
        reject(new Error('Body too large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function cookies(header: string | undefined) {
  const out: Record<string, string> = {}
  if (!header) return out
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=')
    if (key) out[key] = decodeURIComponent(rest.join('='))
  }
  return out
}

function sign(value: string, secret: string) {
  return createHmac('sha256', secret).update(value).digest('hex')
}

function createSession(secret: string) {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + 1000 * 60 * 60 * 24 * 7 })).toString('base64url')
  return `${payload}.${sign(payload, secret)}`
}

function validSession(token: string | undefined, secret: string) {
  if (!token) return false
  const [payload, mac] = token.split('.')
  if (!payload || !mac) return false
  const expected = sign(payload, secret)
  const left = Buffer.from(mac)
  const right = Buffer.from(expected)
  if (left.length !== right.length || !timingSafeEqual(left, right)) return false
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString()) as { exp?: number }
    return typeof data.exp === 'number' && data.exp > Date.now()
  } catch {
    return false
  }
}

function sameSecret(input: string, expected: string) {
  const left = Buffer.from(input)
  const right = Buffer.from(expected)
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

function send(res: ServerResponse, status: number, body: unknown, extra: Record<string, string> = {}) {
  const json = JSON.stringify(body)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store',
    ...extra,
  })
  res.end(json)
}

export function cmsApiPlugin(root: string): Plugin {
  const contentFile = path.join(root, 'data', 'content.json')
  const secretFile = path.join(root, 'data', '.secret')

  const attach = (middlewares: { use: (fn: (req: IncomingMessage, res: ServerResponse, next: () => void) => void) => void }, password: string) => {
    fs.mkdirSync(path.dirname(contentFile), { recursive: true })
    if (!fs.existsSync(secretFile)) fs.writeFileSync(secretFile, randomBytes(32).toString('hex'))
    const secret = fs.readFileSync(secretFile, 'utf8').trim()

    const readContent = () => JSON.parse(fs.readFileSync(contentFile, 'utf8')) as SiteContent
    const writeContent = (content: SiteContent) => {
      const tmp = `${contentFile}.tmp`
      fs.writeFileSync(tmp, `${JSON.stringify(content, null, 2)}\n`)
      fs.renameSync(tmp, contentFile)
    }

    middlewares.use((req, res, next) => {
      const url = new URL(req.url ?? '/', 'http://localhost')
      if (!url.pathname.startsWith('/api/')) return next()

      if (req.method === 'OPTIONS') {
        res.writeHead(204, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, PUT, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        })
        res.end()
        return
      }

      const authed = () => validSession(cookies(req.headers.cookie).cms_session, secret)

      void (async () => {
        try {
          if (req.method === 'GET' && url.pathname === '/api/content') {
            send(res, 200, readContent())
            return
          }
          if (req.method === 'GET' && url.pathname === '/api/session') {
            send(res, authed() ? 200 : 401, { ok: authed() })
            return
          }
          if (req.method === 'POST' && url.pathname === '/api/logout') {
            send(res, 200, { ok: true }, { 'Set-Cookie': 'cms_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0' })
            return
          }
          if (req.method === 'POST' && url.pathname === '/api/login') {
            const body = JSON.parse(await readBody(req)) as { password?: string }
            if (!sameSecret(String(body.password ?? ''), password)) {
              send(res, 401, { error: 'Incorrect password.' })
              return
            }
            const token = createSession(secret)
            send(res, 200, { ok: true }, {
              'Set-Cookie': `cms_session=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=604800`,
            })
            return
          }
          if (req.method === 'PUT' && url.pathname === '/api/content') {
            if (!authed()) {
              send(res, 401, { error: 'Sign in required.' })
              return
            }
            const body = JSON.parse(await readBody(req)) as unknown
            if (!isContent(body)) {
              send(res, 400, { error: 'Content is missing a required section.' })
              return
            }
            writeContent(body)
            send(res, 200, { ok: true })
            return
          }
          send(res, 404, { error: 'Not found.' })
        } catch {
          send(res, 500, { error: 'Could not complete that request.' })
        }
      })()
    })
  }

  return {
    name: 'cms-api',
    configureServer(server) {
      const env = loadEnv(server.config.mode, root, '')
      attach(server.middlewares, env.ADMIN_PASSWORD || 'ruxin-admin')
    },
    configurePreviewServer(server) {
      const env = loadEnv('production', root, '')
      attach(server.middlewares, env.ADMIN_PASSWORD || 'ruxin-admin')
    },
  }
}
