<template>
  <div class="order-detail-container">
    <div class="page-header">
      <el-button
        type="primary"
        :icon="ArrowLeft"
        @click="goBack"
        style="margin-bottom: 20px"
      >
        返回订单列表
      </el-button>
      <h1>订单详情</h1>
    </div>

    <el-alert
      v-if="hasConnectionError"
      title="后端服务未启动"
      type="warning"
      :closable="false"
      show-icon
      style="margin-bottom: 20px"
    >
      <template #default>
        <p style="margin: 0;">无法连接到后端服务器，请确认后端服务是否在 <strong>http://localhost:8081</strong> 运行。</p>
      </template>
    </el-alert>

    <div v-loading="loading" class="order-detail-content">
      <div v-if="!loading && order" class="order-info-card">
        <!-- 订单基本信息 -->
        <el-card class="info-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>订单信息</span>
              <div class="header-actions">
                <el-button
                  type="primary"
                  :icon="Download"
                  @click="downloadTicket"
                  :disabled="order.paymentStatus !== 'PAID'"
                >
                  下载电子票
                </el-button>
              </div>
            </div>
          </template>

          <el-descriptions :column="2" border>
            <el-descriptions-item label="PNR号">
              <span class="pnr-number">{{ order.pnrNumber }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="车次">
              <el-tag type="info" size="large">{{ order.trainNumber }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="订单状态">
              <el-tag :type="getStatusTag(order.status)" size="large">
                {{ getStatusText(order.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="支付状态">
              <el-tag :type="getPaymentStatusTag(order.paymentStatus || 'UNPAID')" size="large">
                {{ getPaymentStatusText(order.paymentStatus || 'UNPAID') }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="订单金额">
              <span class="amount">¥{{ (order.totalPrice || order.totalAmount)?.toFixed(2) || '0.00' }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">
              {{ formatDate(order.createTime) }}
            </el-descriptions-item>
            <el-descriptions-item label="出发站" v-if="order.departureStation">
              {{ order.departureStation }}
            </el-descriptions-item>
            <el-descriptions-item label="到达站" v-if="order.arrivalStation">
              {{ order.arrivalStation }}
            </el-descriptions-item>
            <el-descriptions-item label="出发时间" v-if="order.departureTime">
              {{ formatDateTime(order.departureTime) }}
            </el-descriptions-item>
            <el-descriptions-item label="到达时间" v-if="order.arrivalTime">
              {{ formatDateTime(order.arrivalTime) }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 乘客信息 -->
        <el-card class="info-card" shadow="hover" style="margin-top: 20px">
          <template #header>
            <span>乘客信息</span>
          </template>

          <el-table :data="order.tickets || []" stripe>

            <el-table-column prop="passengerName" label="姓名" min-width="120" />

            <el-table-column prop="idCardNumber" label="身份证号" min-width="180">
              <template #default="{ row }">
                {{ maskIdCard(row.idCardNumber) }}
              </template>
            </el-table-column>
            <el-table-column prop="seatNumber" label="座位号" min-width="120">
              <template #default="{ row }">
                <el-tag v-if="row.seatNumber || row.seat" type="success">{{ row.seatNumber || row.seat }}</el-tag>
                <span v-else class="text-muted">未分配</span>
              </template>
            </el-table-column>
            <el-table-column prop="ticketPrice" label="票价" min-width="100">
              <template #default="{ row }">
                ¥{{ (row.ticketPrice || row.price || 0)?.toFixed(2) || '0.00' }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- 操作按钮 -->
        <div class="action-buttons" v-if="order.status === 'PENDING'">
          <el-button
            type="primary"
            size="large"
            @click="handlePay"
            v-if="order.payUrl"
          >
            去支付
          </el-button>
        </div>
      </div>

      <el-empty v-if="!loading && !order" description="订单不存在" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Download } from '@element-plus/icons-vue'
import { orderService } from '@/services/orderService'

const router = useRouter()
const route = useRoute()

// 响应式数据
const loading = ref(false)
const order = ref(null)
const hasConnectionError = ref(false)

// 获取订单状态标签
const getStatusTag = (status) => {
  const statusMap = {
    'PENDING': 'warning',
    'CONFIRMED': 'success',
    'CANCELLED': 'info',
    'EXPIRED': 'danger',
    'REFUNDED': 'info'
  }
  return statusMap[status] || ''
}

// 获取订单状态文本
const getStatusText = (status) => {
  const statusMap = {
    'PENDING': '待支付',
    'CONFIRMED': '已出票',
    'CANCELLED': '已取消',
    'EXPIRED': '已过期',
    'REFUNDED': '已退款'
  }
  return statusMap[status] || status || '未知'
}

// 获取支付状态标签
const getPaymentStatusTag = (paymentStatus) => {
  const statusMap = {
    'UNPAID': 'warning',
    'PAID': 'success',
    'REFUNDED': 'info',
    'PARTIALLY_REFUNDED': 'warning'
  }
  return statusMap[paymentStatus] || ''
}

// 获取支付状态文本
const getPaymentStatusText = (paymentStatus) => {
  const statusMap = {
    'UNPAID': '未支付',
    'PAID': '已支付',
    'REFUNDED': '已退款',
    'PARTIALLY_REFUNDED': '部分退款'
  }
  return statusMap[paymentStatus] || paymentStatus || '未知'
}

// 获取乘客类型文本
const getPassengerTypeText = (type) => {
  const typeMap = {
    'ADULT': '成人',
    'CHILD': '儿童',
    'STUDENT': '学生',
    'SENIOR': '老人'
  }
  return typeMap[type] || type || '未知'
}

// 获取座位类型文本
const getSeatTypeText = (seatType) => {
  const typeMap = {
    'BUSINESS_CLASS': '商务座',
    'FIRST_CLASS': '一等座',
    'SECOND_CLASS': '二等座',
    'HARD_SEAT': '硬座',
    'SOFT_SLEEPER': '软卧',
    'HARD_SLEEPER': '硬卧'
  }
  return typeMap[seatType] || seatType || '未知'
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return '-'
  const safeDate = typeof date === 'string' ? date.replace(' ', 'T') : date
  return new Date(safeDate).toLocaleString('zh-CN')
}

// 格式化日期时间
const formatDateTime = (date) => {
  if (!date) return '-'
  const safeDate = typeof date === 'string' ? date.replace(' ', 'T') : date
  return new Date(safeDate).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 身份证号脱敏
const maskIdCard = (idCard) => {
  if (!idCard) return '-'
  if (idCard.length <= 8) return idCard
  return idCard.substring(0, 4) + '****' + idCard.substring(idCard.length - 4)
}

// 加载订单详情
const loadOrderDetail = async () => {
  loading.value = true
  try {
    const pnrNumber = route.params.pnr || route.query.pnr
    if (!pnrNumber) {
      ElMessage.error('缺少PNR号')
      router.push('/booking/orders')
      return
    }

    const response = await orderService.getOrderByPnr(pnrNumber)
    order.value = response.data
  } catch (error) {
    console.error('Load order detail error:', error)
    order.value = null

    if (error.request && !error.response) {
      hasConnectionError.value = true
    } else {
      hasConnectionError.value = false
      ElMessage.error(error.response?.data?.message || '获取订单详情失败')
    }
  } finally {
    loading.value = false
  }
}

// 返回订单列表
const goBack = () => {
  router.push('/booking/orders')
}

// 去支付
const handlePay = () => {
  if (order.value?.payUrl) {
    window.open(order.value.payUrl, '_blank')
  } else {
    ElMessage.warning('支付链接不存在')
  }
}

// 下载电子票
const downloadTicket = async () => {
  if (!order.value) {
    ElMessage.error('订单信息不存在')
    return
  }

  if (order.value.paymentStatus !== 'PAID') {
    ElMessage.warning('只有已支付的订单才能下载电子票')
    return
  }

  // 获取订单中的票信息
  const tickets = order.value.tickets || []
  if (tickets.length === 0) {
    ElMessage.warning('订单中没有票信息')
    return
  }

  const pnrNumber = order.value.pnrNumber || order.value.orderId

  try {
    // 如果有多张票，为每张票下载；如果只有一张，下载单张
    const downloadPromises = tickets.map(async (ticket) => {
      // 优先使用 ticketId，如果没有则使用 id（兼容不同后端实现）
      const ticketId = ticket.ticketId || ticket.id
      if (!ticketId) {
        console.warn('票信息缺少ID:', ticket)
        return null
      }

      try {
        // 调用后端接口下载电子票
        const response = await orderService.downloadTicket(ticketId)
        
        // response 是完整的 axios response 对象（因为拦截器对 blob 类型返回完整 response）
        const blob = response.data // blob 数据
        const contentType = response.headers['content-type'] || response.headers['Content-Type'] || 'application/pdf'
        
        // 根据 Content-Type 确定文件扩展名
        let fileExtension = 'pdf'
        if (contentType.includes('html')) {
          fileExtension = 'html'
        } else if (contentType.includes('pdf')) {
          fileExtension = 'pdf'
        } else if (contentType.includes('image')) {
          fileExtension = contentType.split('/')[1] || 'png'
        }
        
        // 创建下载链接
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        const passengerName = ticket.passengerName || '乘客'
        link.download = `电子票_${pnrNumber}_${passengerName}_${new Date().getTime()}.${fileExtension}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        return true
      } catch (error) {
        console.error(`下载票 ${ticketId} 失败:`, error)
        throw error
      }
    })

    // 等待所有下载完成
    await Promise.all(downloadPromises.filter(p => p !== null))
    
    ElMessage.success(tickets.length > 1 ? `成功下载 ${tickets.length} 张电子票` : '电子票下载成功')
  } catch (error) {
    console.error('下载电子票失败:', error)
    ElMessage.error(error.response?.data?.message || '下载电子票失败，请稍后重试')
  }
}


// 组件挂载时加载数据
onMounted(() => {
  loadOrderDetail()
})
</script>

<style scoped lang="scss">
.order-detail-container {
  padding: 20px;
  background: #f5f5f5;
  min-height: calc(100vh - 60px);

  .page-header {
    margin-bottom: 20px;
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      color: #303133;
    }
  }

  .order-detail-content {
    .order-info-card {
      .info-card {
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 600;
          font-size: 16px;

          .header-actions {
            display: flex;
            gap: 10px;
          }
        }

        .pnr-number {
          font-size: 18px;
          font-weight: bold;
          color: #409EFF;
          letter-spacing: 1px;
        }

        .amount {
          font-size: 18px;
          font-weight: bold;
          color: #F56C6C;
        }

        .text-muted {
          color: #909399;
        }
      }
    }

    .action-buttons {
      margin-top: 20px;
      text-align: center;
      padding: 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
  }
}
</style>