import { normalizeSlug, reservedSlugs } from '@fauna/shared';
import type { Bindings } from '../env';

export type SlugTable = 'categories' | 'posts' | 'pages';

/**
 * Simple Ukrainian Cyrillic → Latin transliteration.
 * Handles the most common characters; others pass through.
 */
const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ie',
  ж: 'zh', з: 'z', и: 'y', і: 'i', ї: 'i', й: 'i', к: 'k', л: 'l',
  м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u',
  ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ь: '',
  ю: 'iu', я: 'ia', '’': '', "'": '', 'ʼ': '',
};

function transliterateUkrainian(text: string): string {
  return text
    .toLowerCase()
    .split('')
    .map((ch) => CYRILLIC_TO_LATIN[ch] ?? ch)
    .join('');
}

/**
 * Generate a base slug from a title — transliterates Ukrainian, lowercases,
 * hyphenates, ≤ 120 chars. Falls back to "untitled".
 */
export function baseSlug(title: string): string {
  const transliterated = transliterateUkrainian(title);
  const slug = normalizeSlug(transliterated).slice(0, 120);
  return slug || 'untitled';
}

/**
 * Ensure `candidate` is unique in `table`, optionally excluding `excludeId`
 * (the current entity id during update).  Appends `-2`, `-3`, … up to 20
 * attempts, then falls back to a random suffix.
 */
function suffixedSlug(base: string, suffixNumber: number): string {
  const suffix = `-${suffixNumber}`;
  return base.slice(0, 120 - suffix.length) + suffix;
}

export async function ensureUniqueSlug(
  env: Bindings,
  table: SlugTable,
  candidate: string,
  excludeId?: string,
): Promise<string> {
  let suffixNumber = reservedSlugs.has(candidate) ? 2 : 1;
  for (let attempt = 1; attempt <= 20; attempt++) {
    const slug = suffixNumber === 1 ? candidate : suffixedSlug(candidate, suffixNumber);
    const query = excludeId
      ? `SELECT id FROM ${table} WHERE slug=? AND id != ?`
      : `SELECT id FROM ${table} WHERE slug=?`;
    const args = excludeId ? [slug, excludeId] : [slug];
    const existing = await env.DB.prepare(query).bind(...args).first();
    if (!reservedSlugs.has(slug) && !existing) return slug;
    suffixNumber++;
  }

  // Last resort: random suffix
  const suffix = `-${crypto.randomUUID().slice(0, 7)}`;
  return candidate.slice(0, 120 - suffix.length) + suffix;
}

export function isSlugUniqueConstraint(error: unknown, table: SlugTable): boolean {
  const message =
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message: unknown }).message)
      : '';
  return message.includes(`UNIQUE constraint failed: ${table}.slug`);
}

/**
 * Determine whether to auto-generate a slug from the raw request body.
 *
 * - Create: auto-gen when no valid slug is provided (absent / null / empty).
 * - Update: auto-gen *only* when slug was explicitly emptied (null / "").
 *   When the key is absent entirely the caller should keep the current slug.
 */
export function shouldAutoGenerateSlug(
  body: unknown,
  isCreate: boolean,
): boolean {
  if (!body || typeof body !== 'object') return isCreate;

  const slug = (body as Record<string, unknown>).slug;
  if (!('slug' in body)) {
    // Key not in body at all.
    return isCreate;
  }
  // Key is present — auto-gen when explicitly emptied.
  return slug === null || slug === '' || (typeof slug === 'string' && slug.trim() === '');
}

/**
 * Resolve the final slug for create/update operations.
 *
 * Returns:
 * - `{ slug, generated: false }` — caller-given slug (checked for uniqueness).
 * - `{ slug: null, generated: false }` — slug not in body on update; use existing.
 * - `{ slug, generated: true  }` — auto-generated slug (already unique).
 */
export async function resolveSlug(
  env: Bindings,
  table: SlugTable,
  body: unknown,
  parsedSlug: string | undefined,
  isCreate: boolean,
  excludeId?: string,
): Promise<{ slug: string | null; generated: boolean }> {
  const autoGen = shouldAutoGenerateSlug(body, isCreate);

  // Explicit caller-provided slug — verify uniqueness.
  if (!autoGen && parsedSlug) {
    const collision = await env.DB.prepare(
      excludeId
        ? `SELECT id FROM ${table} WHERE slug=? AND id != ?`
        : `SELECT id FROM ${table} WHERE slug=?`,
    )
      .bind(parsedSlug, ...(excludeId ? [excludeId] : []))
      .first();
    if (collision) {
      throw new SlugTakenError(parsedSlug);
    }
    return { slug: parsedSlug, generated: false };
  }

  // Update without slug in body — keep existing slug.
  if (!isCreate && !autoGen && !parsedSlug) {
    return { slug: null, generated: false };
  }

  // Auto-generate from titleUk (or titleEn fallback).
  const rawBody = body as Record<string, unknown> | null;
  const title =
    (typeof rawBody?.titleUk === 'string' && rawBody.titleUk.trim()) ||
    (typeof rawBody?.titleEn === 'string' && rawBody.titleEn.trim()) ||
    'untitled';

  const generated = await ensureUniqueSlug(env, table, baseSlug(title), excludeId);
  return { slug: generated, generated: true };
}

/** Thrown when the caller's explicitly-provided slug collides with an existing one. */
export class SlugTakenError extends Error {
  constructor(public readonly slug: string) {
    super(`Slug "${slug}" is already taken`);
    this.name = 'SlugTakenError';
  }
}


/** Check if the given value should be treated as "slug explicitly emptied by client". */
export function isSlugExplicitlyEmpty(body: unknown): boolean {
  if (!body || typeof body !== 'object') return false;
  return shouldAutoGenerateSlug(body, false);
}
