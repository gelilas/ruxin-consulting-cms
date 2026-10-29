import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const contentFile = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data', 'content.json')

export const defaultSiteContent = JSON.parse(readFileSync(contentFile, 'utf8')) as Record<string, unknown>

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function blankLike(sample: unknown): unknown {
  if (Array.isArray(sample)) return []
  if (isPlainObject(sample)) {
    return Object.fromEntries(Object.entries(sample).map(([key, value]) => [key, blankLike(value)]))
  }
  if (typeof sample === 'string') return ''
  if (typeof sample === 'number') return 0
  if (typeof sample === 'boolean') return false
  return sample
}

function migrateLegacyContent(value: unknown): unknown {
  if (!isPlainObject(value)) return value

  const source = structuredClone(value) as Record<string, unknown>
  const about = isPlainObject(source.about) ? source.about : null
  const whyChoose = isPlainObject(source.whyChoose) ? source.whyChoose : null

  if (about?.image === '/profile/about.jpg') about.image = '/profile/about-meeting.jpg'
  if (whyChoose?.image === '/profile/clients.jpg') whyChoose.image = '/profile/why-banner.jpg'

  if (Array.isArray(source.navLinks) && !source.navLinks.some((link) => isPlainObject(link) && link.href === '#team')) {
    const clientsIndex = source.navLinks.findIndex((link) => isPlainObject(link) && link.href === '#clients')
    const teamLink = { label: 'Our team', href: '#team' }
    if (clientsIndex === -1) source.navLinks.push(teamLink)
    else source.navLinks.splice(clientsIndex, 0, teamLink)
  }

  return source
}

/** Fill gaps from the website default document without replacing fields that are already set. */
export function fillSiteContent(value: unknown, fallback: unknown = defaultSiteContent): unknown {
  if (Array.isArray(fallback)) {
    if (!Array.isArray(value)) return structuredClone(fallback)
    const sample = fallback.find((item) => isPlainObject(item))
    if (!sample) return value
    const blank = blankLike(sample)
    return value.map((item) => fillSiteContent(item, blank))
  }

  if (isPlainObject(fallback)) {
    const migrated = migrateLegacyContent(value)
    const source = isPlainObject(migrated) ? migrated : {}
    const result: Record<string, unknown> = {}
    for (const key of Object.keys(fallback)) {
      if (!(key in source) || source[key] === undefined || source[key] === null) {
        result[key] = structuredClone(fallback[key])
      } else {
        result[key] = fillSiteContent(source[key], fallback[key])
      }
    }
    return result
  }

  if (typeof fallback === 'string') return typeof value === 'string' ? value : fallback
  if (typeof fallback === 'number') return typeof value === 'number' && Number.isFinite(value) ? value : fallback
  if (typeof fallback === 'boolean') return typeof value === 'boolean' ? value : fallback
  return value === undefined || value === null ? fallback : value
}
