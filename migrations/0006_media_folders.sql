ALTER TABLE media ADD COLUMN folder TEXT NOT NULL DEFAULT '';
CREATE INDEX media_folder_idx ON media(folder);
