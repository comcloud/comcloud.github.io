#!/usr/bin/env node
// 把 issue 正文翻译成 src/content/blog/<slug>.md。
// 由 .github/workflows/publish-from-issue.yml 调用，也可本地跑：
//   ISSUE_BODY="$(cat draft.md)" node scripts/issue-to-post.mjs

import { mkdirSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BLOG_DIR = 'src/content/blog';
const MIN_BODY_CHARS = 200;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

class PostError extends Error {}

function fail(message) {
    throw new PostError(message);
}

// 只认 ASCII 日期，避免 CI 的 UTC 和北京差一天
function todayInShanghai() {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
}

function parseBlockquoteless(text) {
    return text
        .replace(/`([^`]*)`/g, '$1')
        .replace(/\*\*([^*]*)\*\*/g, '$1')
        .replace(/\*([^*]*)\*/g, '$1')
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/[*_~>]/g, '');
}

// 缺 excerpt 时拿第一段正文顶上，它同时是 og description 的来源
function deriveExcerpt(body) {
    const paragraph = body
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .find((p) => p && !/^([#>|`-]|\d+\.)/.test(p));

    if (!paragraph) return '';

    const clean = parseBlockquoteless(paragraph.replace(/\s+/g, ' ')).trim();
    if (clean.length <= 120) return clean;
    return `${clean.slice(0, 120).replace(/[，。、；：,.;:]\s*$/, '')}……`;
}

// ChatGPT 经常把 tags 写成 [a, b, c] 或 ["a", "b"]，方括号和引号都得吃掉
function splitTags(raw) {
    if (!raw) return [];
    const inner = raw.trim().replace(/^\[(.*)\]$/, '$1');
    const items = inner
        .split(/[,，]/)
        .map((t) => t.trim().replace(/^["'`](.*)["'`]$/, '$1').trim())
        .filter(Boolean);
    return [...new Set(items)];
}

function parseMetadata(block) {
    const meta = {};
    for (const line of block.split(/\r?\n/)) {
        if (!line.trim() || line.trim().startsWith('#')) continue;
        const match = line.match(/^\s*([A-Za-z_][\w-]*)\s*:\s?(.*)$/);
        if (!match) fail(`元数据行看不懂：${line}（格式应为 "key: value"，每行一条）`);
        meta[match[1].toLowerCase()] = match[2].trim();
    }
    return meta;
}

function splitIssue(body) {
    const match = body.match(/^\uFEFF?\s*---\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/);
    if (!match) {
        fail(
            '正文开头缺少元数据块。第一篇内容必须长这样：\n\n---\ntitle: 文章标题\nslug: english-slug\ntags: 标签1, 标签2\n---\n\n正文……'
        );
    }
    return { meta: parseMetadata(match[1]), body: body.slice(match[0].length).trim() };
}

function yamlList(items) {
    if (items.length === 0) return '[]';
    return `\n${items.map((i) => `  - ${JSON.stringify(i)}`).join('\n')}`;
}

function quote(value) {
    return JSON.stringify(value);
}

function frontmatter({ title, date, isFeatured, tags, excerpt, issue }) {
    const featured = isFeatured ? 'true' : 'false';
    const excerptLine = excerpt ? `excerpt: ${quote(excerpt)}` : 'excerpt: ""';
    return `---\ntitle: ${quote(title)}\n${excerptLine}\npublishDate: ${quote(date)}\nisFeatured: ${featured}\ntags: ${yamlList(tags)}\nissue: ${issue}\n---\n`;
}

function assertSlugFree(path, slug, issue) {
    if (!existsSync(path)) return;

    const existing = readFileSync(path, 'utf8').match(/^issue:\s*(\d+)\s*$/m);
    const owner = existing ? existing[1] : '手工创建的那篇';

    if (existing && existing[1] !== String(issue)) {
        fail(`slug "${slug}" 已经被 issue #${owner} 生成的文章占用。换一个 slug，或者去那个 issue 里改。`);
    }
}

function buildFile(body, issue) {
    const { meta, body: content } = splitIssue(body);

    const title = (meta.title || '').replace(/^#+\s*/, '');
    if (!title) fail('元数据里缺少 title。');
    if (title.length > 120) fail(`标题 ${title.length} 字，超过 120 字上限。`);

    const slug = meta.slug || '';
    if (!SLUG_RE.test(slug)) {
        fail(`slug "${slug}" 不合法。只能用英文小写字母、数字和单个连字符，例如 llms-next-bottleneck。`);
    }

    if (content.length < MIN_BODY_CHARS) {
        fail(`正文只有 ${content.length} 字，少于 ${MIN_BODY_CHARS} 字。多半是粘贴不完整，检查后再改一次 issue。`);
    }

    const date = meta.date || todayInShanghai();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) fail(`date "${date}" 不是 YYYY-MM-DD。`);

    const isFeatured = /^(true|yes|y|1|是)$/i.test(meta.featured || '');
    const excerpt = meta.excerpt || deriveExcerpt(content);
    const tags = splitTags(meta.tags);

    const yaml = frontmatter({ title, date, isFeatured, tags, excerpt, issue });
    return { slug, title, content: `${yaml}\n${content}` };
}

function main() {
    const body = process.env.ISSUE_BODY;
    const issue = process.env.ISSUE_NUMBER;

    if (!body) fail('环境变量 ISSUE_BODY 是空的。');
    if (!/^\d+$/.test(issue || '')) fail('环境变量 ISSUE_NUMBER 不是数字。');

    const { slug, title, content } = buildFile(body, issue);
    const path = join(BLOG_DIR, `${slug}.md`);

    mkdirSync(BLOG_DIR, { recursive: true });
    assertSlugFree(path, slug, issue);
    writeFileSync(path, `${content.trimEnd()}\n`, 'utf8');

    // 工作流按 stdout 的第一行取路径，其它信息走 stderr 给人看
    console.log(path);
    console.error(`标题：${title}`);
}

try {
    main();
} catch (error) {
    if (error instanceof PostError) {
        console.error(error.message);
        process.exit(2);
    }
    throw error;
}
