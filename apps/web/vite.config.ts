import { defineConfig } from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';
import svgr from 'vite-plugin-svgr';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { cloudflare } from '@cloudflare/vite-plugin';

export default defineConfig({
    server: {
        port: 3000
    },
    optimizeDeps: {
        exclude: ['wrangler']
    },
    plugins: [
        cloudflare({ viteEnvironment: { name: 'ssr' } }),
        tanstackStart(),
        viteReact(),
        tsConfigPaths({
            projects: ['./tsconfig.json']
        }),
        tailwindcss(),
        svgr()
    ]
});
