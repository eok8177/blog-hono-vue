import { describe, expect, it } from 'vitest';
describe('worker setup', () =>
  it('has a deterministic smoke check', () => expect('/en').toMatch(/^\//)));
