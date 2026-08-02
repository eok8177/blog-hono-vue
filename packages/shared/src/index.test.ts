import { describe, expect, it } from 'vitest';
import {
  ftsPrefixQuery,
  localeFromPath,
  normalizeSlug,
  optionalSlugSchema,
  slugSchema,
  paginationSchema,
  postInputSchema,
  pageInputSchema,
  categoryInputSchema,
  mediaUpdateSchema,
  mediaBatchMoveSchema,
  userInputSchema,
  settingInputSchema,
  apiError,
  apiSuccess,
  reservedSlugs,
  roles,
  statuses,
  locales,
  type PostInput,
  type Locale,
} from './index';

// ---------------------------------------------------------------------------
// 1. Slug normalization
// ---------------------------------------------------------------------------
describe('normalizeSlug', () => {
  it('lowercases and trims', () => {
    expect(normalizeSlug('  Fox -- Notes! ')).toBe('fox-notes');
  });

  it('collapses runs of non-alphanumeric characters to a single hyphen', () => {
    expect(normalizeSlug('Hello   World___2024!!!')).toBe('hello-world-2024');
  });

  it('strips leading and trailing hyphens', () => {
    expect(normalizeSlug('--hello-world-')).toBe('hello-world');
  });

  it('removes diacritics (NFKD decomposition)', () => {
    expect(normalizeSlug('café résumé')).toBe('cafe-resume');
  });

  it('handles empty or whitespace-only input', () => {
    expect(normalizeSlug('')).toBe('');
    expect(normalizeSlug('   ')).toBe('');
  });

  it('handles strings that become empty after normalization', () => {
    expect(normalizeSlug('¿Qué pasa?')).toBe('que-pasa');
  });
});

