/**
 * 字数统计 Hook
 * 提供实时字数、段落数、选中字数等统计功能
 */

import { useMemo, useState, useEffect, useCallback } from 'react'

export interface TextStats {
  /** 总字数 */
  totalChars: number
  /** 段落数（按双换行分割） */
  paragraphCount: number
  /** 平均段落长度 */
  avgParagraphLength: number
  /** 选中的字数 */
  selectedChars: number
  /** 目标字数 */
  targetChars?: number
  /** 完成百分比 */
  progress?: number
}

export interface UseTextStatsOptions {
  /** 文本内容 */
  content: string
  /** 目标字数（可选） */
  targetChars?: number
  /** 输入框的 ref（用于监听选中文本） */
  textareaRef?: React.RefObject<HTMLTextAreaElement>
}

export interface UseTextStatsReturn extends TextStats {
  /** 设置目标字数 */
  setTargetChars: (target: number | undefined) => void
}

export function useTextStats({
  content,
  targetChars: initialTarget,
  textareaRef,
}: UseTextStatsOptions): UseTextStatsReturn {
  const [selectedChars, setSelectedChars] = useState(0)
  const [targetChars, setTargetChars] = useState<number | undefined>(initialTarget)

  // 计算基础统计
  const stats = useMemo(() => {
    const totalChars = content.length

    // 按双换行分割段落（更符合小说写作习惯）
    const paragraphs = content.split(/\n\n+/).filter((p) => p.trim().length > 0)
    const paragraphCount = paragraphs.length

    // 计算平均段落长度
    const avgParagraphLength =
      paragraphCount > 0
        ? Math.round(totalChars / paragraphCount)
        : 0

    // 计算进度
    const progress =
      targetChars && targetChars > 0
        ? Math.min(Math.round((totalChars / targetChars) * 100), 100)
        : undefined

    return {
      totalChars,
      paragraphCount,
      avgParagraphLength,
      targetChars,
      progress,
    }
  }, [content, targetChars])

  // 监听文本选中
  const handleSelectionChange = useCallback(() => {
    if (!textareaRef?.current) return

    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd

    if (start !== end) {
      const selected = textarea.value.substring(start, end)
      setSelectedChars(selected.length)
    } else {
      setSelectedChars(0)
    }
  }, [textareaRef])

  // 监听选中事件
  useEffect(() => {
    const textarea = textareaRef?.current
    if (!textarea) return

    // 监听鼠标选中和键盘选中
    textarea.addEventListener('mouseup', handleSelectionChange)
    textarea.addEventListener('keyup', handleSelectionChange)
    textarea.addEventListener('select', handleSelectionChange)

    return () => {
      textarea.removeEventListener('mouseup', handleSelectionChange)
      textarea.removeEventListener('keyup', handleSelectionChange)
      textarea.removeEventListener('select', handleSelectionChange)
    }
  }, [textareaRef, handleSelectionChange])

  return {
    ...stats,
    selectedChars,
    setTargetChars,
  }
}
