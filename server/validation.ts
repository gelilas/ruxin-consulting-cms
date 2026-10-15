import { z } from 'zod'
import { CONTENT_SECTIONS, type ContentSection } from './content-schema'

/**
 * Field validation + SQL-injection defense-in-depth.
 *
 * Primary protection: Prisma parameterized queries (never concatenate user input into SQL).
 * Secondary: Zod schemas that reject oversized / suspicious path & body values before they hit the DB.
 */

/** Common SQL / injection meta patterns in identifier-like fields */
const SUSPICIOUS_SQL =
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|UNION|EXEC|EXECUTE|MERGE|GRANT|REVOKE)\b|--|\/\*|\*\/|;|\bOR\b\s+\d+\s*=\s*\d+|\bAND\b\s+\d+\s*=\s*\d+|xp_|information_schema)/i

export function looksLikeSqlInjection(value: string) {
  return SUSPICIOUS_SQL.test(value)
}

const noSqlMeta = (label: string) =>
  z
    .string()
    .superRefine((value, ctx) => {
      if (looksLikeSqlInjection(value)) {
        ctx.addIssue({
          code: 'custom',
          message: `${label} contains disallowed characters or SQL keywords.`,
        })
      }
    })

/** Prisma cuid() ids used in User / Page / Session */
export const idParamSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[a-z][a-z0-9]*$/i, 'Invalid id format.')
  .and(noSqlMeta('Id'))

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(254)
  .email('Invalid email.')
  .and(noSqlMeta('Email'))

export const personNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[\p{L}\p{M}\p{N} .'-]+$/u, 'Name contains invalid characters.')
  .and(noSqlMeta('Name'))

export const passwordSchema = z
  .string()
  .min(10, 'Password must be at least 10 characters.')
  .max(128, 'Password is too long.')

export const roleSchema = z.enum(['ADMIN', 'EDITOR'])

export const pageSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase kebab-case.')
  .and(noSqlMeta('Slug'))

export const pageTitleSchema = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .and(noSqlMeta('Title'))

export const pageStatusSchema = z.enum(['draft', 'published'])

export const contentSectionSchema = z
  .string()
  .refine((value): value is ContentSection => (CONTENT_SECTIONS as readonly string[]).includes(value), {
    message: 'Unknown content section.',
  })

export const loginBodySchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1).max(128),
  })
  .strict()

export const createUserBodySchema = z
  .object({
    email: emailSchema,
    name: personNameSchema,
    password: passwordSchema,
    role: roleSchema.optional(),
  })
  .strict()

export const updateUserBodySchema = z
  .object({
    name: personNameSchema.optional(),
    role: roleSchema.optional(),
    password: passwordSchema.optional(),
    currentPassword: z.string().min(1).max(128).optional(),
  })
  .strict()

export const createPageBodySchema = z
  .object({
    slug: pageSlugSchema,
    title: pageTitleSchema,
    status: pageStatusSchema.optional(),
    /** JSON document stored via Prisma — never interpolated into SQL */
    body: z.unknown().optional(),
  })
  .strict()

export const updatePageBodySchema = createPageBodySchema.partial().strict()

export function parseOrError<T>(
  schema: z.ZodType<T>,
  value: unknown,
  fallbackMessage: string,
): { ok: true; data: T } | { ok: false; error: string } {
  const parsed = schema.safeParse(value)
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message
    return { ok: false, error: first || fallbackMessage }
  }
  return { ok: true, data: parsed.data }
}
