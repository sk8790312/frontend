<template>
  <div class="order-list-container">
    <div class="page-header">
      <h1>订单管理</h1>
    </div>

    <!-- 后端连接错误提示 -->
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

    <!-- 订单列表表格 -->
    <el-table
      v-loading="loading"
      :data="orders"
      stripe
      style="width: 100%"
    >
      <el-table-column prop="orderId" label="订单号" min-width="150" />
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
          <el-tag :type="getPaymentStatusTag(row.paymentStatus)">
            {{ getPaymentStatusText(row.paymentStatus) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="totalAmount" label="订单金额" min-width="120">
        <template #default="{ row }">
          ¥{{ row.totalAmount?.toFixed(2) || '0.00' }}
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" min-width="180">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
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
            v-if="row.paymentStatus === 'UNPAID' && row.payUrl"
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
    'PENDING': 'info',
    'CONFIRMED': 'success',
    'CANCELLED': 'danger',
    'REFUNDED': 'warning'
  }
  return statusMap[status] || ''
}

// 获取订单状态文本
const getStatusText = (status) => {
  const statusMap = {
    'PENDING': '待确认',
    'CONFIRMED': '已确认',
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
  return new Date(date).toLocaleString('zh-CN')
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
  // TODO: 跳转到订单详情页面
  ElMessage.info('订单详情功能开发中')
  console.log('Order detail:', order)
}

// 去支付
const handlePay = (order) => {
  if (order.payUrl) {
    window.open(order.payUrl, '_blank')
  } else {
    ElMessage.warning('支付链接不存在')
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

