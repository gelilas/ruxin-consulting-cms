import assert from 'node:assert/strict'
import test from 'node:test'
import { eventBodySchema } from '../server/routes/analytics'
import { localizedContent, splitStoredContent, storedContent } from '../server/content-localization'
import { sections } from '../src/types'

test('paused chatbot is not exposed in the CMS section navigation', () => {
  assert.equal(sections.some(([id]) => id === 'assistant'), false)
})

test('analytics accepts the supported anonymous event shape', () => {
  const result = eventBodySchema.safeParse({
    name: 'page_view',
    path: '/',
    visitorId: 'anonymous-browser-id',
    referrer: 'https://example.com/article',
  })

  assert.equal(result.success, true)
})

test('analytics rejects fields that the backend does not store', () => {
  const result = eventBodySchema.safeParse({
    name: 'cta_clicked',
    path: '/',
    label: 'Contact us',
    location: 'hero',
  })

  assert.equal(result.success, false)
})

test('localized content preserves the base document and applies saved translations', () => {
  const base = {
    hero: { headline: ['Build with confidence'], body: 'English body' },
    nested: { label: 'Base label', untouched: true },
  }
  const saved = storedContent(base, {
    zh: { hero: { headline: ['自信地发展'] }, nested: { label: '中文标签' } },
  })
  const localized = localizedContent(saved, 'zh') as typeof base

  const split = splitStoredContent(saved)
  assert.deepEqual(split.base, base)
  assert.equal(localized.hero.headline[0], '自信地发展')
  assert.equal(localized.nested.label, '中文标签')
  assert.equal(localized.nested.untouched, true)
})
