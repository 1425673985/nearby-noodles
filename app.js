// app.js
App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
        console.log('登录成功', res.code)
      }
    })
  },
  globalData: {
    userInfo: null,
    location: null,
    userLocation: null, // 最近一次定位
    nearbyList: [], // 附近面馆完整列表（按距离升序），供排行页使用
    pendingShop: null // 排行页选中、待首页展示的面馆
  }
})
