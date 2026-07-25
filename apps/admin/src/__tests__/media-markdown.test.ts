import { describe, expect, it } from 'vitest';
import {
  buildImageMarkdown,
  copyImageMarkdown,
  isValidMediaUrl,
  type MediaImage,
} from '../utils/media-markdown';

describe('buildImageMarkdown', () => {
  it('builds markdown from image with alt text', () => {
    const img: MediaImage = { url: '/media/abc/960', alt: 'Фото степу' };
    expect(buildImageMarkdown(img)).toBe('![](/media/abc/960 "Фото степу")');
  });

  it('uses altUk when alt not available', () => {
    const img: MediaImage = { url: '/media/abc/960', altUk: 'Степ', altEn: 'Steppe' };
    expect(buildImageMarkdown(img)).toContain('Степ');
  });

  it('uses altEn when alt and altUk not available', () => {
    const img: MediaImage = { url: '/media/abc/960', altEn: 'Steppe' };
    expect(buildImageMarkdown(img)).toContain('Steppe');
  });

  it('extracts name from URL as fallback', () => {
    const img: MediaImage = { url: '/media/abc/960' };
    const result = buildImageMarkdown(img);
    expect(result).toMatch(/^!\[\].*\/media\/abc\/960/);
  });

  it('escapes double quotes in caption', () => {
    const img: MediaImage = { url: '/media/abc/960', alt: 'Фото "степу"' };
    expect(buildImageMarkdown(img)).toContain('\\"');
  });

  it('handles empty alt gracefully', () => {
    const img: MediaImage = { url: '/media/abc/960', alt: '' };
    const result = buildImageMarkdown(img);
    expect(result).toContain('/media/abc/960');
  });
});

describe('isValidMediaUrl', () => {
  it('accepts valid media URLs', () => {
    expect(isValidMediaUrl('/media/abc/960')).toBe(true);
    expect(isValidMediaUrl('/media/variants/hash-480.webp')).toBe(true);
  });

  it('rejects external URLs', () => {
    expect(isValidMediaUrl('https://example.com/image.jpg')).toBe(false);
  });

  it('rejects URLs with path traversal', () => {
    expect(isValidMediaUrl('/media/../config')).toBe(false);
  });

  it('rejects empty URLs', () => {
    expect(isValidMediaUrl('')).toBe(false);
  });
});

describe('copyImageMarkdown', () => {
  it('copies markdown to clipboard', async () => {
    const writeText = vi.fn();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      writable: true,
      configurable: true,
    });

    await copyImageMarkdown({ url: '/media/abc/960', alt: 'Test' });
    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining('/media/abc/960'),
    );
  });

  it('throws on invalid URL', async () => {
    await expect(
      copyImageMarkdown({ url: 'https://evil.com/img.jpg', alt: 'Test' }),
    ).rejects.toThrow('Invalid');
  });
});
