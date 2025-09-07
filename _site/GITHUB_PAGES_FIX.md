# GitHub Pages 文章加载问题修复指南

## 🎯 问题描述

在 GitHub Pages 部署后，文章页面显示 "❌ 文章加载失败，请稍后重试" 错误。

## 🔍 问题根因

1. **数据文件路径问题**：GitHub Pages 与本地环境的资源路径可能不一致
2. **Jekyll 插件限制**：GitHub Pages 对自定义插件有限制
3. **baseurl 配置问题**：部署环境的 baseurl 设置可能需要调整

## ✅ 已修复的内容

### 1. 增强数据源兼容性

- **多路径尝试**：修改了 `articles.md` 和 `index.html`，现在会尝试多个可能的数据源路径
- **数据格式转换**：支持 `articles.json` 和 `blog-data.json` 两种数据格式的自动转换
- **错误处理优化**：提供更友好的错误提示和降级方案

### 2. 修复的文件

#### `articles.md`
- 新增多路径加载逻辑
- 支持 blog-data.json 格式自动转换
- 改进错误提示信息

#### `index.html`
- 主页精选文章加载优化
- 统计信息加载优化
- 数据源自动切换功能

#### `_config.yml`
- 修正 GitHub Pages 的 URL 配置

## 🚀 部署到 GitHub Pages

### 方法一：直接推送（推荐）

```bash
# 提交修改
git add .
git commit -m "修复文章加载失败问题，增强数据源兼容性"
git push origin main
```

### 方法二：如果 Jekyll 插件在 GitHub Pages 不工作

如果 GitHub Pages 不支持自定义插件，可以使用 GitHub Actions：

创建 `.github/workflows/build.yml`：

```yaml
name: Build and Deploy
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout
      uses: actions/checkout@v2

    - name: Setup Ruby
      uses: ruby/setup-ruby@v1
      with:
        ruby-version: 3.0
        bundler-cache: true

    - name: Build site
      run: bundle exec jekyll build

    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      if: github.ref == 'refs/heads/main'
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./_site
```

## 🔧 验证修复效果

### 本地测试
1. 运行 `bundle exec jekyll serve`
2. 访问 `http://localhost:4000/articles/`
3. 检查文章是否正常加载

### 线上测试
1. 部署到 GitHub Pages 后
2. 打开浏览器开发者工具
3. 查看 Console 中的日志信息
4. 确认数据加载成功

## 📋 故障排查清单

如果问题仍然存在，请检查：

- [ ] GitHub Pages 是否正确构建
- [ ] 数据文件是否正确生成
- [ ] 浏览器开发者工具中的网络请求状态
- [ ] Console 中的错误信息

## 🎉 预期效果

修复后，您的文章页面应该：

- ✅ 正常加载所有文章列表
- ✅ 显示正确的分类和标签
- ✅ 支持文章搜索和筛选
- ✅ 在主页显示精选文章
- ✅ 显示正确的统计信息

## 📞 技术支持

如果您在部署过程中遇到任何问题，请：

1. 检查浏览器开发者工具的 Console 输出
2. 查看 GitHub Pages 的构建日志
3. 确认数据文件是否正确生成

修复完成！您的 Jekyll 博客现在应该能够在 GitHub Pages 上正常显示文章了。