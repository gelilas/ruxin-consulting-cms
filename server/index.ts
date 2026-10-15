import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from 'dotenv'
import { serve } from '@hono/node-server'
import { swaggerUI } from '@hono/swagger-ui'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { openApiDocument } from './openapi'
import { authRoutes } from './routes/auth'
import { contentRoutes } from './routes/content'
import { pagesRoutes } from './routes/pages'
import { usersRoutes } from './routes/users'
import type { AppVariables } from './middleware'

// Always load `.env` from project root (works even if cwd is `server/`)
config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env') })

const app = new Hono<{ Variables: AppVariables }>()

const cmsOrigin = process.env.CMS_ORIGIN || 'http://localhost:3030'
const marketingOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173'

app.use(
  '*',
  cors({
    origin: (origin) => {
      if (!origin) return cmsOrigin
      if (origin === cmsOrigin || origin === marketingOrigin) return origin
      return cmsOrigin
    },
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }),
)

app.onError((error, c) => {
  console.error(error)
  return c.json({ error: 'Could not complete that request.' }, 500)
})

app.get('/api/health', (c) => c.json({ ok: true }))
app.get('/api/openapi.json', (c) => c.json(openApiDocument))
app.get('/api/docs', swaggerUI({ url: '/api/openapi.json' }))

app.route('/api', authRoutes)
app.route('/api/content', contentRoutes)
app.route('/api/users', usersRoutes)
app.route('/api/pages', pagesRoutes)

const port = Number(process.env.API_PORT || 4001)

serve({ fetch: app.fetch, port }, () => {
  console.log(`CMS API listening on http://localhost:${port}`)
  console.log(`Swagger UI: http://localhost:${port}/api/docs`)
})
