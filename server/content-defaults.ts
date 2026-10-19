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
    const source = isPlainObject(value) ? value : {}
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
