import type { Locale } from '@fauna/shared';

type JsonLd = Record<string, unknown>;
type Breadcrumb = { name: string; url: string };

export const archiveName = (locale: Locale) =>
  locale === 'en' ? 'Fauna Archive of Southern Ukraine' : 'Архів фауни півдня України';

export function firstText(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

export function textSummary(value: unknown, fallback = '') {
  const text = firstText(value, fallback)
    .replace(/!?(?:\[[^\]]*\])\([^)]*\)/g, '$1')
    .replace(/[`*_>#~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return text.slice(0, 320);
}

function siteNodes(base: string, locale: Locale): JsonLd[] {
  const name = archiveName(locale);
  return [
    {
      '@type': 'WebSite',
      '@id': `${base}/#website`,
      url: `${base}/`,
      name,
      inLanguage: locale,
    },
    {
      '@type': 'Organization',
      '@id': `${base}/#organization`,
      name,
      url: `${base}/`,
    },
  ];
}

export function pageJsonLd({
  base,
  url,
  name,
  description,
  locale,
  type = 'WebPage',
  breadcrumbs,
}: {
  base: string;
  url: string;
  name: string;
  description: string;
  locale: Locale;
  type?: 'WebPage' | 'CollectionPage';
  breadcrumbs?: Breadcrumb[];
}) {
  const nodes: JsonLd[] = [
    ...siteNodes(base, locale),
    {
      '@type': type,
      '@id': `${url}#webpage`,
      url,
      name,
      description,
      inLanguage: locale,
      isPartOf: { '@id': `${base}/#website` },
    },
  ];
  if (breadcrumbs?.length) {
    nodes.push({
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url,
      })),
    });
  }
  return { '@context': 'https://schema.org', '@graph': nodes };
}

export function homeJsonLd({
  base,
  url,
  name,
  description,
  locale,
}: {
  base: string;
  url: string;
  name: string;
  description: string;
  locale: Locale;
}) {
  const graph = pageJsonLd({ base, url, name, description, locale })['@graph'] as JsonLd[];
  return { '@context': 'https://schema.org', '@graph': graph };
}

export function articleJsonLd({
  base,
  url,
  headline,
  description,
  locale,
  datePublished,
  dateModified,
  image,
  breadcrumbs,
}: {
  base: string;
  url: string;
  headline: string;
  description: string;
  locale: Locale;
  datePublished: string;
  dateModified: string;
  image?: string;
  breadcrumbs: Breadcrumb[];
}) {
  const graph = pageJsonLd({
    base,
    url,
    name: headline,
    description,
    locale,
    breadcrumbs,
  })['@graph'] as JsonLd[];
  graph.push({
    '@type': 'BlogPosting',
    mainEntityOfPage: { '@id': `${url}#webpage` },
    headline,
    description,
    inLanguage: locale,
    datePublished,
    dateModified,
    ...(image ? { image } : {}),
    author: { '@id': `${base}/#organization` },
    publisher: { '@id': `${base}/#organization` },
  });
  return { '@context': 'https://schema.org', '@graph': graph };
}

export function collectionJsonLd({
  base,
  url,
  name,
  description,
  locale,
  breadcrumbs,
  items,
}: {
  base: string;
  url: string;
  name: string;
  description: string;
  locale: Locale;
  breadcrumbs: Breadcrumb[];
  items: Array<{ name: string; url: string }>;
}) {
  const graph = pageJsonLd({
    base,
    url,
    name,
    description,
    locale,
    type: 'CollectionPage',
    breadcrumbs,
  })['@graph'] as JsonLd[];
  graph.push({
    '@type': 'ItemList',
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: item.url,
    })),
  });
  return { '@context': 'https://schema.org', '@graph': graph };
}
