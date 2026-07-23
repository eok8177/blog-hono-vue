import type { Context, Hono } from 'hono';
import type { AppEnv } from '../../index';
import { listPublished } from '../../services/posts';
import { Layout, SectionLabel } from '../../views/layout';
import { readNavigation, readSettings, settingText } from './shared';

type Locale = 'uk' | 'en';

export function registerHomeRoutes(app: Hono<AppEnv>) {
  app.get('/', (c) => renderHome(c, 'uk'));
  app.get('/en/', (c) => renderHome(c, 'en'));
}

async function renderHome(c: Context<AppEnv>, locale: Locale) {
  const [posts, settings, site, categories] = await Promise.all([
    listPublished(c.env, locale),
    readSettings(c.env, 'home'),
    readSettings(c.env, 'site'),
    c.env.DB.prepare(
      `SELECT slug,title_${locale} title FROM categories WHERE status='published'${locale === 'en' ? ' AND is_en_published=1' : ''} ORDER BY menu_order, title LIMIT 6`,
    ).all<{ slug: string; title: string }>(),
  ]);
  const title = settingText(
    settings[locale === 'en' ? 'heroTitleEn' : 'heroTitleUk'],
    settingText(
      site[locale === 'en' ? 'titleEn' : 'titleUk'],
      locale === 'en' ? 'Fauna of Southern Ukraine' : 'Фауна півдня України',
    ),
  );
  const intro = settingText(
    settings[locale === 'en' ? 'introEn' : 'introUk'],
    locale === 'en'
      ? 'A living archive of observations, field notes and research from the southern Ukrainian landscape.'
      : 'Живий архів спостережень, польових нотаток і досліджень ландшафтів півдня України.',
  );
  const basePath = locale === 'en' ? '/en' : '';
  const menuItems = await readNavigation(c.env, locale);

  return c.html(
    <Layout
      nonce={c.get('cspNonce')}
      lang={locale}
      title={title}
      description={settingText(site[locale === 'en' ? 'descriptionEn' : 'descriptionUk'], intro)}
      menuItems={menuItems}
    >
      <section class="hero" aria-labelledby="home-title">
        <span class="hero-orbit hero-orbit-left" aria-hidden="true" />
        <span class="hero-orbit hero-orbit-right" aria-hidden="true" />
        <div class="hero-inner">
          <p class="eyebrow">
            {locale === 'en' ? 'A field archive · since 2024' : 'Польовий архів · з 2024 року'}
          </p>
          <h1 id="home-title">{title}</h1>
          <p class="hero-intro">{intro}</p>
          <div class="hero-rule" aria-hidden="true">
            {locale === 'en' ? 'in careful observation' : 'у уважному спостереженні'}
          </div>
        </div>
      </section>
      <section class="section" aria-labelledby="recent-title">
        <div class="container">
          <SectionLabel>{locale === 'en' ? 'The archive' : 'Архів'}</SectionLabel>
          <div class="section-heading">
            <h2 id="recent-title">
              {locale === 'en' ? 'Recent observations' : 'Останні спостереження'}
            </h2>
            <p>
              {locale === 'en'
                ? 'Notes from years of patient attention to the steppe, coast and wetlands.'
                : 'Нотатки з років уважного спостереження за степом, узбережжям і водно-болотними угіддями.'}
            </p>
          </div>
          <div class="archive-grid">
            {posts.results
              .slice(0, 6)
              .map(
                (post: {
                  slug: string;
                  title: string;
                  excerpt: string | null;
                  published_at?: string;
                }) => (
                  <article class="card" key={post.slug}>
                    <p class="post-meta">
                      {post.published_at
                        ? new Date(post.published_at).toLocaleDateString(
                            locale === 'uk' ? 'uk-UA' : 'en-GB',
                            { year: 'numeric', month: 'short' },
                          )
                        : locale === 'en'
                          ? 'Archive note'
                          : 'Архівна нотатка'}
                    </p>
                    <h2>
                      <a href={`${basePath}/post/${post.slug}`}>{post.title}</a>
                    </h2>
                    <p>
                      {post.excerpt ||
                        (locale === 'en'
                          ? 'Read the full field note.'
                          : 'Переглянути повну польову нотатку.')}
                    </p>
                    <a class="read-more" href={`${basePath}/post/${post.slug}`}>
                      {locale === 'en' ? 'Read note' : 'Читати нотатку'}
                    </a>
                  </article>
                ),
              )}
          </div>
          {!posts.results.length ? (
            <p class="empty-state">
              {locale === 'en'
                ? 'The first observations will appear here soon.'
                : 'Перші спостереження скоро з’являться тут.'}
            </p>
          ) : null}
        </div>
      </section>
      <section class="section" aria-labelledby="categories-title">
        <div class="container archive-note">
          <div>
            <p class="eyebrow">{locale === 'en' ? 'Ways into the archive' : 'Розділи архіву'}</p>
            <h2 id="categories-title">
              {locale === 'en'
                ? 'A landscape is never just one story.'
                : 'Ландшафт ніколи не є лише однією історією.'}
            </h2>
          </div>
          <div>
            <p class="note-mark">
              {locale === 'en' ? 'Explore by subject' : 'Досліджуйте за темою'}
            </p>
            {categories.results.map((category) => (
              <p key={category.slug}>
                <a class="text-link" href={`${basePath}/category/${category.slug}`}>
                  {category.title}
                </a>
              </p>
            ))}
          </div>
        </div>
      </section>
    </Layout>,
  );
}
