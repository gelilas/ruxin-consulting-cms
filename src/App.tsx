import { ExternalLink, LogOut, Save, Trash2 } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { api } from './api'
import {
  AboutEditor,
  AssistantEditor,
  CareersEditor,
  ClientsEditor,
  WhyEditor,
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
import { Field, Logo } from './ui'

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
    return (
      <p className="grid min-h-svh place-items-center bg-paper font-mono text-[11px] uppercase tracking-[0.22em] text-mute">
        Loading
      </p>
    )
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
    <main className="relative grid min-h-svh place-items-center bg-paper px-5 py-12">
      <div className="pointer-events-none absolute inset-0 grid-fine-dark opacity-70" aria-hidden="true" />
      <form onSubmit={submit} className="relative w-full max-w-md border border-ink/10 bg-cream px-8 py-10">
        <Logo />
        <p className="mt-10 font-mono text-[10.5px] uppercase tracking-[0.22em] text-ruxin">Content studio</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">Sign in</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink/60">Edit the website content from here.</p>
        <label className="mt-8 block text-sm font-medium">
          Email
          <input
            type="email"
            autoFocus
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1.5 w-full rounded-md border border-ink/10 bg-white px-3 py-2.5 outline-none transition-colors focus:border-ruxin"
          />
        </label>
        <label className="mt-4 block text-sm font-medium">
          Password
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1.5 w-full rounded-md border border-ink/10 bg-white px-3 py-2.5 outline-none transition-colors focus:border-ruxin"
          />
        </label>
        {error ? <p className="mt-3 text-sm text-ruxin">{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-full bg-ruxin text-sm font-medium text-white transition-colors hover:bg-ruxin-bright disabled:opacity-60"
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

  const navClass = (active: boolean) =>
    `flex items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm whitespace-nowrap transition-colors md:w-full ${
      active ? 'bg-white text-ink' : 'text-ink/60 hover:bg-white/70 hover:text-ink'
    }`

  return (
    <div className="min-h-svh bg-paper">
      <header className="bg-ruxin text-white">
        <div className="flex h-16 items-center justify-between gap-3 px-4 md:h-20 md:px-8">
          <div className="flex items-center gap-4">
            <Logo light mark="white" />
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.32em] text-white/65 sm:inline">CMS</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="mr-2 hidden text-[13px] text-white/75 md:inline">{user.name}</span>
            <a
              href={websiteUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-full border border-white/30 px-4 text-[13px] transition-colors hover:bg-white/10"
            >
              View site
              <ExternalLink className="size-3.5" />
            </a>
            <button
              type="button"
              onClick={logout}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-white/30 px-4 text-[13px] transition-colors hover:bg-white/10"
            >
              <LogOut className="size-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
            {!isUsers ? (
              <button
                type="button"
                onClick={save}
                disabled={!dirty || pending || !content}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-cream px-4 text-[13px] font-medium text-ink transition-colors hover:bg-white disabled:opacity-40"
              >
                <Save className="size-3.5" />
                {pending ? 'Saving…' : 'Save'}
              </button>
            ) : null}
          </div>
        </div>
      </header>
      <div className="md:grid md:grid-cols-[240px_1fr]">
      <aside className="border-b border-ink/10 bg-cream md:sticky md:top-0 md:h-[calc(100svh-5rem)] md:overflow-y-auto md:border-b-0 md:border-r">
        <nav className="flex gap-1 overflow-x-auto px-3 py-3 md:block md:px-3 md:py-5">
          <p className="mb-2 hidden px-3 font-mono text-[10px] uppercase tracking-[0.22em] text-mute md:block">Pages</p>
          {sections.map(([id, label]) => (
            <button key={id} type="button" onClick={() => setSection(id)} className={navClass(section === id)}>
              <span className={`size-1.5 shrink-0 rounded-full ${section === id ? 'bg-ruxin' : 'bg-transparent'}`} aria-hidden="true" />
              {label}
            </button>
          ))}
          {isAdmin ? (
            <>
              <p className="mt-5 mb-2 hidden px-3 font-mono text-[10px] uppercase tracking-[0.22em] text-mute md:block">Admin</p>
              <button type="button" onClick={() => setSection('users')} className={`${navClass(section === 'users')} md:mt-0`}>
                <span className={`size-1.5 shrink-0 rounded-full ${section === 'users' ? 'bg-ruxin' : 'bg-transparent'}`} aria-hidden="true" />
                Users
              </button>
            </>
          ) : null}
        </nav>
      </aside>
      <section className="mx-auto w-full max-w-3xl px-5 py-8 md:px-10">
        <header className="mb-8">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ruxin">Editing</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">{title}</h1>
        </header>
        {isUsers ? (
          <UsersAdmin currentUser={user} />
        ) : !content ? (
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mute">Loading content</p>
        ) : (
          <EditorBody section={section as SectionId} content={content} onChange={update} />
        )}
      </section>
      </div>
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
      <form onSubmit={create} className="space-y-4 border border-ink/10 bg-cream p-5">
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
            className="mt-1.5 w-full rounded-md border border-ink/10 bg-white px-3 py-2 text-sm outline-none focus:border-ruxin"
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
          className="h-11 rounded-full bg-ruxin px-5 text-sm font-medium text-white transition-colors hover:bg-ruxin-bright disabled:opacity-60"
        >
          {pending ? 'Creating…' : 'Create user'}
        </button>
      </form>

      <div className="overflow-x-auto border border-ink/10 bg-cream">
        <table className="w-full min-w-[32rem] text-left text-sm">
          <thead className="border-b border-ink/10 font-mono text-[10.5px] uppercase tracking-[0.16em] text-mute">
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
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute">You</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void remove(item.id)}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-wine hover:bg-stone"
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
    case 'why':
      return <WhyEditor content={content} onChange={onChange} />
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
