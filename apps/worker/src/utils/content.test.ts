import { describe, expect, it } from 'vitest';
import { now } from './content';

// Note: renderMarkdown is tested via integration tests where workerd
// provides the full Node.js compatibility for sanitize-html.

// ---------------------------------------------------------------------------
// Timestamps
// ---------------------------------------------------------------------------
describe('now', () => {
  it('returns an ISO 8601 string', () => {
    const ts = now();
    expect(() => new Date(ts)).not.toThrow();
    expect(ts).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
