# Технічне завдання для AI coding agent

> Створення двомовного вебсайту-архіву про фауну півдня України на `Hono + Vue + Cloudflare Workers + D1 + R2`

## 1. Призначення документа

Це самодостатнє технічне завдання для AI coding agent. Агент повинен створити повноцінний production-ready застосунок, а не лише макет, набір компонентів або демонстраційний прототип.

Перед початком роботи агент повинен:

1. Прочитати цей документ повністю.
2. Перевірити наявні файли репозиторію, `README.md`, `AGENTS.md` і локальні правила.
3. Не перезаписувати наявну роботу без аналізу.
4. Перевірити актуальні офіційні документації Hono, Vue, Drizzle та Cloudflare, оскільки API, тарифи й конфігурація можуть змінюватися.
5. Використовувати актуальні стабільні сумісні версії залежностей на момент реалізації.
6. Зафіксувати версії у `pnpm-lock.yaml` і зазначити основні версії у `README.md`.
7. Скласти короткий план реалізації та виконувати його завершеними вертикальними частинами.
8. Після кожної частини запускати релевантні перевірки.

## 2. Роль AI-агента

Агент виконує роль senior full-stack engineer, solution architect, UI/UX engineer, QA engineer і DevOps engineer для Cloudflare.

Агент відповідає за:

- архітектуру та структуру репозиторію;
- модель даних і міграції;
- публічну SSR-частину сайту;
- адміністративну панель на Vue;
- API для адміністративної панелі;
- автентифікацію й авторизацію;
- роботу із зображеннями та файлами;
- локалізацію;
- пошук;
- SEO;
- доступність;
- безпеку;
- кешування;
- резервне копіювання;
- автоматизовані тести;
- CI/CD;
- документацію локального запуску й production deployment.

Не обмежуватися описом: потрібно створити фактично працездатний код.

## 3. Мета проєкту

Потрібно створити електронний архів матеріалів дослідника, який багато років вивчає фауну півдня України.

Сайт повинен:

- зберігати та публікувати статті, сторінки, категорії, фотографії й посилання на джерела;
- дозволяти досліднику самостійно додавати, редагувати, перекладати й публікувати матеріали;
- мати українську та англійську публічні версії;
- бути доступним для науковців, студентів, викладачів і широкої аудиторії;
- добре індексуватися пошуковими системами;
- коректно працювати без клієнтського JavaScript у публічній частині;
- працювати без окремого VPS або постійного Node.js-сервера;
- за звичайного навантаження залишатися в безкоштовних лімітах Cloudflare;
- мати мінімальну обов'язкову річну вартість — переважно лише вартість домену.

## 4. Пріоритети

Якщо між вимогами виникає конфлікт, використовувати такий порядок пріоритетів:

1. Цілісність і можливість відновлення матеріалів.
2. Безпека адміністративного доступу та персональних даних.
3. Доступність публічного контенту без JavaScript і технічне SEO.
4. Мінімальна річна вартість.
5. Простота роботи в адміністративній панелі.
6. Швидкість і доступність публічного сайту.
7. Візуальні ефекти та необов'язкові покращення.

## 5. Обов'язковий технологічний стек

### 5.1. Серверна та публічна частина

- `Hono` — маршрутизація, SSR, API та middleware.
- `Hono JSX` — серверний рендеринг публічних сторінок.
- `TypeScript` у strict-режимі.
- `Cloudflare Workers` — виконання серверної логіки.
- `Cloudflare Vite plugin` — рекомендована офіційна інтеграція збірки Worker і статичних assets, якщо вона стабільна та сумісна на момент реалізації.
- `Cloudflare D1` — структуровані дані.
- `Cloudflare R2` — зображення, файли й резервні копії.
- `Cloudflare Access` — зовнішній захист адміністративних маршрутів.
- `Cloudflare Turnstile` — захист публічної контактної форми, якщо форму ввімкнено.

Публічний сайт не повинен бути Vue SPA. Основний контент має повертатися як готовий SSR HTML.

### 5.2. Адміністративна панель

- `Vue 3`.
- `Vite`.
- Composition API.
- компоненти у форматі `<script setup lang="ts">`.
- `Vue Router` із history base `/admin/`.
- `Pinia` лише для справді глобального клієнтського стану.
- `@tanstack/vue-query` для server state, кешу API, повторних запитів і мутацій або обґрунтований легший аналог.
- спільні TypeScript DTO та validation schemas із сервером.

Адміністративна панель є окремою SPA, але розміщується в тому самому Cloudflare Worker deployment і на тому самому домені.

### 5.3. Інструменти розробки

- `pnpm` workspaces.
- `Vitest`.
- `@cloudflare/vitest-pool-workers` або актуальний офіційний еквівалент для Worker integration tests.
- `Playwright` для E2E.
- `ESLint`.
- `Prettier`.
- `Wrangler`.

### 5.4. Валідація

Використовувати `Zod` або іншу актуальну schema-validation бібліотеку, сумісну з Hono, Vue і Workers.

Валідація виконується:

- у браузері для зручності користувача;
- повторно на сервері як остаточна перевірка;
- під час читання змінних середовища;
- на межі між моделями D1 і DTO API.

Клієнтська валідація не вважається захистом.

### 5.5. Заборонені заміни

Без прямого погодження не замінювати:

- Hono на Next.js, Nuxt, Laravel або інший серверний framework;
- Vue admin на іншу SPA-технологію;
- Workers на VPS або постійний Node.js-сервер;
- D1 на зовнішню платну базу;
- R2 на локальну файлову систему;
- Access на самописне зберігання паролів;
- Cloudflare на іншу hosting-платформу.

## 6. Drizzle ORM і робота з D1

У проєкті слід використовувати `Drizzle ORM` із Cloudflare D1 driver.

Drizzle потрібен для:

- опису схеми в TypeScript;
- типобезпечних CRUD-запитів;
- зв'язків між таблицями;
- повторного використання типів;
- генерації SQL-міграцій через Drizzle Kit.

Водночас Drizzle не повинен приховувати специфічні можливості SQLite/D1. Для `FTS5`, тригерів, спеціальних індексів, `PRAGMA` та складних оптимізованих запитів дозволено й рекомендовано використовувати перевірені raw SQL migrations і `sql` escape hatch.

Обов'язкові правила:

- усі значення в запитах параметризуються;
- схеми та міграції зберігаються в Git;
- SQL, згенерований Drizzle Kit, переглядається перед застосуванням;
- міграції тестуються на порожній локальній D1;
- production-міграції застосовуються через Wrangler/Cloudflare migration workflow;
- не використовувати `drizzle-kit push` безпосередньо для production;
- production-схему не змінювати вручну через Dashboard;
- для D1 налаштувати коректний шлях або `migrations_pattern`, якщо міграції мають вкладену структуру;
- repository/service layer не повинен залежати від HTTP-контексту Hono;
- транзакційні групи операцій виконувати через підтримуваний D1 `batch()` або інший офіційний атомарний механізм;
- raw SQL має бути ізольований, задокументований і покритий тестами.

## 7. Вартість та інфраструктурні обмеження

Рішення проєктується насамперед для безкоштовних тарифів Cloudflare Workers, D1, R2, Access і Turnstile.

Перед production deployment агент повинен перевірити актуальні офіційні тарифи та ліміти й додати до документації таблицю з:

