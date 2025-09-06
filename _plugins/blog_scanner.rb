require 'json'
require 'find'
require 'yaml'

# 读取文件的 Front Matter
def read_front_matter(file_path)
  return {} unless File.exist?(file_path)
  
  content = File.read(file_path)
  if content.start_with?('---')
    parts = content.split('---', 3)
    if parts.length >= 3
      begin
        return YAML.safe_load(parts[1]) || {}
      rescue => e
        puts "Warning: Failed to parse YAML front matter in #{file_path}: #{e.message}"
        return {}
      end
    end
  end
  {}
end

# 递归扫描目录函数
def scan_directory(dir_path, base_url, relative_path = "")
  entries = []
  
  return entries unless Dir.exist?(dir_path)
  
  Dir.entries(dir_path).each do |entry|
    next if entry == '.' || entry == '..'
    
    full_path = File.join(dir_path, entry)
    entry_relative_path = File.join(relative_path, entry).gsub(/^\//, "")
    
    if File.directory?(full_path)
      # 递归扫描子目录
      subdir_entries = scan_directory(full_path, base_url, entry_relative_path)
      entries.concat(subdir_entries) if subdir_entries.any?
    elsif File.file?(full_path)
      # 处理文件
      ext = File.extname(entry)
      name_without_ext = File.basename(entry, ext)
      
      if ['.md', '.html'].include?(ext)
        # 读取文件的 front matter
        front_matter = read_front_matter(full_path)
        
        # 生成文件URL（去掉扩展名）
        file_url_path = entry_relative_path.gsub(/\.(md|html)$/, '')
        
        file_info = {
          name: entry,
          title: front_matter['title'] || name_without_ext.gsub(/[-_]/, ' ').split.map(&:capitalize).join(' '),
          url: "#{base_url}/blog/#{file_url_path}",
          type: ext == '.md' ? 'markdown' : 'html',
          date: front_matter['date'],
          description: front_matter['description'],
          tags: front_matter['tags'] || [],
          category: front_matter['category']
        }
        
        entries << file_info
      end
    end
  end
  
  # 如果是顶层目录，返回目录信息
  if relative_path == ""
    return entries
  else
    # 如果是子目录，返回目录结构信息
    dir_name = File.basename(dir_path)
    return [{
      name: dir_name,
      path: relative_path,
      title: "#{dir_name.capitalize} Series",
      description: "Explore articles in the #{dir_name} series.",
      files: entries.sort_by { |file| file[:date] || '1900-01-01' }.reverse
    }]
  end
end

Jekyll::Hooks.register :site, :post_write do |site|
  blog_dir = File.join(site.source, 'blog')
  blog_data = []
  
  if Dir.exist?(blog_dir)
    Dir.entries(blog_dir).each do |entry|
      next if entry == '.' || entry == '..' || entry == 'index.html' || entry == 'series.html'
      
      series_path = File.join(blog_dir, entry)
      next unless File.directory?(series_path)
      
      # 递归扫描系列目录
      series_info = scan_directory(series_path, site.baseurl, entry)
      blog_data.concat(series_info)
    end
  end
  
  # Write the blog data to a JSON file
  output_file = File.join(site.dest, 'assets', 'blog-data.json')
  FileUtils.mkdir_p(File.dirname(output_file))
  File.write(output_file, JSON.pretty_generate(blog_data))
  
  puts "Generated blog data: #{blog_data.length} series found"
end