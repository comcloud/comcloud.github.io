/**
 * Main JS file for Scriptor behaviours
 */

// Responsive video embeds
let videoEmbeds = [
  'iframe[src*="youtube.com"]',
  'iframe[src*="vimeo.com"]'
];
reframe(videoEmbeds.join(','));

// Menu on small screens
let menuToggle = document.querySelectorAll('.menu-toggle');
if (menuToggle) {
  for (let i = 0; i < menuToggle.length; i++) {
    menuToggle[i].addEventListener('click', function (e) {
      document.body.classList.toggle('menu--opened');
      e.preventDefault();
    }, false);
  }
}

/**
 * 随机选择文章和图片功能
 */
class RandomContentSelector {
  constructor() {
    // 可用的图片列表
    this.availableImages = [
      'images/404.jpg',
      'images/about.jpg', 
      'images/apple-watch-in-car.jpg',
      'images/apple-watch.jpg',
      'images/author.png',
      'images/design.jpg',
      'images/desk.jpg',
      'images/iphone-6.jpg',
      'images/iphone-in-hand.jpg',
      'images/mountain-2.jpg',
      'images/mountain.jpg',
      'images/road.jpg',
      'images/scriptor-jekyll.png'
    ];
  }
  
  /**
   * 从现有文章中随机选择几篇文章
   */
  selectRandomPosts(posts, count = 3) {
    // 创建文章副本以避免修改原数组
    const shuffled = [...posts].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
  
  /**
   * 随机选择一张图片
   */
  selectRandomImage() {
    const randomIndex = Math.floor(Math.random() * this.availableImages.length);
    return this.availableImages[randomIndex];
  }
  
  /**
   * 为文章添加随机图片
   */
  addRandomImagesToPosts(posts) {
    return posts.map(post => {
      return {
        ...post,
        feature_image: this.selectRandomImage()
      };
    });
  }
}

// 初始化随机内容选择器
document.addEventListener('DOMContentLoaded', function() {
  const randomSelector = new RandomContentSelector();
  
  // 如果在主页，实现随机内容展示
  if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
    // 这里可以添加针对主页的特殊处理
    console.log('Random content selector initialized for homepage');
  }
});
