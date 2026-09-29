type MdastNode = {
    type: string;
    value?: string;
    children?: MdastNode[];
};

function escapeHtml(value: string) {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// 上标 ^2^ / ^{2}，下标 _{2}。~~ 已经被 GFM 的删除线占了，所以这里不走 ~x~ 那套写法
const MARK = /\^\{([^{}\n]+)\}|\^([^\s^]{1,24})\^|_\{([^{}\n]+)\}/g;

function splitText(value: string) {
    const nodes: MdastNode[] = [];
    let cursor = 0;

    for (const match of value.matchAll(MARK)) {
        const [raw, bracedSup, plainSup, bracedSub] = match;
        if (match.index! > cursor) nodes.push({ type: 'text', value: value.slice(cursor, match.index) });
        const tag = bracedSub === undefined ? 'sup' : 'sub';
        const text = bracedSub ?? bracedSup ?? plainSup ?? '';
        nodes.push({ type: 'html', value: `<${tag}>${escapeHtml(text)}</${tag}>` });
        cursor = match.index! + raw.length;
    }

    if (nodes.length === 0) return null;
    if (cursor < value.length) nodes.push({ type: 'text', value: value.slice(cursor) });
    return nodes;
}

function walk(nodes: MdastNode[]) {
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (!node.children) continue;

        const next: MdastNode[] = [];
        for (const child of node.children) {
            const parts = child.type === 'text' && child.value ? splitText(child.value) : null;
            if (parts) next.push(...parts);
            else next.push(child);
        }
        node.children = next;
        walk(next);
    }
}

export default function remarkSubSup() {
    return function transform(tree: MdastNode) {
        if (tree.children) walk(tree.children);
    };
}
