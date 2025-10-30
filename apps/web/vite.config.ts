import { cloudflare } from '@cloudflare/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import svgr from 'vite-plugin-svgr';
import tsConfigPaths from 'vite-tsconfig-paths';
import { ViteMcp } from 'vite-plugin-mcp';

export default defineConfig({
    server: {
        port: 3000
    },
    optimizeDeps: {
        exclude: ['wrangler'],
        include: ['lucide-react', 'sonner', 'next-themes'],
        force: process.env['CI'] === 'true'
    },
    plugins: [
        ViteMcp({
            updateConfig: false
        }),
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
