import { describe, expect, it } from 'vitest';
import { inspectImage } from './media';
describe('image inspection', () => {
  it('rejects SVG/text masquerading as an image', () =>
    expect(inspectImage(new TextEncoder().encode('<svg onload="alert(1)"/>'))).toBeNull());
  it('detects a WebP VP8X header and dimensions', () => {
    const bytes = new Uint8Array(30);
    bytes.set(new TextEncoder().encode('RIFF'), 0);
    bytes.set(new TextEncoder().encode('WEBPVP8X'), 8);
    bytes.set([127, 0, 0, 63, 0, 0], 24);
    expect(inspectImage(bytes)).toEqual({ mimeType: 'image/webp', width: 128, height: 64 });
  });
});
