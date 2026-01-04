/**
 * 键盘快捷键管理 Hook
 * 支持跨平台快捷键检测（Ctrl/Cmd）
 */
import { useEffect, useCallback } from 'react'

export interface KeyboardShortcut {
  key: string
  ctrlOrCmd?: boolean
  shift?: boolean
  alt?: boolean
  handler: (event: KeyboardEvent) => void
  description?: string
  preventDefault?: boolean
}

export interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[]
  enabled?: boolean
}

/**
 * 判断是否为 Mac 系统
 */
const isMac = () => {
  return typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0
}

/**
 * 检查修饰键是否匹配
 */
const checkModifiers = (
  event: KeyboardEvent,
  shortcut: KeyboardShortcut
): boolean => {
  const cmdKey = isMac() ? event.metaKey : event.ctrlKey
  
  if (shortcut.ctrlOrCmd !== undefined && shortcut.ctrlOrCmd !== cmdKey) {
    return false
  }
  
  if (shortcut.shift !== undefined && shortcut.shift !== event.shiftKey) {
    return false
  }
  
  if (shortcut.alt !== undefined && shortcut.alt !== event.altKey) {
    return false
  }
  
  return true
}

/**
 * 键盘快捷键管理 Hook
 */
export const useKeyboardShortcuts = ({
  shortcuts,
  enabled = true,
}: UseKeyboardShortcutsOptions) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return

      // 检查是否在输入框中（允许 textarea 中使用部分快捷键）
      const target = event.target as HTMLElement
      const isInput = 
        target.tagName === 'INPUT' || 
        target.tagName === 'SELECT' ||
        target.isContentEditable

      for (const shortcut of shortcuts) {
        // 匹配按键和修饰键
        if (
          event.key.toLowerCase() === shortcut.key.toLowerCase() &&
          checkModifiers(event, shortcut)
        ) {
          // 某些快捷键在输入框中也应该生效（如保存）
          const allowInInput = shortcut.ctrlOrCmd || shortcut.alt
          
          if (isInput && !allowInInput) {
            continue
          }

          if (shortcut.preventDefault !== false) {
            event.preventDefault()
            event.stopPropagation()
          }

          shortcut.handler(event)
          break
        }
      }
    },
    [shortcuts, enabled]
  )

  useEffect(() => {
    if (!enabled) return

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown, enabled])

  /**
   * 获取快捷键的显示文本
   */
  const getShortcutText = useCallback((shortcut: KeyboardShortcut): string => {
    const parts: string[] = []
    
    if (shortcut.ctrlOrCmd) {
      parts.push(isMac() ? 'Cmd' : 'Ctrl')
    }
    
    if (shortcut.shift) {
      parts.push('Shift')
    }
    
    if (shortcut.alt) {
      parts.push(isMac() ? 'Option' : 'Alt')
    }
    
    parts.push(shortcut.key.toUpperCase())
    
    return parts.join(' + ')
  }, [])

  return {
    getShortcutText,
    isMac: isMac(),
  }
}

export default useKeyboardShortcuts
