type MdastNode = {
    type: string;
    value?: string;
    children?: MdastNode[];
    data?: { hProperties?: Record<string, unknown> };
    position?: { start: { offset: number }; end: { offset: number } };
};

const LABELS: Record<string, string> = {
    note: '说明',
    tip: '提示',
    important: '重要',
    warning: '注意',
    caution: '警告'
};

const HEADER = /^:::([a-z-]+)(?:[ \t]+([^\n]*?))?[ \t]*$/;
// 紧跟在列表后面的 ::: 会被 CommonMark 当成列表续行，prettier 还会给它补上缩进，所以允许行首空白
const FOOT = /^[ \t]{0,3}:::[ \t]*$/m;
const SPAN_LIMIT = 8000;

export default function remarkContainers(this: { parse(value: string): MdastNode }) {
    const processor = this;

    return function transform(tree: MdastNode, file: { value?: unknown }) {
        const source = String(file.value ?? '');
        const nodes = tree.children;
        if (!nodes || source.length === 0) return;

        for (let i = 0; i < nodes.length; i++) {
            const start = nodes[i].position?.start.offset;
            if (start === undefined) continue;

            const lineEnd = source.indexOf('\n', start);
            const header = lineEnd < 0 ? null : HEADER.exec(source.slice(start, lineEnd));
            if (!header || !(header[1].toLowerCase() in LABELS)) continue;

            const bodyStart = lineEnd + 1;
            const foot = FOOT.exec(source.slice(bodyStart, bodyStart + SPAN_LIMIT));
            if (!foot) continue;

            const closeEnd = bodyStart + foot.index + foot[0].length;
            let last = i;
            while (last + 1 < nodes.length) {
                const next = nodes[last + 1].position;
                if (!next || next.end.offset > closeEnd) break;
                last++;
            }

            const kind = header[1].toLowerCase();
            const block: MdastNode[] = [
                { type: 'html', value: `<div class="markdown-alert markdown-alert-${kind}">` },
                {
                    type: 'paragraph',
                    data: { hProperties: { className: ['markdown-alert-title'] } },
                    children: [{ type: 'text', value: header[2]?.trim() || LABELS[kind] }]
                },
                ...processor.parse(source.slice(bodyStart, bodyStart + foot.index)).children!,
                { type: 'html', value: '</div>' }
            ];

            nodes.splice(i, last - i + 1, ...block);
            i += block.length - 1;
        }
    };
}
