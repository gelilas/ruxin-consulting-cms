import { z } from 'zod'
import { starterLocales } from './content-locales'

export const contentLocaleSchema = z.enum(['en', 'am', 'zh'])
export type ContentLocale = z.infer<typeof contentLocaleSchema>

type JsonObject = Record<string, unknown>

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Merge translated fields while retaining English values for fields not yet translated. */
export function mergeLocalizedContent(base: unknown, translation: unknown): unknown {
  if (Array.isArray(base) && Array.isArray(translation)) {
    const length = Math.max(base.length, translation.length)
    return Array.from({ length }, (_, index) => mergeLocalizedContent(base[index], translation[index]))
  }
  if (isObject(base) && isObject(translation)) {
    const result: JsonObject = { ...base }
    for (const [key, value] of Object.entries(translation)) {
      result[key] = key in result ? mergeLocalizedContent(result[key], value) : value
    }
    return result
  }
  return translation === undefined || translation === null ? base : translation
}

export function splitStoredContent(value: unknown) {
  if (!isObject(value)) return { base: {}, locales: {} as Partial<Record<'am' | 'zh', JsonObject>> }
  const { _locales, ...base } = value
  const locales: Partial<Record<'am' | 'zh', JsonObject>> = {}
  if (isObject(_locales)) {
    if (isObject(_locales.am)) locales.am = _locales.am
    if (isObject(_locales.zh)) locales.zh = _locales.zh
  }
  return { base, locales }
}

export function localizedContent(value: unknown, locale: ContentLocale) {
  const { base, locales } = splitStoredContent(value)
  if (locale === 'en') return base
  const starter = mergeLocalizedContent(base, starterLocales[locale])
  return mergeLocalizedContent(starter, locales[locale] || {})
}

export function storedContent(base: JsonObject, locales: Partial<Record<'am' | 'zh', JsonObject>>) {
  return { ...base, _locales: locales }
}
