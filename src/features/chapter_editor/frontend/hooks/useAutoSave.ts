/**
 * 自动保存 Hook
 */
import { useEffect, useState, useRef } from 'react'
import { chapterEditorAPI } from '../api'
import type { SaveStatus } from '../types'

export const useAutoSave = (
  chapterId: string | undefined,
  title: string,
  content: string,
  enabled: boolean = true
) => {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (!enabled || !chapterId) return

    // 实时保存到 localStorage
    localStorage.setItem(`chapter_draft_${chapterId}`, JSON.stringify({ title, content }))

    // 清除之前的定时器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // 2秒防抖保存到服务器
    timeoutRef.current = setTimeout(async () => {
      setSaveStatus('saving')
      try {
        await chapterEditorAPI.updateChapter(chapterId, { title, content })
        setSaveStatus('saved')
        // 保存成功后清除 localStorage
        localStorage.removeItem(`chapter_draft_${chapterId}`)
      } catch (error) {
        console.error('自动保存失败:', error)
        setSaveStatus('error')
      }
    }, 2000)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [chapterId, title, content, enabled])

  // 检查草稿恢复
  const checkDraft = (chapterId: string): { title: string; content: string } | null => {
    const draft = localStorage.getItem(`chapter_draft_${chapterId}`)
    if (draft) {
      try {
        return JSON.parse(draft)
      } catch {
        return null
      }
    }
    return null
  }

  // 清除草稿
  const clearDraft = (chapterId: string) => {
    localStorage.removeItem(`chapter_draft_${chapterId}`)
  }

  return { saveStatus, checkDraft, clearDraft }
}
