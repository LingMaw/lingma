/**
 * AI辅助写作组件
 */
import { useState } from 'react'
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  IconButton,
  Collapse,
  FormControlLabel,
  Switch,
  CircularProgress,
  Divider,
} from '@mui/material'
import { AutoAwesome, Close, Send } from '@mui/icons-material'

interface AIAssistantProps {
  onGenerate: (prompt: string, useOutlineContext: boolean) => Promise<void>
  generating: boolean
}

export default function AIAssistant({ onGenerate, generating }: AIAssistantProps) {
  const [expanded, setExpanded] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [useOutlineContext, setUseOutlineContext] = useState(true)

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    await onGenerate(prompt, useOutlineContext)
    setPrompt('')
  }

  return (
    <Box sx={{ position: 'relative' }}>
      {/* 触发按钮 */}
      {!expanded && (
        <Button
          variant="contained"
          startIcon={<AutoAwesome />}
          onClick={() => setExpanded(true)}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: '0 8px 20px -4px rgba(118, 75, 162, 0.5)',
          }}
        >
          AI辅助写作
        </Button>
      )}

      {/* 展开面板 */}
      <Collapse in={expanded}>
        <Paper
          elevation={3}
          sx={{
            p: 2,
            borderRadius: 3,
            background: theme =>
              `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)`,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AutoAwesome color="primary" />
              AI写作助手
            </Typography>
            <IconButton size="small" onClick={() => setExpanded(false)} disabled={generating}>
              <Close />
            </IconButton>
          </Box>

          <Divider sx={{ mb: 2 }} />

          <TextField
            fullWidth
            multiline
            rows={3}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="输入你的写作需求，例如：续写下一段、润色这段文字、扩展这个情节..."
            disabled={generating}
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={useOutlineContext}
                  onChange={e => setUseOutlineContext(e.target.checked)}
                  disabled={generating}
                />
              }
              label="使用大纲上下文"
            />

            <Button
              variant="contained"
              startIcon={generating ? <CircularProgress size={20} /> : <Send />}
              onClick={handleGenerate}
              disabled={!prompt.trim() || generating}
            >
              {generating ? '生成中...' : '生成内容'}
            </Button>
          </Box>
        </Paper>
      </Collapse>
    </Box>
  )
}
