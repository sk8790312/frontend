<template>
  <div style="padding: 20px;">
    <h1>测试页面</h1>
    <p>如果你能看到这个页面，说明 Vue 应用基本功能正常。</p>
    <el-button type="primary" @click="testClick">测试按钮</el-button>
    <p v-if="clicked">按钮点击成功！</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElButton } from 'element-plus'

const clicked = ref(false)

const testClick = () => {
  clicked.value = true
  console.log('测试按钮被点击')
}
</script>

<style scoped>
h1 {
  color: #303133;
  margin-bottom: 20px;
}
p {
  color: #606266;
  margin: 10px 0;
}
</style>

