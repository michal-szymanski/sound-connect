import { cloudflare } from '@cloudflare/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
    server: {
        port: 3001
    },
    optimizeDeps: {
        exclude: ['wrangler'],
        include: ['lucide-react', 'sonner'],
        force: process.env['CI'] === 'true'
    },
    plugins: [
        cloudflare({ viteEnvironment: { name: 'ssr' } }),
        tanstackStart(),
        viteReact(),
        tsConfigPaths({
            projects: ['./tsconfig.json']
        }),
        tailwindcss()
    ]
});
