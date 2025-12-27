/**
 * 大纲节点选择器组件
 */
import { useState, useEffect } from 'react'
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  CircularProgress,
  SelectChangeEvent,
} from '@mui/material'
import { Link, LinkOff } from '@mui/icons-material'
import { chapterEditorAPI } from '../api'
import type { OutlineNodeOption } from '../types'

interface OutlineNodeSelectorProps {
  projectId: number
  value: number | null
  onChange: (value: number | null) => void
  disabled?: boolean
}

export default function OutlineNodeSelector({
  projectId,
  value,
  onChange,
  disabled = false,
}: OutlineNodeSelectorProps) {
  const [nodes, setNodes] = useState<OutlineNodeOption[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadNodes = async () => {
      try {
        setLoading(true)
        const data = await chapterEditorAPI.getOutlineNodes(projectId)
        setNodes(data)
      } catch (error) {
        console.error('加载大纲节点失败:', error)
      } finally {
        setLoading(false)
      }
    }

    loadNodes()
  }, [projectId])

  const handleChange = (event: SelectChangeEvent<number | string>) => {
    const val = event.target.value
    if (val === 'none') {
      onChange(null)
    } else {
      onChange(Number(val))
    }
  }

  return (
    <FormControl fullWidth size="small" disabled={disabled}>
      <InputLabel>关联大纲节点</InputLabel>
      <Select
        value={value ?? 'none'}
        onChange={handleChange}
        label="关联大纲节点"
        startAdornment={
          loading ? (
            <CircularProgress size={20} sx={{ mr: 1 }} />
          ) : value ? (
            <Link sx={{ mr: 1, fontSize: 20 }} color="primary" />
          ) : (
            <LinkOff sx={{ mr: 1, fontSize: 20 }} color="disabled" />
          )
        }
      >
        <MenuItem value="none">
          <em>不关联大纲</em>
        </MenuItem>
        {nodes.map(node => (
          <MenuItem key={node.id} value={node.id} disabled={node.has_chapter && node.id !== value}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
              <span>{node.path}</span>
              {node.has_chapter && node.id !== value && (
                <Chip label="已关联" size="small" color="default" />
              )}
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}
