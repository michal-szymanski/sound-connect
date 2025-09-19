import { defineConfig, loadEnv } from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';
import svgr from 'vite-plugin-svgr';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const { API_URL } = loadEnv(mode, process.cwd(), '');

    console.log(`[App] Configuring proxy for /media -> ${API_URL}/media`);

    return {
        server: {
            port: 3000,
            proxy: {
                '/media': {
                    target: API_URL,
                    changeOrigin: true,
                    configure: (proxy, _options) => {
                        proxy.on('error', (err, _req, _res) => {
                            console.log('[App] Proxy error', err);
                        });
                        proxy.on('proxyReq', (proxyReq, req, _res) => {
                            console.log('[App] Sending Request to the Target:', req.method, req.url);
                        });
                        proxy.on('proxyRes', (proxyRes, req, _res) => {
                            console.log('[App] Received Response from the Target:', proxyRes.statusCode, req.url);
                        });
                    }
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
