/**
 * 大纲树数据管理Hook
 */
import { useState, useCallback } from 'react'
import { outlineAPI, OutlineTreeResponse } from '../api'

export const useOutlineTree = (projectId: number) => {
  const [treeData, setTreeData] = useState<OutlineTreeResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadTree = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await outlineAPI.getTree(projectId)
      setTreeData(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '加载大纲失败')
      console.error('Failed to load outline tree:', err)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  const refreshTree = useCallback(() => {
    loadTree()
  }, [loadTree])

  /**
   * 乐观更新:立即更新本地状态,后台同步
   * 返回回滚函数,用于失败时恢复
   */
  const optimisticUpdate = useCallback(
    (updateFn: (tree: OutlineTreeResponse) => OutlineTreeResponse) => {
      if (!treeData) return () => {}

      const oldData = treeData
      setTreeData(updateFn(treeData))

      // 返回回滚函数
      return () => setTreeData(oldData)
    },
    [treeData]
  )

  return {
    treeData,
    loading,
    error,
    loadTree,
    refreshTree,
    optimisticUpdate,
  }
}
