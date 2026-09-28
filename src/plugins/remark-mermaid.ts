type MdastNode = { type: string; lang?: string | null; value?: string; children?: MdastNode[] };

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

function transformNodes(nodes: MdastNode[]) {
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

        if (node.children) transformNodes(node.children);
        kept.push(node);
    }

    nodes.length = 0;
    nodes.push(...kept);
}

// 必须在 Shiki 之前把 mermaid 代码块换成原始 HTML，否则源码会被拆成一堆带颜色的 span
export default function remarkMermaid() {
    return function transform(tree: MdastNode) {
        if (tree.children) transformNodes(tree.children);
    };
}
