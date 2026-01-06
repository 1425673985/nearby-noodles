# 附近面馆 - 微信小程序

一个基于微信小程序开发的附近面馆查找应用，可以帮助用户查找附近3km内的面馆信息，并提供导航功能。

## 功能特性

- ✅ 用户定位授权
- ✅ 用户信息授权和登录
- ✅ 基于高德地图API搜索附近3km内的面馆
- ✅ 展示面馆详细信息（图片、评分、评价、地址等）
- ✅ 换一家面馆功能
- ✅ 一键导航功能

## 项目结构

```
nearby-noodle-shop/
├── app.js                 # 小程序逻辑
├── app.json               # 小程序公共配置
├── app.wxss               # 小程序公共样式
├── project.config.json    # 项目配置文件
├── sitemap.json          # 站点地图配置
├── pages/                 # 页面目录
│   └── index/            # 主页面
│       ├── index.js      # 页面逻辑
│       ├── index.json    # 页面配置
│       ├── index.wxml    # 页面结构
│       └── index.wxss    # 页面样式
└── utils/                 # 工具函数
    ├── api.js            # API调用函数
    └── config.js         # 配置文件
```

## 使用前准备

### 1. 获取高德地图API Key

1. 访问 [高德开放平台](https://console.amap.com/)
2. 注册并登录账号
3. 进入控制台，创建新应用
4. 为应用添加Key，选择"微信小程序"平台
5. 配置小程序的AppID

### 2. 配置API Key

编辑 `utils/config.js` 文件，将 `your-amap-key` 替换为你的高德地图API Key：

```javascript
AMAP_KEY: 'your-amap-key', // 替换为你的API Key
```

### 3. 配置小程序AppID

编辑 `project.config.json` 文件，将 `your-appid` 替换为你的微信小程序AppID：

```json
{
  "appid": "your-appid"
}
```

### 4. 配置服务器域名（重要）

由于微信小程序的网络安全限制，直接调用高德地图API可能会遇到跨域问题。有两种解决方案：

#### 方案1：使用服务器代理（推荐）

1. 在你的服务器上创建一个代理接口，用于调用高德地图API
2. 修改 `utils/api.js`，使用 `searchNearbyRestaurantsByProxy` 函数
3. 在微信公众平台配置服务器域名

#### 方案2：配置request合法域名

1. 登录[微信公众平台](https://mp.weixin.qq.com/)
2. 进入开发管理 -> 开发设置
3. 在"服务器域名"中添加：
   - `https://restapi.amap.com` （request合法域名）

## 安装和使用

1. 使用微信开发者工具打开项目
2. 在微信开发者工具中导入项目
3. 填写AppID（如果没有，可以选择测试号）
4. 配置API Key和服务器域名
5. 编译运行

## 功能说明

### 定位授权

小程序首次打开时会请求用户授权位置信息，用户需要授权后才能使用查找功能。

### 搜索面馆

- 自动获取用户当前位置
- 搜索半径：3km
- 搜索关键词：面馆
- 返回第一个匹配的面馆信息

### 面馆信息展示

- 面馆名称
- 地址信息
- 评分和评价数量
- 距离用户位置
- 面馆图片（如果有）
- 用户评价（模拟数据）

### 换一家面馆

点击"换一家面馆"按钮，会在已搜索到的面馆列表中循环切换显示。

### 导航功能

点击"开始导航"按钮，会调用微信内置地图，打开导航功能，引导用户前往目标面馆。

## 注意事项

1. **API Key安全**：高德地图API Key应该妥善保管，不要提交到公开代码仓库
2. **服务器代理**：生产环境建议使用服务器代理调用高德API，避免暴露API Key
3. **图片资源**：如果面馆没有图片，需要准备默认图片放在 `images/default-restaurant.jpg`
4. **权限配置**：确保在 `app.json` 中正确配置了位置权限说明

## 开发建议

1. 可以将API Key存储在环境变量或后端配置中
2. 建议添加错误处理和重试机制
3. 可以添加面馆收藏功能
4. 可以添加更多的筛选条件（如价格、评分等）
5. 可以集成真实的用户评价系统

## 许可证

MIT License

## 技术支持

如有问题，请查看：
- [微信小程序官方文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [高德地图API文档](https://lbs.amap.com/api/webservice/summary)
