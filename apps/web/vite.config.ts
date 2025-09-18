import { defineConfig } from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';
import { cloudflare } from 'unenv';
import nitroCloudflareBindings from 'nitro-cloudflare-dev';
import svgr from 'vite-plugin-svgr';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';

//const apiUrl = 'http://localhost:8787';
const apiUrl = process.env.API_URL;

export default defineConfig({
    server: {
        port: 3000
        // preset: 'cloudflare-module',
        // unenv: cloudflare,
        // modules: [nitroCloudflareBindings]
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
