# VeriGate - 人机验证组件

一个类似Cloudflare的人机验证组件，可以嵌入到任何网站中。

## 功能特性

- 🛡️ 多种验证方式：滑块验证、点击验证、拼图验证
- 🎨 可自定义主题和样式
- 🚀 轻量级，易于集成
- 🌐 支持跨域使用
- ☁️ 可部署到Netlify

## 快速开始

### 1. 在HTML中引入组件

```html
<script src="https://verigate1.netlify.app/verigate.js"></script>
<div id="verigate-container"></div>
<script>
  VeriGate.render('#verigate-container', {
    siteKey: 'your-site-key',
    theme: 'light',
    onSuccess: function(token) {
      console.log('验证成功:', token);
    }
  });
</script>
```

> **提示：** 你可以直接将上述代码嵌入到你的网页，无论你的网站部署在哪里，组件会自动连接 verigate1.netlify.app 的 API，无需任何额外配置。
### 2. 服务端验证

```javascript
// 向API发送验证请求
const response = await fetch('https://verigate1.netlify.app/.netlify/functions/verify', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    token: 'user-token',
    siteKey: 'your-site-key'
  })
});
```

> **提示：** API 已设置允许跨域（CORS），你可以在任意网站或后端直接请求，无需担心跨域问题。

## 项目结构

```
VeriGate/
├── src/
│   ├── verigate.js          # 主要的验证组件
│   ├── styles.css           # 组件样式
│   └── challenges/          # 各种验证挑战
├── netlify/
│   └── functions/           # Netlify Functions API
├── demo/                    # 演示页面
└── dist/                    # 构建输出
```

## 部署到Netlify

1. 将项目推送到GitHub
2. 在Netlify中连接GitHub仓库
3. 设置构建命令：`npm run build`
4. 设置发布目录：`dist`
5. 部署完成后即可使用

## API文档

详见 [API文档](./docs/api.md)
