import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api'

// 创建axios实例（复用passengerService的配置）
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
apiClient.interceptors.response.use(
    (response) => {
      // 【关键点】直接返回 response.data (即后端的 Result 对象: {code, msg, data})
      // 不要在这里 return response.data.data，否则组件里拿不到 code
      return response.data
    },
  (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          localStorage.removeItem('token')
          window.location.href = '/login'
          break
        case 403:
          console.error('权限不足')
          break
        case 404:
          console.error('资源不存在')
          break
        case 500:
          console.error('服务器错误')
          break
        default:
          console.error('请求失败:', error.response.data?.message || error.message)
      }
    }
    return Promise.reject(error)
  }
)

/**
 * 订单服务
 */
export const orderService = {
  /**
   * 创建订单
   * @param {Object} orderData - 订单数据
   * @returns {Promise}
   */
  createOrder(orderData) {
    return apiClient.post('/order', orderData)
  },

  /**
   * 获取订单列表
   * @param {Object} params - 查询参数 { userId }
   * @returns {Promise}
   */
  getOrderList(params = {}) {
    return apiClient.get('/order/list', { params })
  },

  /**
   * 获取订单详情 (通过ID)
   * GET /api/order/detail?orderId=...
   * @param {Number|String} orderId
   */
  getOrderDetail(orderId) {
    return apiClient.get('/order/detail', {
      params: { orderId }
    })
  },

  /**
   * 通过PNR查询订单详情
   * @param {String} pnrNumber - PNR号
   * @returns {Promise}
   */
  getOrderByPnr(pnrNumber) {
    return apiClient.get(`/order/pnr/${pnrNumber}`)
  },

  /**
   * 获取支付链接 (去支付)
   * GET /api/order/pay-url?pnrNumber=...
   * @param {String} pnrNumber
   */
  getPayUrl(pnrNumber) {
    return apiClient.get('/order/pay-url', {
      params: { pnrNumber }
    })
  },

  /**
   * 同步/查询支付状态 (我已支付)
   * POST /api/order/sync-status?pnrNumber=...
   * @param {String} pnrNumber
   */
  syncPaymentStatus(pnrNumber) {
    // POST 请求，参数通过 query params 传递 (匹配后端 @RequestParam)
    return apiClient.post('/order/sync-status', null, {
      params: { pnrNumber }
    })
  },

  /**
   * 取消订单
   * POST /api/order/cancel?orderId=...
   * @param {Number|String} orderId
   */
  cancelOrder(orderId) {
    return apiClient.post('/order/cancel', null, {
      params: { orderId }
    })
  },

  /**
   * 删除订单
   * POST /api/order/delete?orderId=...
   * @param {Number|String} orderId
   */
  deleteOrder(orderId) {
    return apiClient.post('/order/delete', null, {
      params: { orderId }
    })
  }
}

export default orderService

