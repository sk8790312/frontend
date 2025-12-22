<template>
  <div class="passenger-list-container">
    <div class="page-header">
      <h1>乘客管理</h1>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        添加乘客
      </el-button>
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
        <p style="margin: 5px 0 0 0;">页面功能受限，但可以正常浏览界面。</p>
      </template>
    </el-alert>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索乘客姓名、身份证号或手机号"
        clearable
        @input="handleSearch"
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
      :default-sort="{ prop: 'id', order: 'ascending' }"
    >
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
      <el-table-column prop="createTime" label="创建时间" min-width="180" sortable>
        <template #default="{ row }">
          {{ formatDate(row.createTime) }}
        </template>
      </el-table-column>
      <el-table-column prop="updateTime" label="修改时间" min-width="180" sortable>
        <template #default="{ row }">
          {{ formatDate(row.updateTime) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" min-width="200" fixed="right">
        <template #default="{ row }">
          <el-button
            type="primary"
            size="small"
            link
            @click="handleEdit(row)"
          >
            <el-icon><Edit /></el-icon>
            编辑
          </el-button>
          <el-button
            type="danger"
            size="small"
            link
            @click="handleDelete(row)"
          >
            <el-icon><Delete /></el-icon>
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加/编辑对话框 -->
    <PassengerForm
      v-model="dialogVisible"
      :passenger="currentPassenger"
      :is-edit="isEdit"
      @success="handleFormSuccess"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, ElAlert } from 'element-plus'
import { Plus, Search, Edit, Delete } from '@element-plus/icons-vue'
import PassengerForm from './PassengerForm.vue'
import { passengerService } from '@/services/passengerService'

// 响应式数据
const loading = ref(false)
const passengers = ref([])
const searchQuery = ref('')
const dialogVisible = ref(false)
const currentPassenger = ref(null)
const isEdit = ref(false)
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

// 获取乘客类型标签（type: 1=成人, 2=学生）
const getPassengerTypeTag = (type) => {
  const typeMap = {
    1: 'success', // 成人
    2: 'info'     // 学生
  }
  return typeMap[type] || ''
}

// 获取乘客类型文本（type: 1=成人, 2=学生）
const getPassengerTypeText = (type) => {
  const typeMap = {
    1: '成人',
    2: '学生'
  }
  return typeMap[type] || `未知(${type})`
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

// 加载乘客列表
const loadPassengers = async () => {
  loading.value = true
  try {
    const response = await passengerService.getAllPassengers({
      userId: 1 // 临时使用1，后续从token中获取
    })
    // 后端返回格式：{ code: 200, message: "", data: [...] }
    // 响应拦截器已经处理，这里 response.data 就是数组
    passengers.value = Array.isArray(response.data) ? response.data : []
  } catch (error) {
    // 即使 API 失败也显示空列表，不阻止页面渲染
    console.error('Load passengers error:', error)
    passengers.value = []
    
    // 检查是否是网络连接错误
    if (error.request && !error.response) {
      hasConnectionError.value = true
      console.error('Network Error: 无法连接到后端服务器，请确认后端服务是否在 http://localhost:8081 运行')
    } else {
      hasConnectionError.value = false
      if (error.response) {
        console.error('API Error:', error.response.status, error.response.data)
      } else {
        console.error('Error:', error.message)
      }
    }
  } finally {
    loading.value = false
  }
}

// 搜索处理
const handleSearch = () => {
  // 实时搜索，使用计算属性过滤
}

// 添加乘客
const handleAdd = () => {
  currentPassenger.value = null
  isEdit.value = false
  dialogVisible.value = true
}

// 编辑乘客
const handleEdit = (passenger) => {
  currentPassenger.value = { ...passenger }
  isEdit.value = true
  dialogVisible.value = true
}

// 删除乘客
const handleDelete = async (passenger) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除乘客 "${passenger.name}" 吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    loading.value = true
    await passengerService.deletePassenger(passenger.id)
    ElMessage.success('删除成功')
    await loadPassengers()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败: ' + (error.message || '未知错误'))
      console.error('Delete passenger error:', error)
    }
  } finally {
    loading.value = false
  }
}

// 表单提交成功回调
const handleFormSuccess = () => {
  dialogVisible.value = false
  loadPassengers()
}

// 组件挂载时加载数据
onMounted(() => {
  loadPassengers()
})
</script>

<style scoped lang="scss">
.passenger-list-container {
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

  // 确保表格列能够自适应
  :deep(.el-table__header-wrapper),
  :deep(.el-table__body-wrapper) {
    width: 100%;
  }

  :deep(.el-table__header),
  :deep(.el-table__body) {
    width: 100% !important;
  }

}

// 响应式设计
@media (max-width: 768px) {
  .passenger-list-container {
    padding: 10px;

    .page-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 15px;
      padding: 15px;

      h1 {
        font-size: 20px;
      }
    }

    .search-bar {
      padding: 15px;

      .el-input {
        width: 100% !important;
      }
    }


    :deep(.el-table) {
      font-size: 12px;

      .el-table__cell {
        padding: 8px 4px;
      }
    }
  }
}

@media (max-width: 480px) {
  .passenger-list-container {
    .page-header {
      h1 {
        font-size: 18px;
      }
    }

    :deep(.el-table) {
      .el-table__cell {
        padding: 6px 2px;
        font-size: 11px;
      }
    }

  }
}
</style>

