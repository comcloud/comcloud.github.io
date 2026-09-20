# 随手记

个人思考与观察的写作站点。基于 [Dante](https://github.com/JustGoodUI/dante-astro-theme) 主题（GPL-3.0，见 `LICENSE`），用 [Astro](https://astro.build) 生成纯静态文件，通过 GitHub Actions 自动发布到 GitHub Pages。

## 写一篇文章

```bash
npm run new silver-economy "银发经济不是老年人生意" "银发经济,消费"
```

三个参数依次是：**英文 slug**（会直接成为网址 `/blog/silver-economy/`）、**标题**、**逗号分隔的标签**（标签可以用中文）。

如果设置了 `EDITOR` 环境变量，脚本会自动打开编辑器；否则手动编辑生成的 `src/content/blog/<slug>.md`：

```yaml
---
title: 文章标题
excerpt: 一句话摘要，会显示在列表和分享卡片上
publishDate: '2026-09-20'
isFeatured: true # 可选，true 会出现在首页「精选」
tags:
  - 银发经济
---
正文用 Markdown 写在这里。
```

本地预览：

```bash
npm run dev      # http://localhost:4321
```

## 发布

推送到 `main` 分支即自动构建上线，无需手动操作：

```bash
git add src/content/blog/你的文章.md
git commit -m "Add: 文章标题"
git push
```

站点地址：<https://comcloud.github.io>（RSS：<https://comcloud.github.io/rss.xml>）。

## 常用改动位置

| 想改什么                                  | 文件                                                      |
| ----------------------------------------- | --------------------------------------------------------- |
| 站点标题、简介、导航、社交链接、首页导语  | `src/data/site-config.ts`                                 |
| 配色（浅色/深色变量，文件里附了几套备选） | `src/styles/global.css`                                   |
| 中文字体栈                                | `src/styles/global.css` 的 `--font-sans` / `--font-serif` |
| 「关于」「联系」页                        | `src/content/pages/`                                      |
| 图标                                      | `public/favicon.svg`                                      |
| 每页显示多少篇文章                        | `src/data/site-config.ts` 的 `postsPerPage`               |

改完记得同步 `src/data/site-config.ts` 里的 `website` 字段，它决定 RSS 和分享链接用的域名。

## 命令

| 命令              | 作用                           |
| ----------------- | ------------------------------ |
| `npm run dev`     | 本地开发服务器，改文件即时刷新 |
| `npm run new`     | 按模板新建一篇文章             |
| `npm run build`   | 构建静态站点到 `dist/`         |
| `npm run preview` | 预览构建产物                   |
| `npm run check`   | 类型检查                       |

## 说明

- 字体走的是系统字体（苹方 / 微软雅黑 / 宋体），不引用 Google Fonts，国内访问不会卡住。
- 中文标签会生成中文 URL（如 `/tags/银发经济/`），GitHub Pages 支持，分享时会自动做百分号编码。
- 首页订阅框默认关闭（`subscribe.enabled: false`），接上表单服务后可在 `src/data/site-config.ts` 打开。

## 致谢

主题与排版设计来自 [Dante Astro.js theme](https://justgoodui.com/astro-themes/dante/) by JustGoodUI，GPL-3.0 许可；`LICENSE` 保留其原始授权文本。你的文章是独立作品，不受该许可约束。
