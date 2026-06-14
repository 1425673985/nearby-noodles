// utils/config.example.js
// 配置模板：复制本文件为 utils/config.js，并填入你自己的 Key。
// ⚠️ utils/config.js 已被 .gitignore 忽略，请勿提交真实 Key 到仓库。

module.exports = {
  // 腾讯地图 API Key
  // 获取方式：https://lbs.qq.com/console/mykey.html
  // 建议在控制台为该 Key 绑定小程序 AppID 白名单，并设置每日调用上限。
  TENCENT_MAP_KEY: '你的腾讯地图Key',

  // 搜索半径（米）
  SEARCH_RADIUS: 3000,

  // 搜索关键词
  SEARCH_KEYWORD: '面馆',

  // 是否使用腾讯街景图作为门脸图（默认关闭）
  // ⚠️ 注意：街景对店内小面馆覆盖率有限，且每次会消耗地图配额。
  //   关闭时使用本地品类配图（images/food/*.jpg），缺图时由插画兜底，零配额消耗。
  ENABLE_STREETVIEW: false
}