- лімітом Workers requests;
- лімітами D1 rows read, rows written і storage;
- лімітами R2 storage та операцій;
- правилами Cloudflare Access і Turnstile;
- прогнозом використання для малого інформаційного сайту;
- умовами, за яких може знадобитися платний тариф.

Вимоги до вартості:

- окремий VPS не потрібен;
- не підключати платні UI-компоненти;
- не підключати платну базу, пошту, пошук або обробку зображень без погодження;
- не використовувати Cloudflare Images paid transformations у MVP;
- передбачувана обов'язкова щорічна витрата — домен;
- перевищення free-лімітів не повинно непомітно створювати витрати: додати usage monitoring і, де доступно, spending notifications/limits.

## 8. Фізичне розміщення в Cloudflare

Production-схема:

```text
Користувач
    |
    v
Cloudflare DNS + HTTPS + CDN
    |
    +-- /admin/* --------> Cloudflare Access
    |                           |
    +-- /api/admin/* -----> Cloudflare Access
    |                           |
    v                           v
Cloudflare Worker: Hono SSR + API + static assets
    |                 |                    |
    |                 |                    +--> Vue admin JS/CSS/assets
    |                 +--> D1 binding ----------> SQLite data
    +--------------------> R2 binding ----------> media/backups
```

Фізично розміщуються такі частини:

- код Hono виконується у Cloudflare Workers;
- зібрані CSS, JS, fonts і Vue admin assets видаються через Workers Static Assets;
- D1 під'єднується до Worker через binding, наприклад `DB`;
- R2 під'єднується через binding, наприклад `MEDIA`;
- домен спрямовується на Worker через Cloudflare route/custom domain;
- Access перевіряє адміністратора на edge до входу в admin, а Worker додатково перевіряє Access JWT;
- secrets зберігаються у Cloudflare secrets, а не в репозиторії;
- окремий Linux-сервер, Nginx, PHP-FPM, Docker host або процес Node.js не потрібні.

Preview, staging і production повинні мати окремі bindings або окремі ресурси, щоб тестові дані не потрапляли в production.

## 9. Структура репозиторію

Рекомендована структура:

```text
.
├── apps/
│   ├── worker/                 # Hono SSR, public routes, API, middleware
│   │   ├── src/
│   │   │   ├── db/
│   │   │   ├── middleware/
│   │   │   ├── repositories/
│   │   │   ├── routes/
│   │   │   │   ├── public/
│   │   │   │   └── api/
│   │   │   ├── services/
│   │   │   ├── views/
│   │   │   └── index.tsx
│   │   └── test/
│   └── admin/                  # Vue 3 SPA
│       ├── src/
│       │   ├── api/
│       │   ├── components/
│       │   ├── composables/
│       │   ├── layouts/
│       │   ├── router/
│       │   ├── stores/
│       │   └── views/
│       └── test/
├── packages/
│   ├── shared/                 # DTO, Zod schemas, constants, utilities
│   └── design/                 # design tokens, Tailwind theme, shared CSS
├── migrations/
├── scripts/
├── docs/
├── wrangler.jsonc
├── pnpm-workspace.yaml
└── package.json
```

Допускається інша структура, якщо вона простіша й документовано забезпечує ті самі межі відповідальності.

## 10. Мови та локалізація

### 10.1. Загальні правила

- Українська — основна мова без URL-префікса.
- Англійська — з префіксом `/en/`.
- Код української мови — `uk`, а не `ua`.
- Українські сторінки мають `<html lang="uk">`.
- Англійські сторінки мають `<html lang="en">`.
- Адміністративна панель у MVP — лише українською.
- У базі час зберігається в UTC.
- Дати відображаються відповідно до локалі сторінки.
- Латинські наукові назви в контенті можна оформлювати курсивом через Markdown.

### 10.2. Правила перекладів

- Українські поля є основними та обов'язковими для публікації.
- Англійські поля можуть бути порожніми.
- Англійський URL повертає `404`, якщо англійська версія конкретного матеріалу не опублікована.
- Не робити автоматичний fallback з англійської сторінки на український текст: це створює помилкову мовну розмітку й дублікати.
- Для опублікованої пари сторінок додавати взаємні `hreflang="uk"`, `hreflang="en"` і за потреби `x-default`.
- `canonical` кожної мовної сторінки вказує на неї саму.
- Системні UI-тексти зберігати в централізованих словниках, а не хаотично в JSX-компонентах.

## 11. Публічні маршрути

### 11.1. Обов'язкові URL

```text
/                           home.uk
/category/{slug}            category.uk
/post/{slug}                post.uk
/{slug}                     page.uk

/en/                        home.en
/en/category/{slug}         category.en
/en/post/{slug}             post.en
/en/{slug}                  page.en

/search                     search.uk
/en/search                  search.en
/sitemap.xml                sitemap або sitemap index
/robots.txt                 robots
```

У Hono параметр записується як `:slug`, наприклад `app.get('/post/:slug', handler)`. Позначення `{slug}` вище описує публічний URL, а не синтаксис Hono.

### 11.2. Порядок реєстрації маршрутів

Універсальні сторінкові маршрути `/:slug` і `/en/:slug` обов'язково реєструвати після всіх конкретних публічних, системних, admin та API routes. Інакше вони перехоплять `/admin`, `/api`, `/search` та інші адреси.

Додаткові правила:

- `/en` виконує постійний redirect на `/en/`;
- trailing slash policy має бути єдиною та задокументованою;
- page slug не може дорівнювати зарезервованим сегментам;
- зарезервувати щонайменше `admin`, `api`, `en`, `category`, `post`, `search`, `assets`, `media`, `robots.txt`, `sitemap.xml`;
- невідомий або неопублікований slug повертає справжній HTTP `404`;
- змінений slug створює `301` redirect зі старого URL на новий;
- redirect loops заборонені й покриваються тестами.

## 12. Публічні сторінки

### 12.1. Головна сторінка

Повинна підтримувати керовані з admin блоки:

- назва та короткий опис проєкту;
- hero image;
- останні або вибрані публікації;
- основні категорії;
- блок про автора/дослідника;
- посилання на важливі статичні сторінки.

### 12.2. Сторінка категорії

- назва й опис категорії;
- breadcrumb;
- дочірні категорії, якщо вони є;
- список лише опублікованих постів;
- пагінація через URL;
- коректні canonical URL для сторінок пагінації;
- empty state;
- локалізовані SEO metadata.

### 12.3. Сторінка поста

- заголовок;
- excerpt/короткий вступ;
- обкладинка;
- Markdown-контент;
- дата першої публікації й дата оновлення;
- автор, якщо він публічно вказується;
- категорії;
- галерея з підписами та credits;
- джерела й зовнішні посилання як частина Markdown або структурованого блока;
- breadcrumb;
- пов'язані публікації за наявності;
- Open Graph і JSON-LD `Article`.

### 12.4. Статична сторінка

Підходить для сторінок «Про проєкт», «Про автора», «Контакти», «Політика конфіденційності» тощо.

Поля та можливості:

- title;
- Markdown body;
- template/type;
- featured image;
- menu visibility і menu order;
- локалізовані SEO metadata;
- за потреби контактна форма на визначеній сторінці.

### 12.5. Навігація

- semantic `<nav>`;
- desktop і mobile navigation;
- keyboard-accessible menu;
- видимий focus;
- активний пункт;
- language switcher веде на переклад поточної сутності, якщо він існує;
- якщо перекладу немає, language switcher веде на головну відповідної мови або показує недоступний стан — обрану поведінку застосовувати послідовно.

