import { useEffect, useRef } from 'react'

export interface UseDocumentTitleOptions {
  /**
   * 页面主标题
   */
  title?: string
  /**
   * 标题前缀（如：章节名 - 项目名）
   */
  prefix?: string
  /**
   * 标题后缀，默认为 "Lingma"
   */
  suffix?: string
  /**
   * 是否在卸载时恢复原标题
   */
  restoreOnUnmount?: boolean
}

/**
 * 动态设置浏览器标签页标题的 Hook
 * 
 * @example
 * // 列表页: "小说项目 - Lingma"
 * useDocumentTitle({ title: '小说项目' })
 * 
 * @example
 * // 详情页: "《西游记》 - Lingma"
 * useDocumentTitle({ title: '《西游记》' })
 * 
 * @example
 * // 编辑页: "编辑:第一章 - 《西游记》 - Lingma"
 * useDocumentTitle({ 
 *   title: '编辑', 
 *   prefix: '第一章 - 《西游记》' 
 * })
 * 
 * @example
 * // 生成页: "AI创作中 - Lingma"
 * useDocumentTitle({ title: 'AI创作中' })
 */
export function useDocumentTitle(options: UseDocumentTitleOptions = {}) {
  const { 
    title, 
    prefix, 
    suffix = 'Lingma', 
    restoreOnUnmount = true 
  } = options

  const prevTitleRef = useRef<string>()

  useEffect(() => {
    // 保存原标题
    if (prevTitleRef.current === undefined) {
      prevTitleRef.current = document.title
    }

    // 构建新标题
    const parts: string[] = []
    
    if (title && prefix) {
      // 编辑页格式: "编辑:章节名 - 项目名 - Lingma"
      parts.push(`${title}:${prefix}`)
    } else if (title) {
      parts.push(title)
    }
    
    if (suffix) {
      parts.push(suffix)
    }

    const newTitle = parts.length > 0 ? parts.join(' - ') : suffix || 'Lingma'
    document.title = newTitle

    // 清理函数
    return () => {
      if (restoreOnUnmount && prevTitleRef.current) {
        document.title = prevTitleRef.current
      }
    }
  }, [title, prefix, suffix, restoreOnUnmount])
}
