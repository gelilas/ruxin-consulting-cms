import { z } from 'zod'

const linkSchema = z.object({
  label: z.string(),
  href: z.string(),
})

export const siteContentSchema = z.object({
  company: z.object({
    name: z.string(),
    tagline: z.string(),
    email: z.string(),
    phone: z.string(),
    location: z.string(),
    socials: z.array(linkSchema),
  }),
  navLinks: z.array(linkSchema),
  hero: z.object({
    eyebrow: z.string(),
    headline: z.array(z.string()),
    body: z.string(),
    primaryCta: linkSchema,
    secondaryCta: linkSchema,
  }),
  about: z.object({
    eyebrow: z.string(),
    headline: z.array(z.string()),
    body: z.string(),
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
    }),
  ),
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
  'team',
  'careers',
  'insightCategories',
  'insights',
  'assistant',
] as const

export type ContentSection = (typeof CONTENT_SECTIONS)[number]
