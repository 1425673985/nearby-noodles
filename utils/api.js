// utils/api.js
const config = require('./config.js')

/**
 * 搜索附近的POI（面馆）
 * @param {number} latitude 纬度
 * @param {number} longitude 经度
 * @param {number} radius 搜索半径（米）
 * @param {string} keyword 关键词（面馆）
 * @returns {Promise} 返回附近的面馆列表
 */
function searchNearbyRestaurants(latitude, longitude, radius, keyword) {
  return new Promise((resolve, reject) => {
    // 高德地图周边搜索API
    // 注意：高德地图API需要使用服务器端调用，这里提供两种方案
    // 方案1：使用高德小程序SDK（推荐）
    // 方案2：通过自己的服务器代理调用高德API
    
    // 这里使用wx.request直接调用（需要在微信公众平台配置request合法域名）
    // 实际项目中建议使用自己的服务器作为代理
    const url = `https://restapi.amap.com/v3/place/around`
    
    wx.request({
      url: url,
      method: 'GET',
      data: {
        key: config.AMAP_KEY,
        location: `${longitude},${latitude}`, // 高德API使用 经度,纬度 格式
        keywords: keyword,
        radius: radius,
        types: '050000', // 餐饮服务
        offset: 20, // 返回结果数量
        page: 1,
        extensions: 'all' // 返回详细信息
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.status === '1') {
          // 过滤出包含"面"字的POI
          let restaurants = res.data.pois || []
          restaurants = restaurants.filter(poi => {
            return poi.name.includes('面') || poi.type.includes('面')
          })
          
          // 如果过滤后为空，返回所有餐饮POI
          if (restaurants.length === 0) {
            restaurants = res.data.pois || []
          }
          
          resolve(restaurants)
        } else {
          reject(new Error(res.data.info || '搜索失败'))
        }
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

/**
 * 通过服务器代理调用高德API（推荐方案）
 * 如果直接调用高德API遇到跨域或安全限制，可以使用此方法
 * 需要在服务器端实现代理接口
 */
function searchNearbyRestaurantsByProxy(latitude, longitude, radius, keyword) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${config.SERVER_API_URL}/nearby-restaurants`, // 你的服务器代理接口
      method: 'POST',
      data: {
        latitude,
        longitude,
        radius,
        keyword
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 0) {
          resolve(res.data.data)
        } else {
          reject(new Error(res.data.message || '搜索失败'))
        }
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

module.exports = {
  searchNearbyRestaurants,
  searchNearbyRestaurantsByProxy
}