## 13. Адміністративні маршрути та API

### 13.1. Vue SPA routes

```text
/admin/                       dashboard
/admin/posts                  список постів
/admin/posts/new              створення поста
/admin/posts/:id              редагування поста
/admin/categories             категорії
/admin/categories/new         створення категорії
/admin/categories/:id         редагування категорії
/admin/pages                  сторінки
/admin/pages/new              створення сторінки
/admin/pages/:id              редагування сторінки
/admin/media                  медіатека
/admin/users                  редактори, лише admin
/admin/settings               налаштування
/admin/redirects              redirects
/admin/audit-log              журнал дій, лише admin
```

`createWebHistory('/admin/')` є обов'язковим. Worker повинен повертати admin `index.html` для невідомих GET-запитів усередині `/admin/*`, щоб пряме відкриття вкладеного SPA route не давало `404`.

`/admin` повинен виконувати redirect на `/admin/`. Обидві адреси мають бути охоплені Cloudflare Access policy.

API та assets потрібно зіставляти раніше за SPA fallback.

### 13.2. Admin API

Базовий префікс: `/api/admin`.

```text
GET    /api/admin/session
GET    /api/admin/dashboard

GET    /api/admin/posts
POST   /api/admin/posts
GET    /api/admin/posts/:id
PUT    /api/admin/posts/:id
DELETE /api/admin/posts/:id
POST   /api/admin/posts/:id/publish
POST   /api/admin/posts/:id/archive
GET    /api/admin/posts/:id/preview

GET    /api/admin/categories
POST   /api/admin/categories
GET    /api/admin/categories/:id
PUT    /api/admin/categories/:id
DELETE /api/admin/categories/:id

GET    /api/admin/pages
POST   /api/admin/pages
GET    /api/admin/pages/:id
PUT    /api/admin/pages/:id
DELETE /api/admin/pages/:id
POST   /api/admin/pages/:id/publish
POST   /api/admin/pages/:id/archive
GET    /api/admin/pages/:id/preview

GET    /api/admin/media
POST   /api/admin/media
GET    /api/admin/media/:id
PUT    /api/admin/media/:id
DELETE /api/admin/media/:id

GET    /api/admin/users
POST   /api/admin/users
PUT    /api/admin/users/:id
DELETE /api/admin/users/:id

GET    /api/admin/settings
PUT    /api/admin/settings

GET    /api/admin/redirects
DELETE /api/admin/redirects/:id
GET    /api/admin/audit-log
```

Можна змінити форму endpoints, але не їхню функціональність. Hono не має Laravel-подібного `resource()` і в цьому проєкті не використовуються «Hono Actions» — мутації реалізуються як звичайні, явно захищені HTTP API routes.

### 13.3. API contract

- JSON має стабільний versionable contract.
- Успішні й помилкові відповіді використовують узгоджену структуру.
- Validation errors повертають field path і локалізоване безпечне повідомлення.
- Не повертати stack traces, SQL або secrets.
- List endpoints мають server-side pagination, filtering, sorting і контрольований search.
- Максимальний `pageSize` обмежити на сервері.
- Sort fields дозволяти лише через allowlist.
- Для конкурентного редагування використати `updated_at`/version і повертати `409 Conflict`, якщо користувач перезаписує новішу версію.
- Mutating endpoints мають бути idempotent, де це практично, або захищені від випадкового подвійного submit.

## 14. Вимоги до Vue admin

### 14.1. Загальні UX-вимоги

Адмінка має бути зручною для людини без технічної підготовки.

Обов'язково реалізувати:

- responsive layout для desktop і tablet;
- sidebar navigation і компактну mobile navigation;
- page title та breadcrumbs;
- loading, empty, error і success states;
- toast notifications;
- зрозумілі підтвердження небезпечних дій;
- skeleton або progress state для довгих операцій;
- повтор запиту після тимчасової помилки;
- єдину сторінку `403`, `404` і стан втрати сесії;
- кнопку виходу/переходу до Access logout;
- посилання «Переглянути на сайті» для опублікованого матеріалу;
- preview draft у новій вкладці через захищений endpoint.

### 14.2. Таблиці та списки

Списки постів, сторінок, медіа й користувачів мають підтримувати:

- server-side pagination;
- search із debounce;
- filters за статусом, мовою, категорією та датою, де доречно;
- sorting;
- збереження filter state в URL query;
- індикатор активних фільтрів;
- empty state з кнопкою створення;
- row actions через доступне меню;
- вибір кількох елементів лише там, де реалізовані безпечні bulk actions.

Не завантажувати всю таблицю D1 у браузер.

### 14.3. Форми редагування

Форми поста, сторінки й категорії повинні мати:

- окремі вкладки або зрозумілі секції «Українська», «English», «SEO», «Медіа», «Публікація»;
- field-level validation;
- summary помилок із focus на перше невалідне поле;
- slug generator із можливістю ручного редагування;
- перевірку унікальності та зарезервованих slug;
- Markdown editor із toolbar і preview;
- однаковий Markdown renderer у preview та production;
- лічильник рекомендованої довжини SEO title/description без штучної заборони збереження;
- вибір обкладинки з медіатеки;
- керування категоріями;
- статус `draft`, `published`, `archived`;
- окрему дію публікації з підтвердженням;
- індикатор незбережених змін;
- navigation guard перед закриттям сторінки з незбереженими змінами;
- блокування повторного submit;
- повідомлення про `409 Conflict` із можливістю перечитати нову версію.

Автозбереження не є обов'язковим для MVP. Якщо воно реалізоване, не повинно випадково публікувати draft або створювати конфлікти.

### 14.4. Керування перекладом

- Англійські поля необов'язкові для українського draft/publish.
- Admin чітко показує, чи готова й опублікована англійська версія.
- Неможливо позначити англійську версію опублікованою без title і body/description, потрібних для конкретного типу сутності.
- Language status видно у списку матеріалів.
- Відсутній переклад не заповнювати українським текстом автоматично.

### 14.5. Dashboard

Показати:

- кількість draft/published/archived posts;
- кількість сторінок і категорій;
- кількість медіафайлів і приблизний обсяг R2 за доступними metadata;
- останні змінені матеріали;
- останні audit events, якщо користувач має право;
- попередження про матеріали без SEO description, alt або завершеного перекладу;
- посилання на основні дії.

Не виконувати дорогі повні сканування D1 при кожному відкритті dashboard.

### 14.6. Керування користувачами

Модуль доступний лише ролі `admin`.

Можливості:

- додати email, який уже дозволений або буде дозволений у Cloudflare Access;
- змінити ім'я, роль і active status;
- заборонити видалення/деактивацію останнього активного admin;
- показати час останньої адміністративної активності, якщо він зберігається;
- не зберігати паролі в D1;
- не намагатися керувати Cloudflare Access policy через UI у MVP.

### 14.7. Клієнтський стан і API

- Server state зберігати в query cache, а не дублювати в Pinia.
- Pinia використовувати для session/UI state лише за потреби.
- API client централізувати.
- Усі fetch-запити використовують same-origin relative URLs.
- CORS для admin не потрібен і не повинен бути глобально відкритим.
- Обробляти `401/403`, `409`, `422`, `429` і `5xx` узгоджено.
- Route guards покращують UX, але не замінюють server-side authorization.
- Не зберігати Access JWT у `localStorage` або `sessionStorage`.

