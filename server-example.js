// server-example.js
// 这是一个Node.js服务器代理示例，用于代理高德地图API请求
// 使用前需要安装: npm install express axios

const express = require('express')
const axios = require('axios')
const app = express()

// 高德地图API Key（应该从环境变量读取，不要硬编码）
const AMAP_KEY = process.env.AMAP_KEY || 'your-amap-key'

// 允许跨域
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  next()
})

app.use(express.json())

// 搜索附近面馆的代理接口
app.post('/api/nearby-restaurants', async (req, res) => {
  try {
    const { latitude, longitude, radius, keyword } = req.body

    if (!latitude || !longitude) {
      return res.json({
        code: 1,
        message: '缺少位置参数'
      })
    }

    // 调用高德地图API
    const response = await axios.get('https://restapi.amap.com/v3/place/around', {
      params: {
        key: AMAP_KEY,
        location: `${longitude},${latitude}`,
        keywords: keyword || '面馆',
        radius: radius || 1000,
        types: '050000', // 餐饮服务
        offset: 20,
        page: 1,
        extensions: 'all'
      }
    })

    if (response.data.status === '1') {
      // 过滤出包含"面"字的POI
      let restaurants = response.data.pois || []
      restaurants = restaurants.filter(poi => {
        return poi.name.includes('面') || poi.type.includes('面')
      })
      
      // 如果过滤后为空，返回所有餐饮POI
      if (restaurants.length === 0) {
        restaurants = response.data.pois || []
      }

      res.json({
        code: 0,
        message: 'success',
        data: restaurants
      })
    } else {
      res.json({
        code: 1,
        message: response.data.info || '搜索失败'
      })
    }
  } catch (error) {
    console.error('代理请求失败:', error)
    res.json({
      code: 1,
      message: '服务器错误'
    })
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`)
})

// 使用说明：
// 1. 安装依赖: npm install express axios
// 2. 设置环境变量: export AMAP_KEY=your-amap-key
// 3. 运行服务器: node server-example.js
// 4. 在小程序中修改 utils/api.js，使用 searchNearbyRestaurantsByProxy 函数
// 5. 在小程序中修改代理接口地址为你的服务器地址
