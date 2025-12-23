import request from '@/services/request' // 引入刚才创建的工具

export const orderService = {
  /**
   * 创建订单
   */
  createOrder(orderData) {
    return request({
      url: '/order',
      method: 'post',
      data: orderData
    })
  },

  /**
   * 获取订单列表
   */
  getOrderList(params = {}) {
    return request({
      url: '/order/list',
      method: 'get',
      params
    })
  },

  /**
   * 获取订单详情
   */
  getOrderDetail(orderId) {
    return request({
      url: '/order/detail',
      method: 'get',
      params: { orderId }
    })
  },

  /**
   * 通过PNR查询
   */
  getOrderByPnr(pnrNumber) {
    return request({
      url: `/order/pnr/${pnrNumber}`,
      method: 'get'
    })
  },

  /**
   * 获取支付链接
   */
  getPayUrl(pnrNumber) {
    return request({
      url: '/order/pay-url',
      method: 'get',
      params: { pnrNumber }
    })
  },

  /**
   * 同步支付状态
   */
  syncPaymentStatus(pnrNumber) {
    return request({
      url: '/order/sync-status',
      method: 'post',
      params: { pnrNumber } // 注意：后端是 @RequestParam，所以用 params 拼在 URL 上
    })
  },

  /**
   * 取消订单
   */
  cancelOrder(orderId) {
    return request({
      url: '/order/cancel',
      method: 'post',
      params: { orderId }
    })
  },

  /**
   * 删除订单
   */
  deleteOrder(orderId) {
    return request({
      url: '/order/delete',
      method: 'post',
      params: { orderId }
    })
  },

  /**
   * 下载电子票 (特殊处理 blob)
   */
  downloadTicket(ticketId) {
    return request({
      url: `/tickets/download/${ticketId}`,
      method: 'get',
      responseType: 'blob'
    })
  }
}

export default orderService