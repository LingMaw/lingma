/**
 * HTTP 拦截器
 * 处理请求和响应的拦截逻辑
 */
import { AxiosError, InternalAxiosRequestConfig } from 'axios'
import type { APIErrorResponse } from './types'

/**
 * 请求拦截器：添加认证 token
 */
export function requestInterceptor(config: InternalAxiosRequestConfig) {
  const token = localStorage.getItem('token')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}

/**
 * 请求错误拦截器
 */
export function requestErrorInterceptor(error: Error) {
  console.error('Request error:', error.message)
  return Promise.reject(error)
}

/**
 * 响应拦截器：统一处理错误
 * 注：不使用enqueueSnackbar，改由各个页面组件自行处理错误提示
 */
export async function responseErrorInterceptor(error: AxiosError<APIErrorResponse>) {
  // 处理后端返回的标准错误格式
  const errorData = error.response?.data

  if (errorData && errorData.success === false) {
    const { code, message } = errorData

    // 认证失败（401）
    if (code === 'AUTH_FAILED' || error.response?.status === 401) {
      if (!error.config?.url?.includes('/login')) {
        localStorage.removeItem('token')
        // 使用setTimeout避免在响应拦截器中同步修改location
        setTimeout(() => {
          window.location.href = '/#/login'
        }, 100)
      }
      return Promise.reject(new Error(message || '认证失败'))
    }

    // 权限不足（403）
    if (code === 'PERMISSION_DENIED' || error.response?.status === 403) {
      return Promise.reject(new Error(message || '权限不足'))
    }

    // 资源未找到（404）
    if (code === 'RESOURCE_NOT_FOUND' || error.response?.status === 404) {
      return Promise.reject(new Error(message || '资源未找到'))
    }

    // 数据验证失败（422）
    if (code === 'VALIDATION_ERROR' || error.response?.status === 422) {
      return Promise.reject(new Error(message || '数据验证失败'))
    }

    // 服务器内部错误（500）
    if (error.response?.status === 500) {
      return Promise.reject(new Error(message || '服务器内部错误'))
    }

    // 其他业务错误
    return Promise.reject(new Error(message || '请求失败'))
  }

  // 网络错误
  if (error.message === 'Network Error') {
    return Promise.reject(new Error('网络连接失败'))
  }

  // 请求超时
  if (error.code === 'ECONNABORTED') {
    return Promise.reject(new Error('请求超时'))
  }

  // 未知错误
  return Promise.reject(error)
}
