export type Link = { label: string; href: string }

export type CmsRole = 'ADMIN' | 'EDITOR'

export type CmsUser = {
  id: string
  email: string
  name: string
  role: CmsRole
}

export type SiteContent = {
  company: {
    name: string
    tagline: string
    email: string
    phone: string
    location: string
    socials: Link[]
  }
  navLinks: Link[]
  hero: {
    eyebrow: string
    headline: string[]
    body: string
    primaryCta: Link
    secondaryCta: Link
  }
  about: {
    eyebrow: string
    headline: string[]
    body: string
    stages: string[]
    stats: { value: number; suffix: string; label: string }[]
  }
  services: {
    id: string
    number: string
    name: string
    concept: string[]
    title: string
    description: string
    capabilities: string[]
  }[]
  clients: { name: string; mark: string; logo?: string }[]
  testimonials: {
    quote: string
    detail: string
    name: string
    role: string
    company: string
    mark: string
  }[]
  team: { name: string; role: string; bio: string; image: string; linkedin: string }[]
  careers: {
    headline: string
    body: string
    benefits: string[]
    jobs: {
      id: string
      title: string
      department: string
      location: string
      type: string
      summary: string
      description: string
      responsibilities: string[]
      requirements: string[]
    }[]
  }
  insightCategories: string[]
  insights: {
    id: string
    category: string
    date: string
    title: string
    description: string
    image: string
    readTime: string
  }[]
  assistant: { welcome: string; suggestions: string[] }
}

export const sections = [
  ['company', 'Company'],
  ['navigation', 'Navigation'],
  ['hero', 'Hero'],
  ['about', 'About'],
  ['services', 'Services'],
  ['clients', 'Clients'],
  ['testimonials', 'Testimonials'],
  ['team', 'Team'],
  ['careers', 'Careers'],
  ['insights', 'Insights'],
  ['assistant', 'Assistant'],
] as const

export type SectionId = (typeof sections)[number][0]
