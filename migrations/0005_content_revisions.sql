-- A client-visible revision prevents same-millisecond optimistic-lock collisions.
-- mutation_id is written uniquely by each successful mutation so dependent D1 batch
-- statements can only belong to that exact mutation.
ALTER TABLE posts ADD COLUMN revision INTEGER NOT NULL DEFAULT 0;
ALTER TABLE posts ADD COLUMN mutation_id TEXT;
ALTER TABLE pages ADD COLUMN revision INTEGER NOT NULL DEFAULT 0;
ALTER TABLE pages ADD COLUMN mutation_id TEXT;
ALTER TABLE categories ADD COLUMN revision INTEGER NOT NULL DEFAULT 0;
ALTER TABLE categories ADD COLUMN mutation_id TEXT;
