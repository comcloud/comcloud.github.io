import type { SiteConfig } from '../types';

const siteConfig: SiteConfig = {
    website: 'https://comcloud.github.io',
    title: '随手记',
    subtitle: '程度犀牛 · 关于商业、技术与社会的一些观察',
    description: '一个人写点想法的地方：银发经济、大模型、消费与技术的长期变化，看到什么、想到什么，就记下来。',
    headerNavLinks: [
        { text: '首页', href: '/' },
        { text: '文章', href: '/blog' },
        { text: '标签', href: '/tags' },
        { text: '关于', href: '/about' }
    ],
    footerNavLinks: [
        { text: '关于', href: '/about' },
        { text: '联系', href: '/contact' },
        { text: 'RSS', href: '/rss.xml' }
    ],
    socialLinks: [
        { text: 'GitHub', href: 'https://github.com/comcloud' },
        { text: 'RSS', href: '/rss.xml' }
    ],
    hero: {
        title: '这里记录我的一些想法。',
        text: '我是**程度犀牛**。不定期更新，看到值得琢磨的事就写一篇——**银发经济**、**大模型**、消费与技术范式的长期变化。\n\n不追求及时，只追求把一件事想到自己满意为止。'
    },
    subscribe: { enabled: false },
    postsPerPage: 10
};

export default siteConfig;
