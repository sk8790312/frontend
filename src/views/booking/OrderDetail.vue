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
              <span class="pnr-number">{{ order.orderId || order.pnrNumber }}</span>
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
              {{ formatDate(order.createdAt) }}
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

          <el-table :data="order.passengers || []" stripe>
            <el-table-column prop="name" label="姓名" min-width="120" />
            <el-table-column prop="type" label="类型" min-width="100">
              <template #default="{ row }">
                <el-tag>{{ getPassengerTypeText(row.type) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="idCardNumber" label="身份证号" min-width="180">
              <template #default="{ row }">
                {{ maskIdCard(row.idCardNumber) }}
              </template>
            </el-table-column>
            <el-table-column prop="seat" label="座位号" min-width="120">
              <template #default="{ row }">
                <el-tag v-if="row.seat || row.seatNumber" type="success">{{ row.seat || row.seatNumber }}</el-tag>
                <span v-else class="text-muted">未分配</span>
              </template>
            </el-table-column>
            <el-table-column prop="price" label="票价" min-width="100">
              <template #default="{ row }">
                ¥{{ (row.price || row.ticketPrice)?.toFixed(2) || '0.00' }}
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
const downloadTicket = () => {
  if (!order.value) {
    ElMessage.error('订单信息不存在')
    return
  }

  if (order.value.paymentStatus !== 'PAID') {
    ElMessage.warning('只有已支付的订单才能下载电子票')
    return
  }

  // 生成电子票HTML
  const ticketHtml = generateTicketHtml(order.value)
  
  // 创建Blob并下载
  const blob = new Blob([ticketHtml], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `电子票_${order.value.orderId || order.value.pnrNumber}_${new Date().getTime()}.html`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  ElMessage.success('电子票下载成功')
}

// 生成电子票HTML（按照图2222格式）
const generateTicketHtml = (orderData) => {
  const pnrNumber = orderData.orderId || orderData.pnrNumber
  const trainNumber = orderData.trainNumber || ''
  
  // 格式化时间：从 "2025-12-20T08:30:00" 提取 "08:00"
  const formatTimeOnly = (dateTimeStr) => {
    if (!dateTimeStr) return ''
    try {
      const date = new Date(dateTimeStr.replace(' ', 'T'))
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${hours}:${minutes}`
    } catch {
      return ''
    }
  }

  // 获取站点名称（去除可能的ID后缀）
  const getStationName = (station) => {
    if (!station) return '未知'
    // 如果包含括号，可能是 "北京 (Beijing)" 格式，只取中文部分
    const match = station.match(/^([^(]+)/)
    return match ? match[1].trim() : station
  }

  const departureStation = getStationName(orderData.departureStation)
  const arrivalStation = getStationName(orderData.arrivalStation)
  const departureTime = formatTimeOnly(orderData.departureTime)
  const arrivalTime = formatTimeOnly(orderData.arrivalTime)

  // 生成二维码URL（使用PNR号）
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pnrNumber)}`

  // 为每个乘客生成一张电子票
  const passengers = orderData.passengers || []
  
  if (passengers.length === 0) {
    return '<html><body><p>没有乘客信息</p></body></html>'
  }

  // 生成单张电子票HTML
  const generateSingleTicket = (passenger) => {
    const passengerName = passenger.name || ''
    const idCardNumber = passenger.idCardNumber || ''
    // 根据API文档，PassengerDTO使用seatNumber和ticketPrice，但为了兼容也支持seat和price
    const seat = passenger.seatNumber || passenger.seat || '待分配'
    const price = (passenger.ticketPrice || passenger.price || 0).toFixed(2)
    
    // 格式化出发站和到达站：城市名 (时间)
    const fromStation = departureTime ? `${departureStation} (${departureTime})` : departureStation
    const toStation = arrivalTime ? `${arrivalStation} (${arrivalTime})` : arrivalStation

    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>电子客票 - ${pnrNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Microsoft YaHei', 'SimHei', Arial, sans-serif;
      background: white;
      padding: 40px 20px;
      color: #000000;
    }
    .ticket-container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
    }
    .ticket-header {
      text-align: center;
      margin-bottom: 30px;
    }
    .ticket-header .chinese-title {
      font-size: 24px;
      font-weight: bold;
      color: #000000;
      margin-bottom: 5px;
    }
    .ticket-header .english-title {
      font-size: 18px;
      color: #000000;
      font-weight: normal;
    }
    .qr-code-container {
      text-align: center;
      margin: 30px 0;
    }
    .qr-code-container img {
      width: 200px;
      height: 200px;
      border: 1px solid #e0e0e0;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      border: 1px solid #333333;
    }
    .info-table td {
      padding: 12px 15px;
      border: 1px solid #333333;
      font-size: 14px;
      color: #000000;
    }
    .info-table td:first-child {
      width: 40%;
      font-weight: normal;
      background: #fafafa;
    }
    .info-table td:last-child {
      width: 60%;
      font-weight: normal;
    }
    .footer-instruction {
      text-align: center;
      margin-top: 30px;
      font-size: 12px;
      color: #000000;
      line-height: 1.6;
    }
    .footer-instruction p {
      margin: 5px 0;
    }
    @media print {
      body {
        padding: 20px;
      }
      .ticket-container {
        page-break-after: always;
      }
    }
  </style>
</head>
<body>
  <div class="ticket-container">
    <div class="ticket-header">
      <div class="chinese-title">电子客票</div>
      <div class="english-title">E-TICKET RECEIPT</div>
    </div>

    <div class="qr-code-container">
      <img src="${qrCodeUrl}" alt="QR Code" />
    </div>

    <table class="info-table">
      <tr>
        <td>订单号 (PNR):</td>
        <td>${pnrNumber}</td>
      </tr>
      <tr>
        <td>车次 (Train):</td>
        <td>${trainNumber}</td>
      </tr>
      <tr>
        <td>乘客姓名 (Passenger):</td>
        <td>${passengerName}</td>
      </tr>
      <tr>
        <td>证件号 (ID No.):</td>
        <td>${idCardNumber}</td>
      </tr>
      <tr>
        <td>出发站 (From):</td>
        <td>${fromStation}</td>
      </tr>
      <tr>
        <td>到达站 (To):</td>
        <td>${toStation}</td>
      </tr>
      <tr>
        <td>座位 (Seat):</td>
        <td>${seat}</td>
      </tr>
      <tr>
        <td>票价 (Price):</td>
        <td>CNY ${price}</td>
      </tr>
    </table>

    <div class="footer-instruction">
      <p>请向检票员出示上方二维码进行核验。</p>
      <p>Please show the QR code above for validation.</p>
    </div>
  </div>
</body>
</html>
    `
  }

  // 如果只有一个乘客，返回单张票；如果有多个乘客，为每个乘客生成一张票
  if (passengers.length === 1) {
    return generateSingleTicket(passengers[0])
  } else {
    // 多个乘客时，生成多张票，用分页符分隔
    return passengers.map(passenger => generateSingleTicket(passenger)).join('<div style="page-break-after: always;"></div>')
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

