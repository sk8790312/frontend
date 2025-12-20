# 订单管理功能开发文档

## 概述

本文档记录了火车订票系统 Booking panel 模块中新增的订单管理功能，包括创建订单、选择乘客、订单列表等核心功能。

## 新增文件

### 1. 服务层

#### `src/services/orderService.js`
订单服务，提供订单相关的API调用方法。

**功能：**
- `createOrder(orderData)` - 创建订单
- `getOrderList(params)` - 获取订单列表
- `getOrderDetail(orderId)` - 获取订单详情（预留）

**API端点：**
- `POST /api/order` - 创建订单
- `GET /api/order/list` - 获取订单列表
- `GET /api/order/:orderId` - 获取订单详情

### 2. 页面组件

#### `src/views/booking/CreateOrder.vue`
创建订单页面，用于接收车次信息并创建订单。

**主要功能：**
- 接收URL参数（trainNumber, departureStation, arrivalStation, departureTime, arrivalTime, price, userId）
- 自动解析并填充订单信息表单
- 支持userId格式：`1001` 或 `user_1001`
- 联系人手机号输入和验证
- 跳转到乘客选择页面选择乘客
- 显示已选乘客列表（支持删除）
- 提交订单到后端

**URL参数格式：**
```
/booking/create-order?trainNumber=G101&departureStation=成都站&arrivalStation=北京站&departureTime=2025-12-20T08:30:00&arrivalTime=2025-12-20T13:30:00&price=407.09&userId=1001
```

#### `src/views/booking/PassengerSelect.vue`
乘客选择页面，支持多选乘客功能。

**主要功能：**
- 显示乘客列表（支持搜索过滤）
- 多选功能（复选框）
- 显示已选乘客数量
- 确认选择后返回选中的乘客ID数组
- 携带订单信息返回创建订单页面

#### `src/views/booking/OrderList.vue`
订单管理页面，显示订单列表。

**主要功能：**
- 显示订单列表
- 订单状态标签显示（PENDING, CONFIRMED, CANCELLED, REFUNDED）
- 支付状态标签显示（UNPAID, PAID, REFUNDED, PARTIALLY_REFUNDED）
- 查看订单详情（预留功能）
- 去支付功能（打开支付链接）

## 修改文件

### `src/router/index.js`
更新路由配置，新增以下路由：

**新增路由：**
- `/booking/create-order` - 创建订单页面
- `/booking/select-passengers` - 乘客选择页面
- `/booking/orders` - 订单列表页面
- `/booking.html` - 处理从其他模块跳转的重定向（携带查询参数）

## 功能流程

### 1. 从Schedules模块跳转
当用户从 Schedules and User panel 模块跳转时：
```
http://localhost:5173/booking.html?trainNumber=G101&departureStation=Beijing&arrivalStation=Shanghai&departureTime=2025-12-19T08:00:00&arrivalTime=2025-12-19T13:00:00&price=100.00&userId=user_1001
```

系统会自动重定向到创建订单页面，并携带所有查询参数。

### 2. 创建订单流程

1. **进入创建订单页面**
   - 自动读取URL参数并填充表单
   - 显示车次、站点、时间、票价等信息

2. **填写联系人手机号**
   - 输入11位有效手机号
   - 格式验证：`/^1[3-9]\d{9}$/`

3. **选择乘客**
   - 点击"选择乘客"按钮
   - 跳转到乘客选择页面
   - 勾选需要的乘客（支持多选）
   - 点击"确认选择"返回

4. **提交订单**
   - 验证必填项（至少一名乘客、联系人手机号）
   - 确认提交
   - 成功后自动跳转到订单列表

### 3. 查看订单

访问订单列表页面，可以：
- 查看所有订单
- 查看订单状态和支付状态
- 点击"去支付"打开支付链接
- 查看订单详情（功能预留）

## API接口说明

### 创建订单

**请求：**
```http
POST /api/order
Content-Type: application/json

{
    "userId": 1001,
    "trainNumber": "G101",
    "departureStation": "成都站",
    "arrivalStation": "北京站",
    "departureTime": "2025-12-20 08:30:00",
    "arrivalTime": "2025-12-20 13:30:00",
    "price": 407.09,
    "contactPhone": "11181046011",
    "passengerIds": [8]
}
```

**响应：**
```json
{
    "code": 200,
    "message": "",
    "data": {
        "bookingId": 0,
        "orderId": "TR12345678",
        "trainNumber": "G101",
        "status": "PENDING",
        "paymentStatus": "UNPAID",
        "totalAmount": 407.09,
        "payUrl": "http://...",
        "createdAt": "2025-12-20T08:30:00",
        "passengers": [...]
    }
}
```

### 获取订单列表

