/**
 * 全局通知系统 Store
 * 用于管理 Snackbar 和 Tooltip 通知
 */
import { create } from 'zustand'

export type NotificationSeverity = 'success' | 'error' | 'warning' | 'info'

export interface Notification {
  id: string
  message: string
  severity: NotificationSeverity
  autoHideDuration?: number
}

interface NotificationState {
  notifications: Notification[]
  tooltipMessage: string | null
  showNotification: (
    message: string,
    severity: NotificationSeverity,
    autoHideDuration?: number
  ) => void
  removeNotification: (id: string) => void
  showTooltip: (message: string, duration?: number) => void
  hideTooltip: () => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  tooltipMessage: null,

  showNotification: (message, severity, autoHideDuration) => {
    const id = `notification-${Date.now()}-${Math.random()}`
    
    // 根据严重程度设置默认显示时长
    let duration = autoHideDuration
    if (!duration) {
      switch (severity) {
        case 'success':
        case 'info':
          duration = 3000
          break
        case 'warning':
          duration = 4000
          break
        case 'error':
          duration = 5000
          break
      }
    }

    set((state) => ({
      notifications: [
        ...state.notifications,
        { id, message, severity, autoHideDuration: duration },
      ],
    }))
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }))
  },

  showTooltip: (message, duration = 1500) => {
    set({ tooltipMessage: message })
    setTimeout(() => {
      set({ tooltipMessage: null })
    }, duration)
  },

  hideTooltip: () => {
    set({ tooltipMessage: null })
  },
}))
