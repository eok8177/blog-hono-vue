import { sql } from 'drizzle-orm';
import {
  check,
  integer,
  index,
  primaryKey,
  sqliteTable,
  text,
  type AnySQLiteColumn,
} from 'drizzle-orm/sqlite-core';

const timestamps = {
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
};

export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull().unique(),
    name: text('name').notNull(),
    role: text('role', { enum: ['admin', 'editor'] }).notNull(),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    lastSeenAt: text('last_seen_at'),
    ...timestamps,
  },
  (t) => [
    check('users_role_check', sql`${t.role} IN ('admin','editor')`),
    check('users_is_active_check', sql`${t.isActive} IN (0,1)`),
  ],
);

export const categories = sqliteTable(
  'categories',
  {
    id: text('id').primaryKey(),
    parentId: text('parent_id').references((): AnySQLiteColumn => categories.id),
    slug: text('slug').notNull().unique(),
    titleUk: text('title_uk').notNull(),
    titleEn: text('title_en'),
    descriptionMdUk: text('description_md_uk'),
    descriptionMdEn: text('description_md_en'),
    seoTitleUk: text('seo_title_uk'),
    seoTitleEn: text('seo_title_en'),
    seoDescriptionUk: text('seo_description_uk'),
    seoDescriptionEn: text('seo_description_en'),
    status: text('status', { enum: ['draft', 'published', 'archived'] })
      .notNull()
      .default('draft'),
    isEnPublished: integer('is_en_published', { mode: 'boolean' }).notNull().default(false),
    showInMenu: integer('show_in_menu', { mode: 'boolean' }).notNull().default(false),
    menuOrder: integer('menu_order').notNull().default(0),
    revision: integer('revision').notNull().default(0),
    mutationId: text('mutation_id'),
    ...timestamps,
  },
  (t) => [
    index('categories_parent_idx').on(t.parentId),
    index('categories_status_idx').on(t.status),
    check('categories_status_check', sql`${t.status} IN ('draft','published','archived')`),
    check('categories_is_en_published_check', sql`${t.isEnPublished} IN (0,1)`),
  ],
);

export const media = sqliteTable(
  'media',
  {
    id: text('id').primaryKey(),
    originalKey: text('original_key'),
    variant480Key: text('variant_480_key'),
    variant960Key: text('variant_960_key'),
    variant1600Key: text('variant_1600_key'),
    mimeType: text('mime_type').notNull(),
    width: integer('width').notNull(),
    height: integer('height').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    sha256: text('sha256'),
    altUk: text('alt_uk').notNull(),
    altEn: text('alt_en'),
    captionUk: text('caption_uk'),
    captionEn: text('caption_en'),
    credit: text('credit'),
    license: text('license'),
    sourceUrl: text('source_url'),
    status: text('status', { enum: ['processing', 'ready', 'failed', 'archived'] })
      .notNull()
      .default('processing'),
    createdBy: text('created_by').references(() => users.id),
    ...timestamps,
  },
  (t) => [
    index('media_status_created_idx').on(t.status, t.createdAt),
    check('media_status_check', sql`${t.status} IN ('processing','ready','failed','archived')`),
  ],
);

export const posts = sqliteTable(
  'posts',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    titleUk: text('title_uk').notNull(),
    titleEn: text('title_en'),
    excerptUk: text('excerpt_uk'),
    excerptEn: text('excerpt_en'),
    bodyMdUk: text('body_md_uk').notNull(),
    bodyMdEn: text('body_md_en'),
    coverMediaId: text('cover_media_id').references(() => media.id),
    status: text('status', { enum: ['draft', 'published', 'archived'] })
      .notNull()
      .default('draft'),
    isEnPublished: integer('is_en_published', { mode: 'boolean' }).notNull().default(false),
    publishedAt: text('published_at'),
    seoTitleUk: text('seo_title_uk'),
    seoTitleEn: text('seo_title_en'),
    seoDescriptionUk: text('seo_description_uk'),
    seoDescriptionEn: text('seo_description_en'),
    createdBy: text('created_by')
      .notNull()
      .references(() => users.id),
    updatedBy: text('updated_by')
      .notNull()
      .references(() => users.id),
    revision: integer('revision').notNull().default(0),
    mutationId: text('mutation_id'),
    ...timestamps,
  },
  (t) => [
    index('posts_status_published_idx').on(t.status, t.publishedAt),
    index('posts_updated_idx').on(t.updatedAt),
    check('posts_status_check', sql`${t.status} IN ('draft','published','archived')`),
    check('posts_is_en_published_check', sql`${t.isEnPublished} IN (0,1)`),
  ],
);

export const postCategories = sqliteTable(
  'post_categories',
  {
    postId: text('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    categoryId: text('category_id')
      .notNull()
      .references(() => categories.id),
    createdAt: text('created_at').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.postId, t.categoryId] }),
    index('post_categories_category_idx').on(t.categoryId),
  ],
);

