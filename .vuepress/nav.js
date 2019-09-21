module.exports = [
	{
		text: 'Java初学者指南' ,link: '/start/'
	},
	{
		text: 'Java进阶',
		items:[
			{
				text: 'web开发', link: '/Java/web/kaifa/',
				items:[
					{
						text: '前端学习',link: '/Java/web/kaifa/qianduan/',
						items: [
							{text: 'HTML',link: '/Java/web/kaifa/qianduan/htmlxuexi/'},
							{text: 'css', link: '/Java/web/kaifa/qianduan/cssxuexi/'},
							{text: 'javascript', link: '/Java/web/kaifa/qianduan/jsxuexi/'},
							{text:'JQuery',link:'/Java/web/kaifa/qianduan/jueryxuexi/jquery'}
						]
					},
					{
						text: 'servlet学习', link: '/Java/web/kaifa/serlvet/'
					},
					{
						text: '待续', link: '/Java/web/kaifa/daixu'
					}
				]
			},
			{	
				text: '框架学习',link: '/Java/web/framework/',
				items:[
					{text:'SpringBoot框架',link:'/Java/web/framework/springboot/one'},
					{text:'Mybatis',link:'/Java/web/framework/mybatis/one'},
					{text:'Spring',link:'/Java/web/framework/spring/one'},
					{text:'SpringMVC',link:'/Java/web/framework/springmvc/one'},
					{text:'Netty',link:'/Java/web/framework/netty/one'}
				]
			},
			{
				text:'JVM原理',line:'/Java/jvm/one'
			}
		]
	},
	{
		text:'操作系统学习',
		items:[
			{text:'linux',link:'/system/linux/one'},
		]
	},
	{
        text: '工具箱',
        items: [
			{
                text: '在线编辑',
				items: [
					{text: '图片压缩', link: 'https://tinypng.com/'}
				]
            },
			{
                text: '在线服务',
				items: [
					{text: '阿里云', link: 'https://www.aliyun.com/'},
					{text: '腾讯云', link: 'https://cloud.tencent.com/'}
				]
            },
			{
                text: '博客指南',
				items: [
					{text: '掘金', link: 'https://juejin.im/'},
					{text: 'CSDN', link: 'https://blog.csdn.net/'}
				]
            }
        ]
    }
]