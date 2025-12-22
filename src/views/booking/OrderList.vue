<template>
  <div class="order-list-container">
    <div class="page-header">
      <div class="header-content">
        <h1>订单管理</h1>
        <el-button type="primary" @click="loadOrders" :loading="loading">
          刷新列表
        </el-button>
      </div>
    </div>

    <el-alert
        v-if="hasConnectionError"
        title="后端服务连接失败"
        type="error"
        :closable="false"
        show-icon
        style="margin-bottom: 20px"
    >
      <template #default>
        <p>无法连接到后端接口，请检查服务是否启动。</p>
      </template>
    </el-alert>

    <el-table
        v-loading="loading"
        :data="orders"
        stripe
        border
        style="width: 100%"
    >
      <el-table-column prop="pnrNumber" label="订单号 (PNR)" min-width="140" fixed="left">
        <template #default="{ row }">
          <span style="font-weight: bold; color: #409EFF">{{ row.pnrNumber }}</span>
        </template>
      </el-table-column>

      <el-table-column prop="trainNumber" label="车次" min-width="100" align="center">
        <template #default="{ row }">
          <el-tag effect="plain">{{ row.trainNumber }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column label="行程信息" min-width="240">
        <template #default="{ row }">
          <div class="trip-info">
            <div class="station">
              <span class="name">{{ row.departureStation }}</span>
              <span class="time">{{ formatTime(row.departureTime) }}</span>
            </div>
            <div class="arrow">➜</div>
            <div class="station">
              <span class="name">{{ row.arrivalStation }}</span>
              <span class="time">{{ formatTime(row.arrivalTime) }}</span>
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column prop="status" label="状态" min-width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="getStatusTag(row.status)">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="totalPrice" label="金额" min-width="100" align="right">
        <template #default="{ row }">
          <span style="color: #f56c6c; font-weight: bold;">
            ¥{{ row.totalPrice?.toFixed(2) || '0.00' }}
          </span>
        </template>
      </el-table-column>

      <el-table-column prop="createTime" label="下单时间" min-width="160" align="center">
        <template #default="{ row }">
          {{ formatDateTime(row.createTime) }}
        </template>
      </el-table-column>

      <el-table-column label="操作" min-width="250" fixed="right" align="center">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="handleViewDetail(row)">
            详情
          </el-button>

          <el-button
              v-if="row.status === 'PENDING'"
              link
              type="success"
              size="small"
              @click="handlePay(row)"
          >
            去支付
          </el-button>

          <el-button
              v-if="row.status === 'PENDING'"
              link
              type="warning"
              size="small"
              @click="handleCancel(row)"
          >
            取消
          </el-button>

          <el-button
              v-if="['CANCELLED', 'REFUNDED', 'PAID'].includes(row.status)"
              link
              type="danger"
              size="small"
              @click="handleDelete(row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
// 确保路径正确引用了你刚才修改的 orderService.js
import { orderService } from '@/services/orderService'

const router = useRouter()

// ------------------- 数据定义 -------------------
const loading = ref(false)
const orders = ref([])
const hasConnectionError = ref(false)

// ------------------- 状态处理工具函数 -------------------
const getStatusTag = (status) => {
  const map = {
    'PENDING': 'warning',   // 待支付：黄
    'PAID': 'success',      // 已支付：绿
    'CANCELLED': 'info',    // 已取消：灰
    'REFUNDED': 'danger'    // 已退款：红
  }
  return map[status] || ''
}

const getStatusText = (status) => {
  const map = {
    'PENDING': '待支付',
    'PAID': '已支付',
    'CANCELLED': '已取消',
    'REFUNDED': '已退款'
  }
  return map[status] || status
}

// 时间格式化：只显示 HH:mm
const formatTime = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr.replace(' ', 'T'))
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

// 日期时间格式化：YYYY-MM-DD HH:mm
const formatDateTime = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr.replace(' ', 'T'))
  return date.toLocaleString('zh-CN', { hour12: false })
}

// ------------------- 核心业务逻辑 -------------------

