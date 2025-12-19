import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api'

// 创建axios实例
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
    // 从localStorage或store获取token
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
    // 处理后端统一响应格式 {code, message, data}
    if (response.data && typeof response.data === 'object' && 'code' in response.data) {
      // 如果 code 为 200 表示成功（根据后端API文档，code=200表示成功）
      if (response.data.code === 200 || response.data.code === 0) {
        // 将 data 字段提取出来，方便使用
        return { ...response, data: response.data.data }
      } else {
        // code 不为 200 或 0 表示业务错误
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
          // 未授权，跳转到登录页
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
 * 乘客服务
 */
export const passengerService = {
  /**
   * 获取乘客列表
   * @param {Object} params - 查询参数 { userId }
   * @returns {Promise}
   */
  getAllPassengers(params = {}) {
    return apiClient.get('/passengers/list', { params })
  },

  /**
   * 创建乘客
   * @param {Object} passengerData - 乘客数据 { id, userId, name, type, idCardType, idCardNumber, phone }
   * @returns {Promise}
   */
  createPassenger(passengerData) {
    return apiClient.post('/passengers/add', passengerData)
  },

  /**
   * 更新乘客
   * @param {Object} passengerData - 乘客数据 { id, userId, name, type, idCardType, idCardNumber, phone }
   * @returns {Promise}
   */
  updatePassenger(passengerData) {
    return apiClient.post('/passengers/update', passengerData)
  },

  /**
   * 删除乘客
   * @param {Number|String} id - 乘客ID
   * @returns {Promise}
   */
  deletePassenger(id) {
    return apiClient.post('/passengers/remove', null, { params: { id } })
  }
}

export default passengerService

