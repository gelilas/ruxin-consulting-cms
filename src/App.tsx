import { ExternalLink, LogOut, Save } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { api } from './api'
import {
  AboutEditor,
  AssistantEditor,
  CareersEditor,
  ClientsEditor,
  CompanyEditor,
  HeroEditor,
  InsightsEditor,
  NavigationEditor,
  ServicesEditor,
  TeamEditor,
  TestimonialsEditor,
} from './sections'
import { sections, type SectionId, type SiteContent } from './types'

const websiteUrl = 'http://localhost:5173'

export function App() {
  const [authed, setAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    api.session().then(setAuthed).catch(() => setAuthed(false))
  }, [])

  if (authed === null) {
    return <p className="grid min-h-svh place-items-center text-sm text-neutral-500">Loading…</p>
  }
  if (!authed) return <Login onSuccess={() => setAuthed(true)} />
  return <Editor onLogout={() => setAuthed(false)} />
}

function Login({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setPending(true)
    setError('')
    try {
      await api.login(password)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in.')
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="grid min-h-svh place-items-center px-5">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl border border-ink/10 bg-white p-8 shadow-sm">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ruxin">Ruxin</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Content admin</h1>
        <p className="mt-2 text-sm text-neutral-500">Sign in to edit the website content.</p>
        <label className="mt-6 block text-sm font-medium">
          Password
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-ink/15 px-3 py-2 outline-none focus:border-ruxin"
          />
        </label>
        {error ? <p className="mt-3 text-sm text-ruxin">{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="mt-6 h-11 w-full rounded-full bg-ruxin text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  )
}

function Editor({ onLogout }: { onLogout: () => void }) {
  const [section, setSection] = useState<SectionId>('company')
  const [content, setContent] = useState<SiteContent | null>(null)
  const [saved, setSaved] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    api.content().then(setContent).catch((err: Error) => setError(err.message))
  }, [])

  const update = (next: SiteContent) => {
    setContent(next)
    setDirty(true)
    setSaved('')
  }

  const save = async () => {
    if (!content) return
    setPending(true)
    setError('')
    try {
      await api.save(content)
      setDirty(false)
      setSaved('Saved. Refresh the website to see it.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.')
    } finally {
      setPending(false)
    }
  }

  const logout = async () => {
    await api.logout().catch(() => undefined)
    onLogout()
  }

  return (
    <div className="min-h-svh md:grid md:grid-cols-[240px_1fr]">
      <aside className="border-b border-ink/10 bg-white md:sticky md:top-0 md:h-svh md:border-b-0 md:border-r">
        <div className="px-5 py-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ruxin">Ruxin CMS</p>
          <p className="mt-1 text-sm text-neutral-500">Website content</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-4 md:block md:px-3">
          {sections.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setSection(id)}
              className={`rounded-full px-3 py-2 text-left text-sm whitespace-nowrap md:block md:w-full md:rounded-lg ${section === id ? 'bg-ink text-white' : 'text-neutral-600 hover:bg-paper'}`}
            >
              {label}
            </button>
          ))}
        </nav>
      </aside>
      <section className="mx-auto w-full max-w-3xl px-5 py-8 md:px-10">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{sections.find(([id]) => id === section)?.[1]}</h1>
          <div className="flex items-center gap-2">
            <a href={websiteUrl} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-full border border-ink/15 px-4 text-sm">
              View site
              <ExternalLink className="size-3.5" />
            </a>
            <button type="button" onClick={logout} className="inline-flex h-10 items-center gap-2 rounded-full border border-ink/15 px-4 text-sm">
              <LogOut className="size-3.5" />
              Sign out
            </button>
            <button
              type="button"
              onClick={save}
              disabled={!dirty || pending || !content}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-ruxin px-4 text-sm font-medium text-white disabled:opacity-40"
            >
              <Save className="size-3.5" />
              {pending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </header>
        {error ? <p className="mb-4 text-sm text-ruxin">{error}</p> : null}
        {saved ? <p className="mb-4 text-sm text-neutral-500">{saved}</p> : null}
        {!content ? (
          <p className="text-sm text-neutral-500">Loading content…</p>
        ) : (
          <EditorBody section={section} content={content} onChange={update} />
        )}
      </section>
    </div>
  )
}

function EditorBody({
  section,
  content,
  onChange,
}: {
  section: SectionId
  content: SiteContent
  onChange: (content: SiteContent) => void
}) {
  switch (section) {
    case 'company':
      return <CompanyEditor content={content} onChange={onChange} />
    case 'navigation':
      return <NavigationEditor content={content} onChange={onChange} />
    case 'hero':
      return <HeroEditor content={content} onChange={onChange} />
    case 'about':
      return <AboutEditor content={content} onChange={onChange} />
    case 'services':
      return <ServicesEditor content={content} onChange={onChange} />
    case 'clients':
      return <ClientsEditor content={content} onChange={onChange} />
    case 'testimonials':
      return <TestimonialsEditor content={content} onChange={onChange} />
    case 'team':
      return <TeamEditor content={content} onChange={onChange} />
    case 'careers':
      return <CareersEditor content={content} onChange={onChange} />
    case 'insights':
      return <InsightsEditor content={content} onChange={onChange} />
    case 'assistant':
      return <AssistantEditor content={content} onChange={onChange} />
  }
}
