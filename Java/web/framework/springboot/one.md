# SpringBoot框架学习

注解：@SpringBootApplication
此注解为SpringBoot程序的启动注解，被标注的类为启动类
将主配置类(@SpringBootApplication)下的同一包中的类扫描

## 一：注解讲解     

### 1.将配置文件中的数据注入到对象中的注解

#### ①ConfigurationProperties(prefix = "从某处开始")

#### ②@Value("值")或者@Value("${对应配置文件中的值}")或者Value("#{11*2}")

二者取值比较：

|                         | @ConfigurationProerties  | @Value   |
| ----------------------- | ------------------------ | -------- |
| 功能                    | 批量注入配置文件中的属性 | 单个指定 |
| 松散绑定（松散语法）    | 支持                     | 不支持   |
| SpEL                    | 不支持                   | 支持     |
| JSR303数据校验          | 支持                     | 不支持   |
| 复杂类型封装(Map等赋值) | 支持                     | 不支持   |

#### 🌂@ImportResource(locations = {"classpath:Spring配置文件名"})

导入Spring的配置文件，让配置文件中的内容生效

Spring Boot没有Spring的配置文件，所以使用Spring的配置文件需要将此注解添加到一个配置类上



### 2.配置文件占位符

#### 1.随机数

random.value,random.int(10)...

#### 2.占位符获取之前的值，没有可以使用:然后指定值



#### 3.虚拟机参数

-Dspring.profiles.active=dev



## 二：配置相关

### 1.Profile

#### 1.多Profile文件

#### 2.yml支持多文档模块的方式

在yml文件中写入：---然后代表一个文档模块

#### 3.激活指定Profile(default    dev    prod)

##### 1.在配置文件中写入：spring.profiles.active=dev

##### 2.命令行

java -jar jar包名 --spring.profiles.active=dev



二：配置文件加载位置

spring boot启动会将application.properties或者application.yml作为默认配置文件

加载位置优先级为：

-file:./config/      （file指的是项目下）

-file:./

-classpath:/config/      （classpath指的是maven项目中src.main.rescources中的配置）

-classpath:/

高优先级的配置会覆盖低优先级的配置

可以手动更改默认加载位置：spring.config.location





### 2.外部配置加载顺序

SpringBoot从以下加载配置，优先级从高到底；

相同的配置优先级高的覆盖优先级低的，不同的配置共同起作用
$$
1.命令行参数

2.来自java:comp/env的JNDI属性

3.Java系统属性(System.getProperties())

4.操作系统环境变量

5.RandomValuePropertySource配置的random.*属性值

6.jar包外部的application-{profile}.properties或者application.yml（带profile)的配置文件

7.jar包内部的application-{profile}.properties或者application.yml（带profile)的配置文件

8..jar包外部的application.properties或者application.yml（不带profile)的配置文件

9..jar包内部的application.properties或者application.yml（不带profile)的配置文件

10.@Configuration注解类上的@PropertySource

11.通过SpringApplication.setDefaultProperties设置默认属性
$$


### 3.自动配置原理



1.从启动类中的注解进入：@SpringBootApplication其中的@EnableAutoConfiguration(自动加载配置)

2.@EnableAutoCOnfiguration的作用：

- 利用EnableAutoConfigurationImportSelector给容器导入一些组件

- 可以插件一些selectImports()方法的内容

- List<String> configurations = getCandidateConfigurations(annotationMetadata, attributes);获取候选配置

~~~java
springFactoriesLoader.loadFactoryNames()
    /*
    扫描所有Jar包类路径下的：META-INF/spring-factories
    然后将扫描后的内容包装成一个Properties对象
    从此对象中拿到EnableAutoConfigguration.class对应的值，然后添加到容器中*/
~~~

**将类路径下META-INF/spring-factories中所有的EnableAutoConfiguration的值加入到容器中**

**每一个xxxAutoConfiguration类都是容器中的一个组件，用他们来做自动配置**

每一个自动配置类进行自动配置

在配置文件中添加debug=true则会在控制台打印出所有自动配置生效的类



*******模式：*

1）、SpringBoot在自动配置很多组件的时候，先看容器中有没有用户自己配置的(@Bean,@Component)如果有就用用户配置的，如果没有才会自动配置；

如果有些组件可以有多个(ViewResolver)将用户配置的和自己默认的组合起来；

2）、在SpringBoot中会有很多的xxxConfigurer帮助我们进行扩展配置

3）、在SpringBoot中会有很多的xxxCustomizer帮助我们进行定制配置

***

## 三：日志

### 1.日志框架

| 抽象层     | 实现层              |
| ---------- | ------------------- |
| JCL,SLF4j, | log4j,logback,log4j |
|            |                     |

springBoot使用Spring实现，Spring默认使用JCL

Spring Boot使用SLF4j和logback

### 2.SLF4j的使用

#### 1.图	

![concrete-bindings.png (1152Ã636)](https://www.slf4j.org/images/concrete-bindings.png)



#### 2.遗留问题

当下很多框架底层使用的日志工具不同

解决方法：使用以有的jar包替换

![legacy.png (1587Ã1123)](https://www.slf4j.org/images/legacy.png)

SpringBoot底层使用的是SLF4j和logback，所以他把其他的日志在底层替换成了SLF4j

**SpringBoot可以自动适配所有的日志，引入其他框架的时候需要将这个框架所依赖的日志框架排除掉 **

### 3.SpringBoot的一些默认配置

#### 1.日志级别

五个级别：trace<debug<info<warn<error

默认使用info级别（root级别），可以在配置文件中手动更改：logging.level.com.cloud=级别

使用的级别后给出的信息后只会有此级别以及更高级别

#### 2.输出的日志位置

|      | logging.file | logging.path | Example      | Description                          |
| ---- | ------------ | ------------ | ------------ | ------------------------------------ |
|      | (none)       | (none)       |              | 控制台                               |
|      | 指定文件名   | （none)      | my.log       | 输出日志到当前项目下的my.log文件     |
|      | （none)      | 指定路径     | c:/mylog/log | 输出日志到指定文件夹下spring.log文件 |
|      |              |              |              |                                      |

#### 3.日志格式

~~~properties

logging.pattern.console=格式：表示修改在控制台的打印格式
loggin.patter.file=格式：表示修改在文件中的打印格式

%d:表示日期时间

%thread:表示线程名

%-5level:级别从左显示5个字符长度

%logger{50}:表示logger名字最长为50个字符，否则以句号分割

%msg:日志信息

%n:换行符

#修改打印在文件中的格式
loggin.pattern.file=%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{50} - % msg %n

~~~

#### 4.指定配置

以下为应该手动添加的配置名称

| Logging System          | Customization                                                |
| ----------------------- | ------------------------------------------------------------ |
| Logback                 | `logback-spring.xml`, `logback-spring.groovy`, `logback.xml`, or `logback.groovy` |
| Log4j2                  | `log4j2-spring.xml` or `log4j2.xml`                          |
| JDK (Java Util Logging) | `logging.properties`                                         |

注意：使用Logback的推荐使用logback-spring.xml

logback.xml:直接被日志框架识别

logback-spring.xml:由SpringBoot直接加载,这样就可以使用一些高级功能（springProfile标签）

~~~properties
<springProfile name="staging">
	<!-- configuration to be enabled when the "staging" profile is active -->
	指定某段配置只在某种环境下起作用
</springProfile>

<!--开发环境-->
<springProfile name="dev | staging">
	<!-- configuration to be enabled when the "dev" or "staging" profiles are active -->
</springProfile>

<springProfile name="!production">
	<!-- configuration to be enabled when the "production" profile is not active -->
</springProfile>
~~~

#### 5.切换日志环境

1.排除之前的日志转换

2.引入对应pom.xml配置-----他引入对应的jar包

## 四：WEB开发

### 1.访问静态资源

手动更改静态文件夹下的资源：spring-reources-static-location=classpath:/hello/,classpath:/cloud/.....

--实际上这为一个数组，想要添加多个文件夹中间添加逗号即可

/**：访问当前项目中的所有资源

classpath:/META-INF/resources/

classpath:/resources/

classpath:static

classpath:/public/

/：当前项目的根路径

2.欢迎页：静态资源下的所有index.html文件

3.图标：将图片放置在静态资源中，文件名称：favicon.ico

### 2.模板引擎

常见有：JSP,Velocity,Freemarker,Thymeleaf

SpringBoot推荐使用:Thymeleaf;

#### Thymeleaf语法

~~~java
@ConfigurationProperties(prefix = "spring.thymeleaf")
public class ThymeleafProperties {

	private static final Charset DEFAULT_ENCODING = StandardCharsets.UTF_8;

	public static final String DEFAULT_PREFIX = "classpath:/templates/";//前缀

	public static final String DEFAULT_SUFFIX = ".html";//后缀
//<!--默认规则-->
~~~

由上述代码可知，把HTML页面放入classpath:/templates/下就可以自动渲染

使用时导入Thymeleaf的命名空间以获得对应的提示：

~~~xml
<html lang="en" xmlns:th="http:///www.thymeleaf.org">
</html>
~~~

Thymeleaf公共页面抽取

~~~html
1.抽取公共片段
<div th:fragment="copy">
    &copy;
</div>
2.引入公共片段
<div th:insert="~{footer :: copy}">
</div>

~{templatename::selector}:模板名::选择器
~{templatename::fragmentname}:模板名::片段名

3.默认效果：
insert的功能片段在div标签中
如果使用th:insert等属性进行引入，可以不用写~{}
行内写法：[[~{}]];[(~{})]

4.三种引入功能片段的th属性
th:insert:将公共片段整个插入到声明引入的元素中
th:replace:将声明引入的元素替换为公共片段
th:include:将被引入的片段的内容包含进这个标签中
~~~









扩展SpringMVC功能：

<u>***编写一个配置类(@Configuration),他是WebMvcConfiguratinoAdapter类型，不能标注@EnableWebMvc***</u>

@EnableWebMvc这个配置代表全面接管SpringMVC，即不使用原有的自动配置，而是全部自己写



### 3.国际化

SpringMVC中需要：

1.编写配置文件，存储对应的国际化转换信息

2.编写管理国际化资源文件的对应组件

3.页面获取

SpringBoot中已经将第二步自动配置，对应类名为：MessageSourceAutoConfiguration

~~~java
public class MessageSourceAutoConfiguration {
    /*
    编写的配置文件基础名，比如配置文件为login_en_US.properties，那么对应的基础名为login,所以我们可以直接将对应的配置文件写在类路径下，然后文件名为:messages.properties
    */
    private String basename = "messages";
    private Charset encoding = Charset.forName("UTF-8");

    
      @Bean
    public MessageSource messageSource() {
        ResourceBundleMessageSource messageSource = new ResourceBundleMessageSource();
        if (StringUtils.hasText(this.basename)) {
            					 messageSource.setBasenames(StringUtils.commaDelimitedListToStringArray(StringUtils.trimAllWhitespace(this.basename)));//设置国际化资源文件的基础名，即去掉后缀与国家代码的
        }

        if (this.encoding != null) {
            messageSource.setDefaultEncoding(this.encoding.name());
        }

        messageSource.setFallbackToSystemLocale(this.fallbackToSystemLocale);
        messageSource.setCacheSeconds(this.cacheSeconds);
        messageSource.setAlwaysUseMessageFormat(this.alwaysUseMessageFormat);
        return messageSource;
    }
