module.exports = {
    title: '成都犀牛',
    description: '成都犀牛和你一起学习',
    base:'/',
    port: '7777',
    head: [
        ['link', {rel: 'icon', href: '/img/logo.png'}],
		["link", {rel: "stylesheet", href: "/css/style.css"}],
  		["script", {charset: "utf-8", src: "/js/main.js"}]
    ],
    markdown: {
        lineNumbers: true
    },
    themeConfig: {
        nav: require("./nav.js"),
        sidebar: require("./sidebar.js"),
        sidebarDepth: 2,
        lastUpdated: 'Last Updated',
        searchMaxSuggestoins: 10,
        serviceWorker: {
            updatePopup: {
                message: "有新的内容.",
                buttonText: '更新'
            }
        },
        editLinks: true,
        editLinkText: '在 GitHub 上编辑此页 ！'
    }
}