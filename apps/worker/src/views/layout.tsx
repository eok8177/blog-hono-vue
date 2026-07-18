import type { FC } from 'hono/jsx';
import { raw } from 'hono/html';
export const Layout: FC<{
  title: string;
  lang: 'uk' | 'en';
  description?: string;
  children: unknown;
}> = ({ title, lang, description, children }) => (
  <html lang={lang}>
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="description" content={description ?? ''} />
      <link rel="canonical" href="" />
      <title>{title}</title>
      <style>{`body{margin:0;font:17px/1.6 system-ui,sans-serif;color:#213128;background:#f8f7f1}a{color:#285c4d}.wrap{max-width:1080px;margin:auto;padding:1.25rem}header{background:#173b32;color:#fff}header a{color:#fff;margin-right:1rem}.card{background:#fff;border-radius:12px;padding:1.5rem;margin:1rem 0}main{min-height:70vh}article img{max-width:100%;height:auto}a:focus{outline:3px solid #d8a72a;outline-offset:3px}`}</style>
    </head>
    <body>
      <a class="wrap" href="#main">
        Перейти до вмісту
      </a>
      <header>
        <nav class="wrap" aria-label="Основна навігація">
          <a href="/">Архів фауни</a>
          <a href="/category/doslidzhennia">Дослідження</a>
          <a href="/search">Пошук</a>
          <a href={lang === 'uk' ? '/en/' : '/'}>{lang === 'uk' ? 'English' : 'Українська'}</a>
        </nav>
      </header>
      <main id="main" class="wrap">
        {children}
      </main>
      <footer class="wrap">Електронний архів · тестові матеріали</footer>
    </body>
  </html>
);
export const Markdown = ({ html }: { html: string }) => <div class="markdown">{raw(html)}</div>;