~~~

页面获取，使用Thymeleaf中，#{}可以直接将对应的信息取出

eg:

~~~html
 <label class="sr-only" th:text="#{login.username}">Username</label>
    <input type="text" name="username" class="form-control" placeholder="Username" 	                  th:placeholder="#{login.username}"
           required="" autofocus="">
<div class="checkbox mb-3">
        <label>
            <input type="checkbox" value="remember-me"/> [[#{login.remember}]]
        </label>
</div>
	
<!--注意：在label中可以使用th:text=#{}进行获取，但是在input中不可以，需要直接在标签外写入信息位置写入：[[#{}]]-->
<!--login为对应的基础名-->
~~~

默认采用的为对请求头进行处理，然后使用相应的显示语言

也可以采用对URL进行处理的方式：

~~~java
/*
* 可以在连接上携带区域信息
* */
public class MyLocalResolver implements LocaleResolver {

    /*
    * 这里采用一种对于请求URL进行处理的方式对首页中的点击中文与英文处理
    * 默认的方式是采用获取请求头，然后对相应的请求头进行处理
    * */
    //解析区域信息
    @Override
    public Locale resolveLocale(HttpServletRequest httpServletRequest) {
        String l = httpServletRequest.getParameter("l");//获取超链接上的附带国际化信息
        Locale locale = Locale.getDefault();//获取默认信息
        if(!StringUtils.isEmpty(l)){
            //因为在前端页面中写入的附带国际化信息为:en_US
            String[] strings = l.split("_");
            locale = new Locale(strings[0],strings[1]);
        }
        return locale;
    }

    @Override
    public void setLocale(HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse, Locale locale) {

    }
}

~~~

然后在自己的配置类中，添加：

~~~java
 @Bean
    public LocaleResolver localeResolver(){
        return new MyLocalResolver();
    }
~~~

这样在前端中的便有效果

~~~html
<a class="btn btn-sm" th:href="@{/index.html(l='zh_CN')}">中文</a>
<a class="btn btn-sm" th:href="@{/index.html(l='en_US')}">English</a>
~~~

## 五：错误处理机制

### 1.SpringBoot的默认处理机制

#### 1.默认效果：

	1）：返回一个错误页面
	
	2）：其他客户端访问，默认响应一个json数据

其中添加的组件

1.DefaultErrorAttributes

2.BasicErrorController

~~~java
@Controller
@RequestMapping({"${server.error.path:${error.path:/error}}"})
public class BasicErrorController extends AbstractErrorController {
~~~

~~~java
//根据请求头
//浏览器发出的是：text/html
//客户端："text/*"

@RequestMapping(produces = {"text/html"}//这个请求产生错误html页面
    )
    public ModelAndView errorHtml(HttpServletRequest request, HttpServletResponse response) {
        HttpStatus status = this.getStatus(request);
        Map<String, Object> model = Collections.unmodifiableMap(this.getErrorAttributes(request, this.isIncludeStackTrace(request, MediaType.TEXT_HTML)));
        response.setStatus(status.value());
        //ModelAndView包含
        ModelAndView modelAndView = this.resolveErrorView(request, response, status, model);
        return modelAndView == null ? new ModelAndView("error", model) : modelAndView;
    }

    @RequestMapping//这个请求产生Json数据
    @ResponseBody
    public ResponseEntity<Map<String, Object>> error(HttpServletRequest request) {
        Map<String, Object> body = this.getErrorAttributes(request, this.isIncludeStackTrace(request, MediaType.ALL));
        HttpStatus status = this.getStatus(request);
        return new ResponseEntity(body, status);
    }
~~~



3.ErrorPageCustomizer

~~~java
@Value("${error.path:/error}")
private String path = "/errot";
~~~

4.DefaultErrorViewResolver

#### 2.手动定制错误页面

1.**有模板引擎的情况下，在templates下添加error文件夹，然后其中想要显示对应的页面就直接：状态码.html页面，发生此状态码的错误，会自动到此页面**

2.**也可以直接写状态码开头的数字，如；4xx.html，发生对应的以4开头的错误时会自动到此页面**

但是SpringBoot会首先寻找精确的页面，没有则4xx等

页面可以获取的信息：

timestamp:时间戳

status:状态码

error:错误提示

exception:异常对象

message:异常信息

errors:JSR303数据校验的错误

**3.没有模板引擎时，在静态文件夹下**

**4.以上都没有，到SpringBoot默认的错误页面**

#### 3.定制错误的JSON数据

~~~java
@ControllerAdvice
public class MyExceptionHandler{
    
    @ResponseBody
    @ExceptionHandler(Exception.class)//捕获对应的异常类，此处以捕获所有异常为例
    public Map<String,Object> handleException(Exception e){//出现对应的异常时会自动将异常对象传入
        Map<String,Object> map = new HashMap<>();
        map.put("code","异常出现");
        map.put("msessage",e.getMessage());
        return map;//自动将map数据转换为JSON数据
    }
}
~~~

此时没有自适应效果，也就是浏览器和客户端应该不同，而此时都是JSON数据

~~~java
@Controller
public class MyExceptionHandler{
    @ExceptionHandler(Exception.class)
    public String handlerException(Exception e){
        Map<String,Object> map = new HashMap<>();
        map.put("code","异常出现");
        map.put("message",e.getMessage());
        return "forward:/error"//此时转发到error请求，SpringBoot会自动对其处理，也就满足自适应
    }
}
~~~

出现错误后，会发出/error请求，被BasicErrorController处理，响应出去可以获取的数据是由getErrorAttibutes得到的(是AbstractErrorController(ErrorController)规定的方法)

1.完全编写一个ErrorController的实现类[或者是编写AbstractErrorController的子类],方法容器中

2.页面上能用的数据，或者是JSON返回能用的数据都是通过errorAttributes.getErrorAttributes得到；

容器中DefaultErrorAttributes.getErrorAttributes();默认进行数据处理的；

自定义ErrorAttributes

~~~java
//给容器中加入我们自己定义的ErrorAttributes
@Component
public class MyErrorAttributes extends DefaultErrorAttributes {

    @Override
    public Map<String, Object> getErrorAttributes(RequestAttributes requestAttributes, boolean includeStackTrace) {
        Map<String,Object> map = super.getErrorAttributes(requestAttributes,includeStackTrace);
        map.put("com","cloud");
        return map;
    }
}
~~~

## 六：配置嵌入式servlet容器

SpringBoot默认配置嵌入式servlet容器(tomcat)

![1565701390509](C:\Users\张玉雷\AppData\Roaming\Typora\typora-user-images\1565701390509.png)

默认嵌入tomcat

### 1.修改默认配置

方法：

#### 1.手动在配置文件中修改对应的信息

比如server.xxx=yyy...

~~~properties
server.port=8081

server.tomcat.uri-encoding=UTF-8
~~~

#### 2.编写配置类

写出一个带有@Bean注解的方法：返回值为EmbeddedServletContainerCustomizer（接口），内部返回一个此接口的内部实现

~~~java
@Configuration
public class MyMvcConfig extends WebMvcConfigurerAdapter {

    @Bean
    public EmbeddedServletContainerCustomizer embeddedServletContainerCustomizer() {
        return new EmbeddedServletContainerCustomizer() {
            @Override
            public void customize(ConfigurableEmbeddedServletContainer container) {
                container.setPort(8083);//
            }
        };
    }
}
~~~

**此时配置文件和手动添加的代码有相冲突的端口设置**，**以配置类中设置为准**

### 2.注册Servlet三大组件(Servlet Filter,Listener)

由于SpringBoot默认是以jar包形式启动嵌入式的Servlet容器来启动SpringBoot的web应用，没有web.xml文件，所以注册组件使用以下方式即可：

1.ServletRegistrationBean

~~~java
public class MyServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        doPost(req, resp);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.getWriter().write("Hello world！" );
    }
}

~~~



~~~java
  @Bean
    public ServletRegistrationBean myServlet(){
        ServletRegistrationBean servletRegistrationBean = new ServletRegistrationBean(new MyServlet(),"/myServlet");
        return servletRegistrationBean;
    }
~~~

2.FilterRegistrationBean

~~~java
public class MyFilter implements Filter {
    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
    }
    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain) throws IOException, ServletException {
        servletResponse.getWriter().write("hello world!");
        System.out.println("filter process....");
        filterChain.doFilter(servletRequest, servletResponse);
    }
    @Override
    public void destroy() {
    }
}
~~~

