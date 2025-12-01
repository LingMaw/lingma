/**
 * 用户功能 API
 */
import axios from 'axios'
import { httpClient } from '@/frontend/core/http'
import type { User, LoginRequest, LoginResponse, RegisterRequest } from '@/frontend/core/types'
import type { AiSettingsData } from './pages/components/types'

/**
 * 用户认证 API
 */
export const userAPI = {
  /**
   * 用户登录
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await httpClient.post<LoginResponse>('/auth/login', data)
    return response.data
  },

  /**
   * 用户注册
   */
  async register(data: RegisterRequest): Promise<LoginResponse> {
    const response = await httpClient.post<LoginResponse>('/auth/register', data)
    return response.data
  },

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(): Promise<User> {
    const response = await httpClient.get<User>('/auth/me')
    return response.data
  },

  /**
   * 用户登出
   */
  async logout(): Promise<void> {
    await httpClient.post('/auth/logout')
  },

  /**
   * 刷新令牌
   */
  async refreshToken(): Promise<LoginResponse> {
    const response = await httpClient.post<LoginResponse>('/auth/refresh')
    return response.data
  },

  /**
   * 获取用户设置
   */
  async getUserSettings(): Promise<AiSettingsData> {
    const response = await httpClient.get<Record<string, string>>('/auth/settings')
    const data = response.data

    // 确保返回的数据包含所有必需的字段
    return {
      api_key: data.api_key || '',
      api_base: data.api_base || '',
      api_model: data.api_model || 'gpt-3.5-turbo',
      api_max_tokens: data.api_max_tokens || '16000',
      auto_save: data.auto_save || 'true'
    }
  },

  /**
   * 获取特定用户设置
   */
  async getUserSetting(key: string): Promise<string> {
    const response = await httpClient.get<string>(`/auth/settings/${key}`)
    return response.data
  },

  /**
   * 更新或创建用户设置
   */
  async updateUserSetting(key: string, value: string): Promise<void> {
    await httpClient.post(`/auth/settings/${key}`, { value })
  },

  /**
   * 重置用户设置为默认值
   */
  async resetUserSettings(): Promise<Record<string, string>> {
    const response = await httpClient.post<Record<string, string>>('/auth/settings/reset')
    return response.data
  },

  /**
   * 更新用户资料
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await httpClient.put<User>('/auth/profile', data)
    return response.data
  },

  /**
   * 更新用户密码
   */
  async updatePassword(oldPassword: string, newPassword: string): Promise<void> {
    await httpClient.put('/auth/password', { 
      old_password: oldPassword, 
      new_password: newPassword 
    })
  },

  /**
   * 获取AI模型列表
   */
  async getAvailableModels(apiBase: string, apiKey: string): Promise<string[]> {
    try {
      // 创建一个临时的HTTP客户端用于获取模型列表
      const client = axios.create({
        baseURL: apiBase || 'https://api.openai.com/v1',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      const response = await client.get('/models')
      const data = response.data
      
      // 提取模型名称列表
      if (data && data.data && Array.isArray(data.data)) {
        return data.data.map((model: any) => model.id).sort()
      }
      
      return []
    } catch (error) {
      console.error('获取模型列表失败:', error)
      return []
    }
  }
}
