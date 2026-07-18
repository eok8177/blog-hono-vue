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
CREATE INDEX post_media_media_idx ON post_media(media_id);
CREATE INDEX page_media_media_idx ON page_media(media_id);
