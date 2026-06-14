// utils/config.example.js
// 配置模板：复制本文件为 utils/config.js，并填入你自己的 Key。
// ⚠️ utils/config.js 已被 .gitignore 忽略，请勿提交真实 Key 到仓库。

module.exports = {
  // 腾讯地图 API Key（基础数据：店名/地址/距离/品类/电话）
  // 获取方式：https://lbs.qq.com/console/mykey.html
  // 建议在控制台为该 Key 绑定小程序 AppID 白名单，并设置每日调用上限。
  TENCENT_MAP_KEY: '你的腾讯地图Key',

  // 高德地图 Web 服务 Key（进阶数据：评分 rating / 人均 cost / 门店图）
  // 获取方式：https://console.amap.com/dev/key/app（服务平台选「Web服务」）
  // 配置后自动切换为高德数据源，可启用「好评榜」与人均显示（覆盖率视店铺而定）。
  // ⚠️ 需在「服务器域名 → request 合法域名」添加 https://restapi.amap.com
  AMAP_KEY: '你的高德Key',

  // 搜索半径（米）
  SEARCH_RADIUS: 3000,

  // 搜索关键词
  SEARCH_KEYWORD: '面馆',

  // 是否使用腾讯街景图作为门脸图（默认关闭）
  // ⚠️ 注意：街景对店内小面馆覆盖率有限，且每次会消耗地图配额。
  //   关闭时使用本地品类配图（images/food/*.jpg），缺图时由插画兜底，零配额消耗。
  ENABLE_STREETVIEW: false
}
