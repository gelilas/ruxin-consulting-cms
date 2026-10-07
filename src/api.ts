import type { SiteContent } from './types'

async function request(path: string, init?: RequestInit) {
  const response = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  const data = (await response.json().catch(() => ({}))) as { error?: string }
  if (!response.ok) throw new Error(data.error || 'Request failed.')
  return data
}

export const api = {
  session: () => fetch('/api/session').then((response) => response.ok),
  login: (password: string) => request('/api/login', { method: 'POST', body: JSON.stringify({ password }) }),
  logout: () => request('/api/logout', { method: 'POST', body: '{}' }),
  content: () => fetch('/api/content').then(async (response) => {
    if (!response.ok) throw new Error('Could not load content.')
    return (await response.json()) as SiteContent
  }),
  save: (content: SiteContent) => request('/api/content', { method: 'PUT', body: JSON.stringify(content) }),
}
