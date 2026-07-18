-- Idempotent local demo seed. It never overwrites existing fixture records.
INSERT OR IGNORE INTO users VALUES ('00000000-0000-4000-8000-000000000001','admin@example.test','Demo Admin','admin',1,NULL,'2026-01-01T00:00:00.000Z','2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO users VALUES ('00000000-0000-4000-8000-000000000002','editor@example.test','Demo Editor','editor',1,NULL,'2026-01-01T00:00:00.000Z','2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO categories VALUES ('00000000-0000-4000-8000-000000000010',NULL,'doslidzhennia','Тестові дослідження','Test research',NULL,NULL,NULL,NULL,NULL,NULL,'published',1,1,1,'2026-01-01T00:00:00.000Z','2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO posts VALUES ('00000000-0000-4000-8000-000000000020','testovyi-step','Тестовий матеріал про степ','Test material about the steppe','Демонстраційний опис','Demonstration description','# Тестовий матеріал\n\nЦе **тестовий** контент, не наукова публікація.','# Test material\n\nThis is **test** content, not a scientific publication.',NULL,'published',1,'2026-01-01T00:00:00.000Z',NULL,NULL,NULL,NULL,'00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','2026-01-01T00:00:00.000Z','2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO post_categories VALUES ('00000000-0000-4000-8000-000000000020','00000000-0000-4000-8000-000000000010','2026-01-01T00:00:00.000Z');
DELETE FROM content_fts WHERE entity_id='00000000-0000-4000-8000-000000000020';
INSERT INTO content_fts VALUES ('post','00000000-0000-4000-8000-000000000020','uk','Тестовий матеріал про степ','Демонстраційний опис','Це тестовий контент');
INSERT INTO content_fts VALUES ('post','00000000-0000-4000-8000-000000000020','en','Test material about the steppe','Demonstration description','This is test content');
