<template>
  <div class="create-order-container">
    <div class="page-header">
      <h1>创建订单</h1>
    </div>

    <el-alert
        v-if="!orderForm.userId"
        title="用户身份信息缺失"
        description="无法获取当前操作用户，请从首页重新进入或登录。"
        type="error"
        show-icon
        :closable="false"
        style="margin-bottom: 20px"
    />

    <el-card class="order-info-card">
      <template #header>
        <div class="card-header">
          <span>订单信息</span>
          <el-tag size="small" type="info" style="float: right">Current UserID: {{ orderForm.userId || '未获取' }}</el-tag>
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
            <el-form-item label="票价">
              <el-input v-model="orderForm.price" disabled>
                <template #append>元</template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12"><el-form-item label="出发站"><el-input v-model="orderForm.departureStation" disabled /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="到达站"><el-input v-model="orderForm.arrivalStation" disabled /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12"><el-form-item label="出发时间"><el-input v-model="orderForm.departureTime" disabled /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="到达时间"><el-input v-model="orderForm.arrivalTime" disabled /></el-form-item></el-col>
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
            <el-button type="primary" @click="handleSelectPassengers" :disabled="!orderForm.userId">
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
          :disabled="selectedPassengers.length === 0 || !orderForm.contactPhone || !orderForm.userId"
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

const formRules = {
  contactPhone: [
    { required: true, message: '请输入联系人手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的11位手机号', trigger: 'blur' }
  ]
}

const orderForm = reactive({
  userId: null, // 初始化为 null
  trainNumber: '',
  departureStation: '',
  arrivalStation: '',
  departureTime: '',
  arrivalTime: '',
  price: '',
  contactPhone: ''
})

// 【核心修改】初始化逻辑
const initOrderForm = () => {
  if (isFormInitialized.value) return

  const query = route.query

  // 1. 优先尝试从 URL 参数获取 userId (集成入口)
  let incomingUserId = query.userId

  // 处理 user_ 前缀的情况（虽然对方代码看起来直接传了数字，但保留防御性编程）
  if (incomingUserId && typeof incomingUserId === 'string' && incomingUserId.startsWith('user_')) {
    incomingUserId = incomingUserId.replace('user_', '')
  }

  // 2. 决策逻辑：
  //    如果有 URL 参数 -> 存入 localStorage (刷新页面不丢失) -> 赋值给 form
  //    如果无 URL 参数 -> 尝试从 localStorage 读取 -> 赋值给 form
  //    如果都没有 -> 报错，form.userId 保持 null

  if (incomingUserId) {
    // 收到新 ID，更新缓存
    localStorage.setItem('token', incomingUserId)
    localStorage.setItem('userId', incomingUserId)
    orderForm.userId = incomingUserId // 注意：后端如果是 Long 类型，JS里字符串也没问题，axios会自动处理
  } else {
    // 没收到新 ID，读取旧缓存
    const cachedId = localStorage.getItem('token') || localStorage.getItem('userId')
    if (cachedId) {
      orderForm.userId = cachedId
    } else {
      ElMessage.error('未检测到登录用户，请重新从首页进入')
      // 可以在这里强制跳转回首页
    }
  }

  // 其他字段初始化
  orderForm.trainNumber = query.trainNumber || ''
  orderForm.departureStation = query.departureStation || ''
  orderForm.arrivalStation = query.arrivalStation || ''
  orderForm.departureTime = (query.departureTime || '').replace('T', ' ')
  orderForm.arrivalTime = (query.arrivalTime || '').replace('T', ' ')
  orderForm.price = query.price || ''

  const savedPhone = sessionStorage.getItem('temp_create_order_phone')
  if (savedPhone) {
    orderForm.contactPhone = savedPhone
  } else if (query.contactPhone) {
    orderForm.contactPhone = query.contactPhone
  }

  isFormInitialized.value = true
}

