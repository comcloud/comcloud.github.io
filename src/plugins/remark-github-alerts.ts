type MdastNode = {
    type: string;
    value?: string;
    children?: MdastNode[];
    data?: { hProperties?: Record<string, unknown> };
};

const LABELS: Record<string, string> = {
    note: '说明',
    tip: '提示',
    important: '重要',
    warning: '注意',
    caution: '警告'
};

// [!NOTE] 后面可能紧跟换行（官方写法），也可能直接接正文
const MARKER = /^\[!(note|tip|important|warning|caution)\][ \t]*(?:\n[ \t]*)?/i;

function transformNode(node: MdastNode): void {
    if (node.type !== 'blockquote') return;

    const body = node.children?.[0];
    const markerText = body?.children?.[0];
    if (body?.type !== 'paragraph' || markerText?.type !== 'text' || typeof markerText.value !== 'string') return;

    const matched = MARKER.exec(markerText.value);
    if (!matched) return;

    const kind = matched[1].toLowerCase();
    const rest = markerText.value.slice(matched[0].length);
    if (rest) {
        markerText.value = rest;
    } else {
        node.children?.shift();
    }

    node.data ??= {};
    node.data.hProperties = { className: ['markdown-alert', `markdown-alert-${kind}`] };
    node.children?.unshift({
        type: 'paragraph',
        data: { hProperties: { className: ['markdown-alert-title'] } },
        children: [{ type: 'text', value: LABELS[kind] }]
    });
}

function walk(nodes: MdastNode[]): void {
    for (const node of nodes) {
        transformNode(node);
        if (node.children) walk(node.children);
    }
}

// GitHub 的 > [!NOTE] 提示块在 CommonMark 里只是一个引用块，站点把它认出来换成带色卡片
export default function remarkGithubAlerts() {
    return function transform(tree: MdastNode) {
        if (tree.children) walk(tree.children);
    };
}
