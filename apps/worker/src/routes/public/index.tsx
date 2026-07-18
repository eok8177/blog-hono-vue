import type { Hono } from 'hono';
import type { AppEnv } from '../../index';
import { registerCategoryRoutes } from './categories';
import { registerHomeRoutes } from './home';
import { registerPageRoutes } from './pages';
import { registerPostRoutes } from './posts';
import { registerSearchRoutes } from './search';

export function registerPublicRoutes(app: Hono<AppEnv>) {
  registerHomeRoutes(app);
  registerPostRoutes(app);
  registerSearchRoutes(app);
  registerCategoryRoutes(app);
  // Keep the catch-all page routes last so they do not shadow specific routes.
  registerPageRoutes(app);
}
