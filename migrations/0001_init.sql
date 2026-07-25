PRAGMA foreign_keys = ON;

-- =============================================================================
-- Tables
-- =============================================================================

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin','editor')),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  last_seen_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  parent_id TEXT REFERENCES categories(id),
  slug TEXT NOT NULL UNIQUE,
  title_uk TEXT NOT NULL,
  title_en TEXT,
  description_md_uk TEXT,
  description_md_en TEXT,
  seo_title_uk TEXT,
  seo_title_en TEXT,
  seo_description_uk TEXT,
  seo_description_en TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','archived')),
  is_en_published INTEGER NOT NULL DEFAULT 0 CHECK(is_en_published IN (0,1)),
  show_in_menu INTEGER NOT NULL DEFAULT 0,
  menu_order INTEGER NOT NULL DEFAULT 0,
  revision INTEGER NOT NULL DEFAULT 0,
  mutation_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE media (
  id TEXT PRIMARY KEY,
  original_key TEXT,
  variant_480_key TEXT,
  variant_960_key TEXT,
  variant_1600_key TEXT,
  mime_type TEXT NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  size_bytes INTEGER NOT NULL,
  sha256 TEXT,
  alt_uk TEXT NOT NULL,
  alt_en TEXT,
  caption_uk TEXT,
  caption_en TEXT,
  credit TEXT,
  license TEXT,
  source_url TEXT,
  status TEXT NOT NULL DEFAULT 'processing' CHECK(status IN ('processing','ready','failed','archived')),
  folder TEXT NOT NULL DEFAULT '',
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE posts (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title_uk TEXT NOT NULL,
  title_en TEXT,
  excerpt_uk TEXT,
  excerpt_en TEXT,
  body_md_uk TEXT NOT NULL,
  body_md_en TEXT,
  cover_media_id TEXT REFERENCES media(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','archived')),
  is_en_published INTEGER NOT NULL DEFAULT 0 CHECK(is_en_published IN (0,1)),
  published_at TEXT,
  seo_title_uk TEXT,
  seo_title_en TEXT,
  seo_description_uk TEXT,
  seo_description_en TEXT,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  updated_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  revision INTEGER NOT NULL DEFAULT 0,
  mutation_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE pages (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  template TEXT NOT NULL DEFAULT 'default' CHECK(template IN ('default','about','contact')),
  title_uk TEXT NOT NULL,
  title_en TEXT,
  body_md_uk TEXT NOT NULL,
  body_md_en TEXT,
  cover_media_id TEXT REFERENCES media(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','archived')),
  is_en_published INTEGER NOT NULL DEFAULT 0,
  published_at TEXT,
  show_in_menu INTEGER NOT NULL DEFAULT 0,
  menu_order INTEGER NOT NULL DEFAULT 0,
  seo_title_uk TEXT,
  seo_title_en TEXT,
  seo_description_uk TEXT,
  seo_description_en TEXT,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  updated_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  revision INTEGER NOT NULL DEFAULT 0,
  mutation_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE redirects (
  id TEXT PRIMARY KEY,
  old_path TEXT NOT NULL UNIQUE,
  new_path TEXT NOT NULL,
  status_code INTEGER NOT NULL CHECK(status_code IN (301,308)),
  entity_type TEXT NOT NULL CHECK(entity_type IN ('post','page','category')),
  entity_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  request_id TEXT,
  created_at TEXT NOT NULL
);

-- =============================================================================
-- Junction tables
-- =============================================================================

CREATE TABLE post_categories (
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES categories(id),
  created_at TEXT NOT NULL,
  PRIMARY KEY(post_id, category_id)
);

CREATE TABLE post_media (
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  media_id TEXT NOT NULL REFERENCES media(id),
  role TEXT NOT NULL DEFAULT 'gallery' CHECK(role IN ('cover','gallery','inline')),
  position INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(post_id, media_id)
);

CREATE TABLE page_media (
  page_id TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  media_id TEXT NOT NULL REFERENCES media(id),
  role TEXT NOT NULL DEFAULT 'gallery' CHECK(role IN ('cover','gallery','inline')),
  position INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(page_id, media_id)
);

CREATE TABLE category_media (
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  media_id TEXT NOT NULL REFERENCES media(id),
  role TEXT NOT NULL DEFAULT 'gallery' CHECK(role IN ('cover','gallery','inline')),
  position INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(category_id, media_id)
);

-- =============================================================================
-- Full-text search
-- =============================================================================

CREATE VIRTUAL TABLE content_fts USING fts5(
  entity_type UNINDEXED,
  entity_id UNINDEXED,
  locale UNINDEXED,
  title,
  summary,
  body,
  tokenize='unicode61'
);

-- =============================================================================
-- FTS triggers
-- =============================================================================

CREATE TRIGGER posts_fts_after_insert AFTER INSERT ON posts BEGIN
  INSERT INTO content_fts(entity_type,entity_id,locale,title,summary,body)
  SELECT 'post',NEW.id,'uk',NEW.title_uk,COALESCE(NEW.excerpt_uk,''),NEW.body_md_uk WHERE NEW.status='published';
  INSERT INTO content_fts(entity_type,entity_id,locale,title,summary,body)
  SELECT 'post',NEW.id,'en',NEW.title_en,COALESCE(NEW.excerpt_en,''),NEW.body_md_en WHERE NEW.status='published' AND NEW.is_en_published=1;
END;
CREATE TRIGGER posts_fts_after_update AFTER UPDATE ON posts BEGIN
  DELETE FROM content_fts WHERE entity_type='post' AND entity_id=NEW.id;
  INSERT INTO content_fts(entity_type,entity_id,locale,title,summary,body)
  SELECT 'post',NEW.id,'uk',NEW.title_uk,COALESCE(NEW.excerpt_uk,''),NEW.body_md_uk WHERE NEW.status='published';
  INSERT INTO content_fts(entity_type,entity_id,locale,title,summary,body)
  SELECT 'post',NEW.id,'en',NEW.title_en,COALESCE(NEW.excerpt_en,''),NEW.body_md_en WHERE NEW.status='published' AND NEW.is_en_published=1;
END;
CREATE TRIGGER posts_fts_after_delete AFTER DELETE ON posts BEGIN DELETE FROM content_fts WHERE entity_type='post' AND entity_id=OLD.id; END;

CREATE TRIGGER pages_fts_after_insert AFTER INSERT ON pages BEGIN
  INSERT INTO content_fts(entity_type,entity_id,locale,title,summary,body) SELECT 'page',NEW.id,'uk',NEW.title_uk,'',NEW.body_md_uk WHERE NEW.status='published';
  INSERT INTO content_fts(entity_type,entity_id,locale,title,summary,body) SELECT 'page',NEW.id,'en',NEW.title_en,'',NEW.body_md_en WHERE NEW.status='published' AND NEW.is_en_published=1;
END;
CREATE TRIGGER pages_fts_after_update AFTER UPDATE ON pages BEGIN
  DELETE FROM content_fts WHERE entity_type='page' AND entity_id=NEW.id;
  INSERT INTO content_fts(entity_type,entity_id,locale,title,summary,body) SELECT 'page',NEW.id,'uk',NEW.title_uk,'',NEW.body_md_uk WHERE NEW.status='published';
  INSERT INTO content_fts(entity_type,entity_id,locale,title,summary,body) SELECT 'page',NEW.id,'en',NEW.title_en,'',NEW.body_md_en WHERE NEW.status='published' AND NEW.is_en_published=1;
END;
CREATE TRIGGER pages_fts_after_delete AFTER DELETE ON pages BEGIN DELETE FROM content_fts WHERE entity_type='page' AND entity_id=OLD.id; END;

-- =============================================================================
-- Indexes
-- =============================================================================

CREATE INDEX posts_status_published_idx ON posts(status,published_at);
CREATE INDEX posts_updated_idx ON posts(updated_at);
CREATE INDEX pages_status_published_idx ON pages(status,published_at);
CREATE INDEX pages_updated_idx ON pages(updated_at);
CREATE INDEX categories_parent_idx ON categories(parent_id);
CREATE INDEX categories_status_idx ON categories(status);
CREATE INDEX media_status_created_idx ON media(status,created_at);
CREATE INDEX media_folder_idx ON media(folder);
CREATE INDEX audit_logs_created_idx ON audit_logs(created_at);
CREATE INDEX redirects_old_path_idx ON redirects(old_path);
CREATE INDEX redirects_entity_idx ON redirects(entity_type,entity_id);
CREATE INDEX post_categories_category_idx ON post_categories(category_id);
CREATE INDEX post_media_media_idx ON post_media(media_id);
CREATE INDEX page_media_media_idx ON page_media(media_id);
CREATE INDEX category_media_media_idx ON category_media(media_id);
