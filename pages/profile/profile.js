// pages/profile/profile.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    versionDisplay: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.getVersionInfo()
  },

  /**
   * 获取小程序版本信息
   */
  getVersionInfo() {
    try {
      const accountInfo = wx.getAccountInfoSync()
      const miniProgram = accountInfo.miniProgram
      
      let versionDisplay = '未知'
      const envVersion = miniProgram.envVersion // develop, trial, release
      const version = miniProgram.version || '' // 正式版才有值，开发版和体验版为空
      
      if (envVersion === 'release') {
        // 正式版：显示版本号
        versionDisplay = version ? `v${version}` : 'v未知'
      } else if (envVersion === 'trial') {
        // 体验版：显示版本号-体验版（如果没有版本号，只显示环境）
        versionDisplay = version ? `v${version}-体验版` : 'v未知-体验版'
      } else if (envVersion === 'develop') {
        // 开发版：显示版本号-开发版（如果没有版本号，只显示环境）
        versionDisplay = version ? `v${version}-开发版` : 'v未知-开发版'
      } else {
        // 其他环境
        versionDisplay = version ? `v${version}-${envVersion}` : `v未知-${envVersion}`
      }

      this.setData({
        versionDisplay: versionDisplay
      })
    } catch (e) {
      console.error('获取版本信息失败：', e)
      this.setData({
        versionDisplay: '获取失败'
      })
    }
  }
})

