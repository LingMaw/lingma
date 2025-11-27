---
trigger: manual
---

  ---
  1️⃣ 主题状态管理

  文件： src/frontend/shared/stores/theme.ts

  使用 Zustand 管理主题状态，存储：
  - mode: 'light' | 'dark'（主题模式）
  - palette: 'blue' | 'purple' | 'green' | 'orange'（配色方案）

  const { mode, palette } = useThemeStore()  // 获取状态
  const { toggleMode, setPalette } = useThemeStore()  // 修改状态

  状态自动持久化到 localStorage（键名：app-theme）

  ---
  2️⃣ 主题生成

  文件： src/frontend/core/theme/macOS.ts

  getTheme(mode, palette) 函数动态创建 MUI 主题：
  - 根据模式选择 macOS 风格配色
  - 定义字体、圆角、组件样式
  - 支持玻璃拟态效果（backdrop-filter）

  ---
  3️⃣ 主题注入

  文件： src/App.tsx

  const theme = useMemo(() => getTheme(mode, palette), [mode, palette])

  <ThemeProvider theme={theme}>
    <CssBaseline />
    {/* 应用内容 */}
  </ThemeProvider>

  ---
  4️⃣ 在组件中使用主题

  ✅ 正确方式：

  // 方式一：直接使用 SX 属性中的 token（推荐）
  <Paper
    sx={{
      backgroundColor: 'background.paper',
      color: 'text.primary',
      borderColor: 'divider',
    }}
  />

  // 方式二：获取 theme 对象
  import { useTheme, alpha } from '@mui/material'

  const theme = useTheme()
  <Box sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>

  ❌ 错误方式：

  // 硬编码颜色（不支持主题切换）
  <Paper sx={{ backgroundColor: '#FFFFFF' }}>
  <Box sx={{ color: '#667eea' }}>

  ---
  5️⃣ 主题切换流程

  用户操作（点击切换按钮）
    → MainLayout.tsx 调用 toggleMode()/setPalette()
    → theme.ts 更新 Zustand store
    → App.tsx 重新生成 theme 对象
    → ThemeProvider 提供新主题
    → 所有组件自动适配 ✨

  ---
  6️⃣ ProjectListPage.tsx 修复清单

  当前文件中的硬编码问题：

  1. 第 111-112 行 - 按钮渐变
  // ❌ 错误
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',

  // ✅ 正确
  background: (theme) =>
    `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
  2. 第 141 行 - 卡片背景
  // ❌ 错误
  background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(245,245,245,0.8) 100%)',

  // ✅ 正确
  backgroundColor: 'background.paper',
  3. 第 158 行 - 图标背景
  // ❌ 错误
  bgcolor: 'primary.light',

  // ✅ 正确（已是 token，但缺少 alpha 透明度）
  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),

  ---
  7️⃣ 关键原则

  ✅ 始终使用语义化 token
  - theme.palette.primary.main（主色）
  - theme.palette.background.paper（卡片背景）
  - theme.palette.text.primary（主文本色）
  - theme.palette.divider（分割线）
  - theme.palette.action.disabled（禁用状态）

  ✅ 使用 alpha 工具函数处理透明度
  import { alpha } from '@mui/material'
  alpha(theme.palette.primary.main, 0.1)

  ✅ 玻璃拟态标准样式
  backgroundColor: alpha(theme.palette.background.paper, 0.8),
  backdropFilter: 'blur(20px)',
  border: `1px solid ${theme.palette.divider}`,

  ---
  8️⃣ 支持的配色方案

  | 配色     | Light 主色 | Dark 主色 |
  |--------|----------|---------|
  | blue   | #007AFF  | #0A84FF |
  | purple | #AF52DE  | #BF5AF2 |
  | green  | #34C759  | #30D158 |
  | orange | #FF9500  | #FF9F0A |

  ---
  通过统一使用主题系统，可以确保应用支持：
  - 🌓 深色/浅色模式自动切换
  - 🎨 4 种配色方案任意切换
  - 🎯 视觉风格一致性
  - 🔧 低维护成本

  所有组件会自动响应主题变化，无需手动刷新页面！