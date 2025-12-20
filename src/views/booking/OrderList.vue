<template>
  <div class="order-list-container">
    <div class="page-header">
      <h1>订单管理</h1>
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

    <el-table
        v-loading="loading"
        :data="orders"
        stripe
        style="width: 100%"
    >
      <el-table-column prop="pnrNumber" label="PNR号" min-width="150" />

      <el-table-column prop="trainNumber" label="车次" min-width="100" />
      <el-table-column prop="departureStation" label="出发站" min-width="120" />
      <el-table-column prop="arrivalStation" label="到达站" min-width="120" />

      <el-table-column prop="status" label="订单状态" min-width="120">
        <template #default="{ row }">
          <el-tag :type="getStatusTag(row.status)">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="paymentStatus" label="支付状态" min-width="120">
        <template #default="{ row }">
          <el-tag :type="getPaymentStatusTag(row.paymentStatus || 'UNPAID')">
            {{ getPaymentStatusText(row.paymentStatus || 'UNPAID') }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="totalPrice" label="订单金额" min-width="120">
        <template #default="{ row }">
          ¥{{ row.totalPrice?.toFixed(2) || '0.00' }}
        </template>
      </el-table-column>

      <el-table-column prop="createTime" label="创建时间" min-width="180">
        <template #default="{ row }">
          {{ formatDate(row.createTime) }}
        </template>
      </el-table-column>

      <el-table-column label="操作" min-width="200" fixed="right">
        <template #default="{ row }">
          <el-button
              type="primary"
              size="small"
              link
              @click="handleViewDetail(row)"
          >
            查看详情
          </el-button>
          <el-button
              v-if="row.status === 'PENDING'"
              type="success"
              size="small"
              link
              @click="handlePay(row)"
          >
            去支付
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElAlert } from 'element-plus'
import { orderService } from '@/services/orderService'

const router = useRouter()

// 响应式数据
const loading = ref(false)
const orders = ref([])
const hasConnectionError = ref(false)

// 获取订单状态标签
const getStatusTag = (status) => {
  const statusMap = {
    'PENDING': 'warning',   // PENDING 通常是待处理/待支付，用 warning 黄色比较合适
    'CONFIRMED': 'success',
    'CANCELLED': 'info',    // 取消通常用灰色 info
    'REFUNDED': 'danger'
  }
  return statusMap[status] || ''
}

// 获取订单状态文本
const getStatusText = (status) => {
  const statusMap = {
    'PENDING': '待支付', // 根据你的上下文，PENDING 往往意味着还没付钱
    'CONFIRMED': '已出票',
    'CANCELLED': '已取消',
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

// 格式化日期
const formatDate = (date) => {
  if (!date) return '-'
  // 解决部分浏览器无法解析 'YYYY-MM-DD HH:mm:ss' 格式的问题（替换空格为T）
  const safeDate = typeof date === 'string' ? date.replace(' ', 'T') : date;
  return new Date(safeDate).toLocaleString('zh-CN')
}

// 加载订单列表
const loadOrders = async () => {
  loading.value = true
  try {
    const response = await orderService.getOrderList({
      userId: 1 // 临时使用1，后续从token中获取
    })
    orders.value = Array.isArray(response.data) ? response.data : []
  } catch (error) {
    console.error('Load orders error:', error)
    orders.value = []

    if (error.request && !error.response) {
      hasConnectionError.value = true
    } else {
      hasConnectionError.value = false
    }
  } finally {
    loading.value = false
  }
}

// 查看详情
const handleViewDetail = (order) => {
  // 可以在这里打印一下看看当前行的数据
  console.log('查看订单详情:', order)
  ElMessage.info(`查看 PNR: ${order.pnrNumber} 的详情`)
}

// 去支付
const handlePay = (order) => {
  // 后端JSON暂时没返回 payUrl，这里做个防御性提示
  if (order.payUrl) {
    window.open(order.payUrl, '_blank')
  } else {
    ElMessage.success('模拟支付跳转...')
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadOrders()
})
</script>

<style scoped lang="scss">
.order-list-container {
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

  .el-table {
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    width: 100%;
  }
}
</style>