~~~java
  //注册Filter
    @Bean
    public FilterRegistrationBean myFilter(){
        FilterRegistrationBean filterRegistrationBean = new FilterRegistrationBean();
        filterRegistrationBean.setFilter(new MyFilter());
        filterRegistrationBean.setUrlPatterns(Arrays.asList("/helloMyFilter","/myFilter"));
        return filterRegistrationBean;
    }
~~~



3.ServletListenerRegistrationBean

~~~java
public class MyListener implements ServletContextListener {
    @Override
    public void contextInitialized(ServletContextEvent servletContextEvent) {
        System.out.println("启动....");
    }
    @Override
    public void contextDestroyed(ServletContextEvent servletContextEvent) {
        System.out.println("销毁....");
    }
}
~~~

~~~java
    //注册Listener
    @Bean
    public ServletListenerRegistrationBean myListener(){
        ServletListenerRegistrationBean<MyListener> registrationBean = new ServletListenerRegistrationBean<>(new MyListener());
        return registrationBean;
    }
~~~

SpringBoot自动配置SpringMVC的时候会自动注册SpringMVC的前端控制器：DispatcherServlet

~~~java
 @Bean(
            name = {"dispatcherServletRegistration"}
        )
        @ConditionalOnBean(
            value = {DispatcherServlet.class},
            name = {"dispatcherServlet"}
        )
        public ServletRegistrationBean dispatcherServletRegistration(DispatcherServlet dispatcherServlet) {
            ServletRegistrationBean registration = new ServletRegistrationBean(dispatcherServlet, new String[]{this.serverProperties.getServletMapping()});
           //默认拦截："/"拦截所有，不包括jsp,而"/*"拦截所有，包括jsp
            //可以通过设置server.servletPath=""进行设置SpringMVC的前端控制器拦截的路径
            registration.setName("dispatcherServlet");
            registration.setLoadOnStartup(this.webMvcProperties.getServlet().getLoadOnStartup());
            if (this.multipartConfig != null) {
                registration.setMultipartConfig(this.multipartConfig);
            }

            return registration;
        }
~~~

### 3.修改SpringBoot默认Servlet容器

SpringBoot支持三种Servlet容器：

Tomcat(默认)

Jetty(适合长连接)

Undertow(不支持JSP,并发性能等好)

![1565744261635](C:\Users\张玉雷\AppData\Roaming\Typora\typora-user-images\1565744261635.png)

修改步骤(Maven项目中)：

1.将当前的容器移除

2.pom.xml文件中写入：

~~~xml
<!--		引入新的Servlet容器-->
引入Jetty
		<dependency>
			<artifactId>spring-boot-starter-jetty</artifactId>
			<groupId>org.springframework.boot</groupId>
		</dependency>
引入Underdow
		<!--引入其他的Servlet容器-->
		<!--<dependency>
			<artifactId>spring-boot-starter-undertow</artifactId>
			<groupId>org.springframework.boot</groupId>
		</dependency>-->

~~~

![1565746628174](C:\Users\张玉雷\AppData\Roaming\Typora\typora-user-images\1565746628174.png)

### 4.嵌入式Servlet容器自动配置原理

自动配置类：

~~~java
package org.springframework.boot.autoconfigure.web;

@AutoConfigureOrder(-2147483648)
@Configuration
@ConditionalOnWebApplication
@Import({EmbeddedServletContainerAutoConfiguration.BeanPostProcessorsRegistrar.class})
public class EmbeddedServletContainerAutoConfiguration {
   
    @Configuration
    @ConditionalOnClass({Servlet.class, Tomcat.class})//当引入Tomcat依赖后才会生效
    @ConditionalOnMissingBean(
        value = {EmbeddedServletContainerFactory.class},//嵌入式Servlet容器工厂
        search = SearchStrategy.CURRENT
    )
    public static class EmbeddedTomcat {
        public EmbeddedTomcat() {}
        @Bean
        public TomcatEmbeddedServletContainerFactory tomcatEmbeddedServletContainerFactory() {
            return new TomcatEmbeddedServletContainerFactory();
        }
    }
}
~~~

1).EmbeddedServletContainerFactory(嵌入式Servlet容器工厂)

~~~java
public interface EmbeddedServletContainerFactory {
    //获取嵌入式的Servlet容器工厂
	EmbeddedServletContainer getEmbeddedServletContainer(
			ServletContextInitializer... initializers);
}
~~~

2）.EmbeddedServletContainer

![1565749224094](C:\Users\张玉雷\AppData\Roaming\Typora\typora-user-images\1565749224094.png)

下述代码表明SpringBoot对导入依赖做了判断，根据不同的情况执行不同的配置

~~~java
//对Undertow的依赖判断
@Configuration
    @ConditionalOnClass({Servlet.class, Undertow.class, SslClientAuthMode.class})
    @ConditionalOnMissingBean(
        value = {EmbeddedServletContainerFactory.class},
        search = SearchStrategy.CURRENT
    )
    public static class EmbeddedUndertow {
        public EmbeddedUndertow() {
        }

        @Bean
        public UndertowEmbeddedServletContainerFactory undertowEmbeddedServletContainerFactory() {
            return new UndertowEmbeddedServletContainerFactory();
        }
    }
//对Jetty的依赖判断
    @Configuration
    @ConditionalOnClass({Servlet.class, Server.class, Loader.class, WebAppContext.class})
    @ConditionalOnMissingBean(
        value = {EmbeddedServletContainerFactory.class},
        search = SearchStrategy.CURRENT
    )
    public static class EmbeddedJetty {
        public EmbeddedJetty() {
        }

        @Bean
        public JettyEmbeddedServletContainerFactory jettyEmbeddedServletContainerFactory() {
            return new JettyEmbeddedServletContainerFactory();
        }
    }
//对Tomcat的依赖判断
    @Configuration
    @ConditionalOnClass({Servlet.class, Tomcat.class})
    @ConditionalOnMissingBean(
        value = {EmbeddedServletContainerFactory.class},
        search = SearchStrategy.CURRENT
    )
    public static class EmbeddedTomcat {
        public EmbeddedTomcat() {
        }

        @Bean
        public TomcatEmbeddedServletContainerFactory tomcatEmbeddedServletContainerFactory() {
            return new TomcatEmbeddedServletContainerFactory();
        }
    }
~~~

以Tomcat工厂为例：

~~~java
//重写嵌入式Servlet工厂接口中的方法，实现获取Tomcat的作用
@Override
	public EmbeddedServletContainer getEmbeddedServletContainer(
			ServletContextInitializer... initializers) {
        //创建Tomcat
		Tomcat tomcat = new Tomcat();
        //Tomcat的基本配置
		File baseDir = (this.baseDirectory != null ? this.baseDirectory
				: createTempDir("tomcat"));
		tomcat.setBaseDir(baseDir.getAbsolutePath());
		Connector connector = new Connector(this.protocol);
		tomcat.getService().addConnector(connector);
		customizeConnector(connector);
		tomcat.setConnector(connector);
		tomcat.getHost().setAutoDeploy(false);
		configureEngine(tomcat.getEngine());
		for (Connector additionalConnector : this.additionalTomcatConnectors) {
			tomcat.getService().addConnector(additionalConnector);
		}
		prepareContext(tomcat.getHost(), initializers);
        //将配置好的Tomcat作用参数传入然后返回对应的Tomcat容器，并且启动Tomcat容器
		return getTomcatEmbeddedServletContainer(tomcat);
	}
~~~

**切换容器为何生效**

步骤：

1.SpringBoot根据导入的依赖，给容器添加响应的EmbeddServletContainerFactory

2.容器中某个组件想要创建对象就会触发后置处理器,EmbeddedServletContainerCustomizerBeanPostProcessor;

只要是嵌入式的Servlet容器工厂，后置处理器就工作

3.后置处理器，从容器中获取所有的EmbeddServletContainerCustomizer,调用定制器的定制方法

## 七：SpringBoot与Docker

Docker是一个开源的应用容器引擎

### 1.Docker中的常用命令

#### 1）.镜像命令

~~~properties
1.docker search xxx (docker search mysql)检索
2.docker pull xxx (docker pull mysql)下载默认最新版(latest)，可以在xxx后加:标签号
3.docker images 查看本地所有镜像
4.docker rmi 镜像ID(Images ID) 删除对应的镜像
~~~

#### 2）.容器操作

| 操作     | 命令                                                         | 说明                                                       |
| -------- | ------------------------------------------------------------ | ---------------------------------------------------------- |
| 运行     | docker run --name container -name -d image-name eg:docker run --name myredis -d redis | --name:自定义容器名  -d:后台运行  image-name :指定镜像模板 |
| 列表     | docker ps(查看运行中的容器)                                  | 加上-a:产看所有容器                                        |
| 停止     | docker stop container -name/container -id                    | 停止当前运行的容器                                         |
| 启动     | docker start container -name/container -id                   | 启动容器                                                   |
| 删除     | docker rm container id                                       | 删除指定容器                                               |
| 端口映射 | -p 6379:6379   eg:docker run -d -p 6379:6379 --name myredis docker.io/redis | -p:主机端口映射到容器内部的端口                            |
| 容器日志 | docker logs container -name/container -id                    |                                                            |
| 更多命令 | https://docs.docker.com/engine/reference/commandline/docker/ |                                                            |

**对于端口映射中，linux中设置完后若想要在其他操作系统中访问，则需要将防火墙关闭**

查看linux中的防火墙命令：service firewalld status/stop

mysql安装并且启动的步骤：

