<template>
  <div class="passenger-select-container">
    <div class="page-header">
      <h1>选择乘客</h1>
      <div class="header-actions">
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

    <!-- 搜索栏 -->
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

    <!-- 乘客列表表格 -->
    <el-table
      v-loading="loading"
      :data="filteredPassengers"
      stripe
      style="width: 100%"
      @selection-change="handleSelectionChange"
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElAlert } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { passengerService } from '@/services/passengerService'

const router = useRouter()

// 响应式数据
const loading = ref(false)
const passengers = ref([])
const searchQuery = ref('')
const selectedPassengers = ref([])
const hasConnectionError = ref(false)

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

// 获取乘客类型标签
const getPassengerTypeTag = (type) => {
  const typeMap = {
    1: 'success', // 成人
    2: 'info'     // 学生
  }
  return typeMap[type] || ''
}

// 获取乘客类型文本
const getPassengerTypeText = (type) => {
  const typeMap = {
    1: '成人',
    2: '学生'
  }
  return typeMap[type] || `未知(${type})`
}

// 获取userId（从URL参数或使用默认值）
const getUserId = () => {
  const query = router.currentRoute.value.query
  let userId = query.userId
  if (userId && typeof userId === 'string' && userId.startsWith('user_')) {
    userId = userId.replace('user_', '')
  }
  return userId ? parseInt(userId) : 1
}

// 加载乘客列表
const loadPassengers = async () => {
  loading.value = true
  try {
    const userId = getUserId()
    const response = await passengerService.getAllPassengers({
      userId: userId
    })
    passengers.value = Array.isArray(response.data) ? response.data : []
  } catch (error) {
    console.error('Load passengers error:', error)
    passengers.value = []
    
    if (error.request && !error.response) {
      hasConnectionError.value = true
      ElMessage.error('无法连接到后端服务器，请确认后端服务是否在 http://localhost:8081 运行')
    } else {
      hasConnectionError.value = false
      ElMessage.error('加载乘客列表失败: ' + (error.message || '未知错误'))
    }
  } finally {
    loading.value = false
  }
}

// 选择变化处理
const handleSelectionChange = (selection) => {
  selectedPassengers.value = selection
}

// 确认选择
const handleConfirm = () => {
  if (selectedPassengers.value.length === 0) {
    ElMessage.warning('请至少选择一个乘客')
    return
  }
  
  // 返回选中的乘客ID数组
  const passengerIds = selectedPassengers.value.map(p => p.id)
  
  // 通过路由参数返回
  router.push({
    name: 'CreateOrder',
    query: {
      ...router.currentRoute.value.query,
      selectedPassengerIds: passengerIds.join(',')
    }
  })
}

// 取消
const handleCancel = () => {
  router.back()
}

// 组件挂载时加载数据
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

