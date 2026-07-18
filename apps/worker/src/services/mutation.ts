export type MutationResult =
  | { kind: 'ok'; id: string; updatedAt?: string; revision?: number }
  | {
      kind: 'missing' | 'conflict' | 'slug_taken' | 'cycle' | 'in_use' | 'last_admin' | 'invalid';
      id?: undefined;
      updatedAt?: undefined;
      revision?: undefined;
    };
