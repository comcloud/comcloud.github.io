require 'fileutils'
require 'yaml'

Jekyll::Hooks.register :site, :post_write do |site|
  # 扫描blog目录下的所有markdown文件，为它们创建对应的HTML页面
  blog_dir = File.join(site.source, 'blog')
  
  if Dir.exist?(blog_dir)
    Find.find(blog_dir) do |path|
      next unless File.file?(path) && path.end_with?('.md')
      
      # 计算相对路径
      relative_path = Pathname.new(path).relative_path_from(Pathname.new(blog_dir)).to_s
      relative_path_without_ext = relative_path.gsub(/\.md$/, '')
      
      # 创建目标目录
      output_dir = File.join(site.dest, 'blog', File.dirname(relative_path_without_ext))
      FileUtils.mkdir_p(output_dir)
      
      # 创建一个目录形式的路径（如 /blog/path/to/file/index.html）
      final_output_dir = File.join(output_dir, File.basename(relative_path_without_ext))
      FileUtils.mkdir_p(final_output_dir)
      output_file = File.join(final_output_dir, 'index.html')
      
      # 读取markdown文件
      markdown_content = File.read(path)
      
      # 解析front matter
      if markdown_content.start_with?('---')
        parts = markdown_content.split('---', 3)
        if parts.length >= 3
          begin
            front_matter = YAML.safe_load(parts[1]) || {}
            content = parts[2].strip
          rescue => e
            puts "Warning: Failed to parse YAML in #{path}: #{e.message}"
            front_matter = {}
            content = markdown_content
          end
        else
          front_matter = {}
          content = markdown_content
        end
      else
        front_matter = {}
        content = markdown_content
      end
      
      # 使用Jekyll的markdown转换器
      converter = site.find_converter_instance(::Jekyll::Converters::Markdown)
      html_content = converter.convert(content)
      
      # 生成完整的HTML页面
      title = front_matter['title'] || File.basename(relative_path_without_ext).gsub(/[-_]/, ' ').split.map(&:capitalize).join(' ')
      description = front_matter['description'] || ''
      
      full_html = <<~HTML
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>#{title}</title>
          <meta name="description" content="#{description}">
          <link rel="canonical" href="#{site.config['url']}#{site.baseurl}/blog/#{relative_path_without_ext}/">
          <link href="#{site.baseurl}/assets/css/style.css" rel="stylesheet">
          <link href="https://fonts.googleapis.com/css?family=Lato:400,400i,700,700i%7CNoto+Serif:400,400i,700,700i&display=swap" rel="stylesheet">
          <!-- Prism.js for syntax highlighting -->
          <link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/themes/prism.min.css" rel="stylesheet">
          <!-- MathJax for math formulas -->
          <script async src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.0/es5/tex-mml-chtml.js"></script>
          <script>
            window.MathJax = {
              tex: {
                inlineMath: [['$', '$'], ['\\(', '\\)']],
                displayMath: [['$$', '$$'], ['\\[', '\\]']]
              }
            };
          </script>
        </head>
        <body>
          <div id="page" class="site">
            <div class="inner">
              <header class="site-header">
                <p class="site-title"><a class="logo-text" href="#{site.baseurl}/">#{site.config['title']}</a></p>
                <nav class="site-navigation">
                  <div class="site-navigation-wrap">
                    <ul class="menu">
                      <li class="menu-item"><a href="#{site.baseurl}/">Home</a></li>
                      <li class="menu-item"><a href="#{site.baseurl}/personal/">Personal</a></li>
                      <li class="menu-item"><a href="#{site.baseurl}/articles/">Articles</a></li>
                      <li class="menu-item"><a href="#{site.baseurl}/blog/">Blog</a></li>
                    </ul>
                  </div>
                </nav>
              </header>
              
              <main class="main-content fadeInDown delay_075s">
                <article class="post">
                  <header class="post-header">
                    <h1 class="post-title">#{title}</h1>
                    #{description.empty? ? '' : "<p class=\"post-description\">#{description}</p>"}
                    #{front_matter['date'] ? "<time class=\"post-date\">#{front_matter['date']}</time>" : ''}
                    #{front_matter['tags'] && !front_matter['tags'].empty? ? "<div class=\"post-tags\">#{front_matter['tags'].map { |tag| "<span class=\"tag\">#{tag}</span>" }.join(' ')}</div>" : ''}
                  </header>
                  <div class="post-content">
                    #{html_content}
                  </div>
                  <footer class="post-footer">
                    <div class="post-navigation">
                      <a href="#{site.baseurl}/blog/" class="nav-link">← 返回博客</a>
                      <a href="#{site.baseurl}/articles/" class="nav-link">查看所有文章 →</a>
                    </div>
                  </footer>
                </article>
              </main>
              
              <footer class="site-footer">
                <div class="offsite-links">
                  #{site.config['footer']['content']}
                </div>
              </footer>
            </div>
          </div>
          
          <!-- Prism.js for syntax highlighting -->
          <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/components/prism-core.min.js"></script>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/plugins/autoloader/prism-autoloader.min.js"></script>
          
          <script src="#{site.baseurl}/assets/js/plugins.js"></script>
          <script src="#{site.baseurl}/assets/js/custom.js"></script>
          
          <style>
            .post-tags {
              margin: 15px 0;
            }
            .tag {
              background: #e3f2fd;
              color: #1976d2;
              padding: 4px 8px;
              border-radius: 3px;
              font-size: 0.85em;
              margin-right: 8px;
            }
            .post-navigation {
              display: flex;
              justify-content: space-between;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
            }
            .nav-link {
              color: #2d72d9;
              text-decoration: none;
              padding: 8px 16px;
              border: 1px solid #2d72d9;
              border-radius: 4px;
              transition: all 0.3s ease;
            }
            .nav-link:hover {
              background: #2d72d9;
              color: white;
            }
            @media (max-width: 600px) {
              .post-navigation {
                flex-direction: column;
                gap: 10px;
              }
            }
          </style>
        </body>
        </html>
      HTML
      
      # 写入HTML文件
      File.write(output_file, full_html)
      puts "Generated HTML for: #{relative_path} -> #{output_file}"
    end
  end
end