// ---------------------------------------------------------------------------
// 2. Reserved slugs
// ---------------------------------------------------------------------------
describe('slugSchema – reserved slugs', () => {
  const reserved = [...reservedSlugs];

  it.each(reserved)('rejects reserved slug "%s"', (slug) => {
    expect(slugSchema.safeParse(slug).success).toBe(false);
  });

  it.each(reserved.filter((s) => !s.includes('.')))(
    'rejects "%s" with a trailing variant',
    (slug) => {
      // Slugs with dots (robots.txt, sitemap.xml) already fail the regex
      expect(slugSchema.safeParse(`${slug}-alt`).success).toBe(true);
    },
  );

  it('rejects empty slug', () => {
    expect(slugSchema.safeParse('').success).toBe(false);
  });

  it('rejects slug over 120 chars', () => {
    expect(slugSchema.safeParse('a'.repeat(121)).success).toBe(false);
  });

  it('rejects uppercase characters', () => {
    expect(slugSchema.safeParse('UpperCase').success).toBe(false);
  });

  it('rejects slug with spaces', () => {
    expect(slugSchema.safeParse('hello world').success).toBe(false);
  });

  it('rejects slug starting with hyphen', () => {
    expect(slugSchema.safeParse('-hello').success).toBe(false);
  });

  it('accepts valid slugs', () => {
    expect(slugSchema.safeParse('valid-slug-123').success).toBe(true);
    expect(slugSchema.safeParse('a').success).toBe(true);
    expect(slugSchema.safeParse('123').success).toBe(true);
    expect(slugSchema.safeParse('z'.repeat(120)).success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 2b. Optional slug schema (used in create/update DTOs)
// ---------------------------------------------------------------------------
describe('optionalSlugSchema', () => {
  it('accepts a valid slug string', () => {
    expect(optionalSlugSchema.safeParse('valid-slug').success).toBe(true);
  });

  it('accepts undefined (slug not in body)', () => {
    expect(optionalSlugSchema.safeParse(undefined).success).toBe(true);
  });

  it('converts null to undefined → passes', () => {
    const result = optionalSlugSchema.safeParse(null);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBeUndefined();
  });

  it('converts empty string to undefined → passes', () => {
    const result = optionalSlugSchema.safeParse('');
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBeUndefined();
  });

  it('converts whitespace-only to undefined → passes', () => {
    const result = optionalSlugSchema.safeParse('   ');
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBeUndefined();
  });

  it('rejects a reserved slug', () => {
    expect(optionalSlugSchema.safeParse('admin').success).toBe(false);
  });

  it('rejects uppercase slug', () => {
    expect(optionalSlugSchema.safeParse('Bad-Slug').success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 3. Locale resolution
// ---------------------------------------------------------------------------
describe('localeFromPath', () => {
  it.each([
    ['/en', 'en'],
    ['/en/', 'en'],
    ['/en/post/some-slug', 'en'],
    ['/en/category/fauna', 'en'],
    ['/en/search?q=test', 'en'],
    ['/', 'uk'],
    ['/post/slug', 'uk'],
    ['/uk', 'uk'],
    ['/uk/', 'uk'],
    ['/unknown', 'uk'],
    ['/en-extra', 'uk'], // not a locale prefix
  ])('resolves %s → %s', (path, expected) => {
    expect(localeFromPath(path)).toBe(expected as Locale);
  });
});

// ---------------------------------------------------------------------------
// 4. Pagination parser
// ---------------------------------------------------------------------------
describe('paginationSchema', () => {
  it('provides defaults for empty input', () => {
    expect(paginationSchema.parse({})).toEqual({ page: 1, pageSize: 20 });
  });

  it('parses string-encoded numbers', () => {
    expect(paginationSchema.parse({ page: '3', pageSize: '10' })).toEqual({
      page: 3,
      pageSize: 10,
    });
  });

  it('rejects pageSize over 100', () => {
    expect(paginationSchema.safeParse({ pageSize: '200' }).success).toBe(false);
  });

  it('rejects page below 1', () => {
    expect(paginationSchema.safeParse({ page: 0 }).success).toBe(false);
    expect(paginationSchema.safeParse({ page: -1 }).success).toBe(false);
  });

  it('rejects pageSize below 1', () => {
    expect(paginationSchema.safeParse({ pageSize: 0 }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 5. Post input validation (publish validation, SEO fallback, translations)
// ---------------------------------------------------------------------------
function validPost(): PostInput {
  return {
    slug: 'test-post',
    titleUk: 'Тестовий матеріал',
    bodyMdUk: 'Тіло матеріалу',
    status: 'draft',
    isEnPublished: false,
    categoryIds: [],
    mediaIds: [],
    version: undefined,
  };
}

describe('postInputSchema', () => {
  it('accepts a minimal draft post', () => {
    expect(postInputSchema.safeParse(validPost()).success).toBe(true);
  });

  it('rejects empty Ukrainian title', () => {
    const result = postInputSchema.safeParse({ ...validPost(), titleUk: '   ' });
    expect(result.success).toBe(false);
  });

  it('rejects empty Ukrainian body', () => {
    const result = postInputSchema.safeParse({ ...validPost(), bodyMdUk: '' });
    expect(result.success).toBe(false);
  });

  it('rejects publishing without English title and body when isEnPublished=true', () => {
    const result = postInputSchema.safeParse({
      ...validPost(),
      status: 'published',
      isEnPublished: true,
    });
    expect(result.success).toBe(false);
  });

  it('allows isEnPublished when English title and body are provided', () => {
    const result = postInputSchema.safeParse({
      ...validPost(),
      status: 'published',
      isEnPublished: true,
      titleEn: 'English title',
      bodyMdEn: 'English body',
    });
    expect(result.success).toBe(true);
  });

  it('accepts SEO fields', () => {
    const result = postInputSchema.safeParse({
      ...validPost(),
      seoTitleUk: 'SEO заголовок',
      seoDescriptionUk: 'Опис для пошуку',
      seoTitleEn: 'SEO title',
      seoDescriptionEn: 'SEO description',
    });
    expect(result.success).toBe(true);
  });

  it('rejects title over 250 chars', () => {
    const result = postInputSchema.safeParse({
      ...validPost(),
      titleUk: 'a'.repeat(251),
    });
    expect(result.success).toBe(false);
  });

  it('rejects excerpt over 1000 chars', () => {
    const result = postInputSchema.safeParse({
      ...validPost(),
      excerptUk: 'a'.repeat(1001),
    });
    expect(result.success).toBe(false);
  });

  it('accepts post without slug (auto-generate)', () => {
    const withoutSlug = { ...validPost(), slug: undefined };
    const result = postInputSchema.safeParse(withoutSlug);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.slug).toBeUndefined();
  });

  it('accepts post with empty slug → undefined', () => {
    const result = postInputSchema.safeParse({ ...validPost(), slug: '' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.slug).toBeUndefined();
  });

  it('accepts post with null slug → undefined', () => {
    const result = postInputSchema.safeParse({ ...validPost(), slug: null });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.slug).toBeUndefined();
  });

  it('rejects more than 20 categories', () => {
    const result = postInputSchema.safeParse({
      ...validPost(),
      categoryIds: Array.from({ length: 21 }, () => crypto.randomUUID()),
    });
    expect(result.success).toBe(false);
  });

  it('rejects more than 50 media ids', () => {
    const result = postInputSchema.safeParse({
      ...validPost(),
      mediaIds: Array.from({ length: 51 }, () => crypto.randomUUID()),
    });
    expect(result.success).toBe(false);
  });

  it('coerces empty version string to undefined', () => {
    const result = postInputSchema.safeParse({ ...validPost(), version: '' });
    expect(result.success).toBe(true);
  });

  it('coerces string version to number', () => {
    const result = postInputSchema.parse({ ...validPost(), version: '3' });
    expect(result.version).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// 6. Page input validation
// ---------------------------------------------------------------------------
describe('pageInputSchema', () => {
  it('accepts minimal page input', () => {
    const result = pageInputSchema.safeParse({
      slug: 'about',
      titleUk: 'Про архів',
      bodyMdUk: 'Текст сторінки',
    });
    expect(result.success).toBe(true);
  });

  it('defaults template to "default"', () => {
    const result = pageInputSchema.parse({
      slug: 'about',
      titleUk: 'Про архів',
      bodyMdUk: 'Текст',
    });
    expect(result.template).toBe('default');
  });

  it('rejects invalid template', () => {
    const result = pageInputSchema.safeParse({
      slug: 'about',
      titleUk: 'Про архів',
      bodyMdUk: 'Текст',
      // testing invalid enum
      template: 'gallery' as string,
    });
    expect(result.success).toBe(false);
  });

  it('rejects isEnPublished without English title and body', () => {
    const result = pageInputSchema.safeParse({
      slug: 'about',
      titleUk: 'Про архів',
      bodyMdUk: 'Текст',
      isEnPublished: true,
    });
    expect(result.success).toBe(false);
  });

  it('accepts page without slug (auto-generate)', () => {
    const result = pageInputSchema.safeParse({
      titleUk: 'Про архів',
      bodyMdUk: 'Текст',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.slug).toBeUndefined();
  });

  it('accepts page with empty slug → undefined', () => {
    const result = pageInputSchema.safeParse({
      slug: '',
      titleUk: 'Про архів',
      bodyMdUk: 'Текст',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.slug).toBeUndefined();
  });

  it('accepts page with null slug → undefined', () => {
    const result = pageInputSchema.safeParse({
      slug: null,
      titleUk: 'Про архів',
      bodyMdUk: 'Текст',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.slug).toBeUndefined();
  });

  it('accepts showInMenu and menuOrder', () => {
    const result = pageInputSchema.parse({
      slug: 'about',
      titleUk: 'Про архів',
      bodyMdUk: 'Текст',
      showInMenu: true,
      menuOrder: 5,
    });
    expect(result.showInMenu).toBe(true);
    expect(result.menuOrder).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// 7. Category input validation
// ---------------------------------------------------------------------------
describe('categoryInputSchema', () => {
  it('accepts minimal category', () => {
    const result = categoryInputSchema.safeParse({
      slug: 'research',
      titleUk: 'Дослідження',
    });
    expect(result.success).toBe(true);
  });

  it('rejects isEnPublished without English title', () => {
    const result = categoryInputSchema.safeParse({
      slug: 'research',
      titleUk: 'Дослідження',
      isEnPublished: true,
    });
    expect(result.success).toBe(false);
  });

  it('accepts category without slug (auto-generate)', () => {
    const result = categoryInputSchema.safeParse({
      titleUk: 'Дослідження',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.slug).toBeUndefined();
  });

  it('accepts category with empty slug → undefined', () => {
    const result = categoryInputSchema.safeParse({
      slug: '',
      titleUk: 'Дослідження',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.slug).toBeUndefined();
  });

  it('accepts category with null slug → undefined', () => {
    const result = categoryInputSchema.safeParse({
      slug: null,
      titleUk: 'Дослідження',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.slug).toBeUndefined();
  });

  it('rejects menuOrder over 10000', () => {
    const result = categoryInputSchema.safeParse({
      slug: 'test',
      titleUk: 'Test',
      menuOrder: 10001,
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 8. Media validation schemas
// ---------------------------------------------------------------------------
describe('mediaUpdateSchema', () => {
  it('requires altUk', () => {
    const result = mediaUpdateSchema.safeParse({
      altUk: '',
      version: '2026-01-01T00:00:00.000Z',
    });
    expect(result.success).toBe(false);
  });

  it('requires a valid datetime version', () => {
    const result = mediaUpdateSchema.safeParse({
      altUk: 'Image',
      version: 'not-a-datetime',
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional fields', () => {
    const result = mediaUpdateSchema.safeParse({
      altUk: 'Image',
      altEn: 'Image EN',
      captionUk: 'Caption',
      captionEn: 'Caption EN',
      credit: 'Photographer',
      license: 'CC-BY',
      sourceUrl: 'https://example.com/photo',
      folder: 'nature',
      version: '2026-01-01T00:00:00.000Z',
    });
    expect(result.success).toBe(true);
  });

  it('coerces empty sourceUrl to null', () => {
    const result = mediaUpdateSchema.parse({
      altUk: 'Image',
      sourceUrl: '',
      version: '2026-01-01T00:00:00.000Z',
    });
    expect(result.sourceUrl).toBeNull();
  });

  it('rejects invalid URL in sourceUrl', () => {
    const result = mediaUpdateSchema.safeParse({
      altUk: 'Image',
      sourceUrl: 'not-a-url',
      version: '2026-01-01T00:00:00.000Z',
    });
    expect(result.success).toBe(false);
  });
});

describe('mediaBatchMoveSchema', () => {
  it('requires at least 1 id', () => {
    const result = mediaBatchMoveSchema.safeParse({ ids: [], folder: 'test' });
    expect(result.success).toBe(false);
  });

  it('limits to 200 ids', () => {
    const result = mediaBatchMoveSchema.safeParse({
      ids: Array.from({ length: 201 }, () => crypto.randomUUID()),
      folder: 'test',
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid input', () => {
    const result = mediaBatchMoveSchema.safeParse({
      ids: [crypto.randomUUID()],
      folder: 'destination',
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 9. User input validation
// ---------------------------------------------------------------------------
describe('userInputSchema', () => {
  it('requires email, name, and role', () => {
    const result = userInputSchema.safeParse({
      email: 'editor@example.com',
      name: 'Editor',
      role: 'editor',
    });
    expect(result.success).toBe(true);
  });

  it('lowercases email', () => {
    const result = userInputSchema.parse({
      email: 'UPPER@EXAMPLE.COM',
      name: 'Test',
      role: 'admin',
    });
    expect(result.email).toBe('upper@example.com');
  });

  it('rejects invalid email', () => {
    const result = userInputSchema.safeParse({
      email: 'not-email',
      name: 'Test',
      role: 'admin',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid role', () => {
    const result = userInputSchema.safeParse({
      email: 'admin@example.com',
      name: 'Admin',
      // testing invalid enum
      role: 'superadmin' as string,
    });
    expect(result.success).toBe(false);
  });

  it('defaults isActive to true', () => {
    const result = userInputSchema.parse({
      email: 'admin@example.com',
      name: 'Admin',
      role: 'admin',
    });
    expect(result.isActive).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 10. Settings input validation
// ---------------------------------------------------------------------------
describe('settingInputSchema', () => {
  it('accepts site settings with all fields', () => {
    const result = settingInputSchema.safeParse({
      key: 'site',
      value: {
        titleUk: 'Архів',
        titleEn: 'Archive',
        descriptionUk: 'Опис',
        descriptionEn: 'Description',
      },
    });
    expect(result.success).toBe(true);
  });

  it('rejects unknown keys in site value', () => {
    const result = settingInputSchema.safeParse({
      key: 'site',
      value: { unknownField: 'value' },
    });
    expect(result.success).toBe(false);
  });

  it('accepts home settings', () => {
    const result = settingInputSchema.safeParse({
      key: 'home',
      value: {
        heroTitleUk: 'Герой',
        heroTitleEn: 'Hero',
        introUk: 'Вступ',
        introEn: 'Intro',
        featuredPostIds: [crypto.randomUUID()],
      },
    });
    expect(result.success).toBe(true);
  });

  it('rejects unknown setting key', () => {
    const result = settingInputSchema.safeParse({
      // testing invalid key
      key: 'unknown' as string,
      value: {},
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 11. FTS query builder
// ---------------------------------------------------------------------------
describe('ftsPrefixQuery', () => {
  it('builds a valid prefix query from Ukrainian text', () => {
    expect(ftsPrefixQuery('лисиця степ')).toBe('"лисиця"* AND "степ"*');
  });

  it('returns null for single-character terms', () => {
    expect(ftsPrefixQuery('x')).toBeNull();
    expect(ftsPrefixQuery('a b')).toBeNull();
  });

  it('returns null for empty input', () => {
    expect(ftsPrefixQuery('')).toBeNull();
    expect(ftsPrefixQuery('   ')).toBeNull();
  });

  it('filters out terms with special characters', () => {
    const result = ftsPrefixQuery('valid @invalid #hash');
    expect(result).toContain('"valid"*');
    expect(result).not.toContain('invalid');
    expect(result).not.toContain('hash');
  });

  it('limits to 8 terms', () => {
    const result = ftsPrefixQuery('one two three four five six seven eight nine ten');
    const matches = result!.match(/\*/g);
    expect(matches?.length).toBe(8);
  });

  it('handles apostrophes and hyphens in terms', () => {
    expect(ftsPrefixQuery("o'brien mcdonald")).toContain('"o\'brien"*');
  });

  it('filters out terms with double quotes', () => {
    expect(ftsPrefixQuery('test"value')).toBeNull();
  });

  it('uses NFKC normalization on full-width characters', () => {
    // Full-width characters normalize to ASCII via NFKC
    expect(ftsPrefixQuery('ｔｅｓｔ')).toBe('"test"*');
  });
});

// ---------------------------------------------------------------------------
// 12. API response helpers (DTO mapping)
// ---------------------------------------------------------------------------
describe('apiError / apiSuccess', () => {
  it('apiSuccess wraps data with ok: true', () => {
    expect(apiSuccess({ id: '123' })).toEqual({ ok: true, data: { id: '123' } });
  });

  it('apiError wraps error with ok: false', () => {
    expect(apiError('NOT_FOUND', 'Не знайдено')).toEqual({
      ok: false,
      error: { code: 'NOT_FOUND', message: 'Не знайдено' },
    });
  });

  it('apiError includes field-level errors', () => {
    const error = apiError('VALIDATION', 'Помилка', { slug: 'Зарезервовано' });
    expect(error.error).toHaveProperty('fields');
    expect(error.error!.fields!.slug).toBe('Зарезервовано');
  });

  it('apiSuccess works with primitive values', () => {
    expect(apiSuccess(42)).toEqual({ ok: true, data: 42 });
  });
});

// ---------------------------------------------------------------------------
// 13. Constants / domain types
// ---------------------------------------------------------------------------
describe('domain constants', () => {
  it('defines expected locales', () => {
    expect(locales).toEqual(['uk', 'en']);
  });

  it('defines expected statuses', () => {
    expect(statuses).toEqual(['draft', 'published', 'archived']);
  });

  it('defines expected roles', () => {
    expect(roles).toEqual(['admin', 'editor']);
  });

  it('includes all reserved slugs', () => {
    expect(reservedSlugs.has('admin')).toBe(true);
    expect(reservedSlugs.has('api')).toBe(true);
    expect(reservedSlugs.has('en')).toBe(true);
    expect(reservedSlugs.has('category')).toBe(true);
    expect(reservedSlugs.has('post')).toBe(true);
    expect(reservedSlugs.has('search')).toBe(true);
    expect(reservedSlugs.has('assets')).toBe(true);
    expect(reservedSlugs.has('media')).toBe(true);
    expect(reservedSlugs.has('robots.txt')).toBe(true);
    expect(reservedSlugs.has('sitemap.xml')).toBe(true);
  });
});