### 14.8. Безпека та кеш admin

- `/admin/*` і `/api/admin/*` захищені Cloudflare Access.
- Worker додатково перевіряє Access JWT.
- Admin HTML і API responses мають `Cache-Control: no-store`.
- Не включати персональні дані чи токени в client bundle.
- Не логувати response bodies, що можуть містити приватні дані.
- Vue admin bundle не завантажується на публічних сторінках.

### 14.9. Доступність admin

- орієнтир WCAG 2.2 AA;
- повна keyboard navigation;
- видимий focus;
- labels та descriptions для полів;
- доступні dialog, menu, tabs і combobox;
- focus trap і повернення focus для modal;
- помилки не позначаються лише кольором;
- достатній contrast;
- `aria-live` для важливих async-повідомлень;
- axe tests для основних admin flows.

## 15. Підхід до CSS і дизайну

Використовувати `Tailwind CSS v4` разом із невеликим шаром кастомного CSS.

Tailwind застосовується для:

- layout;
- spacing;
- responsive breakpoints;
- типових станів компонентів;
- admin UI;
- швидкої підтримки єдиної design system.

Кастомний CSS застосовується для:

- design tokens і глобальних base styles;
- типографіки довгих Markdown-статей;
- print styles;
- складних селекторів;
- стилів, які незручно або неправильно виражати utilities.

Правила:

- спільні кольори, шрифти, spacing і radius оформити як theme tokens через `@theme` або актуальний механізм Tailwind;
- public і admin мають окремі CSS entry points, щоб admin styles не збільшували public bundle;
- у monorepo явно налаштувати `@source` для shared packages;
- не генерувати назви класів динамічно на кшталт `bg-${color}`, якщо scanner не може їх визначити;
- не зловживати `@apply`;
- не додавати важку UI-бібліотеку лише заради базових компонентів;
- компоненти повинні використовувати узгоджені variants, а не випадкові набори utilities;
- тема має відповідати природничому/архівному характеру сайту, але не імітувати конкретний чужий дизайн;
- dark mode не є обов'язковим для MVP.

## 16. Модель даних D1

### 16.1. Загальні правила

D1 є SQLite-сумісною базою, тому не використовувати MySQL-специфічні типи `mediumtext`, `tinyint` або поведінку `unsigned`.

Загальні домовленості:

- primary keys — UUID/ULID як `TEXT`, якщо немає доведеної потреби в integer IDs;
- timestamps — UTC ISO 8601 `TEXT` або інша однаково застосована D1-сумісна домовленість;
- boolean — SQLite integer з Drizzle boolean mapping;
- усі foreign keys та основні filter/sort fields індексувати;
- обов'язкові `created_at`, `updated_at` для редагованих сутностей;
- soft archive використовувати замість hard delete за замовчуванням;
- назви перекладних колонок закінчуються на `_uk` і `_en`;
- `seo_keywords` не потрібне: сучасні пошукові системи не використовують meta keywords як корисний ranking signal;
- схема Drizzle і SQL migrations є джерелом істини.

### 16.2. `users`

```text
id
email                 unique, normalized
name
role                  admin | editor
is_active
last_seen_at          nullable
created_at
updated_at
```

Паролі не зберігаються. Ідентичність надходить із Cloudflare Access.

### 16.3. `categories`

```text
id
parent_id             nullable FK -> categories.id
slug                  unique
title_uk
title_en              nullable
description_md_uk     nullable
description_md_en     nullable
seo_title_uk          nullable
seo_title_en          nullable
seo_description_uk    nullable
seo_description_en    nullable
status                draft | published | archived
is_en_published
show_in_menu
menu_order
created_at
updated_at
```

Заборонити category hierarchy cycles. Видалення категорії з дочірніми категоріями або постами потребує явного рішення: reassign або archive.

### 16.4. `posts`

```text
id
slug                  unique
title_uk
title_en              nullable
excerpt_uk            nullable
excerpt_en            nullable
body_md_uk
body_md_en            nullable
cover_media_id        nullable FK -> media.id
status                draft | published | archived
is_en_published
published_at          nullable
seo_title_uk          nullable
seo_title_en          nullable
seo_description_uk    nullable
seo_description_en    nullable
created_by            FK -> users.id
updated_by            FK -> users.id
created_at
updated_at
```

### 16.5. `post_categories`

```text
post_id               FK -> posts.id
category_id           FK -> categories.id
created_at
PRIMARY KEY (post_id, category_id)
```

### 16.6. `pages`

```text
id
slug                  unique
template              default | about | contact
title_uk
title_en              nullable
body_md_uk
body_md_en            nullable
cover_media_id        nullable FK -> media.id
status                draft | published | archived
is_en_published
published_at          nullable
show_in_menu
menu_order
seo_title_uk          nullable
seo_title_en          nullable
seo_description_uk    nullable
seo_description_en    nullable
created_by            FK -> users.id
updated_by            FK -> users.id
created_at
updated_at
```

Slug сторінки перевіряється не лише на uniqueness, а й на список зарезервованих системних сегментів.

### 16.7. `media`

```text
id
original_key          nullable, private
variant_480_key       nullable
variant_960_key       nullable
variant_1600_key      nullable
mime_type
width
height
size_bytes
sha256                nullable
alt_uk
alt_en                nullable
caption_uk            nullable
caption_en            nullable
credit                 nullable
license                nullable
source_url             nullable
status                processing | ready | failed | archived
created_by            FK -> users.id
created_at
updated_at
```

### 16.8. Media relations

Використовувати окремі таблиці для цілісності foreign keys:

```text
post_media(post_id, media_id, role, position)
page_media(page_id, media_id, role, position)
category_media(category_id, media_id, role, position)
```

Не використовувати неперевірений polymorphic `owner_type/owner_id`, якщо можна зберегти referential integrity явними таблицями.

### 16.9. `settings`

```text
key                   PRIMARY KEY
value_json
updated_by            FK -> users.id
updated_at
```

Validation schema визначається для кожного дозволеного ключа. Не дозволяти довільні settings keys із браузера.

### 16.10. `redirects`

```text
id
old_path              unique
new_path
status_code           301 або 308
entity_type           post | page | category
entity_id
created_at
```

### 16.11. `audit_logs`

```text
id
actor_user_id         nullable FK -> users.id
action
entity_type
entity_id             nullable
metadata_json         sanitized
request_id            nullable
created_at
```

Audit log не містить Access JWT, secrets, повного Markdown body або інших зайвих даних.

### 16.12. `contact_messages`

Створювати лише якщо контактна форма входить у реалізацію.

```text
id
name
email
subject               nullable
message
status                new | read | archived
created_at
```

Встановити retention policy та не публікувати ці записи.

### 16.13. Обмеження й індекси

Передбачити:

- unique indexes для email, slug та old_path;
- indexes для status, published_at, updated_at, parent_id;
- indexes для foreign keys у pivot tables;
- CHECK constraints для status, role й status_code, де Drizzle/D1 це коректно підтримують;
- DB-level foreign keys;
- application-level перевірки зарезервованих slug, hierarchy cycles і publishing rules;
- тестове вимірювання `rows_read` для головних запитів.

## 17. Повнотекстовий пошук

Використовувати D1 `FTS5`.

Рекомендована virtual table містить:

```text
entity_type           UNINDEXED
entity_id             UNINDEXED
locale                UNINDEXED
title
summary
body
```