~~~shell
1.docker pull mysql//安装镜像
2.docker run --name mysql01 -e MYSQL_ROOT_PASSWORD=gates -d mysql
	参数讲解：
		1).--name 此运行的mysql的别名
		2). -e 指定密码(必须指定一种)
		3).-d 指定启动的镜像		
~~~

#### 3）.一些高级操作

~~~powershell
1.对于mysql配置文件的操作
$ docker run --name some-mysql -e MYSQL_ROOT_PASSWORD=my-secret-pw -d mysql:tag --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci

$ docker run --name some-mysql -v /my/own/datadir:/var/lib/mysql -e MYSQL_ROOT_PASSWORD=my-secret-pw -d mysql:tag
参数-v讲解：将手动设置的目录中的配置文件与原目录中的配置文件合并生效
~~~

## 八：SpringBoot与数据访问

### 1.DataSourceInitializer:ApplicationListener

作用：

		1).runSchemaScripts();运行建表语句
	
		2).runDataScripts();运行插入数据的sql语句

默认只需要将文件命名为：

~~~properties
schema-*.sql    data-*.sql
配置文件改为schema-all.yml
也可以在配置文件中写入：
schema:
	-classpath:sql文件全名
	-classpath:....
此时sql文件可以不为原定的模式起名
<!--注意：-classpath:与后面的文件名之间不可以有空格-->
~~~

### 2.使用数据库

使用阿里的数据源：**druid**，Pom.xml引入：

~~~xml
<!-- https://mvnrepository.com/artifact/com.alibaba/druid -->
<dependency>
    <groupId>com.alibaba</groupId>
    <artifactId>druid</artifactId>
    <version>1.1.19</version>
</dependency>
~~~

配置文件中写入：

~~~yaml
spring:
	datasource:
		username:root
		password:gates
		url:jdbc:mysql://localhost:3306/jdbc
		driver-class-name:com.mysql.jdbc.Driver
		type:com.alibaba.druid.pool.DruidDataSource
		
		#以下需要单独写出一个配置类才可以生效
		initialSize:5
		minIdle:5
		maxActive:20
		maxWait:60000
		timeBetweenEvictionRunsMillis:60000
		minEvictableIdleTimeMillis:300000
		validationQuery:SELECT 1 FROM DUAL
		testWhileIdle:true
		testOnBorrow:false
		poolPreparedStatements:true
		#配置监控统计拦截的filters,去掉后监控界面sql无法统计，'wall'用于防火墙
		filters:stat,wall,log4j
		maxPoolPreparedStatementPerConnectionSize:20
		useGlobalDataSourceStat:true
		connectionProperties:druid.stat.mergeSql=true;druid.stat.slowSqlMillis=500
		
~~~

对应的配置类：

~~~java
@Configuration
public class DruidConfig{
    @ConfigurationProperties(prefix = "spring.datasource")
    @Bean
    public DataSource druid(){
        return new DruidDataSource();
    }
}
~~~

整合Druid数据源

~~~java
@Configuration
public class DruidConfig {
    //将配置文件中的后部分内容生效
    @ConfigurationProperties(prefix =  "spring.datasource")
    @Bean
    public DataSource druid(){
        return new DruidDataSource();
    }
    //配置Druid的监控
    //1.配置一个管理后台的Servlet
    @Bean
    public ServletRegistrationBean statViewServlet(){
        ServletRegistrationBean<Servlet> bean = new ServletRegistrationBean<>(new StatViewServlet(), "/druid");

        Map<String,String> map = new HashMap<>();
        map.put("loginUsername","admin");
        map.put("loginPassword","gates");
        map.put("allow","localhost");//若为空则允许所有
        map.put("deny","192.168.1.8");//拒绝指定的IP地址访问

        bean.setInitParameters(map);
        return bean;
    }
    //2.配置web端的fitler
    @Bean
    public FilterRegistrationBean webStatFilter(){
        FilterRegistrationBean bean = new FilterRegistrationBean();
        bean.setFilter(new WebStatFilter());
        bean.setUrlPatterns(Arrays.asList("/*"));

        Map<String,String> map = new HashMap<>();
        map.put("exclusion", ".js,*.css,/druid/");//不拦截这些请求
        bean.setInitParameters(map);
        return bean;
    }
}
~~~

### 3.整合Mybatis

#### 1.导入Mybatis

~~~xml
<dependency>
	<groupId>org.mybatis.spring.boot</groupId>
    <artifactId>mybatis.spring.boot.stater</artifactId>
    <version>1.3.1</version>
</dependency>
~~~

#### 2.注解

mapper类

~~~java
public interface DeptMapper {

    /**
     * option中，useGeneratedKeys指定为是主键递增，keyProperty指定主键的名称
     * 插入数据
     * */
    @Options(useGeneratedKeys = true,keyProperty = "id")
    @Insert("insert into department(departmentName) values(#{departmentName})")
    int insertDept(Department department);
    /**
     * 根据id删除指定数据
     * */
    @Delete("delete from department where id = #{id}")
    int deleteDeptById(Integer id);
    /**
     * 传入对象更新数据
     * */
    @Update("update department set departmentName=#{departmentName} where id = #{id}")
    int updateDept(Department department);
    /**
     * 根据Id查询数据
     * */
    @Select("select * from department where id=#{id}")
    Department getDeptById(Integer id);

}
~~~

一个mybatis的配置类

~~~java
//此注解可以定义扫描指定包下的类，然后mapper包下的所有类可以不加@Mapper
@MapperScan(value = "com.cloud.hello_mybatis.mapper")
@Configuration
public class MybatisConfig {
    @Bean
    public ConfigurationCustomizer configurationCustomizer(){
        return configuration -> {
            configuration.setMapUnderscoreToCamelCase(true);//使用驼峰命名法
        };
    }
}
~~~

#### 3.使用配置文件进行整合

***注意：yml文件中的classpath:xxx中不可以有空格****

mybatis的主配置文件：mybatis-config.xml

~~~xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE configuration PUBLIC "-//mybatis.org//DTD Config 3.0//EN" "http://mybatis.org/dtd/mybatis-3-config.dtd">

<configuration>
    <settings>
<!--        驼峰命名使用-->
        <setting name="mapUnderscoreToCamelCase" value="true"/>
    </settings>
</configuration>
~~~

mapper配置文件：

~~~xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd">

<mapper namespace="com.cloud.hello_mybatis.mapper.EmpMapper">
    <!-- Employee getEmpById(Integer id); -->
    <select id="getEmpById" resultType="com.cloud.hello_mybatis.bean.Employee">
        SELECT * FROM employee WHERE id = #{id}
    </select>
</mapper>
~~~

### 4.整合JPA

#### 1.概念：

