type MdastNode = {
    type: string;
    value?: string;
    children?: MdastNode[];
};

const DEFINITION = /^\*\[([^\]\n]+)\]:[ \t]*(.*?)[ \t]*$/;

function escapeAttr(value: string) {
    return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function isPlainText(node: MdastNode) {
    return node.type === 'paragraph' && !!node.children && node.children.every((child) => child.type === 'text');
}

// 术语表：`*[KPI]: 关键绩效指标`。整段只放定义，正文里再出现这个缩写时自动挂上 title
function collectDefinitions(nodes: MdastNode[]) {
    const definitions = new Map<string, string>();

    for (let i = nodes.length - 1; i >= 0; i--) {
        const node = nodes[i];
        if (!isPlainText(node)) continue;

        const rest: string[] = [];
        for (const line of node
            .children!.map((child) => child.value || '')
            .join('\n')
            .split('\n')) {
            const match = DEFINITION.exec(line);
            if (match) definitions.set(match[1].trim(), match[2].trim());
            else rest.push(line);
        }

        const leftover = rest.join('\n').trim();
        if (leftover) node.children = [{ type: 'text', value: leftover }];
        else nodes.splice(i, 1);
    }

    return definitions;
}

function applyAbbreviations(nodes: MdastNode[], definitions: Map<string, string>, keys: RegExp) {
    for (const node of nodes) {
        // 链接、标题、代码和已经生成的 abbr 里都不再替换，避免嵌套出无意义的 title
        if (!node.children || node.type === 'inlineCode' || node.type === 'link' || node.type === 'html' || node.type === 'heading') continue;

        const next: MdastNode[] = [];
        for (const child of node.children) {
            if (child.type !== 'text' || !child.value) {
                next.push(child);
                continue;
            }
            let cursor = 0;
            for (const match of child.value.matchAll(keys)) {
                if (match.index! > cursor) next.push({ type: 'text', value: child.value.slice(cursor, match.index) });
                const title = definitions.get(match[0]);
                next.push({ type: 'html', value: `<abbr title="${escapeAttr(title || '')}">${match[0]}</abbr>` });
                cursor = match.index! + match[0].length;
            }
            if (cursor < child.value.length) next.push({ type: 'text', value: child.value.slice(cursor) });
        }

        node.children = next;
        applyAbbreviations(next, definitions, keys);
    }
}

export default function remarkAbbr() {
    return function transform(tree: MdastNode) {
        if (!tree.children) return;
        const definitions = collectDefinitions(tree.children);
        if (definitions.size === 0) return;

        const keys = new RegExp(
            [...definitions.keys()]
                .sort((a, b) => b.length - a.length)
                .map((key) => key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
                .join('|'),
            'g'
        );
        applyAbbreviations(tree.children, definitions, keys);
    };
}
