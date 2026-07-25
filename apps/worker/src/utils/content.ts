import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

export function renderMarkdown(markdown: string): string {
  return sanitizeHtml(marked.parse(markdown, { async: false }) as string, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2']),
    allowedAttributes: {
      a: ['href', 'title', 'rel'],
      img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
      // Milkdown Crepe image-block stores aspect ratio in alt and
      // description in title. Replace numeric alt with the real caption.
      img: (tagName, attribs) => {
        if (attribs.title && /^\d+\.?\d*$/.test(attribs.alt ?? '')) {
          attribs.alt = attribs.title;
        }
        delete attribs.title;
        return { tagName, attribs };
      },
    },
  });
}
export const now = () => new Date().toISOString();