JPA是Java Persistence API的简称，中文名Java持久层API，是JDK 5.0注解或XML描述对象－关系表的映射关系，并将运行期的实体[对象持久化](https://baike.baidu.com/item/对象持久化/7316192)到数据库中。 [1] 

Sun引入新的JPA ORM规范出于两个原因：其一，简化现有Java EE和Java SE应用开发工作；其二，Sun希望整合ORM技术，实现天下归一。

#### 2.整合过程：

1.pom.xml文件中引入：

~~~xml
<dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>
~~~

2.编写与数据库对应的实体类(Bean),编写之后需要在类上添加映射注解：

@Entity

@Table(name = "")指定数据库表，默认为实体类名

@Id：表示这个是主键

@GeneratedValue(Strategy = GenerationType.IDENTITY):自增主键

@Column(name = "",length=):指定对应的列名和长度，默认为成员名

3.编写dao接口操作实体类对应的数据库表

~~~java
public interface UserRepository extends JpaRepository<User,Integer> {
    //第一个泛型为操作的对应的实体类，第二个为对应的数据库表中的主键类型
}
~~~



4.基本配置

~~~yaml
  jpa:
    hibernate:
#      更新或者创建数据库表结构
      ddl-auto: update
#      可以在控制台到执行的sql语句
    show-sql: true
~~~



## 九：Druid详解

### DRUID 简介

1、Druid 是阿里巴巴开源平台上一个数据库连接池实现，结合了 C3P0、DBCP、PROXOOL 等 DB 池的优点，同时加入了日志监控

2、Druid 可以很好的监控 DB 池连接和 SQL 的执行情况，天生就是针对监控而生的 DB 连接池

3、《Spring Boot 默认数据源 HikariDataSource 与 JdbcTemplate》中已经介绍 Spring Boot 2.0 以上默认使用 Hikari 数据源，可以说 Hikari 与 Driud 都是当前 Java Web 上最优秀的数据源

### 自定义数据源 Druid

#### 引入数据源

1、第一步需要在应用的 pom.xml 文件中添加上 Druid 数据源依赖，而这个依赖可以从 Maven 仓库官网 Maven Repository 中获取



2、进入之后就可以选择需要的版本然后赋值进 pom.xml 文件中即可



    <?xml version="1.0" encoding="UTF-8"?>
    <project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
             xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
        <modelVersion>4.0.0</modelVersion>
        
    <groupId>com.cloud</groupId>
    <artifactId>horse</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <packaging>jar</packaging>
     
    <name>horse</name>
    <description>Demo project for Spring Boot</description>
     
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.0.4.RELEASE</version>
        <relativePath/>
        <!-- lookup parent from repository -->
    </parent>
     
    <properties>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
        <java.version>1.8</java.version>
    </properties>
     
    <dependencies>
        <!-- 引入Spring封装的jdbc-->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-jdbc</artifactId>
        </dependency>
     
        <!-- 引入html模板引擎Thymeleaf-->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-thymeleaf</artifactId>
        </dependency>
     
        <!-- 因为web项目启动模块-->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
     
        <!-- 引入mysql数据库连接驱动-->
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
            <scope>runtime</scope>
        </dependency>
     
        <!-- 引入 Druid 数据源依赖：https://mvnrepository.com/artifact/com.alibaba/druid -->
        <dependency>
            <groupId>com.alibaba</groupId>
            <artifactId>druid</artifactId>
            <version>1.1.9</version>
        </dependency>
     
        <!-- 引入Spring Boot 测试模块-->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
     
    <build>
        <plugins>
            <!-- Spring Boot 打包插件-->
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-	plugin</artifactId>
            </plugin>
        </plugins>
    </build>
    </project>

#### 切换 Druid 数据源

1、《Spring Boot 默认数据源 HikariDataSource 与 JdbcTemplate》中已经说过 Spring Boot 2.0 以上默认使用 com.zaxxer.hikari.HikariDataSource 数据源

2、但可以 通过 spring.datasource.type 指定数据源，可以从 Spring Boot 官方文档 查看

~~~yaml
spring.datasource.type= # Fully qualified name of the connection pool implementation to use. By default, it is auto-detected from the classpath.

spring:
  datasource:
    username: root
    password: root
    url: jdbc:mysql://192.168.58.129:3307/horse?characterEncoding=UTF-8
    driver-class-name: com.mysql.jdbc.Driver
    type: com.alibaba.druid.pool.DruidDataSource
~~~



3、数据源切换之后，同理可以注入 DataSource，然后获取到它，输出一看便知是否成功切换



```java
@RunWith(SpringRunner.class)
@SpringBootTest
public class HorseApplicationTests {
    /**
     * Spring Boot 默认已经配置好了数据源，程序员可以直接 DI 注入然后使用即可
     */
    @Resource
    DataSource dataSource;

    @Test
    public void contextLoads() throws SQLException {

        System.out.println("数据源>>>>>>" + dataSource.getClass());
        Connection connection = dataSource.getConnection();

        System.out.println("连接>>>>>>>>>" + connection);
        System.out.println("连接地址>>>>>" + connection.getMetaData().getURL());
        connection.close();
    }
}
```
4、如下所示 数据源切换成功，Druid 数据源切换成功之后，便是要考虑设置它的参数，就如同以前 c3p0、dbcp 一样需要设置数据源连接初始化大小、最大连接数、等待时间、最小连接数、以及数据库监控 等等。

~~~properties
2018-08-20 08:54:08.276  INFO 8128 --- [           main] com.lct.www.HorseApplicationTests        : Started HorseApplicationTests in 3.181 seconds (JVM running for 4.892)
数据源>>>>>>class com.alibaba.druid.pool.DruidDataSource
2018-08-20 08:54:08.523  INFO 8128 --- [           main] com.alibaba.druid.pool.DruidDataSource   : {dataSource-1} inited
连接>>>>>>>>>com.mysql.jdbc.JDBC4Connection@7026b7ee
连接地址>>>>>jdbc:mysql://192.168.58.129:3307/horse?characterEncoding=UTF-8
2018-08-20 08:54:08.897  INFO 8128 --- [       Thread-2] o.s.w.c.s.GenericWebApplicationContext   : Closing org.springframework.web.context.support.GenericWebApplicationContext@7e990ed7: startup date [Mon Aug 20 08:54:05 CST 2018]; root of context hierarchy
2018-08-20 08:54:08.904  INFO 8128 --- [       Thread-2] com.alibaba.druid.pool.DruidDataSource   : {dataSource-1} closed

Process finished with exit code 0
~~~

### 配置 Druid 数据源参数

1、如同以前 c3p0、dbcp 数据源可以设置数据源连接初始化大小、最大连接数、等待时间、最小连接数 等一样，Druid 数据源同理可以进行设置

2、Druid 数据源参数配置在全局配置文件中即可，如下所示：

~~~yaml
spring:
  datasource:
    username: root
    password: root
    url: jdbc:mysql://192.168.58.129:3307/horse?characterEncoding=UTF-8
    driver-class-name: com.mysql.jdbc.Driver
    type: com.alibaba.druid.pool.DruidDataSource

#上半区公共部分对应的是 org.springframework.boot.autoconfigure.jdbc.DataSourceProperties 中的属性

#下半区属性对应的是 com.alibaba.druid.pool.DruidDataSource 中的属性，Spring Boot 默认是不注入不了这些属性值的，需要自己绑定
#druid 数据源专有配置
    initialSize: 5
    minIdle: 5
    maxActive: 20
    maxWait: 60000
    timeBetweenEvictionRunsMillis: 60000
    minEvictableIdleTimeMillis: 300000
    validationQuery: SELECT 1 FROM DUAL
    testWhileIdle: true
    testOnBorrow: false
    testOnReturn: false
    poolPreparedStatements: true
#配置监控统计拦截的filters，stat:监控统计、log4j：日志记录、wall：防御sql注入
#如果允许时报错  java.lang.ClassNotFoundException: org.apache.log4j.Priority
#则导入 log4j 依赖即可，Maven 地址： https://mvnrepository.com/artifact/log4j/log4j
    filters: stat,wall,log4j
    maxPoolPreparedStatementPerConnectionSize: 20
    useGlobalDataSourceStat: true
    connectionProperties: druid.stat.mergeSql=true;druid.stat.slowSqlMillis=500
~~~

3、下半区 Druid 数据源的专有属性对应的是 com.alibaba.druid.pool.DruidDataSource 中的属性，虽然切换为 Druid 数据源之后，Spring Boot 会自动生成 DruidDataSource 并放入容器中供程序员使用，但是它并不会自动绑定配置文件的参

4、所以需要程序员自己为 com.alibaba.druid.pool.DruidDataSource 绑定全局配置文件中的参数，再添加到容器中，而不再使用 Spring Boot 的自动生成了

5、如下所示，自己添加 DruidDataSource 组件到容器中，并绑定属性：

~~~java
/*
- Druid 数据源配置类
  */
  @Configuration
  public class DruidConfig {
  /**

  - 将自定义的 Druid 数据源添加到容器中，不再让 Spring Boot 自动创建
  - 这样做的目的是：绑定全局配置文件中的 druid 数据源属性到 com.alibaba.druid.pool.DruidDataSource
  - 从而让它们生效
  - @ConfigurationProperties(prefix = "spring.datasource")：作用就是将 全局配置文件中 前缀为 spring.datasource
  - 的属性值注入到 com.alibaba.druid.pool.DruidDataSource 的同名参数中
    *
  - @return
    */
    @ConfigurationProperties(prefix = "spring.datasource")
    @Bean
    public DataSource druidDataSource() {
        return new DruidDataSource();
    }
 }
~~~



6、对于 @ConfigurationProperties 绑定配置文件参数不熟悉时，可以参考《Spring Boot 全局配置文件》

7、现在可以获取容器中的 DataSource 转为 DruidDataSource ，然后取值看配置文件中的参数是否已经生效，也可以直接 Debug。

```java
@RunWith(SpringRunner.class)
@SpringBootTest
public class HorseApplicationTests {
/**
 * Spring Boot 默认已经配置好了数据源，程序员可以直接 DI 注入然后使用即可
 */
@Resource
DataSource dataSource;
 
@Test
public void contextLoads() throws SQLException {
 
    System.out.println("数据源>>>>>>" + dataSource.getClass());
    Connection connection = dataSource.getConnection();
 
    System.out.println("连接>>>>>>>>>" + connection);
    System.out.println("连接地址>>>>>" + connection.getMetaData().getURL());
 
    DruidDataSource druidDataSource = (DruidDataSource) dataSource;
    System.out.println("druidDataSource 数据源最大连接数：" + druidDataSource.getMaxActive());
    System.out.println("druidDataSource 数据源初始化连接数：" + druidDataSource.getInitialSize());
 
    connection.close();
}
```
}
8、控制台输出如下，可见配置参数已经生效：

~~~properties
2018-08-20 10:21:48.498  INFO 18284 --- [           main] com.lct.www.HorseApplicationTests        : Started HorseApplicationTests in 3.494 seconds (JVM running for 4.763)
数据源>>>>>>class com.alibaba.druid.pool.DruidDataSource
log4j:WARN No appenders could be found for logger (druid.sql.Connection).
log4j:WARN Please initialize the log4j system properly.
log4j:WARN See http://logging.apache.org/log4j/1.2/faq.html#noconfig for more info.
2018-08-20 10:21:48.921  INFO 18284 --- [           main] com.alibaba.druid.pool.DruidDataSource   : {dataSource-1} inited
连接>>>>>>>>>com.alibaba.druid.proxy.jdbc.ConnectionProxyImpl@37d871c2
连接地址>>>>>jdbc:mysql://192.168.58.129:3307/horse?characterEncoding=UTF-8
druidDataSource 数据源最大连接数：20
druidDataSource 数据源初始化连接数：5
2018-08-20 10:21:48.936  INFO 18284 --- [       Thread-2] o.s.w.c.s.GenericWebApplicationContext   : Closing org.springframework.web.context.support.GenericWebApplicationContext@58e1d9d: startup date [Mon Aug 20 10:21:45 CST 2018]; root of context hierarchy
2018-08-20 10:21:48.948  INFO 18284 --- [       Thread-2] com.alibaba.druid.pool.DruidDataSource   : {dataSource-1} closed

Process finished with exit code 0
~~~

### 配置 Druid 数据源监控

1、配置一个 web 监控的 filter，因为使用的是内置 Servlet 容器，所以可以参考《 Web 项目 tiger 之13 注册 Servlet 三大组件之 Filter》

配置 Druid 后台管理 Servlet
1、Druid 数据源具有监控的功能，并提供了一个 web 界面方便用户查看，类似安装 路由器 时，人家也提供了一个默认的 web 页面。

2、所以第一步需要设置 Druid 的后台管理页面，比如 登录账号、密码 等

