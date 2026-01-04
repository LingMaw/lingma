/**
 * 自动保存状态管理 Hook
 * 实现完整的自动保存状态机：IDLE -> DIRTY -> SAVING -> SAVED/ERROR
 */

import { useEffect, useRef, useState, useCallback } from 'react'

export type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error'

export interface SaveMetadata {
  lastSavedAt?: Date
  errorMessage?: string
}

export interface UseAutoSaveOptions<T> {
  /** 数据对象 */
  data: T
  /** 保存函数 */
  onSave: (data: T) => Promise<void>
  /** 防抖延迟（毫秒），默认 300ms */
  debounceMs?: number
  /** 是否启用自动保存，默认 true */
  enabled?: boolean
  /** 数据比较函数，用于判断是否有变更 */
  isEqual?: (a: T, b: T) => boolean
}

export interface UseAutoSaveReturn {
  /** 当前保存状态 */
  status: SaveStatus
  /** 元数据（最后保存时间、错误信息等） */
  metadata: SaveMetadata
  /** 手动触发保存 */
  save: () => Promise<void>
  /** 重置状态为 idle */
  reset: () => void
}

export function useAutoSave<T>({
  data,
  onSave,
  debounceMs = 300,
  enabled = true,
  isEqual,
}: UseAutoSaveOptions<T>): UseAutoSaveReturn {
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [metadata, setMetadata] = useState<SaveMetadata>({})
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const previousDataRef = useRef<T>(data)
  const isSavingRef = useRef(false)

  // 手动保存函数
  const save = useCallback(async () => {
    if (isSavingRef.current) return
    
    try {
      isSavingRef.current = true
      setStatus('saving')
      setMetadata((prev) => ({ ...prev, errorMessage: undefined }))
      
      await onSave(data)
      
      setStatus('saved')
      setMetadata({ lastSavedAt: new Date() })
      previousDataRef.current = data
      
      // 2秒后自动回到 idle 状态
      setTimeout(() => {
        setStatus((current) => (current === 'saved' ? 'idle' : current))
      }, 2000)
    } catch (error) {
      setStatus('error')
      setMetadata({
        errorMessage: error instanceof Error ? error.message : '保存失败',
      })
    } finally {
      isSavingRef.current = false
    }
  }, [data, onSave])

  // 重置状态
  const reset = useCallback(() => {
    setStatus('idle')
    setMetadata({})
    previousDataRef.current = data
  }, [data])

  // 自动保存逻辑
  useEffect(() => {
    if (!enabled) return

    // 检查数据是否变更
    const hasChanged = isEqual
      ? !isEqual(previousDataRef.current, data)
      : previousDataRef.current !== data

    if (!hasChanged) return

    // 标记为有未保存的变更
    if (status !== 'saving') {
      setStatus('dirty')
    }

    // 清除之前的定时器
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    // 设置新的自动保存定时器
    timerRef.current = setTimeout(() => {
      save()
    }, debounceMs)

    // 清理函数
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [data, enabled, debounceMs, save, status, isEqual])

  return {
    status,
    metadata,
    save,
    reset,
  }
}
