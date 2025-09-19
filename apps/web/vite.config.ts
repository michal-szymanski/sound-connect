import { defineConfig } from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';
import svgr from 'vite-plugin-svgr';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';

export default defineConfig({
    server: {
        port: 3000
    },
    plugins: [
        tsConfigPaths({
            projects: ['./tsconfig.json']
        }),
        tanstackStart({ target: 'cloudflare-module', customViteReactPlugin: true }),
        viteReact(),
        tailwindcss(),
        svgr()
    ]
});
