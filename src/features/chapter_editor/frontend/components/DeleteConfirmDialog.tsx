/**
 * 删除确认对话框组件
 */
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material'
import { Warning } from '@mui/icons-material'

interface DeleteConfirmDialogProps {
  open: boolean
  title: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

export default function DeleteConfirmDialog({
  open,
  title,
  onConfirm,
  onCancel,
  loading = false,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Warning color="warning" />
        确认删除
      </DialogTitle>
      <DialogContent>
        <Typography>
          确定要删除章节 <strong>"{title}"</strong> 吗？
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          此操作不可恢复，章节内容将永久删除。
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={loading}>
          取消
        </Button>
        <Button onClick={onConfirm} color="error" variant="contained" disabled={loading}>
          {loading ? '删除中...' : '确认删除'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
