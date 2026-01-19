# 🌙 宝宝哄睡音频播放器

一个纯前端的Vue3音频播放器，专为宝宝哄睡设计。支持单曲循环、后台播放和锁屏控制。

## ✨ 特性

- 🔄 **单曲循环播放** - 自动循环播放选中的音频
- 📱 **移动端优化** - 完美支持 iOS 和 Android 设备
- 🔒 **后台播放** - 支持锁屏后继续播放
- 🎵 **Media Session API** - 锁屏界面显示播放信息和控制按钮
- 💤 **防休眠功能** - 使用 Screen Wake Lock API 保持屏幕常亮
- 🌐 **支持在线音频** - 可以添加本地或在线音频URL
- 💾 **数据持久化** - 音量设置自动保存
- 🎨 **精美UI** - 渐变设计，柔和的夜间模式配色

## 🚀 快速开始

### 启动本地服务器（必须）

由于浏览器安全限制，必须使用本地服务器运行：

```bash
cd baby-sleep-player
python -m http.server 8000
```

或者使用其他方式：

```bash
# 使用 Node.js
npx serve

# 使用 PHP
php -S localhost:8000
```

然后在浏览器访问：`http://localhost:8000`

### 在线部署

可以部署到以下平台获得更好体验：
- **GitHub Pages** - 免费，推荐
- **Vercel** - 免费且快速
- **Netlify** - 免费托管
- **Cloudflare Pages** - 全球CDN加速

## 🎵 添加音频

### 修改音频列表

编辑 `src/main.js` 文件，找到 `audioFiles` 数组（第5-24行）：

```javascript
const audioFiles = ref([
    {
        id: 1,
        name: '哄睡白噪音',
        url: './assets/哄睡白噪音.mp3'  // 本地音频
    },
    {
        id: 2,
        name: '雨声白噪音',
        url: 'https://example.com/rain.mp3'  // 在线音频
    },
    {
        id: 3,
        name: '海浪声',
        url: 'https://example.com/ocean.mp3'
    }
]);
```

### 音频URL格式

- **本地音频**: 使用相对路径，如 `'./assets/music.mp3'`
- **在线音频**: 使用完整URL，如 `'https://example.com/music.mp3'`
- **确保**: 每个音频有唯一的 `id`

### 支持的音频格式

- MP3 ✅
- WAV ✅
- OGG ✅
- AAC ✅
- M4A ✅

## 📱 移动端使用建议

### iOS (iPhone/iPad)

1. 在 Safari 中打开播放器
2. 点击底部的分享按钮
3. 选择"添加到主屏幕"
4. 像原生 App 一样使用

### Android

1. 在 Chrome 中打开播放器
2. 点击菜单（三个点）
3. 选择"添加到主屏幕"或"安装应用"

## ⚠️ 注意事项

### 关于后台播放

1. **iOS Safari**
   - 需要手动点击播放按钮才能开始
   - 锁屏后会继续播放
   - 锁屏界面可使用媒体控制

2. **Android Chrome**
   - 同样需要用户交互才能播放
   - 支持后台播放
   - 部分设备可能有省电限制

3. **微信/QQ 内置浏览器**
   - 可能限制后台播放
   - 建议使用系统浏览器（Safari/Chrome）

### 屏幕常亮

- 需要 HTTPS 环境（localhost 除外）
- 部分旧设备可能不支持
- 低电量时系统可能强制关闭

## 📂 项目结构

```
baby-sleep-player/
├── index.html          # 主页面
├── src/
│   ├── main.js         # Vue 应用逻辑（在这里修改音频列表）
│   └── style.css       # 样式文件
├── assets/             # 音频文件目录
│   └── 哄睡白噪音.mp3
└── README.md           # 项目说明
```

## 🛠️ 技术栈

- **Vue 3** - 渐进式 JavaScript 框架
- **Web Audio API** - 音频播放控制
- **Media Session API** - 锁屏媒体控制
- **Screen Wake Lock API** - 屏幕常亮
- **localStorage** - 数据持久化

## 💡 使用技巧

1. **添加到主屏幕** - 更好的使用体验
2. **播放前调整音量** - 避免打扰宝宝
3. **使用充电器** - 长时间播放建议充电
4. **开启飞行模式** - 避免来电打断

## 🔧 自定义

### 修改主题色

编辑 `src/style.css`：

```css
/* 主色调 */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### 修改标题

编辑 `src/main.js` 中的 template 部分：

```html
<h1>🌙 宝宝哄睡音频</h1>
```

## 📄 许可证

MIT License - 自由使用和修改

---

💤 祝你和宝宝都能有个好梦！
