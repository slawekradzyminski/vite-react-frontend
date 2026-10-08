import { defineConfig, loadConfigFromFile, mergeConfig } from 'vite';

export default defineConfig(async env => {
  const base = await loadConfigFromFile(env, new URL('./vite.config.ts', import.meta.url).pathname);
  if (!base) throw new Error('Could not load the application Vite configuration.');
  const target = process.env.WEBMCP_BACKEND_URL ?? 'http://localhost:8081';
  return mergeConfig(base.config, {
    define: { 'import.meta.env.VITE_API_BASE_URL': JSON.stringify('http://localhost:5180') },
    server: {
      host: 'localhost', port: 5180, strictPort: true,
      proxy: {
        '/api': { target, changeOrigin: true, headers: { origin: new URL(target).origin } },
        '/images': { target, changeOrigin: true },
      },
    },
  });
});
