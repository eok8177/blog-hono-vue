import { describe, expect, it } from 'vitest';
import {
  baseSlug,
  shouldAutoGenerateSlug,
  isSlugExplicitlyEmpty,
  isSlugUniqueConstraint,
  SlugTakenError,
} from './slug';

describe('baseSlug', () => {
  it('transliterates Ukrainian Cyrillic to Latin', () => {
    expect(baseSlug('Привіт Світ')).toBe('pryvit-svit');
  });

  it('lowercases, hyphenates and strips diacritics', () => {
    expect(baseSlug('  Fox -- Notes! ')).toBe('fox-notes');
  });

  it('truncates to 120 characters', () => {
    const long = 'a'.repeat(200);
    expect(baseSlug(long).length).toBeLessThanOrEqual(120);
  });

  it('falls back to "untitled" for empty / whitespace / symbols-only', () => {
    expect(baseSlug('')).toBe('untitled');
    expect(baseSlug('   ')).toBe('untitled');
    expect(baseSlug('¿¿¿')).toBe('untitled');
  });

  it('removes diacritics via NFKD', () => {
    expect(baseSlug('café naïve')).toBe('cafe-naive');
  });
});

describe('shouldAutoGenerateSlug', () => {
  describe('create (isCreate = true)', () => {
    it('returns true when slug key is absent', () => {
      expect(shouldAutoGenerateSlug({ titleUk: 'Test' }, true)).toBe(true);
    });

    it('returns true when slug is null', () => {
      expect(shouldAutoGenerateSlug({ slug: null, titleUk: 'Test' }, true)).toBe(true);
    });

    it('returns true when slug is empty string', () => {
      expect(shouldAutoGenerateSlug({ slug: '', titleUk: 'Test' }, true)).toBe(true);
    });

    it('returns true when slug is whitespace-only', () => {
      expect(shouldAutoGenerateSlug({ slug: '   ', titleUk: 'Test' }, true)).toBe(true);
    });

    it('returns false when a non-empty slug is provided', () => {
      expect(shouldAutoGenerateSlug({ slug: 'my-custom-slug', titleUk: 'Test' }, true)).toBe(false);
    });

    it('returns true for null / non-object body', () => {
      expect(shouldAutoGenerateSlug(null, true)).toBe(true);
      expect(shouldAutoGenerateSlug('string', true)).toBe(true);
    });
  });

  describe('update (isCreate = false)', () => {
    it('returns false when slug key is absent (keep existing)', () => {
      expect(shouldAutoGenerateSlug({ titleUk: 'Test' }, false)).toBe(false);
    });

    it('returns true when slug is explicitly emptied (null)', () => {
      expect(shouldAutoGenerateSlug({ slug: null, titleUk: 'Test' }, false)).toBe(true);
    });

    it('returns true when slug is explicitly emptied ("")', () => {
      expect(shouldAutoGenerateSlug({ slug: '', titleUk: 'Test' }, false)).toBe(true);
    });

    it('returns true when slug is whitespace-only', () => {
      expect(shouldAutoGenerateSlug({ slug: '   ', titleUk: 'Test' }, false)).toBe(true);
    });

    it('returns false when a non-empty slug is provided', () => {
      expect(shouldAutoGenerateSlug({ slug: 'my-custom-slug', titleUk: 'Test' }, false)).toBe(
        false,
      );
    });

    it('returns false for null / non-object body', () => {
      expect(shouldAutoGenerateSlug(null, false)).toBe(false);
    });
  });
});

describe('isSlugExplicitlyEmpty', () => {
  it('returns true when slug is null', () => {
    expect(isSlugExplicitlyEmpty({ slug: null })).toBe(true);
  });

  it('returns true when slug is ""', () => {
    expect(isSlugExplicitlyEmpty({ slug: '' })).toBe(true);
  });

  it('returns true when slug is whitespace-only', () => {
    expect(isSlugExplicitlyEmpty({ slug: '   ' })).toBe(true);
  });

  it('returns false when slug is absent', () => {
    expect(isSlugExplicitlyEmpty({ titleUk: 'Test' })).toBe(false);
  });

  it('returns false when slug is valid', () => {
    expect(isSlugExplicitlyEmpty({ slug: 'valid-slug' })).toBe(false);
  });

  it('returns false for non-object body', () => {
    expect(isSlugExplicitlyEmpty(null)).toBe(false);
    expect(isSlugExplicitlyEmpty('string')).toBe(false);
  });
});

describe('isSlugUniqueConstraint', () => {
  it('recognizes a slug unique-constraint violation for its table only', () => {
    const error = new Error('D1_ERROR: UNIQUE constraint failed: posts.slug: SQLITE_CONSTRAINT');
    expect(isSlugUniqueConstraint(error, 'posts')).toBe(true);
    expect(isSlugUniqueConstraint(error, 'pages')).toBe(false);
  });

  it('does not treat another unique constraint as a slug collision', () => {
    expect(
      isSlugUniqueConstraint(
        new Error(
          'D1_ERROR: UNIQUE constraint failed: post_categories.post_id, post_categories.category_id',
        ),
        'posts',
      ),
    ).toBe(false);
  });
});

describe('SlugTakenError', () => {
  it('stores the slug and has correct message', () => {
    const err = new SlugTakenError('my-slug');
    expect(err.slug).toBe('my-slug');
    expect(err.message).toContain('my-slug');
    expect(err.name).toBe('SlugTakenError');
  });
});
