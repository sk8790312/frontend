# 火车订票系统 - 乘客管理前端

## 项目简介

这是火车订票系统的乘客管理模块前端部分，使用 Vue.js 3 + Element Plus 构建。本项目**只包含前端代码**，需要配合后端服务使用。

## 技术栈

- **Vue.js 3**: 渐进式 JavaScript 框架
- **Vue Router 4**: 官方路由管理器
- **Element Plus**: 基于 Vue 3 的组件库
- **Axios**: HTTP 客户端
- **Vite**: 下一代前端构建工具
- **SCSS**: CSS 预处理器

## 功能特性

- ✅ 乘客列表展示
- ✅ 乘客搜索（按姓名、证件号码、手机号）
- ✅ 添加乘客
- ✅ 编辑乘客信息
- ✅ 删除乘客（带确认提示）
- ✅ 表单验证
- ✅ 响应式设计

## 端口配置

- **前端开发服务器**: `http://localhost:5173`
- **后端 API 服务**: `http://localhost:8081`
- **API 代理**: 前端 `/api` 请求会自动代理到 `http://localhost:8081/api`

## 快速开始

### 前置要求

- Node.js >= 16.0.0
- npm >= 7.0.0

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

启动成功后，访问：**http://localhost:5173/booking/passengers**

### 构建生产版本

```bash
npm run build
```

构建产物在 `dist` 目录。

## 后端服务要求

**⚠️ 重要**：使用本前端项目前，需要确保后端服务已启动。

### 后端配置

- **后端服务地址**: `http://localhost:8081`
- **API 基础路径**: `/api`

### 必需的 API 接口

#### 1. 获取乘客列表
```
GET /api/passengers/list?userId=1001
```

响应格式：
```json
{
  "code": 0,
  "message": "",
  "data": [
    {
      "id": 0,
      "userId": 0,
      "name": "string",
      "type": 0,
      "idCardType": "身份证",
      "idCardNumber": "string",
      "phone": "string",
      "createTime": "string",
      "updateTime": "string"
    }
  ]
}
```

#### 2. 创建乘客
```
POST /api/passengers/add
Content-Type: application/json

{
  "userId": 0,
  "name": "string",
  "type": 0,
  "idCardType": "身份证",
  "idCardNumber": "string",
  "phone": "string"
}
```

#### 3. 更新乘客
```
POST /api/passengers/update
Content-Type: application/json

{
  "id": 0,
  "userId": 0,
  "name": "string",
  "type": 0,
  "idCardType": "身份证",
  "idCardNumber": "string",
  "phone": "string"
}
```

#### 4. 删除乘客
```
POST /api/passengers/remove?id=1
```

## 数据模型

### 乘客数据字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | integer | 主键ID（新增时为空，修改时必填）|
| userId | integer | 用户ID（必填）|
| name | string | 姓名（必填）|
| type | integer | 乘客类型：1=成人，2=学生（必填）|
| idCardType | string | 证件类型（如"身份证"）|
| idCardNumber | string | 证件号码（必填）|
| phone | string | 手机号|
| createTime | string | 创建时间|
| updateTime | string | 更新时间|

### 响应格式

所有 API 响应统一格式：
```json
{
  "code": 0,        // 0 表示成功
  "message": "",    // 提示信息
  "data": {}        // 业务数据
}
```

## 项目结构

```
frontend/
├── src/
│   ├── views/
│   │   ├── booking/
│   │   │   ├── PassengerList.vue    # 乘客列表页面
│   │   │   └── PassengerForm.vue    # 乘客表单组件
│   │   ├── NotFound.vue             # 404页面
│   │   └── Test.vue                 # 测试页面
│   ├── services/
│   │   └── passengerService.js     # 乘客API服务
│   ├── router/
│   │   └── index.js                 # 路由配置
│   ├── App.vue                      # 根组件
│   └── main.js                      # 入口文件
├── index.html                        # HTML模板
├── vite.config.js                   # Vite配置
├── package.json                      # 项目配置
└── README.md                         # 项目说明
```

## 使用说明

### 访问页面

启动项目后，访问：**http://localhost:5173/booking/passengers**

### 功能操作

1. **查看乘客列表**
   - 页面自动加载乘客数据
   - 支持按ID、创建时间排序

2. **搜索乘客**
   - 在搜索框输入姓名、证件号码或手机号
   - 实时过滤显示结果

3. **添加乘客**
   - 点击"添加乘客"按钮
   - 填写表单信息（用户ID、姓名、证件类型、证件号码、手机号、乘客类型）
   - 点击"创建"保存

4. **编辑乘客**
   - 在列表中点击"编辑"按钮
   - 修改信息后点击"更新"保存

5. **删除乘客**
   - 在列表中点击"删除"按钮
   - 确认删除操作

## 表单验证规则

- **用户ID**: 必填，数字类型
- **姓名**: 必填，2-50个字符
- **证件号码**: 必填
- **手机号**: 可选，11位有效手机号格式（1开头）
- **乘客类型**: 必填，1=成人，2=学生

## 开发命令

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview

# 代码检查
npm run lint
```

## 常见问题

### 1. API 请求失败

**检查**：
- 后端服务是否在 `http://localhost:8081` 运行
- 后端接口路径是否正确
- 网络连接是否正常

**解决方案**：
- 确认后端服务已启动
- 检查 `vite.config.js` 中的 proxy 配置
- 查看浏览器控制台的 Network 标签

### 2. 页面显示空白

**检查**：
- 浏览器控制台（F12）是否有错误
- 所有依赖是否已安装

**解决方案**：
- 查看浏览器控制台的错误信息
- 运行 `npm install` 重新安装依赖
- 确认 SCSS 预处理器已安装：`npm install -D sass-embedded`

### 3. 端口冲突

**问题**：前端端口 5173 或后端端口 8081 被占用

**解决方案**：
- 修改 `vite.config.js` 中的 `server.port` 更改前端端口
- 修改 `vite.config.js` 中的 `server.proxy['/api'].target` 更改后端地址

### 4. 后端服务未启动

**现象**：页面显示黄色警告提示"后端服务未启动"

**解决方案**：
- 启动后端服务，确保运行在 `http://localhost:8081`
- 页面功能会受限，但可以正常浏览界面

## 浏览器支持

- Chrome (推荐)
- Firefox
- Safari
- Edge

## 开发规范

- 使用 Vue 3 Composition API
- 组件使用 `<script setup>` 语法
- 样式使用 SCSS，scoped 作用域
- 遵循 Element Plus 设计规范

## 许可证

MIT

