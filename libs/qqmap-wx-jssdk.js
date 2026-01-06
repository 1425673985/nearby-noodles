/**
 * 腾讯地图微信小程序 SDK
 * 如果官方有更新，请从 https://lbs.qq.com/miniprogram_plugin/map.html 下载最新版本
 */

class QQMapWX {
  constructor(options) {
    this.key = options.key || '';
    this.apiBaseUrl = 'https://apis.map.qq.com/ws/';
  }

  /**
   * 搜索接口
   * @param {Object} options 搜索参数
   * @param {string} options.keyword 搜索关键词
   * @param {string} options.location 位置，格式：纬度,经度
   * @param {number} options.radius 搜索半径（米）
   * @param {Function} options.success 成功回调
   * @param {Function} options.fail 失败回调
   */
  search(options) {
    const { keyword, location, radius = 1000, success, fail } = options;
    
    // 处理 location 参数，支持对象和字符串格式
    let locationStr = '';
    if (typeof location === 'string') {
      locationStr = location;
    } else if (location && typeof location === 'object') {
      locationStr = `${location.latitude},${location.longitude}`;
    } else {
      fail && fail({ message: 'location 参数格式错误' });
      return;
    }

    wx.request({
      url: `${this.apiBaseUrl}place/v1/search`,
      method: 'GET',
      data: {
        keyword: keyword,
        boundary: `nearby(${locationStr},${radius})`,
        key: this.key,
        page_size: 20,
        page_index: 1,
        orderby: '_distance',
        get_subpois: 0
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.status === 0) {
          success && success({ data: res.data.data || [] });
        } else {
          fail && fail({
            message: res.data.message || '搜索失败',
            status: res.data.status
          });
        }
      },
      fail: (err) => {
        fail && fail(err);
      }
    });
  }
}

module.exports = QQMapWX;
