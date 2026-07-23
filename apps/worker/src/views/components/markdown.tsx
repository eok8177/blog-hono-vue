import { raw } from 'hono/html';

export const Markdown = ({ html }: { html: string }) => <div class="markdown">{raw(html)}</div>;
