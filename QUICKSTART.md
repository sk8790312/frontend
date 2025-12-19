# 快速启动指南

## 前置要求

- Node.js >= 16.0.0
- npm >= 7.0.0 或 yarn >= 1.22.0 或 pnpm >= 7.0.0
- **后端服务已启动**（运行在 `http://localhost:8081`）

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量（可选）

如果需要修改API地址，创建 `.env` 文件：

```env
VITE_API_BASE_URL=http://localhost:8081/api
```

**注意**：默认配置已指向 `http://localhost:8081/api`，通常不需要修改。

### 3. 启动前端开发服务器

```bash
npm run dev
```

### 4. 访问应用

打开浏览器访问：**http://localhost:5173/booking/passengers**

## 端口配置

- **前端开发服务器**: `http://localhost:5173`
- **后端API服务**: `http://localhost:8081`
- **API代理**: 前端 `/api` 请求会自动代理到后端

## 后端API要求

确保后端服务已启动，并且提供以下接口：

- `GET /api/booking/passengers` - 获取乘客列表（支持分页）
- `GET /api/booking/passengers/{id}` - 获取单个乘客
- `POST /api/booking/passengers` - 创建乘客
- `PUT /api/booking/passengers/{id}` - 更新乘客
- `DELETE /api/booking/passengers/{id}` - 删除乘客

## 认证说明

目前路由守卫中的认证检查已暂时禁用，页面可以直接访问。

如果后端需要认证：
- Token存储在localStorage中，key为`token`
- API请求会自动添加 `Authorization: Bearer {token}` 头

## 常见问题

**Q: 页面显示空白？**
- A: 检查浏览器控制台（F12）错误，确认：
  - 所有依赖已安装（`npm install`）
  - SCSS预处理器已安装（`npm install -D sass-embedded`）
  - 没有JavaScript运行时错误

**Q: API请求失败？**
- A: 检查：
  - 后端服务是否在 `http://localhost:8081` 运行
  - `vite.config.js` 中的 proxy 配置是否正确
  - 浏览器控制台的Network标签查看具体请求

**Q: 样式显示异常？**
- A: 确认已安装所有依赖，运行 `npm install` 重新安装。

**Q: 端口被占用？**
- A: 修改 `vite.config.js` 中的 `server.port` 为其他端口。

**Q: 后端服务未启动？**
- A: 页面会显示黄色警告提示，但可以正常浏览界面。启动后端服务后刷新页面即可。

## 快速检查

```bash
# 检查Node.js版本
node -v

# 检查npm版本
npm -v

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问：http://localhost:5173/booking/passengers
