import { httpClient } from '@/frontend/core/http'
import type { AxiosResponse } from 'axios'
import type { NovelGenerateRequest, NovelGenerateResponse, NovelStreamGenerateRequest } from './types'

/**
 * AI小说生成器API
 */
export const novelGeneratorAPI = {
  /**
   * 生成小说内容
   * @param data 小说生成请求数据
   */
  async generateNovel(data: NovelGenerateRequest): Promise<NovelGenerateResponse> {
    const response: AxiosResponse<NovelGenerateResponse> = await httpClient.post(
      '/novel/generate',
      data
    )
    return response.data
  },

  /**
   * 流式生成小说内容
   * @param data 小说生成请求数据
   * @returns 流式响应
   */
  async generateNovelStream(data: NovelStreamGenerateRequest) {
    // 使用原生fetch实现流式请求
    const token = localStorage.getItem('token')
    const response = await fetch('/api/novel/generate-stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    })

    if (!response.body) {
      throw new Error('流式响应体为空')
    }

    return response.body
  },

}