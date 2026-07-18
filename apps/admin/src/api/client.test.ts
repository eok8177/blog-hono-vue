import { describe, expect, it } from 'vitest';
import { ApiError } from './client';
describe('admin API error', () =>
  it('retains machine-readable code', () =>
    expect(new ApiError('CONFLICT', 'Конфлікт').code).toBe('CONFLICT')));
