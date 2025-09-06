require 'json'
require 'fileutils'
require 'find'

Jekyll::Hooks.register :site, :post_write do |site|
  # 生成文章索引JSON数据
  articles_dir = File.join(site.source, 'articles')
  articles_data = []
  
  if Dir.exist?(articles_dir)
    Find.find(articles_dir) do |path|
      next unless File.file?(path) && path.end_with?('.md')
      
      # 计算相对路径
      relative_path = Pathname.new(path).relative_path_from(Pathname.new(articles_dir)).to_s
      relative_path_without_ext = relative_path.gsub(/\.md$/, '')
      
      # 读取markdown文件
      markdown_content = File.read(path)
      
      # 解析front matter
      title = nil
      description = nil
      date = nil
      tags = []
      
      if markdown_content.start_with?('---')
        parts = markdown_content.split('---', 3)
        if parts.length >= 3
          begin
            front_matter = YAML.safe_load(parts[1]) || {}
            title = front_matter['title']
            description = front_matter['description']
            date = front_matter['date']
            tags = front_matter['tags'] || []
          rescue => e
            puts "Warning: Failed to parse YAML in #{path}: #{e.message}"
          end
        end
      end
      
      # 如果没有title，从文件名生成
      if title.nil? || title.empty?
        title = File.basename(relative_path_without_ext).gsub(/[-_]/, ' ')
      end
      
      # 自动推断分类
      category = get_category_from_path(relative_path)
      
      # 自动生成标签（如果front matter中没有）
      if tags.empty?
        tags = generate_tags_from_path(relative_path, title)
      end
      
      # 自动生成描述（如果front matter中没有）
      if description.nil? || description.empty?
        description = generate_description(title, category)
      end
      
      # 生成文章数据
      article_data = {
        title: title,
        url: "#{site.baseurl}/articles/#{relative_path_without_ext}/",
        type: 'markdown',
        category: category,
        date: date || Time.now.strftime('%Y-%m-%d'),
        tags: tags,
        description: description,
        path: relative_path_without_ext
      }
      
      articles_data << article_data
    end
  end
  
  # 按日期排序
  articles_data.sort_by! { |article| Date.parse(article[:date]) rescue Date.new(1900, 1, 1) }.reverse!
  
  # 写入JSON文件
  json_output_path = File.join(site.dest, 'assets', 'data', 'articles.json')
  FileUtils.mkdir_p(File.dirname(json_output_path))
  File.write(json_output_path, JSON.pretty_generate(articles_data))
  
  puts "Generated articles index: #{articles_data.length} articles found"
end

def get_category_from_path(path)
  path_parts = path.split('/')
  
  if path.include?('深度学习基础知识')
    return '深度学习基础'
  elsif path.include?('llm')
    return 'LLM'
  elsif path.include?('example')
    return '示例'
  elsif path_parts.length > 1
    # 使用第一级目录作为分类
    return path_parts[0].gsub(/[-_]/, ' ').split.map(&:capitalize).join(' ')
  else
    return '技术文章'
  end
end

def generate_tags_from_path(path, title)
  tags = []
  
  # 基于路径添加标签
  if path.include?('深度学习基础知识')
    tags << '深度学习'
    if path.include?('激活函数')
      tags += ['激活函数', '神经网络']
    elsif path.include?('损失函数')
      tags += ['损失函数', '机器学习']
      if path.include?('MAE')
        tags << '回归'
      elsif path.include?('MSE') 
        tags << '回归'
      elsif path.include?('交叉熵')
        tags += ['分类', '信息论']
      end
    elsif path.include?('模型优化')
      tags += ['优化算法', '模型训练']
      if path.include?('Adam') || path.include?('SGD') || path.include?('Momentum') || path.include?('RMSprop')
        tags << '梯度下降'
      elsif path.include?('正则化')
        tags += ['正则化', '过拟合']
      end
    end
  elsif path.include?('llm')
    tags << 'LLM'
    if path.include?('llama')
      tags += ['Llama', '大模型']
    elsif path.include?('qwen')
      tags += ['Qwen', '量化']
    elsif path.include?('deepseek')
      tags += ['DeepSeek', '代码生成']
    end
  elsif path.include?('example')
    tags += ['示例', 'Markdown']
  end
  
  # 基于标题添加标签
  title_lower = title.downcase
  if title_lower.include?('python')
    tags << 'Python'
  elsif title_lower.include?('javascript')
    tags << 'JavaScript'
  elsif title_lower.include?('算法')
    tags << '算法'
  end
  
  tags.uniq
end

def generate_description(title, category)
  descriptions = {
    '激活函数' => '深度学习中常用激活函数的原理和应用',
    '损失函数总览' => '常见损失函数的原理、特点和使用场景',
    'MAE' => '平均绝对误差(MAE)损失函数的原理和应用',
    'MSE' => '均方误差(MSE)损失函数的原理和应用',
    '相对熵与交叉熵' => '相对熵和交叉熵的数学原理及在分类任务中的应用',
    'Adam' => 'Adam优化器的原理、优势和使用技巧',
    'SGD' => '随机梯度下降(SGD)的原理和实践应用',
    'Momentum' => '动量(Momentum)优化器的原理和效果',
    'RMSprop' => 'RMSprop优化器的原理和适用场景',
    '正则化' => 'L1/L2正则化、Dropout等防止过拟合的技术',
    '总览' => 'Llama系列大模型全面解析',
    '量化的核心原理' => '神经网络量化的数学原理和实现机制',
    'intro' => '技术特点和应用场景介绍',
    'markdown-syntax' => '展示所有支持的Markdown语法功能'
  }
  
  # 尝试匹配标题关键词
  descriptions.each do |key, desc|
    if title.include?(key)
      return desc
    end
  end
  
  # 默认描述
  "#{category}相关技术文章"
end