**请求：**
```http
GET /api/order/list?userId=1001
```

**响应：**
```json
{
    "code": 200,
    "message": "",
    "data": [
        {
            "bookingId": 0,
            "orderId": "TR12345678",
            "trainNumber": "G101",
            "departureStation": "成都站",
            "arrivalStation": "北京站",
            "status": "CONFIRMED",
            "paymentStatus": "PAID",
            "totalAmount": 407.09,
            "createdAt": "2025-12-20T08:30:00"
        }
    ]
}
```

## 数据格式说明

### 订单状态（status）
- `PENDING` - 待确认
- `CONFIRMED` - 已确认
- `CANCELLED` - 已取消
- `REFUNDED` - 已退款

### 支付状态（paymentStatus）
- `UNPAID` - 未支付
- `PAID` - 已支付
- `REFUNDED` - 已退款
- `PARTIALLY_REFUNDED` - 部分退款

### userId格式支持
- 数字格式：`1001`
- 字符串格式：`user_1001`（自动提取数字部分）

## 使用方式

### 1. 启动开发服务器

```bash
npm run dev
```

### 2. 访问页面

**创建订单页面：**
```
http://localhost:5173/booking/create-order?trainNumber=G101&departureStation=成都站&arrivalStation=北京站&departureTime=2025-12-20T08:30:00&arrivalTime=2025-12-20T13:30:00&price=407.09&userId=1001
```

**订单列表页面：**
```
http://localhost:5173/booking/orders
```

**乘客管理页面：**
```
http://localhost:5173/booking/passengers
```

**乘客选择页面：**
```
http://localhost:5173/booking/select-passengers
```

### 3. 从其他模块跳转

当从 Schedules 模块跳转时，使用以下URL格式：
```
http://localhost:8081/booking.html?trainNumber=G101&departureStation=Beijing&arrivalStation=Shanghai&departureTime=2025-12-19T08:00:00&arrivalTime=2025-12-19T13:00:00&price=100.00&userId=user_1001
```

系统会自动重定向到创建订单页面。

## 技术实现细节

### 1. URL参数处理

创建订单页面会自动解析URL查询参数：
- `trainNumber` - 车次号
- `departureStation` - 出发站
- `arrivalStation` - 到达站
- `departureTime` - 出发时间
- `arrivalTime` - 到达时间
- `price` - 票价
- `userId` - 用户ID（支持 `1001` 或 `user_1001` 格式）

### 2. 乘客选择流程

1. 在创建订单页面点击"选择乘客"
2. 跳转到乘客选择页面，携带当前订单信息
3. 用户选择乘客后，点击"确认选择"
4. 返回创建订单页面，携带选中的乘客ID数组
5. 创建订单页面根据ID加载乘客详细信息

### 3. 数据验证

**创建订单时的验证：**
- 至少选择一名乘客
- 联系人手机号必填
- 手机号格式验证：11位，1开头

### 4. 响应拦截器

订单服务使用与乘客服务相同的响应拦截器：
- 自动处理 `code === 200` 或 `code === 0` 的成功响应
- 自动提取 `data` 字段
- 统一错误处理

## 注意事项

1. **后端服务**
   - 确保后端服务在 `http://localhost:8081` 运行
   - 否则会显示连接错误提示

2. **用户ID**
   - 目前临时使用 `userId: 1`
   - 后续会从token中获取

3. **日期时间格式**
   - 支持 ISO 格式：`2025-12-20T08:30:00`
   - 支持普通格式：`2025-12-20 08:30:00`

4. **必填项**
   - 至少选择一名乘客
   - 必须填写联系人手机号（11位有效手机号）

5. **路由配置**
   - 所有路由都配置了 `requiresAuth: true`，但目前认证检查已注释
   - 后续可以启用认证检查

## 文件结构

```
src/
├── services/
│   ├── passengerService.js (已存在)
│   └── orderService.js ✨ 新增
└── views/
    └── booking/
        ├── PassengerForm.vue (已存在)
        ├── PassengerList.vue (已存在)
        ├── CreateOrder.vue ✨ 新增
        ├── PassengerSelect.vue ✨ 新增
        └── OrderList.vue ✨ 新增
```

## 后续优化建议

1. **订单详情页面**
   - 实现订单详情查看功能
   - 显示订单完整信息和乘客列表

2. **订单状态管理**
   - 实现订单取消功能
   - 实现订单退款功能

3. **支付集成**
   - 完善支付流程
   - 支付成功后更新订单状态

4. **用户认证**
   - 启用路由认证检查
   - 从token中获取userId

5. **错误处理**
   - 完善错误提示信息
   - 添加重试机制

## 更新日期

2025-12-20

## 开发者

Booking Panel 模块开发团队