Вимоги:

- індексувати лише published content і лише опубліковані мови;
- підтримувати українські та англійські запити;
- коректно працювати з Unicode;
- дозволити безпечний prefix search для практичних запитів;
- мати обмеження мінімальної та максимальної довжини query;
- не передавати raw user query безпосередньо у FTS expression;
- мати pagination і верхній ліміт результатів;
- не робити full scan основних таблиць на кожен запит;
- синхронізувати індекс через SQL triggers або контрольований application layer;
- однаково оновлювати індекс під час publish, edit, archive й language unpublish;
- покрити синхронізацію integration tests;
- сторінки пошуку з параметрами позначати `noindex,follow` і задавати контрольований canonical.

Публічний endpoint:

```text
GET /api/search?q=...&locale=uk&page=1
```

Server визначає й allowlist-ить `locale`; довільні значення не приймаються.

## 18. Markdown і workflow контенту

### 18.1. Формат тексту

Довгі тексти зберігати як Markdown.

Вимоги:

- raw HTML вимкнений або проходить сувору sanitization;
- заборонені `script`, `iframe`, inline event handlers і небезпечні URL schemes;
- preview використовує той самий server renderer і sanitization pipeline, що й production;
- підтримати headings, lists, links, emphasis, images, tables, blockquotes і footnotes за потреби;
- зовнішнім посиланням додавати безпечні attributes;
- зображення в Markdown мають посилатися лише на дозволені media assets;
- broken internal links виявляються окремою перевіркою або звітом.

### 18.2. Workflow

```text
draft -> published -> archived
```

Правила:

- draft і archived не доступні публічно та не індексуються;
- `published_at` встановлюється під час першої публікації;
- `updated_at` змінюється під час кожного збереження;
- archive прибирає URL із sitemap, search і списків;
- зміна slug створює redirect у тій самій атомарній операції;
- publish, archive, slug change і hard delete записуються в audit log;
- перед publish server перевіряє required fields, slug, SEO defaults і пов'язані media;
- preview доступний лише через Access і не кешується.

## 19. R2 і робота із зображеннями

### 19.1. Завантаження

Через обмеження Workers не використовувати `sharp` або важку серверну конвертацію як обов'язкову частину MVP.

Рекомендований workflow:

1. Admin обирає зображення.
2. Браузер перевіряє базовий MIME, розмір і читає dimensions.
3. Браузер створює WebP variants через `createImageBitmap` і Canvas/OffscreenCanvas.
4. EXIF не переноситься у public variants.
5. UI показує progress, дозволяє cancel/retry.
6. Worker повторно перевіряє MIME, magic bytes, розмір і dimensions.
7. Variants завантажуються в R2.
8. Оригінал завантажується лише якщо відповідна setting увімкнена; оригінал завжди private.
9. Metadata записується в D1 після успішного запису потрібних objects.
10. Часткова помилка спричиняє cleanup або запис recoverable failed state.

Конфігуровані початкові ліміти:

- один оригінал до `20 MB`;
- MIME: `image/jpeg`, `image/png`, `image/webp`;
- SVG upload заборонений у MVP;
- variants приблизно `480`, `960`, `1600px`;
- quality задається централізовано;
- кількість одночасних upload обмежується.

Не довіряти розширенню файлу й browser-provided MIME.

### 19.2. Видача

- public variants видавати через custom media path/domain або контрольований Worker route;
- використовувати content-hashed immutable keys;
- встановлювати довгий `Cache-Control` для immutable variants;
- private originals не мають public `r2.dev` URL;
- доступ до originals — лише admin після JWT і role check;
- встановлювати коректні `Content-Type`, `Content-Length`, `ETag` і `Content-Disposition`;
- підтримувати `srcset`, `sizes`, width і height;
- hero image не lazy-load, нижні зображення lazy-load.

### 19.3. Медіатека

Vue admin має підтримувати:

- grid/list view;
- search за alt, caption і filename metadata;
- filter за status/type/date;
- upload queue;
- preview variants;
- редагування alt, caption, credit і license;
- вибір media у формах поста/сторінки/категорії;
- попередження перед archive media, яке використовується;
- відображення пов'язаних сутностей;
- retry або cleanup failed upload.

### 19.4. Видалення

За замовчуванням використовувати archive.

Hard delete:

- доступний лише admin;
- потребує явного confirmation;
- перевіряє зв'язки;
- видаляє всі R2 objects;
- видаляє або оновлює D1 metadata атомарно настільки, наскільки дозволяють D1/R2;
- записує audit event;
- не залишає orphaned objects;
- має integration test і repair/cleanup script.

## 20. Автентифікація та авторизація

### 20.1. Cloudflare Access

Захистити:

```text
/admin
/admin/*
/api/admin
/api/admin/*
```

Можливі identity providers:

- Cloudflare account identity;
- email OTP з allowlist.

Для Cloudflare account увімкнути 2FA. Access policy налаштовується вручну за deployment guide.

### 20.2. Перевірка JWT у Worker

Worker не покладається лише на Dashboard configuration.

Middleware повинен:

- отримати `Cf-Access-Jwt-Assertion`;
- перевірити підпис через JWK Cloudflare Access;
- перевірити `aud`, `iss`, `exp`;
- отримати verified email;
- нормалізувати email;
- знайти active user у D1;
- застосувати role-based authorization;
- кешувати JWK безпечно відповідно до офіційних рекомендацій;
- повертати безпечний `401/403` без деталей токена.

Просте декодування JWT без перевірки підпису заборонене.

### 20.3. Ролі

`admin`:

- усі CRUD-операції;
- керування користувачами;
- settings;
- redirects;
- audit log;
- hard delete;
- backup/export operations, якщо вони доступні через UI.

`editor`:

- CRUD posts, categories, pages і media;
- preview, publish та archive відповідно до обраної policy;
- без керування users;
- без security settings;
- без hard delete;
- без повного audit log, якщо він містить зайві персональні дані.

Кожна мутація перевіряється на сервері. Прихована кнопка у Vue не є авторизацією.

### 20.4. Локальна розробка

Дозволено `DEV_AUTH_BYPASS`, але:

- лише в локальному development;
- default `false`;
- production build/deploy завершується помилкою, якщо bypass активний;
- реальні email і токени не комітяться;
- поведінка покрита тестом;
- staging бажано перевіряти через реальний Access.

## 21. SEO

### 21.1. Загальні вимоги

- повний SSR HTML для public content;
- унікальні `<title>` і meta description;
- self-referencing canonical;
- `hreflang` для доступних перекладів;
- semantic headings;
- breadcrumb navigation;
- Open Graph;
- Twitter/X card без зовнішнього API;
- sitemap;
- robots;
- redirects;
- custom 404;
- noindex для admin, preview, search results і технічних сторінок;
- стабільні clean URLs.

### 21.2. Structured data

Використовувати лише доречні schema.org types:

- `WebSite`;
- `Person`;
- `Article`;
- `WebPage`;
- `BreadcrumbList`;
- `ImageObject`.

Не вигадувати рейтинги, відгуки, організації, наукові ступені або credentials.

### 21.3. Sitemap і robots

- sitemap містить лише canonical published URLs;
- українські й англійські URLs включаються лише коли відповідна мова опублікована;
- admin, draft, archived, preview, search results і private media не включаються;
- `lastmod` відповідає реальному `updated_at`;
- при великій кількості URL використовувати sitemap index;
- generation має бути пагінованим/ефективним;
- robots не використовується як захист приватних даних.

