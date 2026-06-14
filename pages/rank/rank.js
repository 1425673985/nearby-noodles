// pages/rank/rank.js
Page({
  data: {
    list: [], // 当前榜单列表
    activeTab: 'distance' // distance | hot | rating（后两者暂未开放）
  },

  onShow() {
    this.loadDistanceRank()
  },

  // 距离排行：直接读取全局已排序的列表
  loadDistanceRank() {
    const app = getApp()
    const nearbyList = (app.globalData && app.globalData.nearbyList) || []
    // 已按距离升序，这里再保险排一次
    const list = nearbyList.slice().sort((a, b) => a.distance - b.distance)
    this.setData({ list, activeTab: 'distance' })
  },

  // 未开放的标签（热门 / 好评）
  onTabDisabled() {
    wx.showToast({
      title: '该榜单即将上线',
      icon: 'none'
    })
  },

  // 点击某家：打开导航
  navItem(e) {
    const index = e.currentTarget.dataset.index
    const item = this.data.list[index]
    if (!item || !item.location) {
      return
    }
    wx.openLocation({
      latitude: item.location.lat,
      longitude: item.location.lng,
      name: item.name,
      address: item.address,
      scale: 18,
      fail: () => {}
    })
  },

  // 返回首页
  backHome() {
    wx.navigateBack({
      fail: () => {
        wx.reLaunch({ url: '/pages/index/index' })
      }
    })
  }
})
