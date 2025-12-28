/**
 * 大纲节点编辑器对话框
 */

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
} from '@mui/material'

import { outlineAPI } from '../api'
import type { OutlineNodeResponse, NodeType } from '../types'

interface OutlineNodeEditorProps {
  open: boolean
  onClose: () => void
  onSave: () => void
  projectId: number
  editingNode: OutlineNodeResponse | null
  parentNode: OutlineNodeResponse | null
  nodeType: NodeType | null
}

export default function OutlineNodeEditor({
  open,
  onClose,
  onSave,
  projectId,
  editingNode,
  parentNode,
  nodeType,
}: OutlineNodeEditorProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  // 初始化表单数据
  useEffect(() => {
    if (editingNode) {
      setTitle(editingNode.title)
      setDescription(editingNode.description || '')
    } else {
      setTitle('')
      setDescription('')
    }
  }, [editingNode, open])

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert('请输入标题')
      return
    }

    try {
      setLoading(true)

      if (editingNode) {
        // 更新节点
        await outlineAPI.updateNode(editingNode.id, {
          title: title.trim(),
          description: description.trim() || undefined,
        })
      } else {
        // 创建节点
        if (!nodeType) return

        await outlineAPI.createNode(projectId, {
          parent_id: parentNode?.id ?? null,
          node_type: nodeType,
          title: title.trim(),
          description: description.trim() || undefined,
        })
      }

      onSave()
      handleClose()
    } catch (error) {
      console.error('保存节点失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setTitle('')
    setDescription('')
    onClose()
  }

  const getTitle = () => {
    if (editingNode) return '编辑节点'
    if (nodeType === 'volume') return '创建卷'
    if (nodeType === 'chapter') return '创建章'
    if (nodeType === 'section') return '创建小节'
    return '创建节点'
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{getTitle()}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="标题"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
            autoFocus
          />
          <TextField
            label="描述/摘要"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={4}
            placeholder="可选：输入节点的描述或摘要"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>取消</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? '保存中...' : '保存'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
