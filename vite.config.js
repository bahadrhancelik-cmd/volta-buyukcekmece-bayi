import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Dev-only: Vite does not run the Vercel `api/` serverless functions, so a
// POST to /api/contact 404s under `vite dev`. This middleware invokes the same
// handlers locally (with a minimal req/res shim) so the contact form works in
// development exactly as it does in production. Server-side env (RESEND_API_KEY,
// etc.) is loaded from .env.local. No effect on the production build.
function vercelApiDev(env) {
  return {
    name: 'vercel-api-dev',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) return next();

        const name = req.url.split('?')[0].replace(/^\/api\//, '').replace(/\/+$/, '');
        if (!name || name.includes('..') || name.includes('/')) return next();

        const handlerPath = path.resolve(process.cwd(), 'api', `${name}.js`);
        let mod;
        try {
          // Cache-bust so edits to api/*.js are picked up without a restart.
          mod = await import(`${pathToFileURL(handlerPath).href}?t=${Date.now()}`);
        } catch {
          return next(); // no such api function — fall through to SPA
        }
        const handler = mod.default;
        if (typeof handler !== 'function') return next();

        // Collect the raw body; the handlers already JSON.parse string bodies.
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        req.body = Buffer.concat(chunks).toString('utf8');

        // Shim the Vercel res helpers onto the Node ServerResponse.
        res.status = (code) => { res.statusCode = code; return res; };
        res.json = (obj) => {
          if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(obj));
          return res;
        };

        try {
          await handler(req, res);
        } catch (e) {
          console.error(`[api/${name}] dev handler error`, e);
          if (!res.headersSent) res.status(500).json({ error: 'Sunucu hatası (dev).' });
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Load ALL env vars (empty prefix) and expose the non-VITE server keys to
  // process.env so the dev API handlers can read them. (.env changes need a
  // config-file touch to fully restart and re-read.)
  const env = loadEnv(mode, process.cwd(), '');
  for (const key of ['RESEND_API_KEY', 'CONTACT_FROM_EMAIL', 'CONTACT_TO_EMAIL', 'SUPABASE_URL', 'SUPABASE_ANON_KEY']) {
    if (env[key]) process.env[key] = env[key];
  }

  return {
    plugins: [vue(), vercelApiDev(env)],
    server: {
      port: 5173,
      open: true,
    },
  };
});
