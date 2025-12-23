<template>
  <div class="passenger-select-container">
    <div class="page-header">
      <h1>选择乘客</h1>
      <div class="header-actions">
        <el-button type="success" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增乘客
        </el-button>

        <el-button @click="handleCancel">取消</el-button>
        <el-button
            type="primary"
            @click="handleConfirm"
            :disabled="selectedPassengers.length === 0"
        >
          确认选择 ({{ selectedPassengers.length }})
        </el-button>
      </div>
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

    <div class="search-bar">
      <el-input
          v-model="searchQuery"
          placeholder="搜索乘客姓名、身份证号或手机号"
          clearable
          style="width: 300px"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <el-table
        ref="passengerTableRef"
        v-loading="loading"
        :data="filteredPassengers"
        stripe
        style="width: 100%"
        @selection-change="handleSelectionChange"
        row-key="id"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="name" label="姓名" min-width="120" />
      <el-table-column prop="idCardType" label="证件类型" min-width="120" />
      <el-table-column prop="idCardNumber" label="证件号码" min-width="180" />
      <el-table-column prop="phone" label="手机号" min-width="140" />
      <el-table-column prop="type" label="乘客类型" min-width="120">
        <template #default="{ row }">
          <el-tag :type="getPassengerTypeTag(row.type)">
            {{ getPassengerTypeText(row.type) }}
          </el-tag>
        </template>
      </el-table-column>
    </el-table>

    <PassengerForm
        v-model="dialogVisible"
        :is-edit="false"
        :user-id="currentUserId"
        @success="handleFormSuccess"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import { passengerService } from '@/services/passengerService'
import PassengerForm from './PassengerForm.vue'

const router = useRouter()
const route = useRoute()

// 响应式数据
const loading = ref(false)
const passengers = ref([])
const searchQuery = ref('')
const selectedPassengers = ref([])
const hasConnectionError = ref(false)
const passengerTableRef = ref(null) // 表格 Ref，用于调用 toggleRowSelection

// 控制弹窗和用户ID
const dialogVisible = ref(false)
const currentUserId = ref(null)

// 计算属性：过滤后的乘客列表
const filteredPassengers = computed(() => {
  if (!searchQuery.value) {
    return passengers.value
  }

  const query = searchQuery.value.toLowerCase()
  return passengers.value.filter(passenger =>
      passenger.name?.toLowerCase().includes(query) ||
      passenger.idCardNumber?.toLowerCase().includes(query) ||
      passenger.phone?.toLowerCase().includes(query)
  )
})

const getPassengerTypeTag = (type) => {
  const typeMap = { 1: 'success', 2: 'info' }
  return typeMap[type] || ''
}

const getPassengerTypeText = (type) => {
  const typeMap = { 1: '成人', 2: '学生' }
  return typeMap[type] || `未知(${type})`
}

const getUserId = () => {
  const query = router.currentRoute.value.query
  let userId = query.userId

  if (userId && typeof userId === 'string' && userId.startsWith('user_')) {
    userId = userId.replace('user_', '')
  }

  if (!userId) {
    userId = localStorage.getItem('userId')
  }

  return userId ? userId : null
}

// 【关键逻辑】恢复选中状态
const restoreSelection = () => {
  const selectedIdsStr = route.query.selectedPassengerIds
  if (!selectedIdsStr || !passengerTableRef.value) return

  // 将 URL 参数里的 "1,2,3" 转为数组 [1, 2, 3]
  // 注意：后端返回的 ID 可能是 Long(Number)，URL 参数是 String，这里统一转 Number 比较
  const selectedIds = selectedIdsStr.split(',').map(id => {
    const num = Number(id)
    return isNaN(num) ? id : num
  })

  // 遍历当前表格数据，如果 ID 在选中列表中，则勾选
  passengers.value.forEach(row => {
    if (selectedIds.includes(row.id)) {
      passengerTableRef.value.toggleRowSelection(row, true)
    }
  })
}

// 加载乘客列表
const loadPassengers = async () => {
  loading.value = true
  try {
    const userId = getUserId()
    currentUserId.value = userId

    if (!userId) {
      ElMessage.error('无法获取用户ID，无法加载乘客列表')
      passengers.value = []
      loading.value = false
      return
    }

    const response = await passengerService.getAllPassengers({
      userId: userId
    })
    passengers.value = Array.isArray(response.data) ? response.data : []

    // 【关键步骤】等待 DOM 更新后，执行恢复选中逻辑
    await nextTick()
    restoreSelection()

  } catch (error) {
    console.error('Load passengers error:', error)
    if (error.request && !error.response) {
      hasConnectionError.value = true
    }
  } finally {
    loading.value = false
  }
}

const handleSelectionChange = (selection) => {
  selectedPassengers.value = selection
}

const handleAdd = () => {
  if (!currentUserId.value) {
    ElMessage.error('无法获取用户身份，请重新登录')
    return
  }
  dialogVisible.value = true
}

const handleFormSuccess = () => {
  dialogVisible.value = false
  loadPassengers()
}

const handleConfirm = () => {
  if (selectedPassengers.value.length === 0) {
    ElMessage.warning('请至少选择一个乘客')
    return
  }

  const passengerIds = selectedPassengers.value.map(p => p.id)

  router.push({
    name: 'CreateOrder',
    query: {
      ...router.currentRoute.value.query,
      selectedPassengerIds: passengerIds.join(',')
    }
  })
}

const handleCancel = () => {
  router.back()
}

onMounted(() => {
  loadPassengers()
})
</script>

<style scoped lang="scss">
.passenger-select-container {
  padding: 20px;
  background: #f5f5f5;
  min-height: calc(100vh - 60px);

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
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

    .header-actions {
      display: flex;
      gap: 10px;
    }
  }

  .search-bar {
    margin-bottom: 20px;
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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