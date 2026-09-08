import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  if (env.NVIDIA_API_KEY && !process.env.NVIDIA_API_KEY) {
    process.env.NVIDIA_API_KEY = env.NVIDIA_API_KEY;
  }
  if (env.NVIDIA_MODEL_ID && !process.env.NVIDIA_MODEL_ID) {
    process.env.NVIDIA_MODEL_ID = env.NVIDIA_MODEL_ID;
  }

  return {
    plugins: [
      react(),
      {
        name: 'api-dev-server',
        configureServer(server) {
          // Map URL prefixes to their handler modules
          const API_ROUTES: Record<string, string> = {
            '/api/veterinary-expert': './api/veterinary-expert.ts',
            '/api/analyze-visual': './api/analyze-visual.ts',
            '/api/alerts': './api/alerts.ts',
          };

          server.middlewares.use(async (req, res, next) => {
            const matchedRoute = Object.keys(API_ROUTES).find(
              (prefix) => req.url && req.url.startsWith(prefix)
            );
            if (!matchedRoute) return next();

            try {
              // Buffer raw body from stream (supports large base64 payloads)
              let rawBody = '';
              for await (const chunk of req) {
                rawBody += chunk;
              }
              const body = rawBody ? JSON.parse(rawBody) : {};

              // Shim Vercel-style res.status().json() chain
              const customRes = {
                statusCode: 200,
                setHeader: (k: string, v: string) => res.setHeader(k, v),
                status: (code: number) => {
                  res.statusCode = code;
                  return customRes;
                },
                json: (data: any) => {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(data));
                },
                end: () => res.end(),
              };

              const { default: handler } = await import(API_ROUTES[matchedRoute]);
              await handler(
                { ...req, body, method: req.method, headers: req.headers },
                customRes,
              );
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message || 'API dev error' }));
            }
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
  };
});
