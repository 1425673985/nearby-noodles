# 附近面馆 - 微信小程序

一个基于微信小程序开发的「附近面馆」决策助手。它会帮你在当前位置 **3km 范围内**找到一家面馆，直接告诉你**步行大约多少分钟**能到，并支持一键导航。设计理念是「不做选择困难症」——一次只推荐一家，不想去就「换一家」。

## 功能特性

- ✅ 用户定位授权（位置信息）
- ✅ 基于 **腾讯地图（位置服务 WebService SDK）** 搜索附近 3km 内的面馆
- ✅ 实时地图展示，自动框选「我的位置 + 面馆位置」适合步行的视野
- ✅ 展示面馆名称、地址、距离、**步行大约时间**和推荐标签
- ✅ 「换一家」快速切换推荐
- ✅ 一键调起微信内置地图导航

## 项目结构

```
nearby-noodle-shop/
├── app.js                 # 小程序逻辑
├── app.json               # 小程序公共配置
├── app.wxss               # 小程序公共样式
├── project.config.json    # 项目配置文件
├── sitemap.json           # 站点地图配置
├── libs/
│   └── qqmap-wx-jssdk.js  # 腾讯地图微信小程序 JavaScript SDK
├── pages/                 # 页面目录
│   ├── index/             # 主页面（地图 + 面馆推荐）
│   │   ├── index.js
│   │   ├── index.json
│   │   ├── index.wxml
│   │   └── index.wxss
│   └── profile/           # 个人信息页（版本信息）
│       ├── profile.js
│       ├── profile.json
│       ├── profile.wxml
│       └── profile.wxss
└── utils/                 # 工具函数
    ├── api.js             # API 调用函数（备用）
    └── config.js          # 配置文件（地图 Key / 搜索参数）
```

## 使用前准备

### 1. 获取腾讯地图 API Key

1. 访问 [腾讯位置服务控制台](https://lbs.qq.com/console/mykey.html)
2. 注册并登录账号
3. 在「应用管理 → 我的应用」中创建应用，并添加 Key
4. 为该 Key 勾选 **WebServiceAPI** 服务
5. 在 Key 的「配置」中，将「微信小程序」对应的 AppID 加入白名单

### 2. 配置 API Key

编辑 `utils/config.js`，将 `TENCENT_MAP_KEY` 替换为你自己的腾讯地图 Key：

```javascript
module.exports = {
  // 腾讯地图 API Key
  // 获取方式：https://lbs.qq.com/console/mykey.html
  TENCENT_MAP_KEY: '你的腾讯地图Key',

  // 搜索半径（米）
  SEARCH_RADIUS: 3000,

  // 搜索关键词
  SEARCH_KEYWORD: '面馆'
}
```

> ⚠️ **安全提示**：不要把真实的 Key 提交到公开仓库。建议在 Key 的控制台里**绑定 AppID 白名单**并开启额度/调用限制；生产环境可改为后端代理（见 `server-example.js`）。

### 3. 配置小程序 AppID

编辑 `project.config.json`，将 `appid` 替换为你的微信小程序 AppID：

```json
{
  "appid": "你的小程序AppID"
}
```

### 4. 配置服务器域名（重要）

腾讯地图 SDK 内部通过 `wx.request` 调用 WebService 接口，需要在微信公众平台配置合法域名：

1. 登录 [微信公众平台](https://mp.weixin.qq.com/)
2. 进入「开发管理 → 开发设置 → 服务器域名」
3. 在 **request 合法域名** 中添加：
   - `https://apis.map.qq.com`

> 开发阶段也可以在微信开发者工具的「详情 → 本地设置」中勾选「不校验合法域名」临时跳过。

## 安装和使用

1. 使用微信开发者工具导入本项目
2. 填写 AppID（没有可选择测试号）
3. 按上文配置腾讯地图 Key 与服务器域名
4. 编译运行，首次打开会请求位置授权

## 功能说明

### 定位授权
小程序首次打开会请求位置信息授权，授权后才能查找附近面馆。若用户拒绝，可通过弹窗引导前往设置页重新开启。

### 搜索面馆
- 自动获取用户当前位置（坐标系 `gcj02`）
- 搜索半径：3km
- 搜索关键词：面馆
- 取最近的结果展示（最多缓存 2 家用于「换一家」）

### 面馆信息展示
- 面馆名称、地址
- 距离用户的直线距离（米）
- **步行大约时间**（按约 75 m/分钟估算，向上取整）
- 推荐标签（按距离生成 + 随机情绪标签）

### 换一家
点击「换一家」在已搜索到的面馆之间切换，并重新聚焦地图视野。

### 导航
点击「去这家」调用 `wx.openLocation` 打开微信内置地图，引导前往目标面馆。

## 技术要点

- **地图能力**：腾讯地图微信小程序 SDK（`libs/qqmap-wx-jssdk.js`），使用 `qqmapsdk.search` 周边检索
- **地图视野**：通过 `MapContext.includePoints` 自动框选用户与面馆两点，保证步行视角
- **距离计算**：Haversine 公式（`calculateDistance`）兜底，优先使用接口返回的 `_distance`

## 注意事项

1. **API Key 安全**：腾讯地图 Key 请妥善保管，绑定 AppID 白名单，不要提交到公开仓库
2. **服务器代理**：生产环境建议使用后端代理调用，避免在前端暴露 Key（参考 `server-example.js`）
3. **权限配置**：确保 `app.json` 中正确配置了 `scope.userLocation` 权限说明与 `requiredPrivateInfos`

## 开发建议

1. 将 Key 收敛到后端配置/环境变量中
2. 增加更完善的错误处理与重试机制（已内置基础重试）
3. 可扩展面馆收藏、历史记录
4. 可增加更多筛选条件（如品类、距离档位）

## 许可证

MIT License

## 技术支持

如有问题，请查看：
- [微信小程序官方文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [腾讯位置服务 WebService API 文档](https://lbs.qq.com/service/webService/webServiceGuide/webServiceOverview)
- [腾讯地图微信小程序 SDK 文档](https://lbs.qq.com/miniProgram/jsSdk/jsSdkGuide/jsSdkOverview)
