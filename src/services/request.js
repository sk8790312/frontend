import axios from 'axios'
import { ElMessage } from 'element-plus'

// 1. 创建 axios 实例
const service = axios.create({
    baseURL: 'http://localhost:8081/api',
    timeout: 10000
})

// 2. 请求拦截器
service.interceptors.request.use(
    config => {
        // 【关键修改】移除 || '1'，严禁硬编码默认值
        // 既然对方组已经在首页登录并存入了 localStorage，这里直接取即可
        const token = localStorage.getItem('token')

        if (token) {
            config.headers['token'] = token
        }
        return config
    },
    error => {
        return Promise.reject(error)
    }
)

// 3. 响应拦截器 (保持原样，略微优化 401 提示)
service.interceptors.response.use(
    response => {
        if (response.config.responseType === 'blob') {
            return response
        }
        const res = response.data
        if (res.code === undefined) return res

        if (res.code !== 200) {
            ElMessage.error(res.msg || '系统错误')
            return res // 依然返回 res 让组件处理业务逻辑
        }
        return res
    },
    error => {
        console.error('Request Err:', error)
        let msg = error.message
        if (error.response) {
            const status = error.response.status
            if (status === 401) {
                msg = '登录已过期，请重新登录'
                // 可选：这里可以跳转回对方组的登录页
                // window.location.href = 'http://localhost:3000/login'
            } else if (status === 403) {
                msg = '无权访问 (403)'
            } else if (status === 500) {
                msg = '后端服务器报错 (500)'
            } else if (status === 404) {
                msg = '请求接口不存在 (404)'
            }
        }
        ElMessage.error(msg)
        return Promise.reject(error)
    }
)

export default service