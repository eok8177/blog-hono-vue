import { integer, sqliteTable, text, primaryKey, index } from 'drizzle-orm/sqlite-core';

const timestamps = {
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
};
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: text('role', { enum: ['admin', 'editor'] }).notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  lastSeenAt: text('last_seen_at'),
  ...timestamps,
});
export const categories = sqliteTable(
  'categories',
  {
    id: text('id').primaryKey(),
    parentId: text('parent_id'),
    slug: text('slug').notNull().unique(),
    titleUk: text('title_uk').notNull(),
    titleEn: text('title_en'),
    descriptionMdUk: text('description_md_uk'),
    descriptionMdEn: text('description_md_en'),
    status: text('status').notNull().default('draft'),
    isEnPublished: integer('is_en_published', { mode: 'boolean' }).notNull().default(false),
    showInMenu: integer('show_in_menu', { mode: 'boolean' }).notNull().default(false),
    menuOrder: integer('menu_order').notNull().default(0),
    seoTitleUk: text('seo_title_uk'),
    seoTitleEn: text('seo_title_en'),
    seoDescriptionUk: text('seo_description_uk'),
    seoDescriptionEn: text('seo_description_en'),
    ...timestamps,
  },
  (t) => [
    index('categories_parent_idx').on(t.parentId),
    index('categories_status_idx').on(t.status),
  ],
);
export const media = sqliteTable('media', {
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
  status: text('status').notNull().default('processing'),
  createdBy: text('created_by').references(() => users.id),
  ...timestamps,
});
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
    status: text('status').notNull().default('draft'),
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
    ...timestamps,
  },
  (t) => [
    index('posts_status_published_idx').on(t.status, t.publishedAt),
    index('posts_updated_idx').on(t.updatedAt),
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
export const pages = sqliteTable('pages', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  template: text('template').notNull().default('default'),
  titleUk: text('title_uk').notNull(),
  titleEn: text('title_en'),
  bodyMdUk: text('body_md_uk').notNull(),
  bodyMdEn: text('body_md_en'),
  coverMediaId: text('cover_media_id').references(() => media.id),
  status: text('status').notNull().default('draft'),
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
  ...timestamps,
});
