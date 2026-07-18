const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export type ImageInfo = {
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  width: number;
  height: number;
};
const u16 = (v: Uint8Array, at: number) => (v[at]! << 8) | v[at + 1]!;
const u32be = (v: Uint8Array, at: number) =>
  ((v[at]! << 24) | (v[at + 1]! << 16) | (v[at + 2]! << 8) | v[at + 3]!) >>> 0;

/** Verifies bytes rather than trusting a filename or browser supplied MIME type. */
export function inspectImage(bytes: Uint8Array): ImageInfo | null {
  if (bytes.byteLength < 24 || bytes.byteLength > MAX_UPLOAD_BYTES) return null;
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return { mimeType: 'image/png', width: u32be(bytes, 16), height: u32be(bytes, 20) };
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    for (let i = 2; i + 9 < bytes.length;) {
      if (bytes[i] !== 0xff) {
        i++;
        continue;
      }
      const marker = bytes[i + 1]!;
      const size = u16(bytes, i + 2);
      if (
        [0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(
          marker,
        ) &&
        i + 8 < bytes.length
      )
        return { mimeType: 'image/jpeg', width: u16(bytes, i + 7), height: u16(bytes, i + 5) };
      if (size < 2) return null;
      i += size + 2;
    }
  }
  if (
    String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
  ) {
    const kind = String.fromCharCode(...bytes.slice(12, 16));
    if (kind === 'VP8X' && bytes.length >= 30)
      return {
        mimeType: 'image/webp',
        width: 1 + bytes[24]! + (bytes[25]! << 8) + (bytes[26]! << 16),
        height: 1 + bytes[27]! + (bytes[28]! << 8) + (bytes[29]! << 16),
      };
  }
  return null;
}

export async function sha256(bytes: Uint8Array): Promise<string> {
  // Copy into a fresh ArrayBuffer-backed view; Web Crypto intentionally rejects SharedArrayBuffer inputs.
  const digest = await crypto.subtle.digest('SHA-256', new Uint8Array(bytes));
  return [...new Uint8Array(digest)].map((part) => part.toString(16).padStart(2, '0')).join('');
}
