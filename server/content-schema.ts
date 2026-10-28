import { z } from 'zod'

const linkSchema = z.object({
  label: z.string(),
  href: z.string(),
})

const titledBodySchema = z.object({
  title: z.string(),
  body: z.string(),
})

export const siteContentSchema = z.object({
  company: z.object({
    name: z.string(),
    tagline: z.string(),
    email: z.string(),
    phone: z.string(),
    location: z.string(),
    mapEmbedUrl: z.string(),
    website: z.string(),
    socials: z.array(linkSchema),
  }),
  navLinks: z.array(linkSchema),
  hero: z.object({
    eyebrow: z.string(),
    headline: z.array(z.string()),
    body: z.string(),
    image: z.string(),
    primaryCta: linkSchema,
    secondaryCta: linkSchema,
  }),
  about: z.object({
    eyebrow: z.string(),
    headline: z.array(z.string()),
    body: z.string(),
    paragraphs: z.array(z.string()),
    image: z.string(),
    visionImage: z.string(),
    vision: titledBodySchema,
    mission: titledBodySchema,
    valuesImage: z.string(),
    values: z.array(titledBodySchema),
    stages: z.array(z.string()),
    stats: z.array(
      z.object({
        value: z.number(),
        suffix: z.string(),
        label: z.string(),
      }),
    ),
  }),
  services: z.array(
    z.object({
      id: z.string(),
      number: z.string(),
      name: z.string(),
      concept: z.array(z.string()),
      title: z.string(),
      description: z.string(),
      capabilities: z.array(z.string()),
      image: z.string(),
    }),
  ),
  clients: z.array(
    z.object({
      name: z.string(),
      mark: z.string(),
      logo: z.string().optional(),
    }),
  ),
  testimonials: z.array(
    z.object({
      quote: z.string(),
      detail: z.string(),
      name: z.string(),
      role: z.string(),
      company: z.string(),
      mark: z.string(),
      logo: z.string(),
    }),
  ),
  whyChoose: z.object({
    eyebrow: z.string(),
    headline: z.array(z.string()),
    body: z.string(),
    image: z.string(),
    items: z.array(
      z.object({
        title: z.string(),
        body: z.string(),
        image: z.string(),
      }),
    ),
  }),
  investmentIntelligence: z.object({
    eyebrow: z.string(),
    headline: z.array(z.string()),
    body: z.string(),
    image: z.string(),
    imageAlt: z.string(),
    ctaLabel: z.string(),
    ctaHref: z.string(),
    frameworkLabel: z.string(),
    frameworkBody: z.string(),
    lenses: z.array(
      z.object({
        label: z.string(),
        body: z.string(),
      }),
    ),
  }),
  team: z.array(
    z.object({
      name: z.string(),
      role: z.string(),
      bio: z.string(),
      image: z.string(),
      linkedin: z.string(),
    }),
  ),
  careers: z.object({
    headline: z.string(),
    body: z.string(),
    benefits: z.array(z.string()),
    jobs: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        department: z.string(),
        location: z.string(),
        type: z.string(),
        summary: z.string(),
        description: z.string(),
        responsibilities: z.array(z.string()),
        requirements: z.array(z.string()),
      }),
    ),
  }),
  insightCategories: z.array(z.string()),
  insights: z.array(
    z.object({
      id: z.string(),
      category: z.string(),
      date: z.string(),
      title: z.string(),
      description: z.string(),
      image: z.string(),
      readTime: z.string(),
    }),
  ),
  assistant: z.object({
    welcome: z.string(),
    suggestions: z.array(z.string()),
  }),
})

export const CONTENT_SECTIONS = [
  'company',
  'navLinks',
  'hero',
  'about',
  'services',
  'clients',
  'testimonials',
  'whyChoose',
  'investmentIntelligence',
  'team',
  'careers',
  'insightCategories',
  'insights',
  'assistant',
] as const

export type ContentSection = (typeof CONTENT_SECTIONS)[number]
