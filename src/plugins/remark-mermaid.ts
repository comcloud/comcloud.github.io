type MdastNode = {
    type: string;
    lang?: string | null;
    value?: string;
    children?: MdastNode[];
    position?: { start: { offset: number }; end: { offset: number } };
};

function escapeHtml(value: string) {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// 正文里直接粘的 <pre class="mermaid"> 源码会被浏览器当成标签吃掉（比如 <br/>），先还原成纯文本
function normalizeInlineMermaid(value: string) {
    return value.replace(/<pre class="mermaid">([\s\S]*?)<\/pre>/g, (_match, inner: string) => {
        const text = inner.replace(/<br\s*\/?>/gi, '<br/>');
        return `<pre class="mermaid">${escapeHtml(text)}</pre>`;
    });
}

// 发文流水线会连着 <style> 和 CDN 版 <script> 一起粘进正文，脚本还漏过闭合标签把页脚吞掉；
// 渲染统一由站点自己做，正文里的这两类标签整段丢掉
function stripEmbeddedAssets(value: string) {
    const cut = /<(script|style)\b/i.exec(value);
    return cut ? value.slice(0, cut.index) : value;
}

const OPEN = '<pre class="mermaid">';
const CLOSE = '</pre>';

function isUnclosedDiagram(node: MdastNode) {
    const value = node.value || '';
    return node.type === 'html' && value.includes(OPEN) && !value.includes(CLOSE);
}

// 结构性的行不能出现在图源码中间，出现了就说明我们找到的 </pre> 属于别的块
function looksLikeStructure(value: string) {
    return /<div\b|<p\b|<(script|style)\b|^ {0,3}#{1,6} /m.test(value);
}

// 发文流水线粘进来的图，图里一空行就被 CommonMark 截断成「未闭合的 <pre> + 若干段正文」，
// 中间那段会被当成普通代码块，站点的代码块表头文字于是混进了图源码。按原文位置并回去。
function mergeSpilledDiagrams(nodes: MdastNode[], source: string) {
    const kept: MdastNode[] = [];

    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (!isUnclosedDiagram(node) || !node.position) {
            kept.push(node);
            continue;
        }

        const start = node.position.start.offset;
        const close = source.indexOf(CLOSE, node.position.end.offset);
        if (close < 0 || close - node.position.end.offset > 4000) {
            kept.push(node);
            continue;
        }

        let last = -1;
        for (let j = i + 1; j < nodes.length && (nodes[j].position?.start.offset ?? Infinity) < close; j++) last = j;
        if (last < 0) {
            kept.push(node);
            continue;
        }

        const end = nodes[last].position!.end.offset;
        if (looksLikeStructure(source.slice(node.position.end.offset, end))) {
            kept.push(node);
            continue;
        }

        kept.push({ type: 'html', value: source.slice(start, end) });
        i = last;
    }

    nodes.length = 0;
    nodes.push(...kept);
}

function transformNodes(nodes: MdastNode[], source: string) {
    mergeSpilledDiagrams(nodes, source);

    const kept: MdastNode[] = [];

    for (const node of nodes) {
        if (node.type === 'code' && (node.lang || '').toLowerCase() === 'mermaid') {
            kept.push({ type: 'html', value: `<pre class="mermaid">${escapeHtml(node.value || '')}</pre>` });
            continue;
        }

        if (node.type === 'html') {
            const value = normalizeInlineMermaid(stripEmbeddedAssets(node.value || '')).trim();
            if (value) kept.push({ ...node, value });
            continue;
        }

        if (node.children) transformNodes(node.children, source);
        kept.push(node);
    }

    nodes.length = 0;
    nodes.push(...kept);
}

// 必须在 Shiki 之前把 mermaid 代码块换成原始 HTML，否则源码会被拆成一堆带颜色的 span
export default function remarkMermaid() {
    return function transform(tree: MdastNode, file: { value?: unknown }) {
        if (tree.children) transformNodes(tree.children, String(file.value ?? ''));
    };
}
