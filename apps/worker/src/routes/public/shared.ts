import type { Locale } from '@fauna/shared';
import type { AppEnv } from '../../index';

export async function readSettings(
  env: AppEnv['Bindings'],
  key: 'site' | 'home',
): Promise<Record<string, unknown>> {
  const row = await env.DB.prepare('SELECT value_json FROM settings WHERE key=?')
    .bind(key)
    .first<{ value_json: string }>();
  if (!row) return {};

  try {
    const value: unknown = JSON.parse(row.value_json);
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function settingText(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

export async function readNavigation(env: AppEnv['Bindings'], locale: Locale) {
  const titleColumn = locale === 'en' ? 'title_en' : 'title_uk';
  const translation =
    locale === 'en' ? ` AND ${titleColumn} IS NOT NULL AND trim(${titleColumn}) <> ''` : '';
  const rows = await env.DB.prepare(
    `SELECT 'page' entity_type,slug,${titleColumn} title,menu_order FROM pages WHERE status='published' AND show_in_menu=1${translation}
     UNION ALL
     SELECT 'category' entity_type,slug,${titleColumn} title,menu_order FROM categories WHERE status='published' AND show_in_menu=1${locale === 'en' ? ` AND is_en_published=1${translation}` : ''}
     ORDER BY menu_order ASC, title ASC LIMIT 20`,
  ).all<{ entity_type: 'page' | 'category'; slug: string; title: string; menu_order: number }>();

  return rows.results.map((item) => ({
    label: item.title,
    href:
      locale === 'en'
        ? item.entity_type === 'page'
          ? `/en/${item.slug}`
          : `/en/category/${item.slug}`
        : item.entity_type === 'page'
          ? `/${item.slug}`
          : `/category/${item.slug}`,
  }));
}

export async function findRedirect(env: AppEnv['Bindings'], oldPath: string) {
  return env.DB.prepare('SELECT new_path,status_code FROM redirects WHERE old_path=?')
    .bind(oldPath)
    .first<{ new_path: string; status_code: 301 | 308 }>();
}

export function siteUrl(env: AppEnv['Bindings']) {
  return env.SITE_URL.replace(/\/$/, '');
}