// 1. 加载订单列表
const loadOrders = async () => {
  loading.value = true
  hasConnectionError.value = false
  try {
    // 这里的 userId 暂时写死，实际应从 Store 或 Token 解析
    const res = await orderService.getOrderList({ userId: 1 })

    // 兼容后端 Result 包装: {code: 200, msg: "...", data: [...]}
    if (res.code === 200) {
      orders.value = res.data || []
    } else {
      ElMessage.error(res.msg || '获取列表失败')
    }
  } catch (error) {
    console.error('API Error:', error)
    if (error.code === 'ERR_NETWORK') {
      hasConnectionError.value = true
    } else {
      ElMessage.error('网络请求异常')
    }
  } finally {
    loading.value = false
  }
}

// 2. 跳转详情
const handleViewDetail = (row) => {
  // 使用 PNR 跳转
  router.push({
    name: 'OrderDetail',
    params: { pnr: row.pnrNumber }
  })
}

// 3. 去支付 (核心修改：调用后端获取最新链接)
const handlePay = async (row) => {
  try {
    loading.value = true
    // 调用后端新接口 /api/orders/pay-url
    const res = await orderService.getPayUrl(row.pnrNumber)

    if (res.code === 200 && res.data) {
      // 在新窗口打开支付链接
      window.open(res.data, '_blank')

      // 弹窗提示用户刷新状态
      ElMessageBox.confirm(
          '请在新打开的页面完成支付。支付完成后，请点击“已完成支付”刷新状态。',
          '支付确认',
          {
            confirmButtonText: '已完成支付',
            cancelButtonText: '稍后处理',
            type: 'info',
          }
      ).then(() => {
        // 用户点击确认后，刷新列表查看最新状态
        loadOrders()
      }).catch(() => {})

    } else {
      ElMessage.error(res.msg || '无法获取支付链接')
    }
  } catch (error) {
    ElMessage.error('请求支付链接失败')
  } finally {
    loading.value = false
  }
}

// 4. 取消订单
const handleCancel = (row) => {
  ElMessageBox.confirm(
      `确定要取消订单 ${row.pnrNumber} 吗？取消后座位将释放。`,
      '取消提示',
      {
        confirmButtonText: '确认取消',
        cancelButtonText: '再想想',
        type: 'warning',
      }
  ).then(async () => {
    try {
      loading.value = true
      // 调用后端取消接口
      const res = await orderService.cancelOrder(row.orderId)
      if (res.code === 200) {
        ElMessage.success('订单已取消')
        loadOrders() // 刷新列表
      } else {
        ElMessage.error(res.msg || '取消失败')
      }
    } catch (error) {
      ElMessage.error('操作失败')
    } finally {
      loading.value = false
    }
  })
}

// 5. 删除订单
const handleDelete = (row) => {
  ElMessageBox.confirm(
      '确定要删除该订单记录吗？此操作不可恢复。',
      '删除警告',
      {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'error',
      }
  ).then(async () => {
    try {
      loading.value = true
      // 调用后端删除接口
      const res = await orderService.deleteOrder(row.orderId)
      if (res.code === 200) {
        ElMessage.success('删除成功')
        // 直接从前端列表移除，省去一次请求
        orders.value = orders.value.filter(item => item.orderId !== row.orderId)
      } else {
        ElMessage.error(res.msg || '删除失败')
      }
    } catch (error) {
      ElMessage.error('操作失败')
    } finally {
      loading.value = false
    }
  })
}

// 初始化
onMounted(() => {
  loadOrders()
})
</script>

<style scoped lang="scss">
.order-list-container {
  padding: 24px;
  background: #f0f2f5; /* 浅灰色背景，更现代 */
  min-height: calc(100vh - 60px);

  .page-header {
    background: #fff;
    padding: 20px 24px;
    border-radius: 8px;
    margin-bottom: 16px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;

      h1 {
        margin: 0;
        font-size: 20px;
        color: #1f1f1f;
        font-weight: 600;
      }
    }
  }

  /* 优化表格内的行程信息展示 */
  .trip-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-right: 10px;

    .station {
      display: flex;
      flex-direction: column;

      .name {
        font-weight: bold;
        font-size: 14px;
        color: #303133;
      }

      .time {
        font-size: 12px;
        color: #909399;
        margin-top: 4px;
      }
    }

    .arrow {
      color: #DCDFE6;
      font-weight: bold;
      margin: 0 10px;
    }
  }
}
</style>