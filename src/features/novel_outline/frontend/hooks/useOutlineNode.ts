/**
 * 大纲节点CRUD操作Hook
 */
import { useCallback } from 'react'
import {
  outlineAPI,
  OutlineNodeCreate,
  OutlineNodeUpdate,
  PositionUpdate,
} from '../api'

export const useOutlineNode = (projectId: number, onSuccess?: () => void) => {
  const createNode = useCallback(
    async (nodeData: OutlineNodeCreate) => {
      try {
        const newNode = await outlineAPI.createNode(projectId, nodeData)
        onSuccess?.()
        return newNode
      } catch (err: unknown) {
        console.error('Failed to create node:', err)
        throw err
      }
    },
    [projectId, onSuccess]
  )

  const updateNode = useCallback(
    async (nodeId: number, updateData: OutlineNodeUpdate) => {
      try {
        const updatedNode = await outlineAPI.updateNode(projectId, nodeId, updateData)
        onSuccess?.()
        return updatedNode
      } catch (err: unknown) {
        console.error('Failed to update node:', err)
        throw err
      }
    },
    [projectId, onSuccess]
  )

  const deleteNode = useCallback(
    async (nodeId: number, cascade = false) => {
      try {
        await outlineAPI.deleteNode(projectId, nodeId, cascade)
        onSuccess?.()
      } catch (err: unknown) {
        console.error('Failed to delete node:', err)
        throw err
      }
    },
    [projectId, onSuccess]
  )

  const moveNode = useCallback(
    async (nodeId: number, positionData: PositionUpdate) => {
      try {
        await outlineAPI.updatePosition(projectId, nodeId, positionData)
        onSuccess?.()
      } catch (err: unknown) {
        console.error('Failed to move node:', err)
        throw err
      }
    },
    [projectId, onSuccess]
  )

  return {
    createNode,
    updateNode,
    deleteNode,
    moveNode,
  }
}
