/**
 * 动态内容加载器 - Jekyll博客专用
 * 实现客户端动态目录扫描和文件展示功能
 */
class DynamicBlogLoader {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || '';
    this.blogPath = options.blogPath || '/blog/';
    this.loadingClass = options.loadingClass || 'loading';
    this.errorClass = options.errorClass || 'error';
    this.cache = new Map();
    this.cacheTimeout = options.cacheTimeout || 300000; // 5分钟缓存
  }

  /**
   * 初始化动态加载器
   */
  init() {
    this.setupStyles();
    this.bindEvents();
    console.log('Dynamic Blog Loader initialized');
  }

  /**
   * 设置必要的样式
   */
  setupStyles() {
    const styles = `
      .dynamic-loading {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px;
        color: #666;
      }
      
      .loading-spinner {
        width: 20px;
        height: 20px;
        border: 2px solid #f3f3f3;
        border-top: 2px solid #333;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-right: 10px;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .series-meta {
        font-size: 0.9em;
        color: #888;
        margin-top: 5px;
      }
      
      .file-type-badge {
        display: inline-block;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 0.7em;
        font-weight: bold;
        text-transform: uppercase;
        margin-left: 5px;
      }
      
      .file-type-md {
        background: #e3f2fd;
        color: #1976d2;
      }
      
      .file-type-html {
        background: #fff3e0;
        color: #f57c00;
      }
      
      .auto-refresh-indicator {
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 8px 12px;
        border-radius: 20px;
        font-size: 12px;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      .auto-refresh-indicator.active {
        opacity: 1;
      }
      
      .directory-structure {
        margin: 20px 0;
        padding-left: 20px;
        border-left: 2px solid #eee;
      }
      
      .directory-item {
        margin: 5px 0;
      }
      
      .directory-name {
        font-weight: bold;
        color: #333;
      }
      
      .file-list {
        margin-left: 20px;
      }
    `;
    
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }

  /**
   * 绑定事件监听器
   */
  bindEvents() {
    // 页面可见性变化时刷新内容
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.refreshContent();
      }
    });

    // 窗口焦点变化时刷新内容
    window.addEventListener('focus', () => {
      this.refreshContent();
    });
  }

  /**
   * 加载博客系列数据
   */
  async loadBlogSeries(container) {
    if (!container) return;

    this.showLoading(container);

    try {
      const blogData = await this.fetchBlogData();
      this.renderBlogSeries(container, blogData);
      this.showAutoRefreshIndicator('内容已更新');
    } catch (error) {
      console.error('Failed to load blog series:', error);
      this.showError(container, '加载博客系列失败，请刷新页面重试');
    }
  }

  /**
   * 获取博客数据（带缓存）
   */
  async fetchBlogData() {
    const cacheKey = 'blog-data';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await fetch(`${this.baseUrl}/assets/blog-data.json?t=${Date.now()}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      
      // 缓存数据
      this.cache.set(cacheKey, {
        data: data,
        timestamp: Date.now()
      });
      
      return data;
    } catch (error) {
      // 如果有缓存数据，使用缓存
      if (cached) {
        console.warn('Using cached data due to fetch error:', error);
        return cached.data;
      }
      throw error;
    }
  }

  /**
   * 渲染博客系列
   */
  renderBlogSeries(container, blogData) {
    container.innerHTML = '';

    if (!blogData || blogData.length === 0) {
      container.innerHTML = '<p class="no-content">暂无博客系列</p>';
      return;
    }

    // 重新组织数据结构，支持多层级目录
    const organizedData = this.organizeData(blogData);
    this.renderOrganizedData(container, organizedData);
  }

  /**
   * 组织数据结构，支持多层级目录
   */
  organizeData(blogData) {
    const result = [];
    
    blogData.forEach(item => {
      if (item.path) {
        // 这是一个目录
        const pathParts = item.path.split('/');
        let currentLevel = result;
        
        // 遍历路径部分，创建嵌套结构
        for (let i = 0; i < pathParts.length; i++) {
          const part = pathParts[i];
          let existing = currentLevel.find(dir => dir.name === part);
          
          if (!existing) {
            if (i === pathParts.length - 1) {
              // 最后一级，是实际的系列目录
              existing = {
                name: part,
                title: item.title || `${part} Series`,
                description: item.description || `Explore articles in the ${part} series.`,
                files: item.files || [],
                path: item.path
              };
              currentLevel.push(existing);
            } else {
              // 中间级目录
              existing = {
                name: part,
                children: [],
                path: pathParts.slice(0, i+1).join('/')
              };
              currentLevel.push(existing);
            }
          }
          
          if (i < pathParts.length - 1) {
            // 不是最后一级，继续深入
            if (!existing.children) {
              existing.children = [];
            }
            currentLevel = existing.children;
          }
        }
      } else {
        // 这是一个顶层系列
        result.push(item);
      }
    });
    
    return result;
  }

  /**
   * 渲染组织后的数据
   */
  renderOrganizedData(container, data, level = 0) {
    data.forEach(item => {
      if (item.files || item.children) {
        const article = this.createDirectoryElement(item, level);
        container.appendChild(article);
      } else {
        // 单独的系列
        const article = this.createSeriesElement(item);
        container.appendChild(article);
      }
    });
  }

  /**
   * 创建目录元素
   */
  createDirectoryElement(directory, level = 0) {
    const article = document.createElement('article');
    article.className = 'post';

    let contentHtml = '';
    
    if (directory.files && directory.files.length > 0) {
      contentHtml = '<ul class="series-files">';
      directory.files.forEach(file => {
        const fileName = file.name.replace(/\.(md|html)$/, '').replace(/-/g, ' ');
        const displayName = fileName.charAt(0).toUpperCase() + fileName.slice(1);
        const fileType = file.type || (file.name.endsWith('.md') ? 'md' : 'html');
        const badge = `<span class="file-type-badge file-type-${fileType}">${fileType}</span>`;
        
        contentHtml += `<li>
          <a href="${file.url}">${displayName}</a>
          ${badge}
        </li>`;
      });
      contentHtml += '</ul>';
      
      // 添加系列元信息
      contentHtml += `<div class="series-meta">${directory.files.length} 篇文章</div>`;
    }
    
    // 如果有子目录，显示子目录结构
    if (directory.children && directory.children.length > 0) {
      contentHtml += '<div class="directory-structure">';
      contentHtml += `<div class="directory-item"><span class="directory-name">${directory.name}/</span>`;
      contentHtml += '<div class="file-list">';
      this.renderOrganizedDataContent(contentHtml, directory.children, 1);
      contentHtml += '</div></div>';
      contentHtml += '</div>';
    }

    article.innerHTML = `
      <div class="post-thumbnail">
        <div class="placeholder-image">${directory.title || directory.name}</div>
      </div>
      <div class="post-content">
        <h2><a href="${this.baseUrl}/blog/${directory.path || directory.name}/">${directory.title || directory.name}</a></h2>
        <p>${directory.description || `Explore articles in the ${directory.name} series.`}</p>
        ${contentHtml}
        <a href="${this.baseUrl}/blog/${directory.path || directory.name}/" class="read-more">查看系列 →</a>
      </div>
    `;

    return article;
  }

  /**
   * 递归渲染组织后的数据内容
   */
  renderOrganizedDataContent(contentHtml, data, level) {
    data.forEach(item => {
      if (item.files || item.children) {
        contentHtml += `<div class="directory-item"><span class="directory-name">${item.name}/</span>`;
        
        if (item.files && item.files.length > 0) {
          contentHtml += '<ul class="series-files file-list">';
          item.files.forEach(file => {
            const fileName = file.name.replace(/\.(md|html)$/, '').replace(/-/g, ' ');
            const displayName = fileName.charAt(0).toUpperCase() + fileName.slice(1);
            contentHtml += `<li><a href="${file.url}">${displayName}</a></li>`;
          });
          contentHtml += '</ul>';
        }
        
        if (item.children && item.children.length > 0) {
          contentHtml += '<div class="file-list">';
          this.renderOrganizedDataContent(contentHtml, item.children, level + 1);
          contentHtml += '</div>';
        }
        
        contentHtml += '</div>';
      }
    });
  }

  /**
   * 创建系列元素
   */
  createSeriesElement(series) {
    const article = document.createElement('article');
    article.className = 'post';

    let filesHtml = '';
    if (series.files && series.files.length > 0) {
      filesHtml = '<ul class="series-files">';
      series.files.forEach(file => {
        const fileName = file.name.replace(/\.(md|html)$/, '').replace(/-/g, ' ');
        const displayName = fileName.charAt(0).toUpperCase() + fileName.slice(1);
        const fileType = file.type || (file.name.endsWith('.md') ? 'md' : 'html');
        const badge = `<span class="file-type-badge file-type-${fileType}">${fileType}</span>`;
        
        filesHtml += `<li>
          <a href="${file.url}">${displayName}</a>
          ${badge}
        </li>`;
      });
      filesHtml += '</ul>';
      
      // 添加系列元信息
      filesHtml += `<div class="series-meta">${series.files.length} 篇文章</div>`;
    }

    article.innerHTML = `
      <div class="post-thumbnail">
        <div class="placeholder-image">${series.title}</div>
      </div>
      <div class="post-content">
        <h2><a href="${this.baseUrl}/blog/${series.name}/">${series.title}</a></h2>
        <p>${series.description || `Explore articles in the ${series.name} series.`}</p>
        ${filesHtml}
        <a href="${this.baseUrl}/blog/${series.name}/" class="read-more">查看系列 →</a>
      </div>
    `;

    return article;
  }

  /**
   * 显示加载状态
   */
  showLoading(container) {
    container.innerHTML = `
      <div class="dynamic-loading">
        <div class="loading-spinner"></div>
        <span>正在加载博客内容...</span>
      </div>
    `;
  }

  /**
   * 显示错误状态
   */
  showError(container, message) {
    container.innerHTML = `
      <div class="dynamic-loading error">
        <span>⚠️ ${message}</span>
      </div>
    `;
  }

  /**
   * 显示自动刷新指示器
   */
  showAutoRefreshIndicator(message) {
    let indicator = document.querySelector('.auto-refresh-indicator');
    
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.className = 'auto-refresh-indicator';
      document.body.appendChild(indicator);
    }

    indicator.textContent = message;
    indicator.classList.add('active');

    setTimeout(() => {
      indicator.classList.remove('active');
    }, 3000);
  }

  /**
   * 刷新内容
   */
  async refreshContent() {
    // 清除缓存
    this.cache.clear();
    
    // 重新加载所有博客系列容器
    const containers = document.querySelectorAll('[data-dynamic-blog]');
    containers.forEach(container => {
      this.loadBlogSeries(container);
    });
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.cache.clear();
    console.log('Blog data cache cleared');
  }
  
  /**
   * 渲染Markdown内容
   */
  async renderMarkdownContent(url, container) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const markdownText = await response.text();
      // 简单的Markdown到HTML转换（实际项目中可能需要使用专门的库）
      const htmlContent = this.convertMarkdownToHtml(markdownText);
      container.innerHTML = htmlContent;
    } catch (error) {
      console.error('Failed to render Markdown content:', error);
      container.innerHTML = `<p>无法加载内容，请稍后重试。</p>`;
    }
  }
  
  /**
   * 简单的Markdown到HTML转换
   * 注意：这是一个简化的实现，实际项目中建议使用专门的Markdown解析库
   */
  convertMarkdownToHtml(markdown) {
    let html = markdown;
    
    // 转换标题
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // 转换粗体和斜体
    html = html.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>');
    html = html.replace(/\*(.*)\*/gim, '<em>$1</em>');
    
    // 转换代码块
    html = html.replace(/```([a-z]*)\n([\s\S]*?)\n```/gim, '<pre><code class="language-$1">$2</code></pre>');
    
    // 转换行内代码
    html = html.replace(/`(.*?)`/gim, '<code>$1</code>');
    
    // 转换段落
    html = html.replace(/\n\n/gim, '</p><p>');
    html = html.replace(/\n/gim, '<br />');
    
    // 包裹段落
    html = '<p>' + html + '</p>';
    
    return html;
  }
}

// 全局实例
window.DynamicBlogLoader = DynamicBlogLoader;