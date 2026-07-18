import { z } from 'zod';

export const locales = ['uk', 'en'] as const;
export type Locale = (typeof locales)[number];
export const statuses = ['draft', 'published', 'archived'] as const;
export const roles = ['admin', 'editor'] as const;
export const reservedSlugs = new Set([
  'admin',
  'api',
  'en',
  'category',
  'post',
  'search',
  'assets',
  'media',
  'robots.txt',
  'sitemap.xml',
]);

export const slugSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Slug має містити лише малі латинські літери, цифри й дефіси',
  )
  .refine((value) => !reservedSlugs.has(value), 'Цей slug зарезервований');
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export const postInputSchema = z
  .object({
    slug: slugSchema,
    titleUk: z.string().trim().min(1).max(250),
    titleEn: z.string().trim().max(250).nullable().optional(),
    excerptUk: z.string().max(1000).nullable().optional(),
    excerptEn: z.string().max(1000).nullable().optional(),
    bodyMdUk: z.string().min(1),
    bodyMdEn: z.string().nullable().optional(),
    status: z.enum(statuses).default('draft'),
    isEnPublished: z.boolean().default(false),
    seoTitleUk: z.string().max(250).nullable().optional(),
    seoTitleEn: z.string().max(250).nullable().optional(),
    seoDescriptionUk: z.string().max(320).nullable().optional(),
    seoDescriptionEn: z.string().max(320).nullable().optional(),
    version: z.string().datetime().optional(),
    categoryIds: z.array(z.string().uuid()).max(20).default([]),
  })
  .superRefine((data, ctx) => {
    if (data.isEnPublished && (!data.titleEn || !data.bodyMdEn))
      ctx.addIssue({
        code: 'custom',
        message: 'Для англійської публікації потрібні title і body',
        path: ['isEnPublished'],
      });
  });
export type PostInput = z.infer<typeof postInputSchema>;
export const apiError = (code: string, message: string, fields?: Record<string, string>) => ({
  ok: false as const,
  error: { code, message, ...(fields ? { fields } : {}) },
});
export const apiSuccess = <T>(data: T) => ({ ok: true as const, data });
export function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
export function localeFromPath(pathname: string): Locale {
  return pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'uk';
}
export function ftsPrefixQuery(input: string): string | null {
  const terms = input
    .normalize('NFKC')
    .trim()
    .split(/\s+/)
    .filter((term) => /^[\p{L}\p{N}'’-]{2,64}$/u.test(term))
    .slice(0, 8);
  return terms.length ? terms.map((term) => `"${term.replaceAll('"', '')}"*`).join(' AND ') : null;
}
