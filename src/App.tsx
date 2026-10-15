import { ExternalLink, LogOut, Save, Trash2 } from 'lucide-react'
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
import { useToast } from './toast'
import { sections, type CmsUser, type SectionId, type SiteContent } from './types'
import { Field } from './ui'

const websiteUrl = 'http://localhost:5173'

type NavId = SectionId | 'users'

export function App() {
  const [user, setUser] = useState<CmsUser | null | undefined>(undefined)

  useEffect(() => {
    api
      .session()
      .then((session) => setUser(session.ok && session.user ? session.user : null))
      .catch(() => setUser(null))
  }, [])

  const handleAuthLost = () => setUser(null)

  if (user === undefined) {
    return <p className="grid min-h-svh place-items-center text-sm text-neutral-500">Loading…</p>
  }
  if (!user) return <Login onSuccess={setUser} />
  return <Editor user={user} onLogout={handleAuthLost} onAuthLost={handleAuthLost} />
}

function Login({ onSuccess }: { onSuccess: (user: CmsUser) => void }) {
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setPending(true)
    setError('')
    try {
      const result = await api.login(email, password)
      toast.success(`Welcome back, ${result.user.name}.`)
      onSuccess(result.user)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not sign in.'
      setError(message)
      toast.error(message)
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
          Email
          <input
            type="email"
            autoFocus
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-ink/15 px-3 py-2 outline-none focus:border-ruxin"
          />
        </label>
        <label className="mt-4 block text-sm font-medium">
          Password
          <input
            type="password"
            autoComplete="current-password"
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

function Editor({
  user,
  onLogout,
  onAuthLost,
}: {
  user: CmsUser
  onLogout: () => void
  onAuthLost: () => void
}) {
  const toast = useToast()
  const [section, setSection] = useState<NavId>('company')
  const [content, setContent] = useState<SiteContent | null>(null)
  const [pending, setPending] = useState(false)
  const [dirty, setDirty] = useState(false)

  const isAdmin = user.role === 'ADMIN'
  const isUsers = section === 'users'

  const handleApiError = (err: unknown, fallback: string) => {
    const message = err instanceof Error ? err.message : fallback
    toast.error(message)
    if (message.toLowerCase().includes('signed out') || message.toLowerCase().includes('sign in')) {
      onAuthLost()
    }
  }

  useEffect(() => {
    if (isUsers) return
    api
      .content()
      .then(setContent)
      .catch((err: Error) => toast.error(err.message || 'Could not load content.'))
  }, [isUsers, toast])

  const update = (next: SiteContent) => {
    setContent(next)
    setDirty(true)
  }

  const save = async () => {
    if (!content) return
    setPending(true)
    try {
      await api.save(content)
      setDirty(false)
      toast.success('Content saved. Refresh the website to see it.')
    } catch (err) {
      handleApiError(err, 'Could not save.')
    } finally {
      setPending(false)
    }
  }

  const logout = async () => {
    await api.logout().catch(() => undefined)
    toast.info('Signed out.')
    onLogout()
  }

  const title = isUsers ? 'Users' : sections.find(([id]) => id === section)?.[1]

  return (
    <div className="min-h-svh md:grid md:grid-cols-[240px_1fr]">
      <aside className="border-b border-ink/10 bg-white md:sticky md:top-0 md:h-svh md:border-b-0 md:border-r">
        <div className="px-5 py-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ruxin">Ruxin CMS</p>
          <p className="mt-1 text-sm text-neutral-500">{user.name}</p>
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
          {isAdmin ? (
            <button
              type="button"
              onClick={() => setSection('users')}
              className={`rounded-full px-3 py-2 text-left text-sm whitespace-nowrap md:mt-3 md:block md:w-full md:rounded-lg ${section === 'users' ? 'bg-ink text-white' : 'text-neutral-600 hover:bg-paper'}`}
            >
              Users
            </button>
          ) : null}
        </nav>
      </aside>
      <section className="mx-auto w-full max-w-3xl px-5 py-8 md:px-10">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <div className="flex items-center gap-2">
            <a href={websiteUrl} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-full border border-ink/15 px-4 text-sm">
              View site
              <ExternalLink className="size-3.5" />
            </a>
            <button type="button" onClick={logout} className="inline-flex h-10 items-center gap-2 rounded-full border border-ink/15 px-4 text-sm">
              <LogOut className="size-3.5" />
              Sign out
            </button>
            {!isUsers ? (
              <button
                type="button"
                onClick={save}
                disabled={!dirty || pending || !content}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-ruxin px-4 text-sm font-medium text-white disabled:opacity-40"
              >
                <Save className="size-3.5" />
                {pending ? 'Saving…' : 'Save'}
              </button>
            ) : null}
          </div>
        </header>
        {isUsers ? (
          <UsersAdmin currentUser={user} />
        ) : !content ? (
          <p className="text-sm text-neutral-500">Loading content…</p>
        ) : (
          <EditorBody section={section as SectionId} content={content} onChange={update} />
        )}
      </section>
    </div>
  )
}

function UsersAdmin({ currentUser }: { currentUser: CmsUser }) {
  const toast = useToast()
  const [users, setUsers] = useState<(CmsUser & { createdAt: string; updatedAt: string })[]>([])
  const [pending, setPending] = useState(false)
  const [form, setForm] = useState({
    email: '',
    name: '',
    password: '',
    role: 'EDITOR' as 'ADMIN' | 'EDITOR',
  })

  const load = () =>
    api
      .users()
      .then((result) => setUsers(result.users))
      .catch((err: Error) => toast.error(err.message || 'Could not load users.'))

  useEffect(() => {
    void load()
  }, [])

  const create = async (event: FormEvent) => {
    event.preventDefault()
    setPending(true)
    try {
      await api.createUser(form)
      setForm({ email: '', name: '', password: '', role: 'EDITOR' })
      toast.success('User created.')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create user.')
    } finally {
      setPending(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this user?')) return
    try {
      await api.deleteUser(id)
      toast.success('User deleted.')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete user.')
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={create} className="space-y-4 rounded-2xl border border-ink/10 bg-white p-5">
        <h2 className="text-sm font-semibold">Create user</h2>
        <Field label="Name" value={form.name} onChange={(name) => setForm((prev) => ({ ...prev, name }))} />
        <Field label="Email" value={form.email} onChange={(email) => setForm((prev) => ({ ...prev, email }))} />
        <Field
          label="Password"
          value={form.password}
          onChange={(password) => setForm((prev) => ({ ...prev, password }))}
          hint="At least 10 characters"
        />
        <label className="block text-sm">
          <span className="font-medium">Role</span>
          <select
            className="mt-1.5 w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-ruxin"
            value={form.role}
            onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value as 'ADMIN' | 'EDITOR' }))}
          >
            <option value="EDITOR">Editor</option>
            <option value="ADMIN">Admin</option>
          </select>
        </label>
        <button
          type="submit"
          disabled={pending}
          className="h-10 rounded-full bg-ruxin px-4 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? 'Creating…' : 'Create user'}
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-ink/10 bg-white">
        <table className="w-full min-w-[32rem] text-left text-sm">
          <thead className="border-b border-ink/10 text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {users.map((item) => (
              <tr key={item.id} className="border-b border-ink/5 last:border-0">
                <td className="px-4 py-3">{item.name}</td>
                <td className="px-4 py-3">{item.email}</td>
                <td className="px-4 py-3">{item.role}</td>
                <td className="px-4 py-3 text-right">
                  {item.id === currentUser.id ? (
                    <span className="text-xs text-neutral-400">You</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void remove(item.id)}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-ruxin hover:bg-paper"
                      aria-label={`Delete ${item.email}`}
                    >
                      <Trash2 className="size-3.5" />
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