3、配置一个管理后台的 Servlet，因为使用的是内置 Servlet 容器，所以可以参考《 Web 项目 tiger 之12 注册 Servlet 三大组件之 Servlet》

/**
 * Created by Administrator on 2018/8/20 0020.
 * Druid 数据源配置类

~~~java
*/
@Configuration
public class DruidConfig {

/**

- 将自定义的 Druid 数据源添加到容器中，不再让 Spring Boot 自动创建
- 这样做的目的是：绑定全局配置文件中的 druid 数据源属性到 com.alibaba.druid.pool.DruidDataSource
- 从而让它们生效
  *
- @return
- @ConfigurationProperties(prefix = "spring.datasource")：作用就是将 全局配置文件中 前缀为 spring.datasource
- 的属性值注入到 com.alibaba.druid.pool.DruidDataSource 的同名参数中
  */
  @ConfigurationProperties(prefix = "spring.datasource")
  @Bean
  public DataSource druidDataSource() {
  return new DruidDataSource();
  }
~~~

~~~java
- /**

  - 配置 Druid 监控 之  管理后台的 Servlet

  - 内置 Servler 容器时没有web.xml 文件，所以使用 Spring Boot 的注册 Servlet 方式
    */
    @Bean
    public ServletRegistrationBean statViewServlet() {
    ServletRegistrationBean bean = new ServletRegistrationBean(new StatViewServlet(),
            "/druid/*");

    /**

    - loginUsername：Druid 后台管理界面的登录账号
    - loginPassword：Druid 后台管理界面的登录密码
    - allow：Druid 后台允许谁可以访问
    - initParams.put("allow", "localhost")：表示只有本机可以访问
    - initParams.put("allow", "")：为空或者为null时，表示允许所有访问
    - deny：Druid 后台拒绝谁访问
    - initParams.put("deny", "192.168.1.20");表示禁止此ip访问
       */
      Map<String, String> initParams = new HashMap<>();
      initParams.put("loginUsername", "admin");
      initParams.put("loginPassword", "123456");
      initParams.put("allow", "");
      /*initParams.put("deny", "192.168.1.20");*/

    /** 设置初始化参数*/
    bean.setInitParameters(initParams);
    return bean;
    }

}
~~~

4、这些参数可以在 com.alibaba.druid.support.http.StatViewServlet 的父类 com.alibaba.druid.support.http.ResourceServlet 中找到



#### 配置 Druid web 监控 filter

1、这个过滤器的作用就是统计 web 应用请求中所有的数据库信息，比如 发出的 sql 语句，sql 执行的时间、请求次数、请求的 url 地址、以及seesion 监控、数据库表的访问次数 等等。

~~~java
@Configuration
public class DruidConfig {
/**
- 将自定义的 Druid 数据源添加到容器中，不再让 Spring Boot 自动创建
- 这样做的目的是：绑定全局配置文件中的 druid 数据源属性到 com.alibaba.druid.pool.DruidDataSource
- 从而让它们生效
  *
- @return
- @ConfigurationProperties(prefix = "spring.datasource")：作用就是将 全局配置文件中 前缀为 spring.datasource
- 的属性值注入到 com.alibaba.druid.pool.DruidDataSource 的同名参数中
  */
  @ConfigurationProperties(prefix = "spring.datasource")
  @Bean
  public DataSource druidDataSource() {
  	return new DruidDataSource();
  }
~~~

####  配置 Druid 监控 之  管理后台的 Servlet

~~~java
/**

-

- 内置 Servler 容器时没有web.xml 文件，所以使用 Spring Boot 的注册 Servlet 方式
  */
  @Bean
  public ServletRegistrationBean statViewServlet() {
  ServletRegistrationBean bean = new ServletRegistrationBean(new StatViewServlet(),
          "/druid/*");

  /**

  - loginUsername：Druid 后台管理界面的登录账号
  - loginPassword：Druid 后台管理界面的登录密码
  - allow：Druid 后台允许谁可以访问
  - initParams.put("allow", "localhost")：表示只有本机可以访问
  - initParams.put("allow", "")：为空或者为null时，表示允许所有访问
  - deny：Druid 后台拒绝谁访问
  - initParams.put("deny", "192.168.1.20");表示禁止此ip访问
     */
    Map<String, String> initParams = new HashMap<>();
    initParams.put("loginUsername", "admin");
    initParams.put("loginPassword", "123456");
    initParams.put("allow", "");
    /*initParams.put("deny", "192.168.1.20");*/

  /** 设置初始化参数*/
  bean.setInitParameters(initParams);
  return bean;
  }

/**

- 配置 Druid 监控 之  web 监控的 filter

- WebStatFilter：用于配置Web和Druid数据源之间的管理关联监控统计
  */
  @Bean
  public FilterRegistrationBean webStatFilter() {
      FilterRegistrationBean bean = new FilterRegistrationBean();
          bean.setFilter(new WebStatFilter());

          /** exclusions：设置哪些请求进行过滤排除掉，从而不进行统计*/
          Map<String, String> initParams = new HashMap<>();
          initParams.put("exclusions", "*.js,*.css,/druid/*");
          bean.setInitParameters(initParams);

          /** "/*" 表示过滤所有请求*/
          bean.setUrlPatterns(Arrays.asList("/*"));
          return bean;
      }
  }
~~~



2、运行应用，可以往后台发一些请求，同时进行一些 数据库 sql 操作，测试结果效果如下：

