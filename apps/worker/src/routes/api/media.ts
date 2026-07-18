import type { Hono } from 'hono';
import { apiError, apiSuccess, mediaUpdateSchema, paginationSchema } from '@fauna/shared';
import type { AppEnv } from '../../index';
import { requireAdmin } from '../../middleware/auth';
import { inspectImage, sha256 } from '../../utils/media';

export function registerMediaRoutes(app: Hono<AppEnv>) {
  app.get('/api/admin/media', async (c) => {
    const pagination = paginationSchema.parse(c.req.query());
    const search = (c.req.query('q') ?? '').slice(0, 100);
    const where = search
      ? 'WHERE alt_uk LIKE ? OR alt_en LIKE ? OR caption_uk LIKE ? OR caption_en LIKE ?'
      : '';
    const args = search ? Array(4).fill(`%${search}%`) : [];
    const results = await c.env.DB.batch([
      c.env.DB.prepare(
        `SELECT id,variant_480_key,variant_960_key,variant_1600_key,mime_type,width,height,size_bytes,alt_uk,alt_en,caption_uk,caption_en,credit,license,status,created_at,updated_at FROM media ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      ).bind(...args, pagination.pageSize, (pagination.page - 1) * pagination.pageSize),
      c.env.DB.prepare(`SELECT count(*) count FROM media ${where}`).bind(...args),
    ]);
    return c.json(
      apiSuccess({
        items: results[0]!.results,
        total: Number((results[1]!.results[0] as { count: number }).count),
        page: pagination.page,
        pageSize: pagination.pageSize,
      }),
    );
  });

  app.get('/api/admin/media/:id', async (c) => {
    const row = await c.env.DB.prepare('SELECT * FROM media WHERE id=?')
      .bind(c.req.param('id'))
      .first();
    return row ? c.json(apiSuccess(row)) : c.json(apiError('NOT_FOUND', 'Файл не знайдено'), 404);
  });

  app.put('/api/admin/media/:id', async (c) => {
    const data = mediaUpdateSchema.parse(await c.req.json());
    const timestamp = new Date().toISOString();
    const result = await c.env.DB.prepare(
      'UPDATE media SET alt_uk=?,alt_en=?,caption_uk=?,caption_en=?,credit=?,license=?,source_url=?,updated_at=? WHERE id=? AND updated_at=?',
    )
      .bind(
        data.altUk,
        data.altEn ?? null,
        data.captionUk ?? null,
        data.captionEn ?? null,
        data.credit ?? null,
        data.license ?? null,
        data.sourceUrl ?? null,
        timestamp,
        c.req.param('id'),
        data.version,
      )
      .run();
    return result.meta.changes
      ? c.json(apiSuccess({ id: c.req.param('id'), updatedAt: timestamp }))
      : c.json(apiError('CONFLICT', 'Файл змінився або не існує'), 409);
  });

  app.use('/api/admin/media/:id', requireAdmin);
  app.delete('/api/admin/media/:id', async (c) => {
    const id = c.req.param('id');
    const media = await c.env.DB.prepare(
      'SELECT original_key,variant_480_key,variant_960_key,variant_1600_key FROM media WHERE id=?',
    )
      .bind(id)
      .first<{
        original_key: string | null;
        variant_480_key: string | null;
        variant_960_key: string | null;
        variant_1600_key: string | null;
      }>();
    if (!media) return c.json(apiError('NOT_FOUND', 'Файл не знайдено'), 404);

    const relations = await c.env.DB.batch([
      c.env.DB.prepare('SELECT count(*) count FROM post_media WHERE media_id=?').bind(id),
      c.env.DB.prepare('SELECT count(*) count FROM page_media WHERE media_id=?').bind(id),
      c.env.DB.prepare('SELECT count(*) count FROM category_media WHERE media_id=?').bind(id),
    ]);
    if (
      relations.some(
        (result: D1Result<unknown>) => Number((result.results[0] as { count: number }).count) > 0,
      )
    )
      return c.json(
        apiError('MEDIA_IN_USE', 'Файл використовується матеріалами і не може бути видалений'),
        409,
      );

    const timestamp = new Date().toISOString();
    await c.env.DB.batch([
      c.env.DB.prepare('DELETE FROM media WHERE id=?').bind(id),
      c.env.DB.prepare(
        'INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?)',
      ).bind(
        crypto.randomUUID(),
        c.get('actor').id,
        'media.hard_delete',
        'media',
        id,
        '{}',
        timestamp,
      ),
    ]);
    const keys = [
      media.original_key,
      media.variant_480_key,
      media.variant_960_key,
      media.variant_1600_key,
    ].filter((key): key is string => Boolean(key));
    try {
      await Promise.all(keys.map((key) => c.env.MEDIA.delete(key)));
    } catch (error) {
      console.error(
        JSON.stringify({
          requestId: c.get('requestId'),
          event: 'media.orphan_cleanup_failed',
          id,
          error: String(error),
        }),
      );
      return c.json(
        apiError('ORPHAN_CLEANUP_FAILED', 'Metadata видалено, але cleanup R2 потребує перевірки'),
        500,
      );
    }
    return c.json(apiSuccess({ id, status: 'deleted' }));
  });

  app.post('/api/admin/media', async (c) => {
    const contentLength = Number(c.req.header('Content-Length') ?? 0);
    if (contentLength > 21 * 1024 * 1024)
      return c.json(apiError('PAYLOAD_TOO_LARGE', 'Upload не може перевищувати 20 MB'), 413);

    const form = await c.req.formData();
    const altUk = form.get('altUk');
    const variants = [form.get('variant480'), form.get('variant960'), form.get('variant1600')];
    if (
      typeof altUk !== 'string' ||
      !altUk.trim() ||
      !variants.every((value): value is File => value instanceof File)
    )
      return c.json(
        apiError('VALIDATION_ERROR', 'Потрібні alt українською та три WebP variants'),
        422,
      );

    const declaredTotal = variants.reduce(
      (sum, value) => sum + (value instanceof File ? value.size : 0),
      0,
    );
    if (
      declaredTotal > 20 * 1024 * 1024 ||
      variants.some((value) => value instanceof File && value.size > 20 * 1024 * 1024)
    )
      return c.json(
        apiError('PAYLOAD_TOO_LARGE', 'Загальний розмір variants не може перевищувати 20 MB'),
        413,
      );

    const files = await Promise.all(
      variants.map(async (file) => ({ file, bytes: new Uint8Array(await file.arrayBuffer()) })),
    );
    const inspected = files.map(({ bytes }) => inspectImage(bytes));
    const allowedWidths = [480, 960, 1600];
    if (
      inspected.some(
        (image, index) =>
          !image ||
          image.mimeType !== 'image/webp' ||
          image.width < 1 ||
          image.height < 1 ||
          image.width > allowedWidths[index]! ||
          image.width * image.height > 20_000_000 ||
          Math.max(image.width / image.height, image.height / image.width) > 20,
      )
    )
      return c.json(
        apiError('INVALID_MEDIA', 'Variants мають бути валідними WebP зображеннями до 20 MB'),
        422,
      );

    const total = files.reduce((sum, item) => sum + item.bytes.byteLength, 0);
    if (total > 20 * 1024 * 1024)
      return c.json(
        apiError('PAYLOAD_TOO_LARGE', 'Загальний розмір variants не може перевищувати 20 MB'),
        413,
      );

    const hashes = await Promise.all(files.map(({ bytes }) => sha256(bytes)));
    const keys = hashes.map((hash, index) => `variants/${hash}-${[480, 960, 1600][index]}.webp`);
    try {
      await Promise.all(
        files.map(({ bytes }, index) =>
          c.env.MEDIA.put(keys[index]!, bytes, {
            httpMetadata: {
              contentType: 'image/webp',
              cacheControl: 'public, max-age=31536000, immutable',
            },
          }),
        ),
      );
      const id = crypto.randomUUID();
      const timestamp = new Date().toISOString();
      const largest = inspected[2]!;
      await c.env.DB.prepare(
        'INSERT INTO media(id,variant_480_key,variant_960_key,variant_1600_key,mime_type,width,height,size_bytes,sha256,alt_uk,alt_en,caption_uk,caption_en,credit,license,source_url,status,created_by,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      )
        .bind(
          id,
          keys[0]!,
          keys[1]!,
          keys[2]!,
          'image/webp',
          largest.width,
          largest.height,
          total,
          hashes[2]!,
          altUk.trim(),
          typeof form.get('altEn') === 'string' ? String(form.get('altEn')) : null,
          typeof form.get('captionUk') === 'string' ? String(form.get('captionUk')) : null,
          typeof form.get('captionEn') === 'string' ? String(form.get('captionEn')) : null,
          typeof form.get('credit') === 'string' ? String(form.get('credit')) : null,
          typeof form.get('license') === 'string' ? String(form.get('license')) : null,
          typeof form.get('sourceUrl') === 'string' ? String(form.get('sourceUrl')) : null,
          'ready',
          c.get('actor').id,
          timestamp,
          timestamp,
        )
        .run();
      return c.json(apiSuccess({ id }), 201);
    } catch (error) {
      await Promise.all(keys.map((key) => c.env.MEDIA.delete(key)));
      throw error;
    }
  });

  app.get('/media/:id/:variant', async (c) => {
    const media = await c.env.DB.prepare(
      "SELECT variant_480_key,variant_960_key,variant_1600_key,mime_type FROM media WHERE id=? AND status='ready'",
    )
      .bind(c.req.param('id'))
      .first<{
        variant_480_key: string;
        variant_960_key: string;
        variant_1600_key: string;
        mime_type: string;
      }>();
    const variant = c.req.param('variant');
    const key =
      variant === '480'
        ? media?.variant_480_key
        : variant === '960'
          ? media?.variant_960_key
          : variant === '1600'
            ? media?.variant_1600_key
            : null;
    if (!key || !media) return c.notFound();

    const object = await c.env.MEDIA.get(key);
    if (!object) return c.notFound();
    return new Response(object.body, {
      headers: {
        'Content-Type': media.mime_type,
        ...(object.size ? { 'Content-Length': String(object.size) } : {}),
        'Cache-Control': 'public, max-age=31536000, immutable',
        ETag: object.httpEtag,
      },
    });
  });
}
