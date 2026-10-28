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
    mapEmbedUrl: string
    website: string
    socials: Link[]
  }
  navLinks: Link[]
  hero: {
    eyebrow: string
    headline: string[]
    body: string
    image: string
    primaryCta: Link
    secondaryCta: Link
  }
  about: {
    eyebrow: string
    headline: string[]
    body: string
    paragraphs: string[]
    image: string
    visionImage: string
    vision: { title: string; body: string }
    mission: { title: string; body: string }
    valuesImage: string
    values: { title: string; body: string }[]
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
    image: string
  }[]
  clients: { name: string; mark: string; logo?: string }[]
  testimonials: {
    quote: string
    detail: string
    name: string
    role: string
    company: string
    mark: string
    logo: string
  }[]
  whyChoose: {
    eyebrow: string
    headline: string[]
    body: string
    image: string
    items: { title: string; body: string; image: string }[]
  }
  investmentIntelligence: {
    eyebrow: string
    headline: string[]
    body: string
    image: string
    imageAlt: string
    ctaLabel: string
    ctaHref: string
    frameworkLabel: string
    frameworkBody: string
    lenses: { label: string; body: string }[]
  }
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

export type AnalyticsBucket = { label: string; count: number }

export type AnalyticsSummary = {
  range: { from: string; to: string }
  totals: {
    visitors: number
    visits: number
    pageViews: number
    averageEngagementSeconds: number | null
    contactActions: number
    contactFormStarts: number
    contactFormSubmissions: number
  }
  locations: AnalyticsBucket[]
  cities: AnalyticsBucket[]
  sections: AnalyticsBucket[]
  services: { label: string; views: number; interactions: number }[]
  sources: AnalyticsBucket[]
  devices: AnalyticsBucket[]
  actions: AnalyticsBucket[]
  dailyPageViews: AnalyticsBucket[]
  topPaths: AnalyticsBucket[]
}

export const sections = [
  ['company', 'Company'],
  ['navigation', 'Navigation'],
  ['hero', 'Hero'],
  ['about', 'About'],
  ['services', 'Services'],
  ['why', 'Why us'],
  ['investment', 'Investment intelligence'],
  ['analytics', 'Analytics'],
  ['clients', 'Clients'],
  ['testimonials', 'Testimonials'],
  ['team', 'Team'],
  ['careers', 'Careers'],
  ['insights', 'Insights'],
  ['assistant', 'Assistant (paused)'],
] as const

export type SectionId = (typeof sections)[number][0]