export const pages = sqliteTable(
  'pages',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    template: text('template', { enum: ['default', 'about', 'contact'] })
      .notNull()
      .default('default'),
    titleUk: text('title_uk').notNull(),
    titleEn: text('title_en'),
    bodyMdUk: text('body_md_uk').notNull(),
    bodyMdEn: text('body_md_en'),
    coverMediaId: text('cover_media_id').references(() => media.id),
    status: text('status', { enum: ['draft', 'published', 'archived'] })
      .notNull()
      .default('draft'),
    isEnPublished: integer('is_en_published', { mode: 'boolean' }).notNull().default(false),
    publishedAt: text('published_at'),
    showInMenu: integer('show_in_menu', { mode: 'boolean' }).notNull().default(false),
    menuOrder: integer('menu_order').notNull().default(0),
    seoTitleUk: text('seo_title_uk'),
    seoTitleEn: text('seo_title_en'),
    seoDescriptionUk: text('seo_description_uk'),
    seoDescriptionEn: text('seo_description_en'),
    createdBy: text('created_by')
      .notNull()
      .references(() => users.id),
    updatedBy: text('updated_by')
      .notNull()
      .references(() => users.id),
    revision: integer('revision').notNull().default(0),
    mutationId: text('mutation_id'),
    ...timestamps,
  },
  (t) => [
    index('pages_status_published_idx').on(t.status, t.publishedAt),
    index('pages_updated_idx').on(t.updatedAt),
    check('pages_template_check', sql`${t.template} IN ('default','about','contact')`),
    check('pages_status_check', sql`${t.status} IN ('draft','published','archived')`),
    check('pages_is_en_published_check', sql`${t.isEnPublished} IN (0,1)`),
  ],
);

// Relation declarations stay explicit so each foreign key and composite key is visible to Drizzle.
export const postMedia = sqliteTable(
  'post_media',
  {
    postId: text('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    mediaId: text('media_id')
      .notNull()
      .references(() => media.id),
    role: text('role', { enum: ['cover', 'gallery', 'inline'] })
      .notNull()
      .default('gallery'),
    position: integer('position').notNull().default(0),
  },
  (t) => [
    primaryKey({ columns: [t.postId, t.mediaId] }),
    index('post_media_media_idx').on(t.mediaId),
    check('post_media_role_check', sql`${t.role} IN ('cover','gallery','inline')`),
  ],
);
export const pageMedia = sqliteTable(
  'page_media',
  {
    pageId: text('page_id')
      .notNull()
      .references(() => pages.id, { onDelete: 'cascade' }),
    mediaId: text('media_id')
      .notNull()
      .references(() => media.id),
    role: text('role', { enum: ['cover', 'gallery', 'inline'] })
      .notNull()
      .default('gallery'),
    position: integer('position').notNull().default(0),
  },
  (t) => [
    primaryKey({ columns: [t.pageId, t.mediaId] }),
    index('page_media_media_idx').on(t.mediaId),
    check('page_media_role_check', sql`${t.role} IN ('cover','gallery','inline')`),
  ],
);
export const categoryMedia = sqliteTable(
  'category_media',
  {
    categoryId: text('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
    mediaId: text('media_id')
      .notNull()
      .references(() => media.id),
    role: text('role', { enum: ['cover', 'gallery', 'inline'] })
      .notNull()
      .default('gallery'),
    position: integer('position').notNull().default(0),
  },
  (t) => [
    primaryKey({ columns: [t.categoryId, t.mediaId] }),
    index('category_media_media_idx').on(t.mediaId),
    check('category_media_role_check', sql`${t.role} IN ('cover','gallery','inline')`),
  ],
);

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  valueJson: text('value_json').notNull(),
  updatedBy: text('updated_by').references(() => users.id),
  updatedAt: text('updated_at').notNull(),
});
export const redirects = sqliteTable(
  'redirects',
  {
    id: text('id').primaryKey(),
    oldPath: text('old_path').notNull().unique(),
    newPath: text('new_path').notNull(),
    statusCode: integer('status_code').notNull(),
    entityType: text('entity_type', { enum: ['post', 'page', 'category'] }).notNull(),
    entityId: text('entity_id').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (t) => [
    index('redirects_entity_idx').on(t.entityType, t.entityId),
    check('redirects_status_code_check', sql`${t.statusCode} IN (301,308)`),
    check('redirects_entity_type_check', sql`${t.entityType} IN ('post','page','category')`),
  ],
);
export const auditLogs = sqliteTable(
  'audit_logs',
  {
    id: text('id').primaryKey(),
    actorUserId: text('actor_user_id').references(() => users.id),
    action: text('action').notNull(),
    entityType: text('entity_type'),
    entityId: text('entity_id'),
    metadataJson: text('metadata_json').notNull().default('{}'),
    requestId: text('request_id'),
    createdAt: text('created_at').notNull(),
  },
  (t) => [index('audit_logs_created_idx').on(t.createdAt)],
);
