#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const blogDir = join(root, 'src/content/blog');

const usage = () => {
    console.error('用法: npm run new <英文-slug> "文章标题" "标签1,标签2"');
    console.error('示例: npm run new silver-economy "银发经济不是老年人生意" "银发经济,消费"');
};

const [slug, title = slug?.replaceAll('-', ' '), tagArg = ''] = process.argv.slice(2);

if (!slug) {
    usage();
    process.exit(1);
}

if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    console.error(`slug 只能用小写字母、数字和连字符，它会直接成为网址: ${slug}`);
    process.exit(1);
}

const file = join(blogDir, `${slug}.md`);
if (existsSync(file)) {
    console.error(`已存在: src/content/blog/${slug}.md`);
    process.exit(1);
}

const tags = tagArg
    .split(/[,，]/)
    .map((tag) => tag.trim())
    .filter(Boolean);

const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });

const body = [
    '---',
    `title: ${title}`,
    "excerpt: ''",
    `publishDate: '${today}'`,
    tags.length ? `tags:\n${tags.map((tag) => `  - ${tag}`).join('\n')}` : 'tags: []',
    '---',
    '',
    ''
].join('\n');

await mkdir(blogDir, { recursive: true });
await writeFile(file, body, 'utf8');

console.log(`已创建 src/content/blog/${slug}.md`);

const editor = process.env.VISUAL || process.env.EDITOR;
if (editor && process.stdin.isTTY && process.stdout.isTTY) {
    spawn(editor, [file], { stdio: 'inherit' });
} else {
    console.log('下一步：填好 excerpt 和 tags，然后 npm run dev 预览');
}
