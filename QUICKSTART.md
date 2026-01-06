# 快速开始指南

## 第一步：配置基本信息

### 1. 配置小程序AppID

打开 `project.config.json`，将 `your-appid` 替换为你的微信小程序AppID。

```json
{
  "appid": "your-appid"
}
```

### 2. 配置高德地图API Key

打开 `utils/config.js`，将 `your-amap-key` 替换为你的高德地图API Key。

```javascript
AMAP_KEY: 'your-amap-key',
```

**如何获取高德地图API Key：**
1. 访问 https://console.amap.com/
2. 注册并登录
3. 创建应用，选择"微信小程序"平台
4. 获取Key并配置小程序的AppID

### 3. 配置服务器域名（可选）

如果你使用服务器代理方案，需要：

1. 在 `utils/config.js` 中配置服务器地址：
```javascript
SERVER_API_URL: 'https://your-server.com/api'
```

2. 在微信公众平台配置服务器域名：
   - 登录 https://mp.weixin.qq.com/
   - 开发 -> 开发管理 -> 开发设置
   - 服务器域名 -> request合法域名 -> 添加你的服务器域名

如果你直接调用高德API，需要在服务器域名中添加：
- `https://restapi.amap.com`

## 第二步：准备图片资源（可选）

如果面馆没有图片，可以准备一张默认图片：

1. 创建 `images/default-restaurant.jpg`
2. 或者修改 `pages/index/index.js` 中的默认图片路径

## 第三步：使用微信开发者工具打开项目

1. 下载并安装[微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 打开微信开发者工具
3. 选择"导入项目"
4. 选择项目目录 `nearby-noodle-shop`
5. 填写AppID（或选择测试号）
6. 点击"导入"

## 第四步：编译运行

1. 在微信开发者工具中点击"编译"
2. 在模拟器中测试功能
3. 真机预览：点击"预览"，用微信扫描二维码

## 常见问题

### 1. 定位失败

- 确保在 `app.json` 中配置了位置权限
- 确保在微信开发者工具中开启了模拟定位
- 真机测试时需要实际的地理位置权限

### 2. API调用失败

- 检查API Key是否正确
- 检查网络连接
- 如果使用直接调用方案，确保配置了request合法域名
- 查看控制台错误信息

### 3. 搜索不到面馆

- 确认当前位置附近确实有面馆
- 可以尝试扩大搜索半径（修改 `utils/config.js` 中的 `SEARCH_RADIUS`）
- 检查API返回的数据格式是否正确

### 4. 图片不显示

- 检查图片URL是否有效
- 如果使用默认图片，确保图片文件存在
- 检查网络图片的域名是否在downloadFile合法域名中

## 下一步

- 添加更多功能（收藏、分享等）
- 优化UI设计
- 集成真实的用户评价系统
- 添加面馆详情页面
- 优化搜索算法和筛选条件
