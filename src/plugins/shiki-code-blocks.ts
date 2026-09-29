type HastNode = {
    type: string;
    tagName?: string;
    properties?: Record<string, unknown>;
    children?: HastNode[];
    value?: string;
};

type ShikiContext = {
    options?: { lang?: string; meta?: { __raw?: string } };
};

const TITLE = /(?:^|\s)title=(?:"([^"]+)"|'([^']+)'|(\S+))/;
const LINES = /(?:^|\s)\{([\d,-]+)\}/;

function rawMeta(this: ShikiContext) {
    return this.options?.meta?.__raw || '';
}

function parseTitle(raw: string) {
    const matched = TITLE.exec(raw);
    return matched?.[1] ?? matched?.[2] ?? matched?.[3];
}

// `1,3-5` -> Set {1,2,3,5}
function parseLines(raw: string): Set<number> {
    const spec = LINES.exec(raw)?.[1];
    if (!spec) return new Set();

    const lines = new Set<number>();
    for (const part of spec.split(',')) {
        const parts = part.split('-').map((n) => Number.parseInt(n, 10));
        const from = parts[0];
        if (Number.isNaN(from)) continue;

        const to = parts.length > 1 && !Number.isNaN(parts[1]) ? parts[1] : from;
        for (let i = from; i <= to; i++) lines.add(i);
    }
    return lines;
}

// Shiki 用的是 properties.class，hast 规范用的是 className，两边都可能出现，只能顺着已有的那个改
function addClass(node: HastNode, name: string) {
    const props = (node.properties ??= {});
    const key = 'class' in props ? 'class' : 'className';
    const current = props[key];
    const list = Array.isArray(current) ? [...(current as string[])] : typeof current === 'string' ? current.split(/\s+/).filter(Boolean) : [];

    if (!list.includes(name)) list.push(name);
    props[key] = list;
}

function text(value: string): HastNode {
    return { type: 'text', value };
}

function span(className: string[], children: HastNode[]): HastNode {
    return { type: 'element', tagName: 'span', properties: { className }, children };
}

function head(lang: string, title?: string): HastNode {
    const children: HastNode[] = [span(['code-block-name'], [text(title || lang || 'text')])];

    if (title && lang) children.push(span(['code-block-lang'], [text(lang)]));
    children.push({
        type: 'element',
        tagName: 'button',
        properties: { type: 'button', className: ['code-block-copy'], ariaLabel: '复制这段代码' },
        children: [text('复制')]
    });

    return { type: 'element', tagName: 'figcaption', properties: { className: ['code-block-head'] }, children };
}

// 围栏信息的两种写法：```python title="a.py" {1,3-4}
export default function shikiCodeBlocks() {
    return {
        name: 'site-code-blocks',
        line(this: ShikiContext, node: HastNode, index: number) {
            if (parseLines(rawMeta.call(this)).has(index)) addClass(node, 'line-active');
            return node;
        },
        pre(this: ShikiContext, node: HastNode) {
            const raw = rawMeta.call(this);
            const props = node.properties || {};
            const lang = this.options?.lang || (props['data-language'] as string) || '';
            const title = parseTitle(raw);

            addClass(node, 'code-block-body');
            return {
                type: 'element',
                tagName: 'figure',
                properties: { className: ['code-block'], 'data-lang': lang },
                children: [head(lang, title), node]
            };
        }
    };
}