// 加载乘客
const loadPassengersByIds = async (passengerIds) => {
  if (!passengerIds || passengerIds.length === 0) {
    selectedPassengers.value = []
    return
  }

  if (!orderForm.userId) {
    ElMessage.warning('缺少用户ID，无法加载乘客')
    return
  }

  try {
    const response = await passengerService.getAllPassengers({
      userId: orderForm.userId
    })

    const allPassengers = Array.isArray(response.data) ? response.data : []
    selectedPassengers.value = allPassengers.filter(p => passengerIds.includes(p.id))
  } catch (error) {
    console.error('Load passengers error:', error)
  }
}

// 监听 selectedPassengerIds
watch(
    () => route.query.selectedPassengerIds,
    (newValue) => {
      if (newValue) {
        // 确保先初始化好 userId
        if (!orderForm.userId) initOrderForm()

        const passengerIds = newValue.split(',').map(id => {
          // 处理可能的非数字ID（如果后端是Long，前端尽量传字符串或数字）
          return isNaN(Number(id)) ? id : Number(id)
        })

        if (passengerIds.length > 0) {
          loadPassengersByIds(passengerIds)
        }
      }
    },
    {immediate: true}
)

const handleSelectPassengers = async () => {
  if (orderForm.contactPhone) {
    sessionStorage.setItem('temp_create_order_phone', orderForm.contactPhone)
  }

  // 跳转时，不需要再把 userId 传回去了，因为 PassengerSelect 会自己从 localStorage 拿
  // 但为了保险起见，保持 query 透传也是好的，这里简化处理
  const query = {...route.query}

  if (selectedPassengers.value.length > 0) {
    query.selectedPassengerIds = selectedPassengers.value.map(p => p.id).join(',')
  } else {
    delete query.selectedPassengerIds
  }

  router.push({
    name: 'PassengerSelect',
    query: {
      ...query,
      returnTo: 'CreateOrder'
      // 只要 CreateOrder 初始化成功存了 localStorage，PassengerSelect 就能读到，无需 URL 显式传递
    }
  })
}

// ... 移除乘客、手机号验证、handleCancel 等逻辑保持不变 ...

const handleRemovePassenger = (passengerId) => {
  selectedPassengers.value = selectedPassengers.value.filter(p => p.id !== passengerId)
}
const handlePhoneBlur = async () => {
  if (orderFormRef.value) await nextTick();
  orderFormRef.value.validateField('contactPhone', () => {
  })
}
const handlePhoneInput = () => {
  const phonePattern = /^1[3-9]\d{9}$/
  if (orderForm.contactPhone && phonePattern.test(orderForm.contactPhone)) {
    if (orderFormRef.value) orderFormRef.value.clearValidate('contactPhone')
  }
}
const handleCancel = () => router.back()

const handleSubmit = async () => {
  if (!orderFormRef.value) return
  await orderFormRef.value.validate()

  if (selectedPassengers.value.length === 0) {
    ElMessage.warning('请至少选择一名乘客')
    return
  }

  // 最终安全检查
  if (!orderForm.userId) {
    ElMessage.error('用户身份失效，请刷新页面')
    return
  }

  try {
    submitting.value = true
    const orderData = {
      userId: orderForm.userId, // 使用动态获取的 ID
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
    // 兼容可能直接返回 data 或包装对象的情况
    if (response && (response.code === 200 || response.orderId)) {
      ElMessage.success('订单创建成功！')
      setTimeout(() => {
        router.push({name: 'OrderList'})
      }, 1500)
    } else {
      throw new Error(response.msg || '创建返回异常')
    }
  } catch (error) {
    ElMessage.error('创建订单失败: ' + (error.message || '未知错误'))
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  initOrderForm()
})
</script>

<style scoped lang="scss">
/* 样式保持不变 */
.create-order-container {
  padding: 20px;
  background: #f5f5f5;
  min-height: calc(100vh - 60px);
}

.page-header {
  margin-bottom: 20px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.order-info-card {
  margin-bottom: 20px;
}

.card-header {
  font-weight: 600;
  font-size: 16px;
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
</style>