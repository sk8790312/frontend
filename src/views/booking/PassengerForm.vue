<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑乘客' : '添加乘客'"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      label-position="left"
    >
      <el-form-item label="姓名" prop="name">
        <el-input
          v-model="form.name"
          placeholder="请输入乘客姓名"
          maxlength="50"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="证件类型" prop="idCardType">
        <el-select
          v-model="form.idCardType"
          placeholder="请选择证件类型"
          style="width: 100%"
        >
          <el-option label="身份证" value="身份证" />
        </el-select>
      </el-form-item>

      <el-form-item label="证件号码" prop="idCardNumber">
        <el-input
          v-model="form.idCardNumber"
          placeholder="请输入证件号码"
          maxlength="18"
          @blur="validateIdCard"
        />
      </el-form-item>

      <el-form-item label="手机号" prop="phone">
        <el-input
          v-model="form.phone"
          placeholder="请输入11位手机号"
          maxlength="11"
        />
      </el-form-item>

      <el-form-item label="乘客类型" prop="type">
        <el-select
          v-model="form.type"
          placeholder="请选择乘客类型"
          style="width: 100%"
        >
          <el-option label="成人" :value="1" />
          <el-option label="学生" :value="2" />
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ isEdit ? '更新' : '创建' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { passengerService } from '@/services/passengerService'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  passenger: {
    type: Object,
    default: null
  },
  isEdit: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'success'])

const formRef = ref(null)
const submitting = ref(false)

// 表单数据
const form = reactive({
  id: null,
  name: '',
  type: 1, // 1=成人, 2=学生
  idCardType: '身份证',
  idCardNumber: '',
  phone: ''
})

// 对话框显示状态
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入乘客姓名', trigger: 'blur' },
    { min: 2, max: 50, message: '姓名长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  idCardNumber: [
    { required: true, message: '请输入证件号码', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的11位手机号', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择乘客类型', trigger: 'change' },
    { type: 'number', message: '乘客类型必须是数字', trigger: 'change' }
  ]
}

// 身份证号验证
const validateIdCard = () => {
  if (form.idCardType === '身份证' && form.idCardNumber) {
    const idCardPattern = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/
    if (!idCardPattern.test(form.idCardNumber)) {
      ElMessage.warning('身份证号格式不正确')
    }
  }
}

// 重置表单（必须在 watch 之前定义）
const resetForm = () => {
  Object.assign(form, {
    id: null,
    name: '',
    type: 1, // 1=成人, 2=学生
    idCardType: '身份证',
    idCardNumber: '',
    phone: ''
  })
  formRef.value?.clearValidate()
}

// 监听乘客数据变化，填充表单
watch(() => props.passenger, (newPassenger) => {
  if (newPassenger) {
    Object.assign(form, {
      id: newPassenger.id || null,
      name: newPassenger.name || '',
      type: newPassenger.type || 1, // 1=成人, 2=学生
      idCardType: newPassenger.idCardType || '身份证',
      idCardNumber: newPassenger.idCardNumber || '',
      phone: newPassenger.phone || ''
    })
  } else {
    resetForm()
  }
}, { immediate: true })

// 关闭对话框
const handleClose = () => {
  resetForm()
  dialogVisible.value = false
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitting.value = true

    // 准备提交数据（只包含后端需要的字段）
    // userId隐式设置为1，后续从token中获取
    const submitData = {
      id: form.id || undefined,
      userId: 1, // 临时使用1，后续从token中获取
      name: form.name,
      type: form.type,
      idCardType: form.idCardType,
      idCardNumber: form.idCardNumber,
      phone: form.phone || undefined
    }

    if (props.isEdit) {
      // 更新乘客（需要包含 id）
      submitData.id = form.id
      await passengerService.updatePassenger(submitData)
      ElMessage.success('更新成功')
    } else {
      // 创建乘客（不需要 id）
      delete submitData.id
      await passengerService.createPassenger(submitData)
      ElMessage.success('创建成功')
    }

    emit('success')
    handleClose()
  } catch (error) {
    if (error !== false) {
      // 验证失败时 error 为 false，其他情况为实际错误
      ElMessage.error((props.isEdit ? '更新' : '创建') + '失败: ' + (error.message || '未知错误'))
      console.error('Submit passenger error:', error)
    }
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped lang="scss">
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

:deep(.el-form-item) {
  margin-bottom: 22px;
}

:deep(.el-input),
:deep(.el-select),
:deep(.el-textarea) {
  width: 100%;
}
</style>

