# 预加载脚本，解决Ruby 3.4+版本中的库加载问题
begin
  require 'csv'
rescue LoadError
  # CSV已内置于Ruby 3.4之前的版本中
  puts "CSV library not available as gem, using built-in version"
end

begin
  require 'logger'
rescue LoadError
  # Logger已内置于Ruby 3.4之前的版本中
  puts "Logger library not available as gem, using built-in version"
end