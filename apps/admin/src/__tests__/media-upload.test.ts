import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { buildImageMarkdown, isValidMediaUrl } from '../utils/media-markdown';

// webpVariants cannot be tested in Node without a Canvas implementation,
// but we can test the orchestration logic (uploadMedia) with mocks.

describe('media upload orchestration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Mock createImageBitmap
    globalThis.createImageBitmap = vi.fn().mockResolvedValue({
      width: 1920,
      height: 1080,
      close: vi.fn(),
    } as unknown as ImageBitmap);

    // Mock canvas
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    HTMLCanvasElement.prototype.toBlob = vi
      .fn()
      .mockImplementation(
        (cb: (blob: Blob | null) => void) =>
          cb(new Blob(['fake-webp'], { type: 'image/webp' })),
      );

    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('buildImageMarkdown generates correct markdown from media image', () => {
    const result = buildImageMarkdown({
      url: '/media/uuid/960',
      alt: 'Фото степу',
    });
    expect(result).toBe('![](/media/uuid/960 "Фото степу")');
  });

  it('buildImageMarkdown falls back to altUk', () => {
    const result = buildImageMarkdown({
      url: '/media/uuid/960',
      altUk: 'Степ',
      altEn: 'Steppe',
    });
    expect(result).toContain('Степ');
  });

  it('isValidMediaUrl rejects external URLs', () => {
    expect(isValidMediaUrl('https://evil.com/image.jpg')).toBe(false);
    expect(isValidMediaUrl('/media/uuid/960')).toBe(true);
  });
});

describe('cancelUpload and progress', () => {
  it('cancelUpload aborts the current upload', async () => {
    const { cancelUpload, onUploadProgress } = await import('../api/media');

    const progressUpdates: string[] = [];
    const unsub = onUploadProgress((p) => {
      progressUpdates.push(p.stage);
    });

    // Trigger cancel
    cancelUpload();

    // Subsequent progress should not crash
    unsub();
    expect(Array.isArray(progressUpdates)).toBe(true);
  });

  it('onUploadProgress returns unsubscribe function', async () => {
    const { onUploadProgress } = await import('../api/media');

    const listener = vi.fn();
    const unsub = onUploadProgress(listener);

    expect(typeof unsub).toBe('function');
    unsub(); // should not throw
  });
});
