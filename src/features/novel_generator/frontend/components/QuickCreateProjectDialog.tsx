import React, { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  IconButton,
  CircularProgress,
  useTheme,
  alpha,
  Alert,
} from '@mui/material'
import { motion } from 'framer-motion'
import CloseIcon from '@mui/icons-material/Close'
import FolderIcon from '@mui/icons-material/Folder'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'

interface QuickCreateProjectDialogProps {
  open: boolean
  onClose: () => void
  defaultTitle?: string
  defaultDescription?: string
  genre?: string
  style?: string
  content: string
  onSuccess?: (projectId: number) => void
}

const QuickCreateProjectDialog: React.FC<QuickCreateProjectDialogProps> = ({
  open,
  onClose,
  defaultTitle = '',
  defaultDescription = '',
  genre = '',
  style = '',
  content,
  onSuccess,
}) => {
  const theme = useTheme()
  const [title, setTitle] = useState(defaultTitle)
  const [description, setDescription] = useState(defaultDescription)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // 当对话框打开时重置状态
  useEffect(() => {
    if (open) {
      setTitle(defaultTitle)
      setDescription(defaultDescription)
      setError(null)
      setSuccess(false)
    }
  }, [open, defaultTitle, defaultDescription])

  const handleCreate = async () => {
    // 验证标题
    if (!title.trim()) {
      setError('请输入项目标题')
      return
    }

    // 验证内容
    if (!content.trim()) {
      setError('没有可保存的内容，请先生成小说')
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      const { novelProjectAPI } = await import('@/features/novel_project/frontend')
      
      // 创建项目
      const project = await novelProjectAPI.createProject({
        title: title.trim(),
        description: description.trim() || undefined,
        genre: genre || undefined,
        style: style || undefined,
        content: content,
        word_count: content.length,
        status: 'completed',
        use_chapter_system: false,
      })

      setSuccess(true)
      
      // 延迟一下让用户看到成功提示
      setTimeout(() => {
        onSuccess?.(project.id)
        onClose()
      }, 1500)
    } catch (err: any) {
      console.error('创建项目失败:', err)
      // 优先显示错误消息，支持验证错误详情
      let errorMessage = '创建项目失败，请重试'
      if (err.response?.data?.detail) {
        // FastAPI 验证错误详情
        if (Array.isArray(err.response.data.detail)) {
          const validationErrors = err.response.data.detail
          const firstError = validationErrors[0]
          if (firstError?.msg) {
            const location = firstError.loc?.join('.')  || ''
            errorMessage = `${location}: ${firstError.msg}`
          }
        } else {
          errorMessage = err.response.data.detail
        }
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err.message) {
        errorMessage = err.message
      }
      setError(errorMessage)
    } finally {
      setIsCreating(false)
    }
  }

  const handleClose = () => {
    if (!isCreating && !success) {
      onClose()
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
          backdropFilter: 'blur(24px)',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {success ? (
            <CheckCircleIcon sx={{ color: 'success.main', fontSize: 28 }} />
          ) : (
            <FolderIcon sx={{ color: 'primary.main', fontSize: 28 }} />
          )}
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {success ? '创建成功' : '快捷创建项目'}
          </Typography>
        </Box>
        {!success && (
          <IconButton onClick={handleClose} size="small" disabled={isCreating}>
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>

      <DialogContent>
        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                py: 4,
              }}
            >
              <CheckCircleIcon
                sx={{
                  fontSize: 80,
                  color: 'success.main',
                  mb: 2,
                }}
              />
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                项目创建成功！
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                您的短篇小说已保存到新项目中
                <br />
                可在项目管理页面查看和编辑
              </Typography>
            </Box>
          </motion.div>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              将当前生成的短篇小说保存为新项目，方便后续管理和编辑
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="项目标题"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="请输入项目标题"
                fullWidth
                required
                disabled={isCreating}
                autoFocus
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: alpha(theme.palette.background.paper, 0.6),
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.background.paper, 0.9),
                    },
                  },
                }}
              />

              <TextField
                label="项目描述"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="简要描述项目内容（可选）"
                fullWidth
                multiline
                rows={3}
                disabled={isCreating}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: alpha(theme.palette.background.paper, 0.6),
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.background.paper, 0.9),
                    },
                  },
                }}
              />

              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.info.main, 0.1),
                  border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
                }}
              >
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                  📊 项目信息
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  类型：{genre || '未设置'} · 风格：{style || '未设置'}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  字数：{content.length} 字
                </Typography>
              </Box>
            </Box>
          </>
        )}
      </DialogContent>

      {!success && (
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleClose} disabled={isCreating}>
            取消
          </Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={isCreating}
            startIcon={isCreating ? <CircularProgress size={20} /> : <FolderIcon />}
            sx={{
              borderRadius: 2,
              fontWeight: 700,
              px: 3,
            }}
          >
            {isCreating ? '创建中...' : '创建项目'}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  )
}

export default QuickCreateProjectDialog
