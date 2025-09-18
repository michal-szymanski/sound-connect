import { defineConfig } from '@tanstack/react-start/config';
import tsConfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';
import { cloudflare } from 'unenv';
import nitroCloudflareBindings from 'nitro-cloudflare-dev';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
    vite: {
        plugins: [
            tsConfigPaths({
                projects: ['./tsconfig.json']
            }),
            tailwindcss(),
            svgr()
        ]
    },
    tsr: {
        appDirectory: 'src'
    },
    server: {
        preset: 'cloudflare-module',
        unenv: cloudflare,
        modules: [nitroCloudflareBindings]
        // routeRules: {
        //     '/media/**': {
        //         proxy: {
        //             to: 'https://media.sound-connect.com/**'
        //         }
        //     }
        // }
    }
});
