/**
 * 焦点管理 Hook
 * 用于对话框、模态窗口等场景的焦点控制
 */
import { useEffect, useRef, useCallback } from 'react'

export interface UseFocusManagementOptions {
  /**
   * 是否开启焦点管理
   */
  enabled?: boolean
  /**
   * 打开时是否自动聚焦第一个可聚焦元素
   */
  autoFocusOnOpen?: boolean
  /**
   * 关闭时是否将焦点返回到触发元素
   */
  returnFocusOnClose?: boolean
  /**
   * 自定义要聚焦的元素选择器
   */
  focusSelector?: string
}

/**
 * 获取容器内所有可聚焦的元素
 */
const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ')

  return Array.from(container.querySelectorAll(selector))
}

/**
 * 焦点管理 Hook
 */
export const useFocusManagement = (
  isOpen: boolean,
  options: UseFocusManagementOptions = {}
) => {
  const {
    enabled = true,
    autoFocusOnOpen = true,
    returnFocusOnClose = true,
    focusSelector,
  } = options

  const containerRef = useRef<HTMLElement | null>(null)
  const triggerElementRef = useRef<HTMLElement | null>(null)

  /**
   * 设置容器元素
   */
  const setContainerRef = useCallback((element: HTMLElement | null) => {
    containerRef.current = element
  }, [])

  /**
   * 保存触发元素
   */
  const saveTriggerElement = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      triggerElementRef.current = document.activeElement
    }
  }, [])

  /**
   * 聚焦到容器内的第一个可聚焦元素
   */
  const focusFirstElement = useCallback(() => {
    if (!containerRef.current) return

    let elementToFocus: HTMLElement | null = null

    // 优先使用自定义选择器
    if (focusSelector) {
      elementToFocus = containerRef.current.querySelector(focusSelector)
    }

    // 否则查找第一个可聚焦元素
    if (!elementToFocus) {
      const focusableElements = getFocusableElements(containerRef.current)
      elementToFocus = focusableElements[0] || null
    }

    if (elementToFocus) {
      // 延迟聚焦，确保元素已渲染
      setTimeout(() => {
        elementToFocus?.focus()
      }, 100)
    }
  }, [focusSelector])

  /**
   * 将焦点返回到触发元素
   */
  const returnFocusToTrigger = useCallback(() => {
    if (triggerElementRef.current && document.body.contains(triggerElementRef.current)) {
      triggerElementRef.current.focus()
    }
    triggerElementRef.current = null
  }, [])

  /**
   * 焦点陷阱：将焦点限制在容器内
   */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled || !containerRef.current || event.key !== 'Tab') return

      const focusableElements = getFocusableElements(containerRef.current)
      if (focusableElements.length === 0) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      // Shift + Tab
      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus()
        }
      }
      // Tab
      else {
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement.focus()
        }
      }
    },
    [enabled]
  )

  // 打开时的焦点处理
  useEffect(() => {
    if (!enabled || !isOpen) return

    // 保存触发元素
    if (returnFocusOnClose) {
      saveTriggerElement()
    }

    // 自动聚焦第一个元素
    if (autoFocusOnOpen) {
      focusFirstElement()
    }

    // 添加焦点陷阱
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [
    enabled,
    isOpen,
    autoFocusOnOpen,
    returnFocusOnClose,
    saveTriggerElement,
    focusFirstElement,
    handleKeyDown,
  ])

  // 关闭时返回焦点
  useEffect(() => {
    if (!enabled || isOpen) return

    return () => {
      if (returnFocusOnClose) {
        returnFocusToTrigger()
      }
    }
  }, [enabled, isOpen, returnFocusOnClose, returnFocusToTrigger])

  return {
    setContainerRef,
    focusFirstElement,
    saveTriggerElement,
    returnFocusToTrigger,
  }
}

export default useFocusManagement
