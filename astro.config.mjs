import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import rehypeKatex from 'rehype-katex';
import remarkAbbr from './src/plugins/remark-abbr';
import remarkContainers from './src/plugins/remark-containers';
import remarkMath from 'remark-math';
import remarkSubSup from './src/plugins/remark-sub-sup';
import siteConfig from './src/data/site-config';
import rehypeContent from './src/plugins/rehype-content';
import remarkGithubAlerts from './src/plugins/remark-github-alerts';
import remarkMermaid from './src/plugins/remark-mermaid';
import shikiCodeBlocks from './src/plugins/shiki-code-blocks';

// https://astro.build/config
export default defineConfig({
    site: siteConfig.website,
    markdown: {
        // 容器要排在缩写、上下标之前，容器里的正文才吃得到后面这些插件
        remarkPlugins: [remarkMermaid, remarkGithubAlerts, remarkContainers, [remarkMath, { singleDollarTextMath: false }], remarkAbbr, remarkSubSup],
        rehypePlugins: [[rehypeKatex, { throwOnError: false, strict: 'ignore' }], rehypeContent],
        // 站点深色是 html.dark 手动切换的，只给单一主题会让代码块在浅色下变成黑底
        shikiConfig: {
            themes: { light: 'github-light', dark: 'github-dark' },
            transformers: [shikiCodeBlocks()]
        }
    },
    vite: {
        plugins: [tailwindcss()]
    },
    integrations: [mdx(), sitemap()]
});
