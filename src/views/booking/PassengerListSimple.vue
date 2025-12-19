<template>
  <div class="passenger-list-container">
    <div class="page-header">
      <h1>乘客管理</h1>
      <p>如果看到这个页面，说明组件渲染正常</p>
    </div>
    
    <div style="padding: 20px; background: white; border-radius: 8px;">
      <p>正在加载乘客列表...</p>
      <p>如果后端服务未启动，这里会显示空列表</p>
    </div>
  </div>
</template>

<script setup>
console.log('PassengerListSimple component loaded')
</script>

<style scoped>
.passenger-list-container {
  padding: 20px;
  background: #f5f5f5;
  min-height: calc(100vh - 60px);
}

.page-header {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

h1 {
  margin: 0 0 10px 0;
  font-size: 24px;
  color: #303133;
}

p {
  margin: 5px 0;
  color: #606266;
}
</style>