### 21.4. SEO defaults

- якщо `seo_title_*` відсутній, використати локалізований title і site title;
- якщо `seo_description_*` відсутній, використати безпечно скорочений excerpt або description;
- не генерувати meta keywords;
- OG image використовує cover variant або site default;
- усі metadata проходять escaping;
- JSON-LD не містить unpublished fields.

## 22. Кешування

### 22.1. Assets і media

Для hashed static assets і immutable R2 variants:

```text
Cache-Control: public, max-age=31536000, immutable
```

Заміна файлу створює новий key, а не змінює bytes під старим immutable URL.

### 22.2. Public HTML

- browser cache коротший за edge cache;
- дозволено `stale-while-revalidate`;
- після publish/edit/archive очищувати або інвалідувати URL сутності, категорій, головної, пов'язаних списків і sitemap;
- якщо точкове purge не налаштовано, fallback edge TTL не більше 5 хвилин;
- draft, preview, admin і responses із персональними даними не потрапляють у shared cache;
- responses із `Set-Cookie` не кешуються як public;
- cache key не повинен створювати дублікати через tracking parameters;
- query parameters, що змінюють pagination/search, не можна випадково ігнорувати.

Не використовувати experimental API як єдину критичну залежність без задокументованого fallback.

## 23. Performance

Цілі для ключових сторінок на staging за контрольованих умов:

- Lighthouse Performance mobile: `>= 90`;
- Accessibility: `>= 95`;
- Best Practices: `>= 95`;
- SEO: `>= 95`;
- LCP: ціль `< 2.5s`;
- CLS: ціль `< 0.1`;
- INP: ціль `< 200ms` після накопичення реальних даних.

Вимоги:

- мінімум public client-side JavaScript;
- Vue admin bundle не входить у public pages;
- не гідратувати статичні public components;
- pagination замість тисяч записів;
- responsive images;
- не завантажувати originals у cards;
- уникати N+1 queries;
- використовувати D1 indexes;
- вимірювати `rows_read` ключових queries;
- обмежувати response payloads;
- lazy-load неключових admin views через route-level dynamic imports;
- не включати всю editor library у initial admin chunk, якщо її можна завантажити ліниво.

## 24. Доступність публічного сайту

Орієнтир — WCAG 2.2 AA.

Обов'язково:

- semantic landmarks;
- skip link;
- логічна heading hierarchy;
- keyboard navigation;
- видимий focus;
- достатній contrast;
- коректні labels і error messages;
- alt для змістовних зображень і порожній alt для декоративних;
- меню, dialog і language switcher доступні assistive technology;
- рух/анімації враховують `prefers-reduced-motion`;
- zoom до 200% не руйнує основний контент;
- axe tests і ручний keyboard smoke test.

## 25. Безпека

### 25.1. Security headers

Налаштувати й протестувати:

- `Content-Security-Policy`;
- `Strict-Transport-Security` для production HTTPS;
- `X-Content-Type-Options: nosniff`;
- `Referrer-Policy`;
- `Permissions-Policy`;
- CSP `frame-ancestors`;
- безпечні cookie attributes, якщо cookies використовуються;
- відсутність зайвих server/version headers.

CSP не повинна містити глобальний `unsafe-eval`. Inline scripts/styles дозволені лише з nonce/hash або чітко обґрунтованою вузькою policy.

### 25.2. Загальні правила

- parameterized SQL;
- server-side validation;
- output escaping;
- Markdown sanitization;
- upload allowlist;
- same-origin admin API;
- rate limiting для contact/search/upload, де потрібно;
- Turnstile server-side verification для contact;
- secrets лише через Cloudflare secrets;
- dependency audit;
- не показувати внутрішні error details;
- не довіряти client-provided role, user ID, status або media key;
- обмежити request body size.

### 25.3. Контактна форма

Якщо реалізована:

- `POST /api/contact`;
- Turnstile;
- rate limit;
- honeypot як додатковий, не єдиний захист;
- server validation;
- generic success response, що не розкриває внутрішню обробку;
- повідомлення зберігаються в D1;
- email notification не є обов'язковим для MVP;
- privacy notice і retention policy.

## 26. Error handling і логування

### 26.1. Помилки

- справжня сторінка `404`;
- дружня `500` без stack trace;
- field validation errors;
- request/correlation ID для серверних помилок;
- retry-safe upload flow;
- єдина помилка API з machine-readable `code`;
- не показувати факт існування unpublished content неавторизованому користувачу.

### 26.2. Логи

Логувати:

- route template і method;
- status;
- duration;
- request ID;
- безпечний error code;
- actor user ID/email лише в admin audit, коли це потрібно.

Не логувати:

- Access JWT;
- secrets;
- Turnstile token/secret;
- повний request body контактної форми;
- повний Markdown body;
- cookies та authorization headers.

## 27. Конфігурація Cloudflare

`wrangler.jsonc` або актуальний рекомендований config повинен містити bindings без реальних secrets.

Орієнтовні bindings:

```text
DB                    D1Database
MEDIA                 R2Bucket
ASSETS                Fetcher, якщо потрібен Workers Static Assets binding
ENVIRONMENT           development | staging | production
SITE_URL              canonical origin
ACCESS_TEAM_DOMAIN    Access issuer/team domain
ACCESS_AUD            Access application audience
TURNSTILE_SITE_KEY    public config
```

Secret:

```text
TURNSTILE_SECRET_KEY
```

Додати typed `Bindings` interface і runtime validation доступних config values.

Мати окремі development, staging і production environments. D1/R2 IDs не хардкодити в application modules.

## 28. Тестування

### 28.1. Unit tests

Покрити щонайменше:

- slug normalization і reserved slugs;
- locale resolution;
- publish validation;
- SEO metadata fallback;
- Markdown sanitization;
- role permissions;
- pagination parser;
- FTS query builder;
- media validation;
- redirect loop detection;
- DTO mapping.

### 28.2. Worker integration tests

Використовувати реальне Worker-compatible test environment, локальну D1 і R2 test binding/emulation.

Перевірити:

- усі public routes та їхній порядок;
- `/en` redirect;
- `404` для відсутнього перекладу;
- CRUD posts/categories/pages/users/settings;
- D1 migrations і constraints;
- FTS update після publish/edit/archive;
- Access JWT middleware;
- role checks;
- upload metadata flow і cleanup;
- redirects після slug change;
- cache headers;
- sitemap excludes drafts;
- admin/API `no-store`;
- contact validation і Turnstile adapter;
- error responses не містять secrets.

### 28.3. Vue component tests

Перевірити:

- form validation;
- unsaved changes guard;
- table filters у URL;
- loading/error/empty states;
- session expiration;
- publish confirmation;
- conflict `409` UI;
- role-based visibility як UX;
- media upload queue;
- translation status.

### 28.4. E2E tests

Playwright flows:

1. Відкрити public Ukrainian/English content.
2. Увійти в test admin flow.
3. Створити draft post.
4. Додати категорію й media.
5. Заповнити український контент.
6. Переконатися, що draft не public.
7. Опублікувати й перевірити public URL/sitemap/search.
8. Додати та опублікувати English translation.
9. Змінити slug і перевірити redirect.
10. Archive post і перевірити видалення з public views.

### 28.5. Accessibility і performance tests

