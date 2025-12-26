/**
 * 大纲生成进度面板组件 (SSE 订阅)
 */
import { useState, useEffect, useRef } from 'react'
import {
  Paper,
  Box,
  Typography,
  LinearProgress,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import { alpha } from '@mui/material/styles'
import type { OutlineGenerateRequest } from '../api'
import { env } from '@/config/env'

interface GenerationProgressPanelProps {
  projectId: number
  generateParams: OutlineGenerateRequest
  onComplete: (totalNodes: number) => void
  onError: (error: string) => void
  onCancel?: () => void
}

interface CreatedNode {
  id: number
  title: string
  type: string
}

export default function GenerationProgressPanel({
  projectId,
  generateParams,
  onComplete,
  onError,
  onCancel,
}: GenerationProgressPanelProps) {
  const [statusMessage, setStatusMessage] = useState('正在连接AI服务...')
  const [reasoningContent, setReasoningContent] = useState('')
  const [createdNodes, setCreatedNodes] = useState<CreatedNode[]>([])
  const [isCompleted, setIsCompleted] = useState(false)
  const [error, setError] = useState('')

  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    // 创建SSE连接
    const url = `${env.API_BASE_URL}/novel-projects/${projectId}/outline/generate`

    // 获取token
    const token = localStorage.getItem('token')
    if (!token) {
      setError('未登录,请先登录')
      onError('未登录')
      return
    }

    // 创建EventSource (注意: EventSource不支持自定义headers,需要通过URL传递token或使用fetch SSE)
    // 这里使用fetch实现SSE
    const connectSSE = async () => {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(generateParams),
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) {
          throw new Error('无法读取响应流')
        }

        let eventType = ''
        
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('event:')) {
              eventType = line.substring(6).trim()
              continue
            }

            if (line.startsWith('data:')) {
              const dataStr = line.substring(5).trim()
              if (!dataStr) continue

              try {
                const data = JSON.parse(dataStr)
                handleSSEMessage(data, eventType || 'message')
                eventType = '' // 重置事件类型
              } catch (e) {
                console.error('解析SSE数据失败:', e)
              }
            }
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : '连接失败'
        setError(message)
        onError(message)
      }
    }

    const handleSSEMessage = (data: any, type: string) => {
      switch (type) {
        case 'progress':
          setStatusMessage(data.message)
          break

        case 'reasoning':
          setReasoningContent((prev) => prev + data.content)
          break

        case 'content':
          // 内容块,可选展示
          break

        case 'node_created':
          if (data.node) {
            setCreatedNodes((prev) => [...prev, data.node])
          }
          break

        case 'complete':
          setStatusMessage(data.message)
          setIsCompleted(true)
          onComplete(data.total_nodes)
          break

        case 'error':
          setError(data.message)
          onError(data.message)
          break
      }
    }

    connectSSE()

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [projectId, generateParams, onComplete, onError])

  const handleClose = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }
    onCancel?.()
  }

  const getNodeTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      volume: '卷',
      chapter: '章',
      section: '节',
    }
    return labels[type] || type
  }

  const getNodeTypeColor = (type: string): 'primary' | 'secondary' | 'default' => {
    const colors: Record<string, 'primary' | 'secondary' | 'default'> = {
      volume: 'primary',
      chapter: 'secondary',
      section: 'default',
    }
    return colors[type] || 'default'
  }

  return (
    <Paper
      elevation={4}
      sx={{
        borderRadius: 4,
        p: 3,
        backdropFilter: 'blur(20px)',
        backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.95),
        position: 'relative',
      }}
    >
      {/* 标题栏 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          {isCompleted ? '生成完成' : error ? '生成失败' : '正在生成大纲...'}
        </Typography>
        {(isCompleted || error) && (
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      {/* 进度条 */}
      {!isCompleted && !error && <LinearProgress sx={{ mb: 2 }} />}

      {/* 状态消息 */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {statusMessage}
      </Typography>

      {/* 错误提示 */}
      {error && (
        <Alert severity="error" icon={<ErrorIcon />} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 完成提示 */}
      {isCompleted && (
        <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 2 }}>
          大纲生成成功,共创建 {createdNodes.length} 个节点
        </Alert>
      )}

      {/* 思维链 (可选展开) */}
      {reasoningContent && (
        <>
          <Divider sx={{ my: 2 }} />
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="body2">思维链 (AI 推理过程)</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box
                sx={{
                  maxHeight: 200,
                  overflow: 'auto',
                  p: 2,
                  backgroundColor: (theme) => alpha(theme.palette.action.hover, 0.5),
                  borderRadius: 2,
                }}
              >
                <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                  {reasoningContent}
                </Typography>
              </Box>
            </AccordionDetails>
          </Accordion>
        </>
      )}

      {/* 已创建节点列表 */}
      {createdNodes.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" gutterBottom>
            已创建节点 ({createdNodes.length})
          </Typography>
          <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
            {createdNodes.map((node, index) => (
              <ListItem key={index}>
                <ListItemText
                  primary={node.title}
                  secondary={`ID: ${node.id}`}
                  primaryTypographyProps={{ variant: 'body2' }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
                <Chip
                  label={getNodeTypeLabel(node.type)}
                  size="small"
                  color={getNodeTypeColor(node.type)}
                />
              </ListItem>
            ))}
          </List>
        </>
      )}
    </Paper>
  )
}
