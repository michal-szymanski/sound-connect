import { defineConfig, loadEnv } from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';
import svgr from 'vite-plugin-svgr';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const { API_URL } = loadEnv(mode, process.cwd(), '');

    return {
        server: {
            port: 3000,
            proxy: {
                '/media': {
                    target: API_URL,
                    changeOrigin: true
                }
            }
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
    };
});
