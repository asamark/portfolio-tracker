import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { readFileSync } from 'node:fs';

/** Serves public/setup-guide.txt with the current sheet/Code.gs pasted in, so the guide never goes stale. */
function setupGuide() {
  const build = () => readFileSync('public/setup-guide.txt', 'utf8').replace(/^===== SCRIPT[^\n]*=====\n[\s\S]*?^===== END OF SCRIPT =====/m,
    '===== SCRIPT (paste everything below into Apps Script) =====\n' + readFileSync('sheet/Code.gs', 'utf8').trim() + '\n===== END OF SCRIPT =====');
  return {
    name: 'setup-guide',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.split('?')[0] === '/setup-guide.txt') { res.setHeader('Content-Type', 'text/plain; charset=utf-8'); res.end(build()); } else next();
      });
    },
    generateBundle() { this.emitFile({ type: 'asset', fileName: 'setup-guide.txt', source: build() }); },
  };
}

export default defineConfig({
  plugins: [svelte(), setupGuide()],
  // If you host under a sub-path (e.g. GitHub Pages at /portfolio-tracker/), set base to that path.
  base: './',
});
