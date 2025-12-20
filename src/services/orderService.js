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
    if (response.data && typeof response.data === 'object' && 'code' in response.data) {
      if (response.data.code === 200 || response.data.code === 0) {
        return { ...response, data: response.data.data }
      } else {
        const error = new Error(response.data.message || '请求失败')
        error.response = response
        return Promise.reject(error)
      }
    }
    return response
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
   * 获取订单详情
   * @param {String|Number} orderId - 订单ID
   * @returns {Promise}
   */
  getOrderDetail(orderId) {
    return apiClient.get(`/order/${orderId}`)
  },

  /**
   * 通过PNR查询订单详情
   * @param {String} pnrNumber - PNR号
   * @returns {Promise}
   */
  getOrderByPnr(pnrNumber) {
    return apiClient.get(`/order/pnr/${pnrNumber}`)
  }
}

export default orderService