- axe на ключових public/admin сторінках;
- keyboard smoke test;
- Lighthouse CI або задокументований повторюваний аналог;
- перевірка public HTML без JavaScript;
- bundle size report для public і admin;
- жодних serious/critical axe violations у ключових flows.

### 28.6. Команди перевірки

Root `package.json` повинен мати щонайменше:

```text
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
pnpm verify
```

`pnpm verify` запускає всі швидкі обов'язкові перевірки; E2E можна винести окремо, якщо це обґрунтовано часом виконання.

## 29. CI/CD

CI на pull request/push:

1. `pnpm install --frozen-lockfile`.
2. lint.
3. format check.
4. typecheck.
5. unit/integration tests.
6. build.
7. migration validation на порожній D1.
8. E2E для головної гілки або staging, якщо середовище доступне.

Deployment:

- preview/staging deployment перед production;
- production deploy лише після успішного CI;
- migrations застосовувати контрольованим кроком;
- не друкувати secrets у logs;
- не змінювати DNS або production resources без дозволу;
- додати rollback/roll-forward procedure;
- smoke test після deployment.

## 30. Резервне копіювання й відновлення

### 30.1. D1

- задокументувати D1 export/import;
- використовувати Time Travel відповідно до актуального плану й retention;
- автоматизувати періодичний SQL export, якщо це можливо без платної інфраструктури;
- зберігати backup не в тому самому єдиному failure domain, коли власник налаштує зовнішню копію;
- не включати secrets у export metadata.

### 30.2. R2

- мати inventory/list script;
- мати sync/download procedure;
- зберігати hashes, якщо вони доступні;
- перевіряти відповідність D1 metadata й R2 objects;
- мати cleanup report для orphaned files.

### 30.3. Restore test

Документувати й виконати smoke test:

1. Створити порожню test D1.
2. Застосувати migrations.
3. Імпортувати export.
4. Під'єднати test R2 copy або fixture bucket.
5. Запустити Worker.
6. Перевірити ключові public/admin routes.

Backup без перевіреного відновлення не вважати завершеним.

## 31. Документація

### 31.1. `README.md`

- опис проєкту;
- архітектура;
- prerequisites;
- install;
- local D1/R2;
- migrations/seed;
- development;
- tests/build;
- deployment overview;
- environment variables;
- основні версії.

### 31.2. `docs/deployment.md`

- створення Cloudflare account/zone;
- створення D1 і R2;
- bindings;
- Access application і policies;
- Access JWT values;
- Turnstile;
- secrets;
- migrations;
- Worker deployment;
- custom domain;
- DNS/HTTPS;
- staging/production separation;
- post-deploy verification.

### 31.3. `docs/backup-and-restore.md`

- D1 export/import;
- Time Travel;
- R2 inventory/sync;
- checksum;
- restore test;
- відповідальні ручні кроки.

### 31.4. `docs/content-guide.md`

Інструкція українською для дослідника:

- вхід через Cloudflare Access;
- створення категорії;
- створення поста й сторінки;
- Markdown basics;
- додавання фотографії, alt, credit і license;
- draft/preview/publish/archive;
- англійський переклад;
- SEO fields;
- зміна slug і redirects;
- відновлення після типових помилок.

### 31.5. `docs/architecture.md`

- межі Worker/admin/shared packages;
- request flow;
- route order;
- D1 schema;
- R2 object naming;
- auth flow;
- cache strategy;
- ADR для ключових компромісів.

## 32. Seed data

Seed повинен містити:

- одного demo admin;
- одного demo editor;
- 2–3 категорії;
- 3–5 постів у різних status;
- щонайменше один пост з опублікованим англійським перекладом;
- щонайменше один пост без англійського перекладу;
- 2–3 статичні сторінки;
- settings;
- media metadata з локальними neutral placeholders;
- redirect fixture;
- FTS fixtures.

Увесь демонстраційний контент позначити як тестовий. Не видавати вигадані матеріали за реальні наукові дані.

Не використовувати copyrighted photographs. Використати прості власні SVG/raster placeholders без імітації чужих фотографій. SVG допустимий як репозиторний placeholder asset, але не як user upload.

## 33. Не входить у MVP

Без окремого запиту не реалізовувати:

- публічну реєстрацію;
- коментарі;
- форум;
- платні підписки;
- e-commerce;
- мобільний застосунок;
- складну інтерактивну карту;
- автоматичне AI-визначення виду;
- імпорт із GBIF/iNaturalist;
- realtime collaboration;
- bulk upload тисяч записів;
- окремий поштовий сервер;
- Cloudflare Images paid transformations;
- autosave, якщо воно ускладнює надійність;
- візуальний drag-and-drop page builder;
- повне керування Cloudflare Access із Vue admin;
- dark mode.

Архітектура не повинна навмисно блокувати майбутні функції, але MVP не потрібно ускладнювати заради них.

## 34. Порядок реалізації

### Фаза 0. Аналіз

- перевірити repo й локальні правила;
- перевірити офіційні docs;
- зафіксувати versions;
- створити implementation plan;
- визначити зовнішні values;
- використовувати placeholders для domain/email/Cloudflare IDs, якщо вони не надані.

### Фаза 1. Scaffold

- pnpm workspace;
- Hono Worker + Vite/Cloudflare integration;
- Vue admin + Vue Router;
- shared package;
- Tailwind theme і окремі public/admin styles;
- TypeScript strict;
- lint/format/test;
- Wrangler environments.

### Фаза 2. Data layer

- Drizzle schema;
- SQL migrations;
- repositories/services;
- Zod schemas/DTO;
- seed;
- indexes;
- FTS5;
- integration tests.

### Фаза 3. Public vertical slice

- українська home;
- category;
- post;
- page;
- SSR layout;
- responsive design;
- SEO/accessibility;
- route-order tests.

### Фаза 4. Локалізація

- English routes;
- translation publishing rules;
- dictionary UI strings;
- `canonical`/`hreflang`;
- language switcher;
- missing translation tests.

### Фаза 5. Access і Vue admin foundation

- Access JWT verification;
- users/roles;
- admin SPA fallback;
- session endpoint;
- layout/router/query client;
- API error handling;
- admin accessibility baseline.

### Фаза 6. Admin CRUD

- posts;
- categories;
- pages;
- users;
- settings;
- redirects;
- audit log;
- draft/preview/publish/archive;
- component/integration/E2E tests.

### Фаза 7. Media

- client variants;
- upload queue;
- server validation;
- R2 objects;
- metadata/media relations;
- gallery;
- private originals;
- cleanup;
- tests.

### Фаза 8. Search/contact/cache

- FTS search;
- localized results;
- contact + Turnstile, якщо ввімкнено;
- cache headers;
- invalidation/fallback TTL;
- rate limits.

### Фаза 9. Hardening

- security headers/CSP;
- error handling/logging;
- performance;
- accessibility;
- dependency audit;
- full test suite.

### Фаза 10. Operations

- backup scripts;
- restore test;
- CI/CD;
- documentation;
- deployment checklist.

### Фаза 11. Final verification

- clean install;
- migration на порожній D1;
- seed;
- `pnpm verify`;
- E2E;
- production build;
- preview deployment smoke test;
- фінальний звіт.

## 35. Правила автономної роботи агента

