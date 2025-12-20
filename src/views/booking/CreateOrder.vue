<template>
  <div class="create-order-container">
    <div class="page-header">
      <h1>创建订单</h1>
    </div>

    <el-card class="order-info-card">
      <template #header>
        <div class="card-header">
          <span>订单信息</span>
        </div>
      </template>

      <el-form 
        ref="orderFormRef"
        :model="orderForm" 
        :rules="formRules"
        label-width="140px" 
        label-position="left"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="车次号">
              <el-input v-model="orderForm.trainNumber" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="出发站">
              <el-input v-model="orderForm.departureStation" disabled />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="到达站">
              <el-input v-model="orderForm.arrivalStation" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="出发时间">
              <el-input v-model="orderForm.departureTime" disabled />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="到达时间">
              <el-input v-model="orderForm.arrivalTime" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="票价">
              <el-input v-model="orderForm.price" disabled>
                <template #append>元</template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="联系人手机" prop="contactPhone">
          <el-input
            v-model="orderForm.contactPhone"
            placeholder="请输入联系人手机号"
            maxlength="11"
            style="width: 300px"
            clearable
            @blur="handlePhoneBlur"
            @input="handlePhoneInput"
          />
        </el-form-item>

        <el-form-item label="选择乘客">
          <div class="passenger-selection">
            <el-button type="primary" @click="handleSelectPassengers">
              <el-icon><User /></el-icon>
              选择乘客
            </el-button>
            <div v-if="selectedPassengers.length > 0" class="selected-passengers">
              <el-tag
                v-for="passenger in selectedPassengers"
                :key="passenger.id"
                closable
                @close="handleRemovePassenger(passenger.id)"
                style="margin-right: 10px; margin-top: 10px"
              >
                {{ passenger.name }} ({{ passenger.idCardNumber }})
              </el-tag>
            </div>
            <div v-else class="empty-hint">
              <span class="hint-text">请选择至少一名乘客</span>
            </div>
          </div>
        </el-form-item>
      </el-form>
    </el-card>

    <div class="action-buttons">
      <el-button @click="handleCancel">取消</el-button>
      <el-button
        type="primary"
        @click="handleSubmit"
        :loading="submitting"
        :disabled="selectedPassengers.length === 0 || !orderForm.contactPhone"
      >
        提交订单
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User } from '@element-plus/icons-vue'
import { orderService } from '@/services/orderService'
import { passengerService } from '@/services/passengerService'

const route = useRoute()
const router = useRouter()

const submitting = ref(false)
const selectedPassengers = ref([])
const orderFormRef = ref(null)
const isFormInitialized = ref(false)

// 表单验证规则
const formRules = {
  contactPhone: [
    { required: true, message: '请输入联系人手机号', trigger: 'blur' },
    { 
      pattern: /^1[3-9]\d{9}$/, 
      message: '请输入正确的11位手机号（以1开头，第二位为3-9）', 
      trigger: 'blur' 
    }
  ]
}

// 订单表单数据
const orderForm = reactive({
  userId: null,
  trainNumber: '',
  departureStation: '',
  arrivalStation: '',
  departureTime: '',
  arrivalTime: '',
  price: '',
  contactPhone: ''
})

// 从URL参数初始化订单信息（只初始化订单基本信息，不包括乘客）
const initOrderForm = () => {
  // 如果已经初始化过，不再重新初始化（避免覆盖用户填写的内容）
  if (isFormInitialized.value) {
    return
  }
  
  // 从URL查询参数获取
  const query = route.query
  
  // 处理userId（可能是user_1001格式，需要提取数字）
  let userId = query.userId
  if (userId && typeof userId === 'string' && userId.startsWith('user_')) {
    userId = userId.replace('user_', '')
  }
  
  orderForm.userId = userId ? parseInt(userId) : 1
  orderForm.trainNumber = query.trainNumber || ''
  orderForm.departureStation = query.departureStation || ''
  orderForm.arrivalStation = query.arrivalStation || ''
  orderForm.departureTime = query.departureTime || ''
  orderForm.arrivalTime = query.arrivalTime || ''
  orderForm.price = query.price || ''
  
  isFormInitialized.value = true
}

// 根据ID加载乘客信息
const loadPassengersByIds = async (passengerIds) => {
  if (!passengerIds || passengerIds.length === 0) {
    selectedPassengers.value = []
    return
  }
  
  try {
    // 先获取所有乘客列表
    const response = await passengerService.getAllPassengers({
      userId: orderForm.userId
    })
    
    const allPassengers = Array.isArray(response.data) ? response.data : []
    // 筛选出选中的乘客
    selectedPassengers.value = allPassengers.filter(p => passengerIds.includes(p.id))
    
    if (selectedPassengers.value.length > 0) {
      ElMessage.success(`已选择 ${selectedPassengers.value.length} 名乘客`)
    }
  } catch (error) {
    console.error('Load passengers error:', error)
    ElMessage.error('加载乘客信息失败: ' + (error.message || '未知错误'))
    selectedPassengers.value = []
  }
}

