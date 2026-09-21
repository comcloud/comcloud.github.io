import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import siteConfig from './src/data/site-config';

// https://astro.build/config
export default defineConfig({
    site: siteConfig.website,
    markdown: {
        // 站点深色是 html.dark 手动切换的，只给单一主题会让代码块在浅色下变成黑底
        shikiConfig: {
            themes: { light: 'github-light', dark: 'github-dark' }
        }
    },
    vite: {
        plugins: [tailwindcss()]
    },
    integrations: [mdx(), sitemap()]
});
