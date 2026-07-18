-- SQLite/D1-specific FTS5 synchronization. Only published locales are indexed.
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
