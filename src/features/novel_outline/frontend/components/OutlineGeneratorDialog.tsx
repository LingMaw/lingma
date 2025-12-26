/**
 * AI 大纲生成对话框组件
 */
import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Alert,
  Chip,
  Stack,
  Box,
  Switch,
  FormControlLabel,
  Slider,
} from '@mui/material'
import Grid2 from '@mui/material/Grid2'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import { alpha } from '@mui/material/styles'
import type { OutlineGenerateRequest } from '../api'

interface OutlineGeneratorDialogProps {
  open: boolean
  onClose: () => void
  projectId: number
  onGenerateStart: (params: OutlineGenerateRequest) => void
  projectDescription?: string
  projectGenre?: string
  projectStyle?: string
}

// 预设类型和风格
const GENRES = ['玄幻', '都市', '科幻', '武侠', '仙侠', '历史', '军事', '游戏', '竞技', '悬疑', '奇幻']
const STYLES = ['轻松幽默', '严肃深沉', '热血激情', '温馨治愈', '黑暗压抑', '浪漫唯美']

export default function OutlineGeneratorDialog({
  open,
  onClose,
  onGenerateStart,
  projectDescription,
  projectGenre,
  projectStyle,
}: OutlineGeneratorDialogProps) {
  const [formData, setFormData] = useState<OutlineGenerateRequest>({
    theme: '',
    genre: '',
    style: '',
    chapter_count_range: [10, 30],
    reference_outline: '',
    key_plots: [],
    custom_instructions: '',
    generate_sections: true,
  })

  const [keyPlotInput, setKeyPlotInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // 动态构建类型和风格列表（包含项目中的自定义值）
  const genreOptions = [...GENRES]
  if (projectGenre && !GENRES.includes(projectGenre)) {
    genreOptions.push(projectGenre)
  }
  
  const styleOptions = [...STYLES]
  if (projectStyle && !STYLES.includes(projectStyle)) {
    styleOptions.push(projectStyle)
  }

  // 当对话框打开时，自动填充项目信息
  useEffect(() => {
    if (open) {
      setFormData((prev) => ({
        ...prev,
        theme: projectDescription || '',
        genre: projectGenre || '',
        style: projectStyle || '',
      }))
    }
  }, [open, projectDescription, projectGenre, projectStyle])

  const handleSubmit = async () => {
    // 验证必填项
    if (!formData.theme.trim()) {
      setError('请输入小说主题/简介')
      return
    }

    setLoading(true)
    setError('')

    try {
      const submitData = getSubmitData()
      // 触发生成(父组件会打开进度面板)
      onGenerateStart(submitData)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败')
      setLoading(false)
    }
  }

  const handleAddKeyPlot = () => {
    if (keyPlotInput.trim() && formData.key_plots!.length < 20) {
      setFormData({
        ...formData,
        key_plots: [...(formData.key_plots || []), keyPlotInput.trim()],
      })
      setKeyPlotInput('')
    }
  }

  const handleDeleteKeyPlot = (index: number) => {
    setFormData({
      ...formData,
      key_plots: formData.key_plots!.filter((_, i) => i !== index),
    })
  }

  // 获取最终要提交的数据
  const getSubmitData = (): OutlineGenerateRequest => {
    const data: OutlineGenerateRequest = {
      theme: formData.theme,
    }

    // 只包含非空字段
    if (formData.genre) data.genre = formData.genre
    if (formData.style) data.style = formData.style
    if (formData.chapter_count_range) data.chapter_count_range = formData.chapter_count_range
    if (formData.reference_outline?.trim()) data.reference_outline = formData.reference_outline
    if (formData.key_plots && formData.key_plots.length > 0) data.key_plots = formData.key_plots
    if (formData.custom_instructions?.trim())
      data.custom_instructions = formData.custom_instructions
    data.generate_sections = formData.generate_sections

    return data
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          backdropFilter: 'blur(20px)',
          backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.95),
        },
      }}
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <AutoAwesomeIcon color="primary" />
          <Typography variant="h6">AI 生成大纲</Typography>
        </Stack>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Stack spacing={3} sx={{ mt: 1 }}>
          {/* 主题/简介 */}
          <TextField
            label="小说主题/简介"
            value={formData.theme}
            onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
            multiline
            rows={3}
            required
            fullWidth
            placeholder="例如: 一个现代程序员穿越到修仙世界,利用编程思维修炼..."
          />

          {/* 类型和风格 */}
          <Grid2 container spacing={2}>
            <Grid2 size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>小说类型</InputLabel>
                <Select
                  value={formData.genre}
                  label="小说类型"
                  onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                >
                  <MenuItem value="">
                    <em>不指定</em>
                  </MenuItem>
                  {genreOptions.map((genre) => (
                    <MenuItem key={genre} value={genre}>
                      {genre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid2>

            <Grid2 size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>写作风格</InputLabel>
                <Select
                  value={formData.style}
                  label="写作风格"
                  onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                >
                  <MenuItem value="">
                    <em>不指定</em>
                  </MenuItem>
                  {styleOptions.map((style) => (
                    <MenuItem key={style} value={style}>
                      {style}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid2>
          </Grid2>

          {/* 高级参数 */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>高级参数 (可选)</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={3}>
                {/* 章节数范围 */}
                <Box>
                  <Typography gutterBottom>
                    章节数范围: {formData.chapter_count_range?.[0]} - {formData.chapter_count_range?.[1]}
                  </Typography>
                  <Slider
                    value={formData.chapter_count_range || [10, 30]}
                    onChange={(_, value) =>
                      setFormData({ ...formData, chapter_count_range: value as [number, number] })
                    }
                    min={1}
                    max={100}
                    marks={[
                      { value: 1, label: '1' },
                      { value: 50, label: '50' },
                      { value: 100, label: '100' },
                    ]}
                  />
                </Box>

                {/* 关键情节点 */}
                <Box>
                  <TextField
                    label="关键情节点"
                    value={keyPlotInput}
                    onChange={(e) => setKeyPlotInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddKeyPlot()
                      }
                    }}
                    fullWidth
                    placeholder="输入后按回车添加 (最多 20 个)"
                    helperText={`已添加 ${formData.key_plots?.length || 0}/20`}
                  />
                  <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {formData.key_plots?.map((plot, index) => (
                      <Chip
                        key={index}
                        label={plot}
                        onDelete={() => handleDeleteKeyPlot(index)}
                        size="small"
                      />
                    ))}
                  </Box>
                </Box>

                {/* 参考大纲 */}
                <TextField
                  label="参考大纲"
                  value={formData.reference_outline}
                  onChange={(e) => setFormData({ ...formData, reference_outline: e.target.value })}
                  multiline
                  rows={4}
                  fullWidth
                  placeholder="粘贴您的参考大纲或类似作品的大纲结构..."
                  helperText={`${formData.reference_outline?.length || 0}/5000 字符`}
                />

                {/* 自定义指令 */}
                <TextField
                  label="自定义指令"
                  value={formData.custom_instructions}
                  onChange={(e) =>
                    setFormData({ ...formData, custom_instructions: e.target.value })
                  }
                  multiline
                  rows={2}
                  fullWidth
                  placeholder="例如: 每卷需要包含一个高潮情节..."
                />

                {/* 生成小节开关 */}
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.generate_sections}
                      onChange={(e) =>
                        setFormData({ ...formData, generate_sections: e.target.checked })
                      }
                    />
                  }
                  label="生成第三层(小节)"
                />
              </Stack>
            </AccordionDetails>
          </Accordion>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          取消
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !formData.theme.trim()}
          startIcon={<AutoAwesomeIcon />}
        >
          {loading ? '正在准备...' : '开始生成'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
