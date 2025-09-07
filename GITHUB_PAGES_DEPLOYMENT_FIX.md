# GitHub Pages 部署问题修复方案

## 问题描述

在 GitHub Pages 部署时，页面出现以下错误：
```
articles/:186 GET https://comcloud.github.io/assets/data/articles.json?t=1757238657147 404 (Not Found)
articles/:186 GET https://comcloud.github.io/assets/blog-data.json?t=1757238657333 404 (Not Found)
```

## 问题根本原因

GitHub Pages 出于安全考虑，不支持运行自定义 Jekyll 插件（`_plugins` 目录中的插件）。而我们的项目依赖以下插件来生成动态内容：

1. `blog_scanner.rb` - 生成 `blog-data.json`
2. `articles_index_generator.rb` - 生成 `assets/data/articles.json`  
3. `articles_generator.rb` - 生成文章页面
4. `markdown_generator.rb` - 处理 Markdown 文件

本地开发时这些插件正常运行，但在 GitHub Pages 上不会执行，导致 JSON 数据文件不存在。

## 解决方案

### 方案一：使用 GitHub Actions（推荐）

**优点**：
- ✅ 保持所有功能完整
- ✅ 自动化部署
- ✅ 自定义插件正常工作
- ✅ 构建过程可控

**实施步骤**：

1. **创建 GitHub Actions 工作流**
   已创建 `.github/workflows/jekyll.yml` 文件，包含完整的构建和部署配置。

2. **创建 Gemfile**
   已创建 `Gemfile` 来管理依赖。

3. **配置 GitHub Pages**
   - 在 GitHub 仓库设置中
   - 进入 "Pages" 选项
   - 将源设置为 "GitHub Actions"

4. **提交并推送代码**
   ```bash
   git add .
   git commit -m "Add GitHub Actions workflow for custom Jekyll build"
   git push origin main
   ```

### 方案二：静态回退机制（应急方案）

**优点**：
- ✅ 立即可用
- ✅ 无需额外配置  
- ✅ 核心功能可用

**缺点**：
- ❌ 内容需要手动维护
- ❌ 无法自动检测新文章

**实施详情**：
已在 `articles.md` 中添加 `loadStaticFallback()` 函数，当动态加载失败时自动使用预定义的文章列表。

## 部署流程

### GitHub Actions 方案
1. 代码推送到主分支
2. GitHub Actions 自动触发
3. 在 Ubuntu 环境中运行 Jekyll 构建
4. 执行自定义插件生成 JSON 文件
5. 将构建结果部署到 GitHub Pages

### 静态回退方案
1. 前端首先尝试加载动态数据
2. 如果所有数据源都失败，自动切换到静态数据
3. 显示"静态模式"提示

## 验证方法

1. **检查部署状态**
   - 访问仓库的 "Actions" 标签页
   - 确认工作流运行成功

2. **测试页面功能**
   - 访问 `/articles/` 页面
   - 确认文章正常显示
   - 检查浏览器控制台无错误

3. **验证 JSON 文件**
   - 直接访问 `https://comcloud.github.io/assets/blog-data.json`
   - 直接访问 `https://comcloud.github.io/assets/data/articles.json`
   - 确认返回 200 状态码

## 故障排除

### GitHub Actions 构建失败
1. 检查 Gemfile 依赖是否正确
2. 确认 `_config.yml` 配置无误
3. 查看 Actions 日志定位具体错误

### 页面仍显示 404 错误
1. 清除浏览器缓存
2. 确认 GitHub Pages 源设置为 "GitHub Actions"
3. 检查最新部署是否成功

### 静态回退不工作
1. 确认浏览器控制台无 JavaScript 错误
2. 检查静态数据格式是否正确
3. 验证 URL 路径是否匹配

## 长期维护

1. **定期更新静态回退数据**
   添加新文章时，同步更新 `articles.md` 中的 `loadStaticFallback()` 函数

2. **监控构建状态**
   订阅 GitHub Actions 通知，及时发现构建问题

3. **性能优化**
   考虑使用 CDN 或缓存策略来提升访问速度

## 相关文件

- `.github/workflows/jekyll.yml` - GitHub Actions 工作流
- `Gemfile` - Ruby 依赖管理
- `articles.md` - 文章页面（包含静态回退）
- `_plugins/` - Jekyll 自定义插件目录
- `_config.yml` - Jekyll 配置文件