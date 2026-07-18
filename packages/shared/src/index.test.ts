import { describe, expect, it } from 'vitest';
import { ftsPrefixQuery, localeFromPath, normalizeSlug, slugSchema } from './index';
describe('content guards', () => {
  it('normalizes a slug', () => expect(normalizeSlug('  Fox -- Notes! ')).toBe('fox-notes'));
  it('rejects reserved slug', () => expect(slugSchema.safeParse('admin').success).toBe(false));
  it('resolves locale and safely builds FTS prefix query', () => {
    expect(localeFromPath('/en/post/a')).toBe('en');
    expect(ftsPrefixQuery('лисиця степ')).toBe('"лисиця"* AND "степ"*');
    expect(ftsPrefixQuery('x')).toBeNull();
  });
});
