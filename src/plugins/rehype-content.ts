import siteConfig from '../data/site-config';

type HastNode = {
    type: string;
    tagName?: string;
    value?: string;
    properties?: Record<string, unknown>;
    children?: HastNode[];
};

const SITE_HOST = new URL(siteConfig.website).host;

function addClass(node: HastNode, name: string) {
    node.properties ??= {};
    const current = node.properties.className;
    const list = typeof current === 'string' ? current.split(/\s+/).filter(Boolean) : Array.isArray(current) ? [...current] : [];
    if (!list.includes(name)) list.push(name);
    node.properties.className = list;
}

function element(tagName: string, children: HastNode[], properties: Record<string, unknown> = {}): HastNode {
    return { type: 'element', tagName, properties, children };
}

function markExternalLink(node: HastNode) {
    const href = String(node.properties?.href ?? '');
    if (!/^https?:\/\//i.test(href)) return;
    let host = '';
    try {
        host = new URL(href).host;
    } catch {
        return;
    }
    if (host === SITE_HOST) return;
    node.properties ??= {};
    if (!node.properties.target) node.properties.target = '_blank';
    node.properties.rel = 'noopener noreferrer';
    addClass(node, 'external-link');
}

// 独占一段的图才做「点开看大图」，有标题的顺手转成 figure + figcaption
function zoomableImage(node: HastNode) {
    const kept = (node.children ?? []).filter((child) => child.type !== 'text' || (child.value ?? '').trim());
    const image = kept.length === 1 && kept[0].type === 'element' && kept[0].tagName === 'img' ? kept[0] : undefined;
    const src = String(image?.properties?.src ?? '');
    if (!image || !src || /^javascript:/i.test(src)) return undefined;
    image.properties ??= {};

    const title = typeof image.properties.title === 'string' ? image.properties.title.trim() : '';
    if (!title) return element('a', [image], { className: ['prose-image'], href: src });

    delete image.properties.title;
    const link = element('a', [image], { className: ['prose-image'], href: src });
    const caption = element('figcaption', [{ type: 'text', value: title }]);
    return element('figure', [link, caption], { className: ['prose-figure'] });
}

function lazyImage(node: HastNode) {
    node.properties ??= {};
    if (node.properties.loading === undefined) node.properties.loading = 'lazy';
    if (node.properties.decoding === undefined) node.properties.decoding = 'async';
}

function walk(nodes: HastNode[], insideLink: boolean) {
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (node.type !== 'element') continue;

        // 表格套一层横向滚动容器，但要继续往里走，单元格里的链接和图片也要管
        if (node.tagName === 'table') nodes.splice(i, 1, element('div', [node], { className: ['table-scroll'] }));

        if (node.tagName === 'a') markExternalLink(node);
        if (node.tagName === 'img') lazyImage(node);

        if (node.tagName === 'p' && !insideLink) {
            const wrapped = zoomableImage(node);
            if (wrapped) {
                nodes.splice(i, 1, wrapped);
                walk(wrapped.children ?? [], true);
                continue;
            }
        }

        if (node.children) walk(node.children, insideLink || node.tagName === 'a');
    }
}

// 正文排版的收尾：宽表横向滚动、站外链接新窗口、图片懒加载与大图
export default function rehypeContent() {
    return function transform(tree: HastNode) {
        if (tree.children) walk(tree.children, false);
    };
}
