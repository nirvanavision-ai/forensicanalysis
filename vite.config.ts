/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Production hardening for the single-file build:
 * - adds a Content-Security-Policy that only allows network calls to the Anthropic API,
 *   pins the inline script by hash, and blocks every other external resource;
 * - writes the build as `forensic_analysis_app.html` (and keeps `index.html` for hosting).
 */
function cspAndRename(): Plugin {
  const PLACEHOLDER = '__SUBTEXT_SCRIPT_HASHES__';
  return {
    name: 'subtext-csp-and-rename',
    apply: 'build',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const csp = [
          "default-src 'none'",
          `script-src ${PLACEHOLDER}`,
          "style-src 'unsafe-inline'",
          'img-src data: blob:',
          'font-src data:',
          'media-src blob:',
          'connect-src https://api.anthropic.com',
          "base-uri 'none'",
          "form-action 'none'",
          "object-src 'none'",
        ].join('; ');
        return html.replace(
          '<meta charset="UTF-8" />',
          `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${csp}" />`,
        );
      },
    },
    closeBundle() {
      const outDir = resolve(process.cwd(), 'dist');
      const indexPath = resolve(outDir, 'index.html');
      let html: string;
      try {
        html = readFileSync(indexPath, 'utf8');
      } catch {
        return;
      }
      const hashes: string[] = [];
      const re = /<script(?![^>]*application\/json)[^>]*>([\s\S]*?)<\/script>/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(html))) {
        if (m[1].trim().length === 0) continue;
        hashes.push(`'sha256-${createHash('sha256').update(m[1], 'utf8').digest('base64')}'`);
      }
      html = html.replace(PLACEHOLDER, hashes.join(' ') || "'none'");
      writeFileSync(indexPath, html);
      writeFileSync(resolve(outDir, 'forensic_analysis_app.html'), html);
    },
  };
}

export default defineConfig({
  plugins: [react(), viteSingleFile({ removeViteModuleLoader: true }), cspAndRename()],
  build: {
    target: 'es2022',
    assetsInlineLimit: 100_000_000,
    chunkSizeWarningLimit: 5000,
    reportCompressedSize: false,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