// 监听URL参数中的selectedPassengerIds变化（从乘客选择页面返回时）
watch(
  () => route.query.selectedPassengerIds,
  (newValue) => {
    if (newValue) {
      // 关键修改：如果 userId 还没值，先尝试初始化
      if (!orderForm.userId) {
        initOrderForm()
      }

      const passengerIds = newValue.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
      if (passengerIds.length > 0) {
        loadPassengersByIds(passengerIds)
      }
    }
  },
  { immediate: true }
)

// 选择乘客
const handleSelectPassengers = async () => {
  // 先验证联系人手机号
  if (!orderForm.contactPhone) {
    ElMessage.warning('请先填写联系人手机号')
    // 触发表单验证以显示错误提示
    if (orderFormRef.value) {
      await nextTick()
      orderFormRef.value.validateField('contactPhone', () => {})
    }
    return
  }
  
  // 验证手机号格式
  const phonePattern = /^1[3-9]\d{9}$/
  if (!phonePattern.test(orderForm.contactPhone)) {
    ElMessage.warning('请输入正确的11位手机号')
    // 触发表单验证以显示错误提示
    if (orderFormRef.value) {
      await nextTick()
      orderFormRef.value.validateField('contactPhone', () => {})
    }
    return
  }
  
  // 跳转到乘客选择页面，携带当前订单信息（不包含selectedPassengerIds）
  const query = { ...route.query }
  delete query.selectedPassengerIds // 移除selectedPassengerIds，避免混淆
  router.push({
    name: 'PassengerSelect',
    query: {
      ...query,
      returnTo: 'CreateOrder'
    }
  })
}

// 移除乘客
const handleRemovePassenger = (passengerId) => {
  selectedPassengers.value = selectedPassengers.value.filter(p => p.id !== passengerId)
  ElMessage.info('已移除该乘客')
}

// 手机号失焦验证
const handlePhoneBlur = async () => {
  // 触发表单验证（Element Plus会自动显示错误信息）
  if (orderFormRef.value) {
    await nextTick()
    orderFormRef.value.validateField('contactPhone', () => {})
  }
}

// 手机号输入时清除错误提示（如果输入正确则清除错误状态）
const handlePhoneInput = () => {
  const phonePattern = /^1[3-9]\d{9}$/
  // 如果输入正确，清除该字段的验证错误
  if (orderForm.contactPhone && phonePattern.test(orderForm.contactPhone)) {
    if (orderFormRef.value) {
      orderFormRef.value.clearValidate('contactPhone')
    }
  }
}

// 提交订单
const handleSubmit = async () => {
  // 表单验证
  if (orderFormRef.value) {
    try {
      await orderFormRef.value.validate()
    } catch (error) {
      console.error('表单验证失败:', error)
      ElMessage.warning('请检查表单填写是否正确')
      return
    }
  }
  
  if (selectedPassengers.value.length === 0) {
    ElMessage.warning('请至少选择一名乘客')
    return
  }
  
  // 额外验证（表单验证应该已经处理，但这里作为双重检查）
  if (!orderForm.contactPhone) {
    ElMessage.warning('请输入联系人手机号')
    if (orderFormRef.value) {
      await nextTick()
      orderFormRef.value.validateField('contactPhone', () => {})
    }
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确认提交订单吗？\n车次：${orderForm.trainNumber}\n乘客数量：${selectedPassengers.value.length}人`,
      '确认提交',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'info'
      }
    )
    
    submitting.value = true
    
    // 准备提交数据
    const orderData = {
      userId: orderForm.userId,
      trainNumber: orderForm.trainNumber,
      departureStation: orderForm.departureStation,
      arrivalStation: orderForm.arrivalStation,
      departureTime: orderForm.departureTime.replace('T', ' '),
      arrivalTime: orderForm.arrivalTime.replace('T', ' '),
      price: parseFloat(orderForm.price),
      contactPhone: orderForm.contactPhone,
      passengerIds: selectedPassengers.value.map(p => p.id)
    }
    
    const response = await orderService.createOrder(orderData)
    
    ElMessage.success('订单创建成功！')
    
    // 跳转到订单详情或订单列表
    setTimeout(() => {
      router.push({
        name: 'OrderList'
      })
    }, 1500)
    
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('创建订单失败: ' + (error.message || '未知错误'))
      console.error('Create order error:', error)
    }
  } finally {
    submitting.value = false
  }
}

// 取消
const handleCancel = () => {
  router.back()
}

// 组件挂载时初始化
onMounted(() => {
  initOrderForm()
})
</script>

<style scoped lang="scss">
.create-order-container {
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

  .order-info-card {
    margin-bottom: 20px;

    .card-header {
      font-weight: 600;
      font-size: 16px;
    }
  }

  .passenger-selection {
    .selected-passengers {
      margin-top: 10px;
    }

    .empty-hint {
      margin-top: 10px;

      .hint-text {
        color: #909399;
        font-size: 14px;
      }
    }
  }

  .action-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
}
</style>

