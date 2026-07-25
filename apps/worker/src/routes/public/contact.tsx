import type { Hono } from 'hono';
import { z } from 'zod';
import { apiError, apiSuccess } from '@fauna/shared';
import type { AppEnv } from '../../index';
import { rateLimit } from '../../utils/rate-limit';

const contactSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().toLowerCase().email().max(320),
  subject: z.string().trim().min(1).max(500),
  message: z.string().trim().min(10).max(10000),
  'cf-turnstile-response': z.string().min(1, 'Turnstile token is required'),
});

export function registerContactRoutes(app: Hono<AppEnv>) {
  app.post('/api/contact', async (c) => {
    // Rate limit: 3 submissions per 10 minutes per IP
    const limited = await rateLimit(c, {
      namespace: 'contact',
      limit: 3,
      windowSeconds: 600, // 10 minutes
    });
    if (limited) return limited;

    const parsed = contactSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      const fields = Object.fromEntries(
        parsed.error.issues.map((issue) => [issue.path.join('.') || 'form', issue.message]),
      );
      return c.json(apiError('VALIDATION_ERROR', 'Перевірте поля форми', fields), 422);
    }

    const { name, email, subject, message, 'cf-turnstile-response': turnstileToken } = parsed.data;

    // Verify Turnstile token if secret is configured
    const turnstileSecret = c.env.TURNSTILE_SECRET_KEY;
    if (turnstileSecret) {
      const turnstileRes = await fetch(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        {
          method: 'POST',
          body: new URLSearchParams({
            secret: turnstileSecret,
            response: turnstileToken,
            remoteip: c.req.header('CF-Connecting-IP') ?? '',
          }),
        },
      );
      const turnstileData = (await turnstileRes.json()) as { success: boolean };
      if (!turnstileData.success) {
        return c.json(
          apiError('TURNSTILE_FAILED', 'Не вдалося підтвердити, що ви не робот. Спробуйте ще раз.'),
          422,
        );
      }
    }

    // Persist the contact message to the audit log for review
    const timestamp = new Date().toISOString();
    await c.env.DB.prepare(
      'INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?)',
    ).bind(
      crypto.randomUUID(),
      null,
      'contact.submit',
      'contact',
      null,
      JSON.stringify({
        name,
        email,
        subject,
        messagePreview: message.slice(0, 200),
      }),
      timestamp,
    );

    // TODO: integrate with Email Sending binding when available
    // For now, the message is stored in audit logs for manual review.

    return c.json(apiSuccess({ ok: true }), 200);
  });
}
