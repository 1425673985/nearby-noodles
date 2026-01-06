// index.js
const QQMapWX = require('../../libs/qqmap-wx-jssdk.js')
const config = require('../../utils/config.js')

// 初始化腾讯地图 SDK
const qqmapsdk = new QQMapWX({
  key: config.TENCENT_MAP_KEY
})

Page({
  data: {
    loading: false,
    hasLocationAuth: false,
    restaurant: null,
    error: null,
    userLocation: null,
    searchedRestaurants: [], // 已搜索到的面馆列表
    currentIndex: 0, // 当前显示的面馆索引
    mapLongitude: 0, // 地图中心经度
    mapLatitude: 0, // 地图中心纬度
    mapScale: 16, // 地图缩放级别
    showLocationBtn: false, // 是否显示定位用户按钮
    mapContext: null, // 地图上下文
    mapInteractionTimer: null // 地图交互定时器
  },

  onLoad() {
    this.checkLocationAuth()
    // 初始化地图上下文
    this.mapContext = null
  },

  onUnload() {
    // 清理定时器
    if (this.mapInteractionTimer) {
      clearTimeout(this.mapInteractionTimer)
      this.mapInteractionTimer = null
    }
  },

  onShow() {
    // 检查登录状态
    this.checkLogin()
  },

  // 检查定位授权状态
  checkLocationAuth() {
    wx.getSetting({
      success: (res) => {
        if (res.authSetting['scope.userLocation']) {
          this.setData({
            hasLocationAuth: true
          })
          this.getUserLocation()
        } else {
          this.setData({
            hasLocationAuth: false
          })
        }
      }
    })
  },

  // 请求定位授权
  requestLocationAuth() {
    wx.authorize({
      scope: 'scope.userLocation',
      success: () => {
        this.setData({
          hasLocationAuth: true
        })
        this.getUserLocation()
      },
      fail: () => {
        wx.showModal({
          title: '授权提示',
          content: '需要位置权限才能查找附近面馆，请在设置中开启',
          showCancel: true,
          confirmText: '去设置',
          success: (res) => {
            if (res.confirm) {
              wx.openSetting({
                success: (settingRes) => {
                  if (settingRes.authSetting['scope.userLocation']) {
                    this.setData({
                      hasLocationAuth: true
                    })
                    this.getUserLocation()
                  }
                }
              })
            }
          }
        })
      }
    })
  },

  // 获取用户位置
  getUserLocation() {
    this.setData({
      loading: true,
      error: null
    })

    wx.getLocation({
      type: 'gcj02', // 腾讯地图坐标系（GCJ02）
      success: (res) => {
        const location = {
          latitude: res.latitude,
          longitude: res.longitude
        }
        this.setData({
          userLocation: location
        })
        // 保存到全局
        getApp().globalData.location = location
        // 获取附近面馆
        this.searchNearbyRestaurants(location)
      },
      fail: (err) => {
        console.error('获取位置失败', err)
        this.setData({
          loading: false,
          error: '获取位置失败，请检查定位权限'
        })
      }
    })
  },

  // 搜索附近面馆
  searchNearbyRestaurants(location) {
    this.setData({
      loading: true,
      error: null
    })

    // 使用腾讯地图 SDK 搜索附近面馆
    qqmapsdk.search({
      keyword: config.SEARCH_KEYWORD,
      location: {
        latitude: location.latitude,
        longitude: location.longitude
      },
      radius: config.SEARCH_RADIUS,
      success: (res) => {
        const restaurants = res.data || []
        // 调试：打印返回的完整数据结构，查看是否有图片字段
        if (restaurants.length > 0) {
          console.log('========== 腾讯地图API返回的完整数据结构 ==========')
          console.log('第一条数据：', JSON.stringify(restaurants[0], null, 2))
          console.log('所有字段列表：', Object.keys(restaurants[0]))
          console.log('是否有photo字段：', restaurants[0].photo)
          console.log('是否有photos字段：', restaurants[0].photos)
          console.log('是否有image_url字段：', restaurants[0].image_url)
          console.log('是否有pic_url字段：', restaurants[0].pic_url)
          console.log('是否有category字段：', restaurants[0].category)
          console.log('是否有image字段：', restaurants[0].image)
          console.log('==========================================')
        }
        if (restaurants.length > 0) {
          // 限制最多只显示2家
          const displayRestaurants = restaurants.slice(0, 2)
          
          // 处理第一个面馆的数据
          const firstRestaurant = this.processRestaurantData(displayRestaurants[0], location)
          
          // 根据距离选择推荐标签
          firstRestaurant.tag = this.getRecommendTag(firstRestaurant.distance)
          // 生成随机推荐标签
          firstRestaurant.randomTag = this.getRandomRecommendTag()
          
          this.setData({
            searchedRestaurants: displayRestaurants,
            currentIndex: 0,
            restaurant: firstRestaurant,
            loading: false,
            error: null
          })
          
          // 自动聚焦用户位置和面馆位置（适合步行）
          setTimeout(() => {
            this.focusOnUserAndRestaurant()
          }, 300)
        } else {
          this.setData({
            loading: false,
            error: `附近${config.SEARCH_RADIUS / 1000}km内没有找到面馆`
          })
        }
      },
      fail: (err) => {
        console.error('搜索面馆失败', err)
        this.setData({
          loading: false,
          error: err.message || '搜索面馆失败，请稍后重试'
        })
      }
    })
  },

  // 处理面馆数据（适配腾讯地图API返回格式）
  processRestaurantData(restaurant, userLocation) {
    // 处理位置信息（腾讯地图API返回格式）
    let lat, lng
    if (restaurant.location) {
      if (typeof restaurant.location === 'string') {
        // 字符串格式："纬度,经度"
        const locationArr = restaurant.location.split(',')
        lat = parseFloat(locationArr[0])
        lng = parseFloat(locationArr[1])
      } else if (restaurant.location.lat && restaurant.location.lng) {
        // 对象格式：{lat, lng}
        lat = parseFloat(restaurant.location.lat)
        lng = parseFloat(restaurant.location.lng)
      }
    }

    // 如果没有解析到位置，使用默认值
    if (!lat || !lng) {
      lat = userLocation.latitude
      lng = userLocation.longitude
    }

    const locationObj = { lat, lng }

    // 使用腾讯地图返回的距离，如果没有则计算
    let distance = restaurant._distance || 0
    if (!distance) {
      distance = this.calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        lat,
        lng
      )
    }

    // 处理名称（腾讯地图使用title字段）
    const name = restaurant.title || restaurant.name || '未知面馆'

    // 处理地址信息
    const address = restaurant.address || restaurant.ad_info?.adname || '地址未知'

      // 生成地图标记点数据
        // marker id 必须是数字类型，使用固定ID确保替换而不是新增
        const markerId = 1 // 使用固定的ID，确保每次切换时替换标记而不是新增
        
        const mapMarkers = [{
          id: markerId,
          latitude: lat,
          longitude: lng,
          iconPath: '', // 使用默认标记图标
          width: 30,
          height: 30,
          title: name,
          callout: {
            content: name,
            color: '#333',
            fontSize: 14,
            borderRadius: 4,
            bgColor: '#fff',
            padding: 8,
            display: 'ALWAYS'
          }
        }]

    // 根据距离选择推荐标签
    const tag = this.getRecommendTag(Math.round(distance))
    // 生成随机推荐标签
    const randomTag = this.getRandomRecommendTag()

    return {
      id: restaurant.id || restaurant._id || '',
      name: name,
      address: address,
      location: locationObj,
      distance: Math.round(distance),
      mapMarkers: mapMarkers,
      tel: restaurant.tel || restaurant.phone || '',
      tag: tag,
      randomTag: randomTag
    }
  },

  // 地图点击事件
  onMapTap(e) {
    console.log('地图被点击', e)
  },

  // 地图拖动开始
  onMapRegionChange(e) {
    // 用户主动操作地图时，显示定位按钮
    if (e.type === 'begin') {
      this.showLocationButton()
    }
  },

  // 地图缩放
  onMapScaleChange(e) {
    // 用户缩放地图时，显示定位按钮
    this.showLocationButton()
  },

  // 显示定位用户按钮
  showLocationButton() {
    this.setData({
      showLocationBtn: true
    })
    
    // 清除之前的定时器
    if (this.mapInteractionTimer) {
      clearTimeout(this.mapInteractionTimer)
    }
    
    // 3秒后自动隐藏
    this.mapInteractionTimer = setTimeout(() => {
      this.setData({
        showLocationBtn: false
      })
      this.mapInteractionTimer = null
    }, 3000)
  },

  // 计算两点边界，确定合适的中心点和缩放级别（适合步行）
  calculateBoundsForWalking(userLng, userLat, restaurantLng, restaurantLat) {
    const minLng = Math.min(userLng, restaurantLng)
    const maxLng = Math.max(userLng, restaurantLng)
    const minLat = Math.min(userLat, restaurantLat)
    const maxLat = Math.max(userLat, restaurantLat)

    // 计算中心点
    const centerLng = (minLng + maxLng) / 2
    const centerLat = (minLat + maxLat) / 2

    // 计算距离范围（米）
    const lngRange = this.calculateDistance(centerLat, minLng, centerLat, maxLng)
    const latRange = this.calculateDistance(minLat, centerLng, maxLat, centerLng)
    const maxRange = Math.max(lngRange, latRange)

    // 根据距离范围计算合适的缩放级别（适合步行，显示路口和行走方向）
    let scale = 17 // 默认较近距离
    if (maxRange > 1000) {
      scale = 15 // 1公里以上
    } else if (maxRange > 500) {
      scale = 16 // 500米-1公里
    } else if (maxRange > 200) {
      scale = 17 // 200-500米
    } else {
      scale = 18 // 200米以内，更详细
    }

    // 添加边距，确保两个点都能完整显示，同时能看到路口
    const padding = maxRange * 0.4 // 40%的边距
    const adjustedRange = maxRange + padding

    // 根据调整后的范围重新计算缩放级别
    if (adjustedRange > 1000) {
      scale = 15
    } else if (adjustedRange > 500) {
      scale = 16
    } else if (adjustedRange > 200) {
      scale = 17
    } else {
      scale = 18
    }

    return {
      centerLng,
      centerLat,
      scale
    }
  },

  // 自动聚焦用户位置和面馆位置（适合步行）
  focusOnUserAndRestaurant() {
    const { userLocation, restaurant } = this.data
    
    if (!userLocation || !restaurant || !restaurant.location) {
      return
    }

    // 计算边界
    const bounds = this.calculateBoundsForWalking(
      userLocation.longitude,
      userLocation.latitude,
      restaurant.location.lng,
      restaurant.location.lat
    )

    // 更新地图中心和缩放级别
    this.setData({
      mapLongitude: bounds.centerLng,
      mapLatitude: bounds.centerLat,
      mapScale: bounds.scale,
      showLocationBtn: false // 自动聚焦时隐藏按钮
    })

    // 使用地图上下文确保视图更新
    if (!this.mapContext) {
      this.mapContext = wx.createMapContext('restaurantMap', this)
    }
    
    if (this.mapContext) {
      // 使用includePoints确保两个点都在视野内
      this.mapContext.includePoints({
        points: [
          {
            longitude: userLocation.longitude,
            latitude: userLocation.latitude
          },
          {
            longitude: restaurant.location.lng,
            latitude: restaurant.location.lat
          }
        ],
        padding: [60, 60, 60, 60], // 上下左右边距
        success: () => {
          console.log('地图自动聚焦成功')
        },
        fail: (err) => {
          console.warn('地图自动聚焦失败，使用setData方式', err)
        }
      })
    }
  },


  // 定位到用户位置（恢复推荐视图）
  moveToUserLocation() {
    // 恢复自动聚焦视图（用户位置+面馆位置）
    this.focusOnUserAndRestaurant()
    
    // 隐藏按钮
    this.setData({
      showLocationBtn: false
    })
    
    // 清除定时器
    if (this.mapInteractionTimer) {
      clearTimeout(this.mapInteractionTimer)
      this.mapInteractionTimer = null
    }
  },

  // 标签池（固定文案）
  TAG_POOL: [
    '就近解决',
    '附近常吃',
    '下班顺路',
    '随便不踩雷'
  ],

  // 随机推荐标签池（情绪引导标签）
  RANDOM_TAG_POOL: [
    '值得一试',
    '顺路看看',
    '或许好吃'
  ],

  // 根据距离选择推荐标签
  getRecommendTag(distance) {
    // 距离小于150米：就近解决
    // 距离150-300米：附近常吃
    // 距离大于300米：随便不踩雷
    if (distance < 150) {
      return '就近解决'
    } else if (distance < 300) {
      return '附近常吃'
    } else {
      return '随便不踩雷'
    }
  },

  // 生成随机推荐标签
  getRandomRecommendTag() {
    const pool = this.RANDOM_TAG_POOL
    const randomIndex = Math.floor(Math.random() * pool.length)
    return pool[randomIndex]
  },

  // 计算两点之间的距离（米）- 使用Haversine公式
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000 // 地球半径（米）
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  },

  // 换一家面馆（最多2家，在0和1之间切换）
  changeRestaurant() {
    const { searchedRestaurants, currentIndex, userLocation } = this.data
    
    // 如果只有1家，点击无变化
    if (searchedRestaurants.length <= 1) {
      return
    }

    // 如果有2家，在0和1之间来回切换
    const nextIndex = currentIndex === 0 ? 1 : 0
    const nextRestaurant = this.processRestaurantData(
      searchedRestaurants[nextIndex],
      userLocation
    )

    // 根据距离选择推荐标签（processRestaurantData中已计算，这里确保数据正确）
    nextRestaurant.tag = this.getRecommendTag(nextRestaurant.distance)
    // 重新生成随机推荐标签（每次切换时重新随机）
    nextRestaurant.randomTag = this.getRandomRecommendTag()

    this.setData({
      currentIndex: nextIndex,
      restaurant: nextRestaurant
    })
    
    // 自动聚焦到新的面馆位置（用户位置+新面馆位置）
    setTimeout(() => {
      this.focusOnUserAndRestaurant()
    }, 100)
  },

  // 打开导航
  openNavigation() {
    const { restaurant, userLocation } = this.data
    
    if (!restaurant || !restaurant.location) {
      wx.showToast({
        title: '导航信息不完整',
        icon: 'none'
      })
      return
    }

    // 使用微信内置地图导航
    wx.openLocation({
      latitude: restaurant.location.lat,
      longitude: restaurant.location.lng,
      name: restaurant.name,
      address: restaurant.address,
      scale: 18,
      success: () => {
        console.log('打开导航成功')
      },
      fail: (err) => {
        console.error('打开导航失败', err)
        wx.showToast({
          title: '打开导航失败',
          icon: 'none'
        })
      }
    })
  },

  // 检查登录状态
  checkLogin() {
    wx.getSetting({
      success: (res) => {
        if (res.authSetting['scope.userInfo']) {
          wx.getUserInfo({
            success: (userRes) => {
              getApp().globalData.userInfo = userRes.userInfo
            }
          })
        } else {
          // 如果需要用户信息，可以在这里请求授权
          // 目前主要使用位置信息，用户信息为可选
        }
      }
    })
  },

  // 重试加载
  retryLoad() {
    if (this.data.userLocation) {
      this.searchNearbyRestaurants(this.data.userLocation)
    } else {
      this.getUserLocation()
    }
  },

})