![img](https://img-blog.csdn.net/20180820112904218?watermark/2/text/aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3dhbmdteDE5OTMzMjg=/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70)



## 十：SpringBoot的启动原理

![img](https://mmbiz.qpic.cn/mmbiz_png/8pY8IHKk4aH5r9V8zDMpbwOmAicE6q4lJLUP0pmZ5gNggNUjFPSNq8WnxZkLhiadVHuSJsH8oHgc9jxW4q2HbBWg/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

### 正文

我们开发任何一个Spring Boot项目，都会用到如下的启动类

```java
@SpringBootApplication
public class Application {   
    public static void main(String[] args) { 
        SpringApplication.run(Application.class, args);  
    }
}
```

从上面代码可以看出，Annotation定义（**@SpringBootApplication**）和类定义（**SpringApplication.run**）最为耀眼，所以要揭开SpringBoot的神秘面纱，我们要从这两位开始就可以了。

### SpringBootApplication背后的秘密

```java
@Target(ElementType.TYPE)           
// 注解的适用范围，其中TYPE用于描述类、接口（包括包注解类型）或enum声明
@Retention(RetentionPolicy.RUNTIME) 
// 注解的生命周期，保留到class文件中（三个生命周期
）@Documented                        
// 表明这个注解应该被javadoc记录
@Inherited                       
// 子类可以继承该注解
@SpringBootConfiguration          
// 继承了Configuration，表示当前是注解类
@EnableAutoConfiguration           
// 开启springboot的注解功能，springboot的四大神器之一，其借助@import的帮助
@ComponentScan(excludeFilters = {  
// 扫描路径设置（具体使用待确认）   
@Filter(type = FilterType.CUSTOM, classes = TypeExcludeFilter.class),   
@Filter(type = FilterType.CUSTOM, classes = AutoConfigurationExcludeFilter.class) 
})
    public @interface SpringBootApplication {...}
```

虽然定义使用了多个Annotation进行了原信息标注，但实际上重要的只有三个Annotation：

- @Configuration（@SpringBootConfiguration点开查看发现里面还是应用了@Configuration）
- @EnableAutoConfiguration
- @ComponentScan 所以，如果我们使用如下的SpringBoot启动类，整个SpringBoot应用依然可以与之前的启动类功能对等：

```java
@Configuration
@EnableAutoConfiguration
@ComponentScan
public class Application {  
    public static void main(String[] args) {    
        SpringApplication.run(Application.class, args);   
    }
}
```

每次写这3个比较累，所以写一个@SpringBootApplication方便点。接下来分别介绍这3个Annotation。

### @Configuration

这里的@Configuration对我们来说不陌生，它就是JavaConfig形式的Spring Ioc容器的配置类使用的那个@Configuration，SpringBoot社区推荐使用基于JavaConfig的配置形式，所以，这里的启动类标注了@Configuration之后，本身其实也是一个IoC容器的配置类。

举几个简单例子回顾下，XML跟config配置方式的区别：

##### 表达形式层面

基于XML配置的方式是这样：

```xml
<?xml version="1.0" encoding="UTF-8"?><beans xmlns="http://www.springframework.org/schema/beans"       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans-3.0.xsd"       default-lazy-init="true">    <!--bean定义--></beans>
```

而基于JavaConfig的配置方式是这样：

```java
@Configuration
public class MockConfiguration{   
    //bean定义
}
```

任何一个标注了**@Configuration**的Java类定义都是一个JavaConfig配置类。

##### 注册bean定义层面

基于XML的配置形式是这样：

```xml
<bean id="mockService" class="..MockServiceImpl">    ...</bean>
```

而基于JavaConfig的配置形式是这样的：

```java
@Configuration
public class MockConfiguration{
    @Bean   
    public MockService mockService(){  
        return new MockServiceImpl(); 
    }
}
```

任何一个标注了**@Bean**的方法，其返回值将作为一个bean定义注册到Spring的IoC容器，方法名将默认成该bean定义的id。

##### 表达依赖注入关系层面

为了表达bean与bean之间的依赖关系，在XML形式中一般是这样：

```xml
<bean id="mockService" class="..MockServiceImpl">   
    <propery name ="dependencyService" ref="dependencyService" />
</bean>
<bean id="dependencyService" class="DependencyServiceImpl"></bean>
```

而基于JavaConfig的配置形式是这样的：

```java
@Configuration
public class MockConfiguration{  
    @Bean   
    public MockService mockService(){    
        return new MockServiceImpl(dependencyService());   
    }    
    @Bean  
    public DependencyService dependencyService(){  
        return new DependencyServiceImpl();   
    }
}
```

如果一个bean的定义依赖其他bean,则直接调用对应的JavaConfig类中依赖bean的创建方法就可以了。

### @ComponentScan

@ComponentScan这个注解在Spring中很重要，它对应XML配置中的元素，@ComponentScan的功能其实就是自动扫描并加载符合条件的组件（比如@Component和@Repository等）或者bean定义，最终将这些bean定义加载到IoC容器中。

我们可以通过basePackages等属性来细粒度的定制@ComponentScan自动扫描的范围，如果不指定，则默认Spring框架实现会从声明@ComponentScan所在类的package进行扫描。

> 注：所以SpringBoot的启动类最好是放在root package下，因为默认不指定basePackages。

### @EnableAutoConfiguration

个人感觉**@EnableAutoConfiguration**这个Annotation最为重要，所以放在最后来解读，大家是否还记得Spring框架提供的各种名字为@Enable开头的Annotation定义？比如**@EnableScheduling、@EnableCaching、@EnableMBeanExport**等，**@EnableAutoConfiguration**的理念和做事方式其实一脉相承，简单概括一下就是，借助**@Import**的支持，收集和注册特定场景相关的bean定义。

> @EnableScheduling是通过@Import将Spring调度框架相关的bean定义都加载到IoC容器。
>
> @EnableMBeanExport是通过@Import将JMX相关的bean定义加载到IoC容器。

而**@EnableAutoConfiguration**也是借助@Import的帮助，将所有符合自动配置条件的bean定义加载到IoC容器，仅此而已！

**@EnableAutoConfiguration**作为一个复合Annotation,其自身定义关键信息如下：

```java
@SuppressWarnings("deprecation")
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Inherited
@AutoConfigurationPackage
@Import(EnableAutoConfigurationImportSelector.class)
public @interface EnableAutoConfiguration {  
    ...
}
```

**两个比较重要的注解：**

> @AutoConfigurationPackage：自动配置包 @Import: 导入自动配置的组件

AutoConfigurationPackage注解：

```java
static class Registrar implements ImportBeanDefinitionRegistrar, DeterminableImports { 
    @Override      
    public void registerBeanDefinitions(AnnotationMetadata metadata,            
                                        BeanDefinitionRegistry registry) {   
        register(registry, new PackageImport(metadata).getPackageName());  
    }
```

它其实是注册了一个Bean的定义。`newPackageImport(metadata).getPackageName()`，它其实返回了当前主程序类的 同级以及子级的包组件。

**![img](data:image/gif;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQImWNgYGBgAAAABQABh6FO1AAAAABJRU5ErkJggg==)**

以上图为例，DemoApplication是和demo包同级，但是demo2这个类是DemoApplication的父级，和example包同级

也就是说，DemoApplication启动加载的Bean中，并不会加载demo2，这也就是为什么，我们要把DemoApplication放在项目的最高级中。

##### Import(AutoConfigurationImportSelector.class)注解：

![img](data:image/gif;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQImWNgYGBgAAAABQABh6FO1AAAAABJRU5ErkJggg==)

可以从图中看出 **AutoConfigurationImportSelector 继承了DeferredImportSelector 继承了 ImportSelector**

ImportSelector有一个方法为：**selectImports。**

```java
@Override  
public String[] selectImports(AnnotationMetadata annotationMetadata) {    
    if (!isEnabled(annotationMetadata)) {  
        return NO_IMPORTS;     
    }     
    AutoConfigurationMetadata autoConfigurationMetadata = AutoConfigurationMetadataLoader                .loadMetadata(this.beanClassLoader); 
    AutoConfigurationEntry autoConfigurationEntry = 
        getAutoConfigurationEntry(autoConfigurationMetadata, annotationMetadata);       
    	return StringUtils.toStringArray(autoConfigurationEntry.getConfigurations()); 
}   
protected AutoConfigurationEntry getAutoConfigurationEntry(AutoConfigurationMetadata autoConfigurationMetadata,            AnnotationMetadata annotationMetadata) {  
    if (!isEnabled(annotationMetadata)) {       
        return EMPTY_ENTRY;  
    }      
    AnnotationAttributes attributes = getAttributes(annotationMetadata);     
    List<String> configurations = getCandidateConfigurations(annotationMetadata, 
                                                             attributes); 
    configurations = removeDuplicates(configurations);  
    Set<String> exclusions = getExclusions(annotationMetadata, attributes);   
    checkExcludedClasses(configurations, exclusions);       
    configurations.removeAll(exclusions);       
    configurations = filter(configurations, autoConfigurationMetadata);     
    fireAutoConfigurationImportEvents(configurations, exclusions);   
    return new AutoConfigurationEntry(configurations, exclusions); 
}
```

getCandidateConfigurations方法，他其实是使用SpringFactoriesLoader去加载 **publicstaticfinalStringFACTORIES_RESOURCE_LOCATION="META-INF/spring.factories";**外部文件。这个外部文件，有很多自动配置的类。如下：

![img](data:image/gif;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQImWNgYGBgAAAABQABh6FO1AAAAABJRU5ErkJggg==)

其中，最关键的要属 `@Import(EnableAutoConfigurationImportSelector.class)`，借助**EnableAutoConfigurationImportSelector，@EnableAutoConfiguration**可以帮助SpringBoot应用将所有符合条件的**@Configuration**配置都加载到当前SpringBoot创建并使用的IoC容器。就像一只“八爪鱼”一样。

![img](data:image/gif;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQImWNgYGBgAAAABQABh6FO1AAAAABJRU5ErkJggg==)

### 自动配置幕后英雄：SpringFactoriesLoader详解

借助于Spring框架原有的一个工具类：**SpringFactoriesLoader**的支持，**@EnableAutoConfiguration**可以智能的自动配置功效才得以大功告成！

**SpringFactoriesLoader**属于Spring框架私有的一种扩展方案，其主要功能就是从指定的配置文件 `META-INF/spring.factories`加载配置。

```java
public abstract class SpringFactoriesLoader {  
    //...  
    public static <T> List<T> loadFactories(Class<T> factoryClass, ClassLoader classLoader) 	{     
        ...    }    
    public static List<String> loadFactoryNames(C lass<?> factoryClass, ClassLoader classLoader) {       
        ....  
    }
}
```

配合**@EnableAutoConfiguration**使用的话，它更多是提供一种配置查找的功能支持，即根据**@EnableAutoConfiguration**的完整类名 `org.springframework.boot.autoconfigure.EnableAutoConfiguration`作为查找的key，获取对应的一组**@Configuration**类

![img](data:image/gif;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQImWNgYGBgAAAABQABh6FO1AAAAABJRU5ErkJggg==)

上图就是从SpringBoot的autoconfigure依赖包中的 `META-INF/spring.factories`配置文件中摘录的一段内容，可以很好地说明问题。

 所以， `@EnableAutoConfiguration`自动配置的魔法骑士就变成了：从classpath中搜寻所有的 `META-INF/spring.factories`配置文件，并将其中 `org.springframework.boot.autoconfigure.EnableutoConfiguration`对应的配置项通过反射（Java Refletion）实例化为对应的标注了

`@Configuration`的JavaConfig形式的IoC容器配置类，然后汇总为一个并加载到IoC容器。

**SpringBoot的启动原理基本算是讲完了，为了方便记忆，我根据上面的分析画了张图**

**![img](data:image/gif;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQImWNgYGBgAAAABQABh6FO1AAAAABJRU5ErkJggg==)**

#### 深入探索SpringApplication执行流程

SpringApplication的run方法的实现是我们本次需要讲解的主要线路，该方法的主要流程大体可以归纳如下：

1）我们使用的是SpringApplication的静态run方法，那么，在这个方法里面首先创建一个SpringApplication对象的实例，然后调用这个创建好的SpringApplication实例的run方法。在SpringApplication实例初始化的时候，会提前做几件事：

```java
    @SuppressWarnings({ "unchecked", "rawtypes" }) 

public SpringApplication(ResourceLoader resourceLoader, Class<?>... primarySources) {   
    this.resourceLoader = resourceLoader;     
    Assert.notNull(primarySources, "PrimarySources must not be null");  
    this.primarySources = new LinkedHashSet<>(Arrays.asList(primarySources));  
    this.webApplicationType = WebApplicationType.deduceFromClasspath();     
    setInitializers((Collection) 
                    getSpringFactoriesInstances(ApplicationContextInitializer.class));  
    setListeners((Collection) getSpringFactoriesInstances(ApplicationListener.class));   
    this.mainApplicationClass = deduceMainApplicationClass();  
}
```

根据classpath里面是否存在某个特征类（ `org.springframework.web.context.ConfigurableWebApplicationContext`）来决定是否应该创建一个为Web应用使用的ApplicationContext类型。使用 `SpringFactoriesLoader`在应用的classpath中查找并加载所有可用的 `ApplicationContextInitializer`。使用 `SpringFactoriesLoader`在应用classpath中查找并加载所有可用的 `ApplicationListener`。判断并设置 `main`方法的定义类。

2）SpringApplication实例初始化完成并且完成设置后，就开始执行run方法的逻辑了，方法执行开始，首先遍历执行所有通过 `SpringFactoriesLoader`可以查找并加载的 `SpringApplicationRunListener`。调用他们的 `started()`方法，告诉这些 `SpringApplicationRunListener`，Springboot应用可以开始执行了。

```java
public ConfigurableApplicationContext run(String... args) {     
    StopWatch stopWatch = new StopWatch();      
    stopWatch.start();       
    ConfigurableApplicationContext context = null;     
    Collection<SpringBootExceptionReporter> exceptionReporters = new ArrayList<>();  
    configureHeadlessProperty();      
    SpringApplicationRunListeners listeners = getRunListeners(args);    
    listeners.starting();      
    try {       
        ApplicationArguments applicationArguments = new DefaultApplicationArguments(args);
        ConfigurableEnvironment environment = prepareEnvironment(listeners, applicationArguments);           
        configureIgnoreBeanInfo(environment);  
        Banner printedBanner = printBanner(environment);    
        context = createApplicationContext();     
        exceptionReporters = getSpringFactoriesInstances(SpringBootExceptionReporter.class,                    new Class[] { ConfigurableApplicationContext.class }, context);  
        prepareContext(context, environment, listeners, applicationArguments, printedBanner);           
        refreshContext(context);     
        afterRefresh(context, applicationArguments);      
        stopWatch.stop();         
        if (this.logStartupInfo) {    
            new StartupInfoLogger(this.mainApplicationClass).logStarted(getApplicationLog(), stopWatch); 
        }          
        listeners.started(context);   
        callRunners(context, applicationArguments);    
    }catch (Throwable ex) {     
        handleRunFailure(context, ex, exceptionReporters, listeners);     
        throw new IllegalStateException(ex);     
    }     
    try {     
        listeners.running(context);     
    } catch (Throwable ex) {    
        handleRunFailure(context, ex, exceptionReporters, null);  
        throw new IllegalStateException(ex);      
    }        
    return context;  
}
```

3）创建并配置当前Spring Boot应用将要使用的Environment（包括配置要使用的 `PropertySource`以及 `Profile`）。

```java
private ConfigurableEnvironment prepareEnvironment(            SpringApplicationRunListeners listeners,            ApplicationArguments applicationArguments) {     
    // Create and configure the environment   
    ConfigurableEnvironment environment = getOrCreateEnvironment(); 
    configureEnvironment(environment, applicationArguments.getSourceArgs());  
    listeners.environmentPrepared(environment);    
    if (!this.webEnvironment) {     
        environment = new EnvironmentConverter(getClassLoader())                    .convertToStandardEnvironmentIfNecessary(environment);      
    }      
    return environment;  
}
```

4）遍历调用所有 `SpringApplicationRunListener`的 `environmentPrepared`的方法，告诉他们：“当前SPringBoot应用的Environment准备好了”。

```java
 public void environmentPrepared(ConfigurableEnvironment environment) {    
     for (SpringApplicationRunListener listener : this.listeners) {  
         listener.environmentPrepared(environment); 
     }   
 }
```

5）如果 `SpringApplication`的showBanner属性被设置为true，则打印banner。

```java
private Banner printBanner(ConfigurableEnvironment environment) {   
    if (this.bannerMode == Banner.Mode.OFF) {      
        return null;    
    }   
    ResourceLoader resourceLoader = this.resourceLoader != null ? this.resourceLoader                : new DefaultResourceLoader(getClassLoader());    
    SpringApplicationBannerPrinter bannerPrinter = new SpringApplicationBannerPrinter(                resourceLoader, this.banner);    
    if (this.bannerMode == Mode.LOG) {      
        return bannerPrinter.print(environment, this.mainApplicationClass, logger);
    }    
    return bannerPrinter.print(environment, this.mainApplicationClass, System.out);   
}
```

6）根据用户是否明确设置了 `applicationContextClass`类型以及初始化阶段的推断结果，决定该为当前SpringBoot应用创建什么类型的 `ApplicationContext`并创建完成，然后根据条件决定是否添加ShutdownHook，决定是否使用自定义的`BeanNameGenerator`，决定是否使用自定义的 `ResourceLoader`，当然，最重要的，将之前准备好的Environment设置跟创建好的 `ApplicationContext`使用。

7）ApplicationContext创建好之后，SpringApplication会再次借助 `Spring-FactoriesLoader`，查找并加载classpath中所有可用的 `ApplicationContext-Initializer`然后遍历调用这些ApplicationContextInitialzer的 `initialize（applicationContext）`方法来对已经创建好的ApplicationContext进行进一步的处理。

```java
@SuppressWarnings({ "rawtypes", "unchecked" }) 
protected void applyInitializers(ConfigurableApplicationContext context) {   
    for (ApplicationContextInitializer initializer : getInitializers()) {        
        Class<?> requiredType = GenericTypeResolver.resolveTypeArgument(                    initializer.getClass(), ApplicationContextInitializer.class);    
        Assert.isInstanceOf(requiredType, context, "Unable to call initializer.");  
        initializer.initialize(context);      
    }  
}
```

8）遍历调用所有SpringApplicationRunListener的 `contextPrepared()`方法。

```java
private void prepareContext(ConfigurableApplicationContext context,            ConfigurableEnvironment environment, SpringApplicationRunListeners listeners,            ApplicationArguments applicationArguments, Banner printedBanner) {  
    context.setEnvironment(environment);   
    postProcessApplicationContext(context);    
    applyInitializers(context);      
    listeners.contextPrepared(context);  
    if (this.logStartupInfo) {      
        logStartupInfo(context.getParent() == null);  
        logStartupProfileInfo(context);       
    }      
    // Add boot specific singleton beans        
    context.getBeanFactory().registerSingleton("springApplicationArguments",                applicationArguments);       
    if (printedBanner != null) {  
        context.getBeanFactory().registerSingleton("springBootBanner", printedBanner);
    }    
    // Load the sources      
    Set<Object> sources = getSources();       
    Assert.notEmpty(sources, "Sources must not be empty");     
    load(context, sources.toArray(new Object[sources.size()]));      
    listeners.contextLoaded(context);  
}
```

9）最核心的一步，将之前通过 `@EnableAutoConfiguration`获取的所有配置以及其他形式的IoC容器配置加载到已经准备完毕的 `ApplicationContext`。

```java
private void prepareAnalyzer(ConfigurableApplicationContext context,            FailureAnalyzer analyzer) {       
    if (analyzer instanceof BeanFactoryAware) {    
        ((BeanFactoryAware) analyzer).setBeanFactory(context.getBeanFactory());     
    }   
}
```

10）遍历调用所有 `SpringApplicationRunListener`的 `contextLoaded()`方法。

```java
public void contextLoaded(ConfigurableApplicationContext context) {  
    for (SpringApplicationRunListener listener : this.listeners) {    
        listener.contextLoaded(context);      
    } 
}
```

11）调用ApplicationContext的 `refresh()`方法，完成IoC容器可用的最后一道工序。

```java
private void refreshContext(ConfigurableApplicationContext context) {      
    refresh(context);   
    if (this.registerShutdownHook) {
        try {               
            context.registerShutdownHook();       
        }catch (AccessControlException ex) {            
            // Not allowed in some environments.       
        }    
    }   
}
```

12）查找当前ApplicationContext中是否注册有 `CommandLineRunner`，如果有，则遍历执行他们。

```java
private void callRunners(ApplicationContext context, ApplicationArguments args) {    
    List<Object> runners = new ArrayList<Object>();       
    runners.addAll(context.getBeansOfType(ApplicationRunner.class).values());  
    runners.addAll(context.getBeansOfType(CommandLineRunner.class).values()); 
    AnnotationAwareOrderComparator.sort(runners);      
    for (Object runner : new LinkedHashSet<Object>(runners)) {  
        if (runner instanceof ApplicationRunner) {      
            callRunner((ApplicationRunner) runner, args);  
        }           
        if (runner instanceof CommandLineRunner) {  
            callRunner((CommandLineRunner) runner, args);  
        }    
    }   
}
```

13）正常情况下，遍历执行 `SpringApplicationRunListener`的 `finished()`方法，（如果整个过程出现异常，则依然调用所有 `SpringApplicationRunListener的finished()`方法，只不过这种情况下会将异常信息一并传入处理）

去除事件通知点后，整个流程如下：

```java
public void finished(ConfigurableApplicationContext context, Throwable exception) {    
    for (SpringApplicationRunListener listener : this.listeners) {     
        callFinishedListener(listener, context, exception); 
    }   
}
```

![img](https://mmbiz.qpic.cn/mmbiz_png/8pY8IHKk4aH5r9V8zDMpbwOmAicE6q4lJpRRLOib15jkznoaoUicpXia3IkibxAnVEz0cQiaarKwq2ibGTeZLJsrvA3fQ/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

### 总结

到此，SpringBoot的核心组件完成了基本的解析，综合来看，大部分都是Spring框架背后的一些概念和实践方式，SpringBoot只是在这些概念和实践上对特定的场景事先进行了固化和升华，而也恰恰是这些固化让我们开发基于Spring框架的应用更加方便高效。























## 错误笔记


对于IDEA中每次更改前端文件后可以不重启服务器

一：配置文件中添加：spring.thymeleaf.cache=false//禁用缓存

二：在IDEA中按下：ctrl+F9

~~~java
org.springframework.beans.factory.UnsatisfiedDependencyException: Error creating bean with name 'com.cloud.hello_quick.HelloQuickApplicationTests': Unsatisfied dependency expressed through field 'person'; nested exception is org.springframework.beans.factory.NoSuchBeanDefinitionException: No qualifying bean of type 'com.cloud.beans.Person' available: expected at least 1 bean which qualifies as autowire candidate. Dependency annotations: {@org.springframework.beans.factory.annotation.Autowired(required=true)}
此错误原因：检查是否将bean的包与Spring Boot启动类在同一包下，因为Spring Boot只对与启动类在同一包下的类进行扫描，此处出现无法@Autowired而出错
~~~

~~~properties
javax.servlet.ServletException: Circular view path [user]: would dispatch back to the current handle:
1.把@Controller注解换成@RestController

2.在方法上添加注解@ResponseBody
3.如果想要用视图去展示，应该要设置好视图展示页面，比如说用一个模板语言来接收返回的数据(thymeleaf或者freemarker等)，也可以用jsp接收，但是SpringBoot官方是不推荐用jsp的，而是建议使用thymeleaf作为模板语言
~~~



1