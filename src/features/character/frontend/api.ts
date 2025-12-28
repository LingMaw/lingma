/**
 * 人物设定系统API封装
 * 提供角色模板、角色、关系的CRUD操作
 */

import { httpClient } from '@/frontend/core/http'
import type {
  CharacterTemplate,
  Character,
  CharacterRelation,
  CreateCharacterTemplateRequest,
  UpdateCharacterTemplateRequest,
  CreateCharacterRequest,
  UpdateCharacterRequest,
  CreateCharacterRelationRequest,
  UpdateCharacterRelationRequest,
  RelationGraphData,
} from './types'

/**
 * 角色模板API
 */
export const characterTemplateAPI = {
  /**
   * 获取所有模板
   */
  async list(category?: string) {
    const { data } = await httpClient.get<CharacterTemplate[]>('/characters/templates', {
      params: { category },
    })
    return data
  },

  /**
   * 创建模板
   */
  async create(payload: CreateCharacterTemplateRequest) {
    const { data } = await httpClient.post<CharacterTemplate>('/characters/templates', payload)
    return data
  },

  /**
   * 获取模板详情
   */
  async get(id: number) {
    const { data } = await httpClient.get<CharacterTemplate>(`/characters/templates/${id}`)
    return data
  },

  /**
   * 更新模板
   */
  async update(id: number, payload: UpdateCharacterTemplateRequest) {
    const { data } = await httpClient.put<CharacterTemplate>(`/characters/templates/${id}`, payload)
    return data
  },

  /**
   * 删除模板
   */
  async delete(id: number) {
    const { data } = await httpClient.delete<{ success: boolean; message: string }>(`/characters/templates/${id}`)
    return data
  },
}

/**
 * 角色API
 */
export const characterAPI = {
  /**
   * 获取角色列表
   * @param projectId 项目ID(不传则获取全局角色)
   * @param includeAll 是否获取所有角色
   */
  async list(projectId?: number, includeAll?: boolean) {
    const { data } = await httpClient.get<Character[]>('/characters', {
      params: { project_id: projectId, include_all: includeAll },
    })
    return data
  },

  /**
   * 获取所有角色及关系网络数据
   */
  async getAllWithRelations() {
    const { data } = await httpClient.get<RelationGraphData>('/characters/all/with-relations')
    return data
  },

  /**
   * 创建角色(支持从模板创建)
   */
  async create(payload: CreateCharacterRequest) {
    const { data } = await httpClient.post<Character>('/characters', payload)
    return data
  },

  /**
   * 获取角色详情
   */
  async get(id: number) {
    const { data } = await httpClient.get<Character>(`/characters/${id}`)
    return data
  },

  /**
   * 更新角色
   */
  async update(id: number, payload: UpdateCharacterRequest) {
    const { data } = await httpClient.put<Character>(`/characters/${id}`, payload)
    return data
  },

  /**
   * 删除角色
   */
  async delete(id: number) {
    const { data} = await httpClient.delete<{ success: boolean; message: string }>(`/characters/${id}`)
    return data
  },
}

/**
 * 角色关系API
 */
export const characterRelationAPI = {
  /**
   * 获取角色的所有关系
   */
  async list(characterId: number) {
    const { data } = await httpClient.get<CharacterRelation[]>(`/characters/${characterId}/relations`)
    return data
  },

  /**
   * 创建关系
   */
  async create(characterId: number, payload: CreateCharacterRelationRequest) {
    const { data } = await httpClient.post<CharacterRelation>(`/characters/${characterId}/relations`, payload)
    return data
  },

  /**
   * 更新关系
   */
  async update(relationId: number, payload: UpdateCharacterRelationRequest) {
    const { data } = await httpClient.put<CharacterRelation>(`/characters/relations/${relationId}`, payload)
    return data
  },

  /**
   * 删除关系
   */
  async delete(relationId: number) {
    const { data } = await httpClient.delete<{ success: boolean; message: string }>(`/characters/relations/${relationId}`)
    return data
  },

  /**
   * 获取关系图数据
   */
  async getGraph(characterId: number, depth: number = 2) {
    const { data } = await httpClient.get<RelationGraphData>(`/characters/${characterId}/relation-graph`, {
      params: { depth },
    })
    return data
  },
}
