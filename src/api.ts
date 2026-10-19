import type { CmsUser, SiteContent } from './types'

const TOKEN_KEY = 'cms_jwt'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

function authHeaders(init?: RequestInit): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

function clearSessionOnUnauthorized(status: number, path: string) {
  // Don't wipe token on failed login attempts
  if (status === 401 && path !== '/api/login') {
    setToken(null)
  }
}

async function request<T = { error?: string }>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: authHeaders(init),
  })
  const data = (await response.json().catch(() => ({}))) as T & { error?: string }
  if (!response.ok) {
    clearSessionOnUnauthorized(response.status, path)
    const message =
      response.status === 401 && path !== '/api/login'
        ? data.error || 'Signed out. Please sign in again.'
        : data.error || 'Request failed.'
    throw new ApiError(message, response.status)
  }
  return data
}

export type SessionResponse = { ok: boolean; user?: CmsUser }
export type UsersResponse = {
  users: (CmsUser & { createdAt: string; updatedAt: string })[]
}

export const api = {
  session: () =>
    fetch('/api/session', { headers: authHeaders() }).then(async (response) => {
      if (!response.ok) {
        clearSessionOnUnauthorized(response.status, '/api/session')
        return { ok: false } as SessionResponse
      }
      return (await response.json()) as SessionResponse
    }),
  login: async (email: string, password: string) => {
    const result = await request<{ ok: true; token: string; user: CmsUser }>('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    setToken(result.token)
    return result
  },
  logout: async () => {
    try {
      await request('/api/logout', { method: 'POST', body: '{}' })
    } finally {
      setToken(null)
    }
  },
  content: () =>
    fetch('/api/content', { headers: authHeaders() }).then(async (response) => {
      if (!response.ok) throw new ApiError('Could not load content.', response.status)
      return (await response.json()) as SiteContent
    }),
  save: (content: SiteContent) =>
    request('/api/content', { method: 'PUT', body: JSON.stringify(content) }),
  upload: async (file: File) => {
    const body = new FormData()
    body.append('file', file)
    const headers: Record<string, string> = {}
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
    const response = await fetch('/api/uploads', { method: 'POST', headers, body })
    const data = (await response.json().catch(() => ({}))) as { url?: string; error?: string }
    if (!response.ok || !data.url) {
      clearSessionOnUnauthorized(response.status, '/api/uploads')
      throw new ApiError(data.error || 'Could not upload image.', response.status)
    }
    return data.url
  },
  users: () => request<UsersResponse>('/api/users'),
  createUser: (body: { email: string; name: string; password: string; role?: 'ADMIN' | 'EDITOR' }) =>
    request<{ user: CmsUser }>('/api/users', { method: 'POST', body: JSON.stringify(body) }),
  updateUser: (
    id: string,
    body: { name?: string; role?: 'ADMIN' | 'EDITOR'; password?: string; currentPassword?: string },
  ) => request<{ user: CmsUser }>(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteUser: (id: string) => request(`/api/users/${id}`, { method: 'DELETE' }),
}
