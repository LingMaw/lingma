/**
 * 全局通知提供者组件
 * 负责渲染所有 Snackbar 和 Tooltip 通知
 */
import { Snackbar, Alert, Portal, Box, alpha, useTheme } from '@mui/material'
import { AnimatePresence, motion } from 'framer-motion'
import { useNotificationStore } from '@/frontend/shared/stores/notification'

export default function GlobalNotificationProvider() {
  const theme = useTheme()
  const { notifications, tooltipMessage, removeNotification } = useNotificationStore()

  const getAnchorOrigin = (severity: string) => {
    // 成功提示在右下角，错误提示在顶部
    if (severity === 'success' || severity === 'info') {
      return { vertical: 'bottom' as const, horizontal: 'right' as const }
    }
    return { vertical: 'top' as const, horizontal: 'center' as const }
  }

  return (
    <Portal>
      {/* Snackbar 通知列表 */}
      {notifications.map((notification, index) => (
        <Snackbar
          key={notification.id}
          open={true}
          autoHideDuration={notification.autoHideDuration}
          onClose={() => removeNotification(notification.id)}
          anchorOrigin={getAnchorOrigin(notification.severity)}
          sx={{
            // 多个通知时堆叠显示
            mb: index * 7,
          }}
        >
          <Alert
            onClose={() => removeNotification(notification.id)}
            severity={notification.severity}
            variant="filled"
            sx={{
              width: '100%',
              minWidth: 300,
              borderRadius: 3,
              boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.15)}`,
              backdropFilter: 'blur(10px)',
              fontWeight: 600,
            }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      ))}

      {/* 轻量级 Tooltip 提示 */}
      <AnimatePresence>
        {tooltipMessage && (
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            sx={{
              position: 'fixed',
              bottom: 80,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 9999,
              px: 3,
              py: 1.5,
              borderRadius: 3,
              backgroundColor: alpha(theme.palette.common.black, 0.85),
              color: theme.palette.common.white,
              fontSize: '0.875rem',
              fontWeight: 600,
              boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.3)}`,
              backdropFilter: 'blur(10px)',
              pointerEvents: 'none',
            }}
          >
            {tooltipMessage}
          </Box>
        )}
      </AnimatePresence>
    </Portal>
  )
}
