/**
 * 富文本编辑器组件
 * 基于 react-quill 实现
 */
import { useMemo, useRef } from 'react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { Box, useTheme, alpha } from '@mui/material'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  readOnly?: boolean
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = '开始写作...',
  readOnly = false,
}: RichTextEditorProps) {
  const theme = useTheme()
  const quillRef = useRef<ReactQuill>(null)

  // Quill 工具栏配置
  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ indent: '-1' }, { indent: '+1' }],
        [{ align: [] }],
        ['blockquote', 'code-block'],
        ['clean'],
      ],
    }),
    []
  )

  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'list',
    'bullet',
    'indent',
    'align',
    'blockquote',
    'code-block',
  ]

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        '& .quill': {
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        },
        '& .ql-toolbar': {
          borderRadius: '12px 12px 0 0',
          borderColor: theme.palette.divider,
          backgroundColor: alpha(theme.palette.background.paper, 0.6),
          backdropFilter: 'blur(10px)',
        },
        '& .ql-container': {
          flex: 1,
          borderRadius: '0 0 12px 12px',
          borderColor: theme.palette.divider,
          fontSize: '16px',
          fontFamily: theme.typography.fontFamily,
        },
        '& .ql-editor': {
          lineHeight: 1.8,
          padding: '20px',
          color: theme.palette.text.primary,
          '&::before': {
            color: theme.palette.text.disabled,
            fontStyle: 'normal',
          },
        },
        '& .ql-snow .ql-stroke': {
          stroke: theme.palette.text.secondary,
        },
        '& .ql-snow .ql-fill': {
          fill: theme.palette.text.secondary,
        },
        '& .ql-snow .ql-picker-label': {
          color: theme.palette.text.secondary,
        },
        '& .ql-snow.ql-toolbar button:hover, & .ql-snow .ql-toolbar button:hover': {
          '& .ql-stroke': {
            stroke: theme.palette.primary.main,
          },
          '& .ql-fill': {
            fill: theme.palette.primary.main,
          },
        },
        '& .ql-snow.ql-toolbar button.ql-active, & .ql-snow .ql-toolbar button.ql-active': {
          '& .ql-stroke': {
            stroke: theme.palette.primary.main,
          },
          '& .ql-fill': {
            fill: theme.palette.primary.main,
          },
        },
      }}
    >
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={readOnly}
      />
    </Box>
  )
}
