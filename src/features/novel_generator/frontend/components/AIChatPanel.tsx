import React, { useState, useRef, useEffect } from 'react'
import {
    Box,
    TextField,
    Paper,
    Typography,
    CircularProgress,
    IconButton,
    Tooltip,
    useTheme,
    alpha,
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import { novelGeneratorAPI } from '@/features/novel_generator/frontend'
import SendIcon from '@mui/icons-material/Send'
import AutoStoriesIcon from '@mui/icons-material/AutoStories'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import DeleteIcon from '@mui/icons-material/Delete'
import HistoryIcon from '@mui/icons-material/History'
import MarkdownRenderer from '@/frontend/shared/components/MarkdownRenderer'

interface Message {
    role: 'user' | 'assistant'
    content: string
    id?: string
    timestamp?: number
}

interface AIChatPanelProps {
    onInsertContent: (content: string) => void
}

const AIChatPanel: React.FC<AIChatPanelProps> = ({ onInsertContent }) => {
    const [messages, setMessages] = useState<Message[]>([])
    const [inputValue, setInputValue] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [streamingContent, setStreamingContent] = useState('')
    const [thinkingContent, setThinkingContent] = useState('') // 思维链内容状态
    const [currentThinkingContent, setCurrentThinkingContent] = useState('') // 当前对话的思维链
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const theme = useTheme()

    // 滚动到底部
    useEffect(() => {
        scrollToBottom()
    }, [messages, streamingContent, currentThinkingContent])

    // 当对话结束时保存思维链（当AI回复完成时）
    useEffect(() => {
        if (!isLoading && messages.length > 0) {
            const lastMessage = messages[messages.length - 1]
            const hasAssistantReply = lastMessage.role === 'assistant'

            if (hasAssistantReply && currentThinkingContent) {
                setThinkingContent(currentThinkingContent)
            }
        }
    }, [messages, isLoading])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const handleSend = async () => {
        if (!inputValue.trim() || isLoading) return

        try {
            // 添加用户消息
            const userMessage: Message = {
                role: 'user',
                content: inputValue,
                id: `msg-${Date.now()}`,
                timestamp: Date.now()
            }
            const newMessages = [...messages, userMessage]
            setMessages(newMessages)
            setInputValue('')
            setIsLoading(true)
            setStreamingContent('')
            setCurrentThinkingContent('') // 重置当前思维链内容

            // 调用AI对话API
            const stream = await novelGeneratorAPI.chatWithAIStream(newMessages)
            const reader = stream.getReader()
            const decoder = new TextDecoder('utf-8')

            let fullContent = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = decoder.decode(value, { stream: true })

                // 检查是否包含思维链内容
                if (chunk.includes('[REASONING]') && chunk.includes('[/REASONING]')) {
                    const startIdx = chunk.indexOf('[REASONING]') + '[REASONING]'.length
                    const endIdx = chunk.indexOf('[/REASONING]')
                    const reasoningContent = chunk.substring(startIdx, endIdx)
                    setCurrentThinkingContent(prev => prev + reasoningContent)
                } else {
                    fullContent += chunk
                    setStreamingContent(fullContent)
                }
            }

            // 添加AI回复
            if (fullContent) {
                const aiMessage: Message = {
                    role: 'assistant',
                    content: fullContent,
                    id: `msg-${Date.now()}-ai`,
                    timestamp: Date.now()
                }
                setMessages(prev => [...prev, aiMessage])
            }
        } catch (error) {
            console.error('AI对话出错:', error)
            const errorMessage: Message = {
                role: 'assistant',
                content: '抱歉，对话过程中出现错误，请稍后重试。',
                id: `msg-${Date.now()}-error`,
                timestamp: Date.now()
            }
            setMessages(prev => [...prev, errorMessage])
        } finally {
            setIsLoading(false)
            setStreamingContent('')
        }
    }

    const handleInsertToEditor = () => {
        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1]
            if (lastMessage.role === 'assistant') {
                onInsertContent(lastMessage.content)
            }
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const handleClearChat = () => {
        setMessages([])
        setThinkingContent('')
        setCurrentThinkingContent('')
        setStreamingContent('')
    }

    const handleExportChat = () => {
        if (messages.length === 0) return

        const chatContent = messages.map(msg => {
            const role = msg.role === 'user' ? '用户' : 'AI助手'
            const time = msg.timestamp ? new Date(msg.timestamp).toLocaleString('zh-CN') : ''
            return `[${role}] ${time}\n${msg.content}\n\n`
        }).join('')

        const blob = new Blob([chatContent], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `对话历史_${new Date().toISOString().slice(0, 10)}.txt`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    return (
        <Box sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: alpha(theme.palette.background.paper, 0.7),
            backdropFilter: 'blur(10px)',
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            borderBottomLeftRadius: 12,
            borderBottomRightRadius: 12,
            border: `1px solid ${theme.palette.divider}`,
        }}>
            {/* 消息区域 */}
            <Box sx={{
                flex: 1,
                overflow: 'auto',
                p: 2,
                display: 'flex',
                flexDirection: 'column'
            }}>
                {messages.length === 0 ? (
                    <Box sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        color: 'text.secondary'
                    }}>
                        <AutoStoriesIcon sx={{ fontSize: 48, mb: 2, color: 'primary.main' }} />
                        <Typography variant="h6" gutterBottom>
                            欢迎使用AI创作助手
                        </Typography>
                        <Typography variant="body2">
                            你可以在这里与AI讨论小说创作相关的问题，获取灵感和建议
                        </Typography>
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        {messages.map((message, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Box sx={{
                                    display: 'flex',
                                    justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                                    mb: 2
                                }}>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 2,
                                            maxWidth: '80%',
                                            backgroundColor: message.role === 'user'
                                                ? alpha(theme.palette.primary.main, 0.1)
                                                : alpha(theme.palette.grey[500], 0.1),
                                            borderRadius: message.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                                        }}
                                    >
                                        {message.role === 'assistant' ? (
                                            // 对于AI助手的消息，使用Markdown渲染
                                            <MarkdownRenderer>{message.content}</MarkdownRenderer>
                                        ) : (
                                            // 对于用户的消息，保持原有的纯文本显示
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    whiteSpace: 'pre-wrap',
                                                    wordBreak: 'break-word'
                                                }}
                                            >
                                                {message.content}
                                            </Typography>
                                        )}
                                    </Paper>
                                </Box>

                                {/* 在用户消息后显示思维链内容 */}
                                {message.role === 'user' && thinkingContent && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <Box sx={{
                                            display: 'flex',
                                            justifyContent: 'flex-start',
                                            mb: 2
                                        }}>
                                            <Paper
                                                elevation={0}
                                                sx={{
                                                    p: 2,
                                                    width: '80%',
                                                    backgroundColor: alpha(theme.palette.info.light, 0.1),
                                                    borderRadius: '4px 16px 16px 16px',
                                                }}
                                            >
                                                <Accordion sx={{
                                                    backgroundColor: 'transparent',
                                                    boxShadow: 'none',
                                                    '&:before': { display: 'none' }
                                                }}>
                                                    <AccordionSummary
                                                        expandIcon={<ExpandMoreIcon />}
                                                        sx={{
                                                            minHeight: 0,
                                                            padding: 0,
                                                            '& .MuiAccordionSummary-content': {
                                                                margin: 0,
                                                            }
                                                        }}
                                                    >
                                                        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                                                            🤔 AI 思维链 (Reasoning Process)
                                                        </Typography>
                                                    </AccordionSummary>
                                                    <AccordionDetails sx={{ padding: '8px 0 0 0' }}>
                                                        <MarkdownRenderer>{thinkingContent}</MarkdownRenderer>
                                                    </AccordionDetails>
                                                </Accordion>
                                            </Paper>
                                        </Box>
                                    </motion.div>
                                )}
                            </motion.div>
                        ))}

                        {/* 流式内容显示 */}
                        <AnimatePresence>
                            {streamingContent && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <Box sx={{
                                        display: 'flex',
                                        justifyContent: 'flex-start',
                                        mb: 2
                                    }}>
                                        <Paper
                                            elevation={0}
                                            sx={{
                                                p: 2,
                                                maxWidth: '80%',
                                                backgroundColor: alpha(theme.palette.grey[500], 0.1),
                                                borderRadius: '4px 16px 16px 16px',
                                            }}
                                        >
                                            {/* 流式内容也使用Markdown渲染 */}
                                            <MarkdownRenderer>{streamingContent}</MarkdownRenderer>
                                            <Box component="span" sx={{
                                                display: 'inline-block',
                                                width: 8,
                                                height: 16,
                                                bgcolor: theme.palette.primary.main,
                                                ml: 0.5,
                                                verticalAlign: 'middle',
                                                animation: 'blink 1s infinite'
                                            }} />
                                        </Paper>
                                    </Box>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div ref={messagesEndRef} />
                    </Box>
                )}
            </Box>

            {/* 输入区域 */}
            <Box sx={{
                p: 2,
                borderTop: `1px solid ${theme.palette.divider}`,
            }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
                    <TextField
                        multiline
                        maxRows={4}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="与AI助手对话，讨论你的创作想法..."
                        disabled={isLoading}
                        sx={{
                            flex: 1,
                            mr: 1,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 3,
                                backgroundColor: alpha(theme.palette.background.paper, 0.6),
                                '&:hover': {
                                    backgroundColor: alpha(theme.palette.background.paper, 0.8),
                                },
                                '&.Mui-focused': {
                                    backgroundColor: theme.palette.background.paper,
                                }
                            }
                        }}
                    />
                    <Tooltip title="发送消息">
                        <IconButton
                            color="primary"
                            onClick={handleSend}
                            disabled={isLoading || !inputValue.trim()}
                            sx={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                backgroundColor: isLoading ? 'grey.300' : 'primary.main',
                                color: 'white',
                                '&:hover': {
                                    backgroundColor: isLoading ? 'grey.300' : 'primary.dark',
                                }
                            }}
                        >
                            {isLoading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                        </IconButton>
                    </Tooltip>
                </Box>
                {/* 插入内容按钮移到输入区域下方 */}
                {messages.length > 0 && (
                    <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="清空对话历史">
                                <IconButton
                                    size="small"
                                    onClick={handleClearChat}
                                    sx={{
                                        borderRadius: 2,
                                        backgroundColor: alpha(theme.palette.error.main, 0.1),
                                        color: 'error.main',
                                        '&:hover': {
                                            backgroundColor: alpha(theme.palette.error.main, 0.2),
                                        }
                                    }}
                                >
                                    <DeleteIcon sx={{ mr: 0.5, fontSize: '1rem' }} />
                                    <Typography variant="caption" sx={{ fontWeight: 500 }}>
                                        清空对话
                                    </Typography>
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="导出对话历史">
                                <IconButton
                                    size="small"
                                    onClick={handleExportChat}
                                    sx={{
                                        borderRadius: 2,
                                        backgroundColor: alpha(theme.palette.success.main, 0.1),
                                        color: 'success.main',
                                        '&:hover': {
                                            backgroundColor: alpha(theme.palette.success.main, 0.2),
                                        }
                                    }}
                                >
                                    <HistoryIcon sx={{ mr: 0.5, fontSize: '1rem' }} />
                                    <Typography variant="caption" sx={{ fontWeight: 500 }}>
                                        导出对话
                                    </Typography>
                                </IconButton>
                            </Tooltip>
                        </Box>
                        <Tooltip title="将最后一条AI回复插入到创作参数中">
                            <IconButton
                                size="small"
                                onClick={handleInsertToEditor}
                                sx={{
                                    borderRadius: 2,
                                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                    color: 'primary.main',
                                    '&:hover': {
                                        backgroundColor: alpha(theme.palette.primary.main, 0.2),
                                    }
                                }}
                            >
                                <AutoStoriesIcon sx={{ mr: 0.5, fontSize: '1rem' }} />
                                <Typography variant="caption" sx={{ fontWeight: 500 }}>
                                    插入内容
                                </Typography>
                            </IconButton>
                        </Tooltip>
                    </Box>
                )}
            </Box>

            {/* 动画样式 */}
            <style>
                {`
          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
          }
        `}
            </style>
        </Box>
    )
}

export default AIChatPanel