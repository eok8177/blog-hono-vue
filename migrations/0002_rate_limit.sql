CREATE TABLE IF NOT EXISTS rate_limit_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  namespace TEXT NOT NULL,
  client_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  request_id TEXT
);

CREATE INDEX IF NOT EXISTS rate_limit_ns_ck_ca ON rate_limit_entries(namespace, client_key, created_at);
CREATE INDEX IF NOT EXISTS rate_limit_created_at ON rate_limit_entries(created_at);
