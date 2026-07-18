-- Complete explicit media relations and the indexes used by list/public queries.
CREATE TABLE category_media (
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  media_id TEXT NOT NULL REFERENCES media(id),
  role TEXT NOT NULL DEFAULT 'gallery' CHECK(role IN ('cover','gallery','inline')),
  position INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(category_id, media_id)
);
CREATE INDEX category_media_media_idx ON category_media(media_id);
CREATE INDEX pages_status_published_idx ON pages(status,published_at);
CREATE INDEX pages_updated_idx ON pages(updated_at);
CREATE INDEX media_status_created_idx ON media(status,created_at);
CREATE INDEX audit_logs_created_idx ON audit_logs(created_at);
CREATE INDEX redirects_entity_idx ON redirects(entity_type,entity_id);
