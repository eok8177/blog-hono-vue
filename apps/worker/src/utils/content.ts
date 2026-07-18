import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
export function renderMarkdown(markdown: string): string {
  return sanitizeHtml(marked.parse(markdown, { async: false }) as string, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2']),
    allowedAttributes: {
      a: ['href', 'title', 'rel'],
      img: ['src', 'alt', 'width', 'height', 'loading'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: { a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }) },
  });
}
export const now = () => new Date().toISOString();