- Не зупинятися після scaffold.
- Не заявляти про готовність, якщо CRUD, D1 або R2 замінені моками.
- Не залишати критичні функції як `TODO`.
- За відсутності credentials реалізувати локально й створити manual setup checklist.
- Не вигадувати secrets, IDs або production domain.
- Не здійснювати платних операцій.
- Не змінювати DNS без дозволу.
- Не публікувати репозиторій і не push без дозволу.
- Не видаляти наявні user files.
- Після кожної фази запускати релевантні tests.
- Якщо test падає, виправити причину, а не вимикати test.
- Не послаблювати TypeScript, CSP або validation для проходження build.
- Не приховувати проблеми за `any`, `@ts-ignore`, порожнім `catch` або production mock.
- Якщо зовнішній API змінився, використовувати актуальний офіційний спосіб і задокументувати відхилення.
- Ставити запитання лише коли відсутня інформація справді блокує безпечне продовження.

## 36. Критерії приймання

### 36.1. Функціональність public

- [ ] Усі маршрути з розділу 11 працюють.
- [ ] Українська версія не має мовного префікса.
- [ ] `/en` коректно перенаправляє на `/en/`.
- [ ] Англійський URL без опублікованого перекладу повертає `404`.
- [ ] Home, category, post і page віддають SSR HTML.
- [ ] Draft/archived не доступні публічно.
- [ ] Search знаходить localized published content.
- [ ] Pagination працює через URL.
- [ ] Slug change створює redirect.
- [ ] Sitemap містить лише published URLs.

### 36.2. Vue admin

- [ ] Admin працює як Vue 3 SPA з base `/admin/`.
- [ ] Direct open/refresh вкладеного admin route не дає `404`.
- [ ] Vue bundle не завантажується на public pages.
- [ ] Dashboard показує корисні агреговані дані.
- [ ] CRUD posts/categories/pages працює з реальною D1.
- [ ] User management доступний лише admin.
- [ ] Draft/preview/publish/archive працюють.
- [ ] Українські та англійські поля редагуються окремо.
- [ ] Не можна опублікувати неповний English translation.
- [ ] Tables мають server-side pagination/filter/sort.
- [ ] Форми показують field-level errors.
- [ ] Unsaved changes guard працює.
- [ ] `409 Conflict` не перезаписує мовчки чужі зміни.
- [ ] Media upload показує progress/retry й записує реальні variants у R2.
- [ ] Admin і API мають `no-store`.

### 36.3. Дані

- [ ] Drizzle schema відповідає D1/SQLite.
- [ ] SQL migrations відтворюють схему на порожній базі.
- [ ] Production migrations застосовуються через Wrangler workflow.
- [ ] Foreign keys, unique constraints і indexes працюють.
- [ ] FTS5 синхронізується після publish/edit/archive.
- [ ] Seed працює.
- [ ] Немає MySQL-специфічних типів.
- [ ] Немає public API, що повертає internal DB model без DTO.

### 36.4. Безпека

- [ ] `/admin`, `/admin/*`, `/api/admin` і `/api/admin/*` захищені Cloudflare Access.
- [ ] Access JWT перевіряється криптографічно.
- [ ] Ролі перевіряються на сервері.
- [ ] Secrets відсутні в Git і logs.
- [ ] SQL parameterized.
- [ ] Markdown sanitized.
- [ ] Upload validation перевіряє magic bytes/size/dimensions.
- [ ] SVG user upload заборонено.
- [ ] Private originals не public.
- [ ] Turnstile/rate limit працюють для contact, якщо форма ввімкнена.
- [ ] Security headers налаштовані.
- [ ] `DEV_AUTH_BYPASS` неможливо активувати в production.

### 36.5. SEO і доступність

- [ ] SSR HTML доступний без client JS.
- [ ] Унікальні title/description.
- [ ] Canonical і hreflang коректні.
- [ ] Sitemap і robots валідні.
- [ ] Structured data валідні й доречні.
- [ ] Responsive images мають width/height/alt.
- [ ] Keyboard navigation і visible focus працюють.
- [ ] axe не знаходить serious/critical violations у ключових flows.
- [ ] Lighthouse targets досягнуті або відхилення задокументовані.

### 36.6. Відновлення та якість

- [ ] D1 export створюється й імпортується в test DB.
- [ ] R2 inventory/sync задокументовано або автоматизовано.
- [ ] Restore smoke test виконано.
- [ ] `pnpm verify` успішний.
- [ ] TypeScript strict без необґрунтованих suppressions.
- [ ] Немає critical TODO або production mocks.
- [ ] Lockfile committed.
- [ ] README і docs актуальні.
- [ ] Clean install і build успішні.

### 36.7. Вартість

- [ ] Для MVP не потрібен VPS.
- [ ] Немає обов'язкових платних сторонніх сервісів.
- [ ] Архітектура враховує актуальні free limits Workers/D1/R2.
- [ ] Документовано usage monitoring.
- [ ] Очікувана фіксована щорічна витрата — переважно домен.

## 37. Фінальний звіт AI-агента

Після завершення агент надає:

1. Короткий опис реалізованого результату.
2. Ключові архітектурні рішення.
3. Структуру репозиторію.
4. Список public/admin/API routes.
5. Список D1 tables і migrations.
6. Опис Drizzle/raw SQL boundaries.
7. Опис Access і roles.
8. Опис Vue admin modules.
9. Опис R2 upload flow.
10. Результати lint, typecheck, tests і build.
11. Результати accessibility/performance checks.
12. Результат migration/backup/restore smoke tests.
13. Зовнішні ручні кроки: Cloudflare resources, domain, Access, secrets, Turnstile, deploy.
14. Відомі обмеження.
15. Наступні необов'язкові покращення.

Не використовувати слово «готово», якщо critical acceptance criteria не виконані. Чітко розділити:

- повністю реалізоване;
- реалізоване локально, але потребує зовнішнього налаштування;
- відкладене;
- заблоковане.

## 38. Рекомендовані офіційні джерела

Перед реалізацією перевірити актуальні версії та рекомендації:

- [Hono — Cloudflare Workers](https://hono.dev/docs/getting-started/cloudflare-workers)
- [Hono — JSX renderer](https://hono.dev/docs/helpers/jsx)
- [Vue documentation](https://vuejs.org/guide/introduction.html)
- [Vue Router](https://router.vuejs.org/)
- [Cloudflare Vite plugin](https://developers.cloudflare.com/workers/vite-plugin/)
- [Cloudflare Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/)
- [Cloudflare Workers limits](https://developers.cloudflare.com/workers/platform/limits/)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Cloudflare D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/)
- [Cloudflare D1 limits](https://developers.cloudflare.com/d1/platform/limits/)
- [Cloudflare D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/)
- [Cloudflare D1 import/export](https://developers.cloudflare.com/d1/best-practices/import-export-data/)
- [Cloudflare D1 Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/)
- [Drizzle ORM — Cloudflare D1](https://orm.drizzle.team/docs/connect-cloudflare-d1)
- [Cloudflare R2 pricing](https://developers.cloudflare.com/r2/pricing/)
- [Cloudflare R2 Workers API](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/)
- [Cloudflare Access application paths](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/app-paths/)
- [Cloudflare Access JWT validation](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/)
- [Cloudflare Turnstile server-side validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
- [Tailwind CSS — detecting classes](https://tailwindcss.com/docs/detecting-classes-in-source-files)
- [Tailwind CSS — theme variables](https://tailwindcss.com/docs/theme)
- [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Google localized versions](https://developers.google.com/search/docs/specialty/international/localized-versions)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
