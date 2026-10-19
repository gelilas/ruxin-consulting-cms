import { randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Hono } from 'hono'
import { requireAuth, type AppVariables } from '../middleware'

const uploadsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../data/uploads')

const extensions: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

const contentTypes: Record<string, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
}

const maxBytes = 5 * 1024 * 1024

export const uploadRoutes = new Hono<{ Variables: AppVariables }>()

uploadRoutes.post('/api/uploads', requireAuth, async (c) => {
  const body = await c.req.parseBody()
  const file = body.file
  if (!(file instanceof File)) {
    return c.json({ error: 'Choose an image to upload.' }, 400)
  }

  const extension = extensions[file.type]
  if (!extension) {
    return c.json({ error: 'Use a JPG, PNG, WEBP, or GIF image.' }, 400)
  }
  if (file.size > maxBytes) {
    return c.json({ error: 'Image must be 5 MB or smaller.' }, 400)
  }

  await mkdir(uploadsDir, { recursive: true })
  const name = `${randomUUID()}.${extension}`
  await writeFile(path.join(uploadsDir, name), Buffer.from(await file.arrayBuffer()))
  return c.json({ url: `/uploads/${name}` })
})

uploadRoutes.get('/uploads/:name', async (c) => {
  const name = c.req.param('name')
  const match = /^[0-9a-f-]{36}\.(jpg|png|webp|gif)$/.exec(name)
  if (!match) return c.json({ error: 'Image not found.' }, 404)

  try {
    const bytes = await readFile(path.join(uploadsDir, name))
    return c.body(bytes, 200, {
      'Content-Type': contentTypes[match[1]],
      'Cache-Control': 'public, max-age=31536000, immutable',
    })
  } catch {
    return c.json({ error: 'Image not found.' }, 404)
  }
})
