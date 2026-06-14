// pages/rank/rank.js
Page({
  data: {
    list: [], // 当前榜单列表
    activeTab: 'distance', // distance | rating | hot
    hasRating: false, // 数据中是否含评分（高德数据源才有）
    ratingEmpty: false // 好评榜但无评分数据
  },

  onShow() {
    // 进入或切回时按当前榜单刷新
    if (this.data.activeTab === 'rating') {
      this.loadRatingRank()
    } else {
      this.loadDistanceRank()
    }
  },

  getNearby() {
    const app = getApp()
    return ((app.globalData && app.globalData.nearbyList) || []).slice()
  },

  // 距离榜：按距离升序
  loadDistanceRank() {
    const list = this.getNearby().sort((a, b) => a.distance - b.distance)
    const hasRating = list.some((it) => it.ratingNum > 0)
    this.setData({ list, activeTab: 'distance', hasRating, ratingEmpty: false })
  },

  // 好评榜：按评分降序（无评分的沉底）
  loadRatingRank() {
    const all = this.getNearby()
    const hasRating = all.some((it) => it.ratingNum > 0)
    if (!hasRating) {
      // 没有评分数据（未配置高德），给出提示
      this.setData({ list: [], activeTab: 'rating', hasRating, ratingEmpty: true })
      return
    }
    const list = all.sort((a, b) => {
      if (b.ratingNum !== a.ratingNum) {
        return b.ratingNum - a.ratingNum
      }
      return a.distance - b.distance
    })
    this.setData({ list, activeTab: 'rating', hasRating, ratingEmpty: false })
  },

  // 未开放的标签（热门）
  onTabDisabled() {
    wx.showToast({
      title: '热门榜即将上线',
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
