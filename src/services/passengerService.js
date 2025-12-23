import request from '@/services/request'

export const passengerService = {
  /**
   * 获取乘客列表
   */
  getAllPassengers(params = {}) {
    return request({
      url: '/passengers/list',
      method: 'get',
      params
    })
  },

  /**
   * 创建乘客
   */
  createPassenger(passengerData) {
    return request({
      url: '/passengers/add',
      method: 'post',
      data: passengerData
    })
  },

  /**
   * 更新乘客
   */
  updatePassenger(passengerData) {
    return request({
      url: '/passengers/update',
      method: 'post',
      data: passengerData
    })
  },

  /**
   * 删除乘客
   */
  deletePassenger(id) {
    return request({
      url: '/passengers/remove',
      method: 'post',
      params: { id }
    })
  }
}

export default passengerService