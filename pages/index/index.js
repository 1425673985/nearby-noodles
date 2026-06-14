// index.js
const QQMapWX = require('../../libs/qqmap-wx-jssdk.js')
const config = require('../../utils/config.js')
const md5 = require('../../utils/md5.js')

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
    mapInteractionTimer: null, // 地图交互定时器
    foodImgError: false // 门脸图加载失败时回退到插画
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

  // 是否启用高德数据源（配置了有效高德 Key 时，可获取评分/人均/图片）
  useAmap() {
    return !!(config.AMAP_KEY && config.AMAP_KEY !== '你的高德Key')
  },

  // 搜索附近面馆（自动选择数据源）
  searchNearbyRestaurants(location) {
    // 防止重复并发请求（连续点击/重试时只保留一次在途请求，避免浪费配额）
    if (this._searching) {
      return
    }
    this._searching = true

    this.setData({
      loading: true,
      error: null
    })

    if (this.useAmap()) {
      this.searchByAmap(location)
    } else {
      this.searchByTencent(location)
    }
  },

  // 腾讯地图搜索（基础字段：无评分/人均/图片）
  searchByTencent(location) {
    qqmapsdk.search({
      keyword: config.SEARCH_KEYWORD,
      location: {
        latitude: location.latitude,
        longitude: location.longitude
      },
      radius: config.SEARCH_RADIUS,
      success: (res) => {
        this.applySearchResults(res.data || [], location)
      },
      fail: (err) => {
        this.handleSearchFail(err)
      },
      complete: () => {
        this._searching = false
      }
    })
  },

  // 高德地图搜索（含评分 rating / 人均 cost / 门店图 photos）
  searchByAmap(location) {
    const params = {
      key: config.AMAP_KEY,
      location: `${location.longitude},${location.latitude}`, // 高德：经度,纬度
      keywords: config.SEARCH_KEYWORD,
      radius: config.SEARCH_RADIUS,
      offset: 25,
      page: 1,
      extensions: 'all'
    }
    // 数字签名：开启「安全密钥」后必须签名（sig = md5(按key升序拼接的参数串 + 私钥)）
    if (config.AMAP_SECRET) {
      const signStr = Object.keys(params)
        .sort()
        .map((k) => `${k}=${params[k]}`)
        .join('&')
      params.sig = md5(signStr + config.AMAP_SECRET)
    }

    wx.request({
      url: 'https://restapi.amap.com/v3/place/around',
      method: 'GET',
      data: params,
      success: (res) => {
        const data = res.data || {}
        if (data.status === '1' && Array.isArray(data.pois)) {
          const list = data.pois.map((poi) => this.normalizeAmapPoi(poi))
          this.applySearchResults(list, location)
        } else if (data.infocode === '10003' || /CUQPS|DAILY|LIMIT|QUOTA/i.test(data.info || '')) {
          // 高德配额相关错误，复用配额提示
          this.handleSearchFail({ status: 121, message: data.info })
        } else {
          this.handleSearchFail({ message: data.info || '搜索面馆失败' })
        }
      },
      fail: (err) => {
        this.handleSearchFail(err)
      },
      complete: () => {
        this._searching = false
      }
    })
  },

  // 高德 POI → 统一数据结构（兼容 processRestaurantData）
  normalizeAmapPoi(poi) {
    const pick = (v) => (v === undefined || v === null || Array.isArray(v) ? '' : String(v))
    // 高德 location 为字符串："经度,纬度"
    let lat, lng
    if (typeof poi.location === 'string' && poi.location.indexOf(',') !== -1) {
      const arr = poi.location.split(',')
      lng = parseFloat(arr[0])
      lat = parseFloat(arr[1])
    }
    const biz = poi.biz_ext || {}
    const photoUrl = Array.isArray(poi.photos) && poi.photos[0] ? pick(poi.photos[0].url) : ''
    return {
      id: pick(poi.id),
      title: pick(poi.name),
      location: lat && lng ? { lat, lng } : undefined,
      _distance: poi.distance ? parseFloat(poi.distance) : 0,
      address: pick(poi.address),
      tel: pick(poi.tel),
      category: pick(poi.type),
      rating: pick(biz.rating),
      cost: pick(biz.cost),
      // 图片需为 https 才能在真机加载；http 的丢弃，交由插画兜底
      amapPhoto: photoUrl.indexOf('https') === 0 ? photoUrl : ''
    }
  },

  // 统一处理搜索结果（两种数据源共用）
  applySearchResults(restaurants, location) {
    if (!restaurants || restaurants.length === 0) {
      this.setData({
        loading: false,
        error: `附近${config.SEARCH_RADIUS / 1000}km内没有找到面馆`
      })
      return
    }

    // 处理并按距离升序
    const fullList = restaurants
      .map((item) => this.processRestaurantData(item, location))
      .sort((a, b) => a.distance - b.distance)

    // 首页展示最近的 2 家，支持「换一家」
    const displayRestaurants = fullList.slice(0, 2)
    const firstRestaurant = Object.assign({}, displayRestaurants[0])
    firstRestaurant.randomTag = this.getRandomRecommendTag()

    this.setData({
      searchedRestaurants: displayRestaurants,
      currentIndex: 0,
      restaurant: firstRestaurant,
      foodImgError: false,
      loading: false,
      error: null
    })

    // 完整列表存全局，供「附近排行」页使用（不额外发请求）
    const app = getApp()
    app.globalData.nearbyList = fullList
    app.globalData.userLocation = location

    // 自动聚焦用户位置和面馆位置（适合步行）
    setTimeout(() => {
      this.focusOnUserAndRestaurant()
    }, 300)
  },

  // 统一的搜索失败处理
  handleSearchFail(err) {
    console.error('搜索面馆失败', err)
    // status 121 / 高德配额：当日调用量已达上限
    const quotaExceeded = err && (err.status === 121 || err.status === '121')
    this.setData({
      loading: false,
      error: quotaExceeded
        ? '今日地图服务额度已用完，请明天再试，或在控制台更换/升级地图 Key'
        : (err && err.message) || '搜索面馆失败，请稍后重试'
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
    // 计算步行时间
    const walkingTime = this.calculateWalkingTime(Math.round(distance))

    // 识别面食品类（用于食欲配图 + 品类标签）
    const food = this.resolveFood(name, restaurant.category)
    // 门脸图优先级：高德真实门店图 > 街景（可选开关）> 品类配图 > 兜底插画
    const amapPhoto = restaurant.amapPhoto || ''
    const foodImage = amapPhoto || this.buildHeroImage(food.img, lat, lng)

    // 评分 / 人均（高德数据源才有；腾讯为空，自动隐藏）
    const ratingNum = restaurant.rating ? parseFloat(restaurant.rating) : 0
    const costNum = restaurant.cost ? parseFloat(restaurant.cost) : 0

    return {
      id: restaurant.id || restaurant._id || '',
      name: name,
      address: address,
      location: locationObj,
      distance: Math.round(distance),
      walkingTime: walkingTime,
      mapMarkers: mapMarkers,
      tel: restaurant.tel || restaurant.phone || '',
      tag: tag,
      randomTag: randomTag,
      category: food.label,
      foodImage: foodImage,
      rating: ratingNum > 0 ? ratingNum.toFixed(1) : '', // 展示用字符串
      ratingNum: ratingNum, // 排序用数值
      cost: costNum > 0 ? Math.round(costNum) : '' // 人均（元）
    }
  },

  // 面食品类关键词表（命中越靠前优先级越高）
  FOOD_KEYWORDS: [
    { k: ['牛肉面', '牛肉'], label: '牛肉面', img: 'beef' },
    { k: ['兰州', '拉面'], label: '兰州拉面', img: 'lanzhou' },
    { k: ['重庆', '小面'], label: '重庆小面', img: 'xiaomian' },
    { k: ['刀削'], label: '刀削面', img: 'daoxiao' },
    { k: ['担担', '担坦'], label: '担担面', img: 'dandan' },
    { k: ['热干'], label: '热干面', img: 'regan' },
    { k: ['炸酱'], label: '炸酱面', img: 'zhajiang' },
    { k: ['云吞', '馄饨', '抄手', '扁食'], label: '馄饨面', img: 'wonton' },
    { k: ['螺蛳粉', '螺狮粉', '螺丝粉'], label: '螺蛳粉', img: 'luosifen' },
    { k: ['米线', '米粉'], label: '米线', img: 'mixian' },
    { k: ['荞面', '荞麦'], label: '荞面', img: 'qiaomian' },
    { k: ['牛杂', '牛腩'], label: '牛杂面', img: 'beef' }
  ],

  // 根据店名/品类识别面食类型
  resolveFood(name, category) {
    const text = `${name || ''} ${category || ''}`
    for (const item of this.FOOD_KEYWORDS) {
      if (item.k.some((word) => text.indexOf(word) !== -1)) {
        return { label: item.label, img: item.img }
      }
    }
    return { label: '面馆', img: 'default' }
  },

  // 构建门脸图地址
  buildHeroImage(imgKey, lat, lng) {
    // 街景门脸（可选）：覆盖率有限且消耗地图配额，默认关闭，在 config.js 中开启
    if (config.ENABLE_STREETVIEW && lat && lng) {
      return `https://apis.map.qq.com/ws/streetview/v1/image?size=750*420&radius=150&location=${lat},${lng}&key=${config.TENCENT_MAP_KEY}`
    }
    // 品类配图（本地资源，需放入 images/food/ 目录；缺图时由插画兜底）
    return `/images/food/${imgKey}.jpg`
  },

  // 地图点击事件
  onMapTap() {},

  // 门脸图加载失败：回退到插画
  onFoodImgError() {
    this.setData({ foodImgError: true })
  },

  // 跳转附近排行页
  goRank() {
    wx.navigateTo({ url: '/pages/rank/rank' })
  },

  // 一键拨打面馆电话
  callShop() {
    const { restaurant } = this.data
    if (!restaurant || !restaurant.tel) {
      return
    }
    // 腾讯地图返回的 tel 可能含多个号码（以分号/逗号分隔），取第一个
    const phoneNumber = String(restaurant.tel).split(/[;,，；]/)[0].trim()
    wx.makePhoneCall({
      phoneNumber,
      fail: () => {}
    })
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
        padding: [80, 50, 300, 50], // 上/右/下/左：底部留足空间，避免标记被悬浮底卡遮挡
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

  // 根据距离计算步行时间（分钟）
  calculateWalkingTime(distanceInMeters) {
    // 步行速度：4.5-5 km/h = 75 m/分钟
    const WALKING_SPEED_M_PER_MIN = 75

    // 计算时间（分钟）
    const timeInMinutes = distanceInMeters / WALKING_SPEED_M_PER_MIN

    // 边界处理：小于1分钟统一显示"约1分钟"
    if (timeInMinutes < 1) {
      return 1
    }

    // 1分钟及以上，向上取整
    return Math.ceil(timeInMinutes)
  },

  // 换一家面馆（最多2家，在0和1之间切换）
  changeRestaurant() {
    const { searchedRestaurants, currentIndex } = this.data

    // 如果只有1家，点击无变化
    if (searchedRestaurants.length <= 1) {
      return
    }

    // searchedRestaurants 已是处理好的数据，直接切换即可
    const nextIndex = currentIndex === 0 ? 1 : 0
    const nextRestaurant = Object.assign({}, searchedRestaurants[nextIndex])
    // 重新生成随机推荐标签（每次切换时重新随机）
    nextRestaurant.randomTag = this.getRandomRecommendTag()

    this.setData({
      currentIndex: nextIndex,
      restaurant: nextRestaurant,
      foodImgError: false
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
