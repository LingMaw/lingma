import { Suspense, useState, useMemo } from 'react'
import { useLocation, useNavigate, Outlet } from 'react-router-dom'
import {
  Dashboard as DashboardIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  Palette as PaletteIcon,
  BorderColor as BorderColorIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Person as PersonIcon,
  Token as TokenIcon,
  History as HistoryIcon,
  GitHub as GitHubIcon,
} from '@mui/icons-material'
import {
  AppBar,
  Box,
  CircularProgress,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  Divider,
  alpha,
  Paper,
  Fade,
  Stack,
  Badge,
} from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'

import { env } from '@/config/env'
import { useUserStore } from '@/frontend/shared/stores/user'
import { useThemeStore, type ColorPalette } from '@/frontend/shared/stores/theme'
import { pageVariants } from '@/frontend/core/animation'
import { systemColors } from '@/frontend/core/theme/macOS'
import { Breadcrumb, useBreadcrumb } from '@/frontend/shared'

// --- Constants ---
const DRAWER_WIDTH = 280 // 稍微加宽，增加呼吸感
const COLLAPSED_DRAWER_WIDTH = 88 // 加宽以容纳更美观的图标容器

const MENU_ITEMS = [
  { path: '/dashboard', text: '仪表盘', icon: <DashboardIcon /> },
  { path: '/novel_generator', text: 'AI小说生成器', icon: <BorderColorIcon /> },
  { path: '/novel_project', text: '小说项目管理', icon: <BorderColorIcon /> },
  { path: '/characters', text: '角色管理', icon: <BorderColorIcon /> },
  { path: '/token-statistics', text: 'Token统计', icon: <TokenIcon /> },
  { path: '/prompt-records', text: '提示词记录', icon: <HistoryIcon /> },
  { path: '/profile', text: '个人资料', icon: <PersonIcon /> },
]

// --- Helper Component: Nav Item ---
// 提取菜单项组件，统一侧边栏和悬浮菜单的样式逻辑
const NavMenuItem = ({
  item,
  isCollapsed,
  isSelected,
  onClick,
  isPopover = false,
}: {
  item: typeof MENU_ITEMS[0]
  isCollapsed?: boolean
  isSelected: boolean
  onClick: () => void
  isPopover?: boolean
}) => {
  const theme = useTheme()

  return (
    <ListItem disablePadding sx={{ mb: 1, px: isPopover ? 0 : 1.5 }}>
      <Tooltip
        title={isCollapsed && !isPopover ? item.text : ''}
        placement="right"
        arrow
        TransitionComponent={Fade}
      >
        <ListItemButton
          selected={isSelected}
          onClick={onClick}
          sx={{
            borderRadius: '16px', // 更圆润的边角
            minHeight: 50,
            justifyContent: isCollapsed && !isPopover ? 'center' : 'initial',
            px: isCollapsed && !isPopover ? 1 : 2,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden',
            // 选中状态样式
            '&.Mui-selected': {
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              color: 'primary.main',
              fontWeight: 600,
              boxShadow: `0 0 0 1px ${alpha(theme.palette.primary.main, 0.1)}`,
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                transform: 'translateY(-1px)',
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                left: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                height: '40%',
                width: '4px',
                borderRadius: '0 4px 4px 0',
                bgcolor: 'primary.main',
                display: isCollapsed && !isPopover ? 'none' : 'block',
              },
            },
            // 悬停状态
            '&:hover': {
              bgcolor: alpha(theme.palette.text.primary, 0.03),
              transform: isSelected ? 'translateY(-1px)' : 'translateX(4px)',
            },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 0,
              mr: isCollapsed && !isPopover ? 0 : 2,
              justifyContent: 'center',
              color: isSelected ? 'primary.main' : 'text.secondary',
              transition: 'color 0.2s',
              // 图标背景容器（仅在非折叠模式下或悬浮菜单中微调）
              p: 0.5,
              borderRadius: '8px',
            }}
          >
            {item.icon}
          </ListItemIcon>
          {(!isCollapsed || isPopover) && (
            <ListItemText
              primary={item.text}
              primaryTypographyProps={{
                fontSize: '0.925rem',
                fontWeight: isSelected ? 700 : 500,
                letterSpacing: '0.01em',
              }}
            />
          )}
        </ListItemButton>
      </Tooltip>
    </ListItem>
  )
}

export default function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false) // 默认展开，体验更好
  const [, setHoverAnchor] = useState<HTMLElement | null>(null)
  const [anchorElPalette, setAnchorElPalette] = useState<null | HTMLElement>(null)

  // Stores
  const { user, logout } = useUserStore()
  const { mode, toggleMode, setPalette, palette } = useThemeStore()
  const breadcrumbs = useBreadcrumb()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen)
  const toggleCollapse = () => setIsCollapsed(!isCollapsed)

  const handleMouseEnter = (event: React.MouseEvent<HTMLElement>) => {
    if (isCollapsed && !isMobile) {
      setHoverAnchor(event.currentTarget)
    }
  }
  const handleMouseLeave = () => setHoverAnchor(null)

  // 渲染侧边栏内容
  const drawerContent = useMemo(() => (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      bgcolor: 'transparent' 
    }}>
      {/* 1. Brand / Logo Area */}
      <Toolbar 
        disableGutters 
        sx={{ 
          px: isCollapsed ? 0 : 3, 
          height: 80, // Taller header
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          transition: 'all 0.3s ease'
        }}
      >
        <Box
          component={motion.div}
          layoutId="brand-logo"
          sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
        >
          <Avatar
            variant="rounded"
            src="/vite.png"
            sx={{
              width: isCollapsed ? 40 : 36,
              height: isCollapsed ? 40 : 36,
              bgcolor: 'primary.main',
              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`,
              transition: 'all 0.3s'
            }}
          >
            L
          </Avatar>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Typography 
                variant="h6" 
                fontWeight={800} 
                sx={{ 
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  backgroundClip: 'text',
                  textFillColor: 'transparent',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.5px'
                }}
              >
                {env.APP_NAME}
              </Typography>
            </motion.div>
          )}
        </Box>
      </Toolbar>

      {/* 2. Navigation Items */}
      <Box sx={{ flexGrow: 1, px: 1.5, overflowY: 'auto', mt: 1 }}>
        <Typography 
          variant="caption" 
          color="text.secondary" 
          sx={{ 
            pl: 2, 
            mb: 1, 
            display: isCollapsed ? 'none' : 'block',
            fontWeight: 600,
            opacity: 0.7,
            textTransform: 'uppercase',
            fontSize: '0.7rem'
          }}
        >
          Menu
        </Typography>
        <List component="nav" sx={{ pt: 0 }}>
          {MENU_ITEMS.map(item => (
            <NavMenuItem
              key={item.path}
              item={item}
              isCollapsed={isCollapsed}
              isSelected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path)
                if (isMobile) handleDrawerToggle()
              }}
            />
          ))}
        </List>
      </Box>

      {/* 3. Bottom Actions & User Profile */}
      <Box sx={{ p: 2, pb: 3 }}>
         {/* Collapse Toggle (Desktop only) */}
        {!isMobile && (
          <Box sx={{ display: 'flex', justifyContent: isCollapsed ? 'center' : 'flex-end', mb: 2 }}>
            <IconButton 
              onClick={toggleCollapse} 
              size="small"
              sx={{ 
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: 'background.paper',
                '&:hover': { bgcolor: 'action.hover' }
              }}
            >
              {isCollapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
            </IconButton>
          </Box>
        )}

        {/* User Card */}
        <Paper
          elevation={0}
          sx={{
            p: isCollapsed ? 1 : 1.5,
            borderRadius: '16px',
            bgcolor: alpha(theme.palette.background.paper, 0.6),
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            transition: 'all 0.3s',
            cursor: 'pointer',
            '&:hover': {
              bgcolor: alpha(theme.palette.background.paper, 0.9),
              boxShadow: theme.shadows[2],
              transform: 'translateY(-2px)'
            }
          }}
        >
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            variant="dot"
            color="success"
            sx={{ '& .MuiBadge-badge': { border: `2px solid ${theme.palette.background.paper}` } }}
          >
            <Avatar
              src={user?.avatar}
              sx={{
                width: isCollapsed ? 36 : 40,
                height: isCollapsed ? 36 : 40,
                bgcolor: 'primary.main',
                fontSize: '0.9rem',
                fontWeight: 700
              }}
            >
              {user?.username?.slice(0, 2).toUpperCase() || 'U'}
            </Avatar>
          </Badge>
          
          {!isCollapsed && (
            <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
              <Typography variant="subtitle2" noWrap fontWeight={700}>
                {user?.nickname || user?.username}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap display="block">
                {user?.role === 'admin' ? 'System Admin' : 'Editor'}
              </Typography>
            </Box>
          )}
          
          {!isCollapsed && (
            <Tooltip title="退出登录">
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleLogout(); }}>
                <LogoutIcon fontSize="small" color="action" />
              </IconButton>
            </Tooltip>
          )}
        </Paper>
        {isCollapsed && (
           <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
             <Tooltip title="退出登录" placement="right">
                <IconButton onClick={handleLogout} size="small"><LogoutIcon fontSize="small" /></IconButton>
             </Tooltip>
           </Box>
        )}
      </Box>
    </Box>
  ), [isCollapsed, location.pathname, isMobile, mobileOpen, user, theme])

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', bgcolor: 'background.default' }}>
      
      {/* --- Top AppBar --- */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${isCollapsed ? COLLAPSED_DRAWER_WIDTH : DRAWER_WIDTH}px)` },
          ml: { md: `${isCollapsed ? COLLAPSED_DRAWER_WIDTH : DRAWER_WIDTH}px` },
          bgcolor: alpha(theme.palette.background.default, 0.8), // Glassmorphism
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          color: 'text.primary',
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar sx={{ height: 64 }}>
          {/* Left: Mobile Toggle & Breadcrumbs */}
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0, gap: 2 }}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ display: { md: 'none' }, borderRadius: '12px' }}
            >
              <MenuIcon />
            </IconButton>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {breadcrumbs ? (
                    <Breadcrumb items={breadcrumbs} />
                ) : (
                    <Typography variant="h6" fontWeight={700} noWrap>
                    {MENU_ITEMS.find(i => i.path === location.pathname)?.text || 'Console'}
                    </Typography>
                )}
            </Box>
          </Box>

          {/* Right: Actions */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            {/* Palette Picker */}
            <Tooltip title="主题色">
              <IconButton 
                onClick={e => setAnchorElPalette(e.currentTarget)} 
                sx={{ 
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: 'primary.main',
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
                }}
              >
                <PaletteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            {/* Theme Toggle */}
            <Tooltip title={`切换${mode === 'light' ? '深色' : '浅色'}模式`}>
              <IconButton 
                onClick={toggleMode} 
                sx={{ 
                   border: `1px solid ${theme.palette.divider}`,
                }}
              >
                {mode === 'light' ? <DarkModeIcon fontSize="small" /> : <LightModeIcon fontSize="small" />}
              </IconButton>
            </Tooltip>

             {/* Github */}
             <Tooltip title="GitHub">
              <IconButton 
                component="a" 
                href="https://github.com/lingmaw/lingma" 
                target="_blank"
                sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
              >
                <GitHubIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>

          {/* Palette Menu */}
          <Menu
            anchorEl={anchorElPalette}
            open={Boolean(anchorElPalette)}
            onClose={() => setAnchorElPalette(null)}
            PaperProps={{
              sx: { 
                mt: 1.5, 
                minWidth: 200, 
                borderRadius: 3,
                boxShadow: theme.shadows[10] 
              },
            }}
          >
            <Typography variant="subtitle2" sx={{ px: 2, py: 1.5, color: 'text.secondary', fontWeight: 600 }}>
              选择主题风格
            </Typography>
            <Divider sx={{ mb: 1 }} />
            {(Object.keys(systemColors).filter(k =>
                ['blue', 'purple', 'green', 'orange', 'red'].includes(k)
              ) as ColorPalette[]).map(p => (
              <MenuItem
                key={p}
                onClick={() => { setPalette(p); setAnchorElPalette(null); }}
                selected={palette === p}
                sx={{ mx: 1, borderRadius: 2 }}
              >
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    bgcolor: systemColors[p as keyof typeof systemColors][mode],
                    mr: 2,
                    boxShadow: palette === p ? `0 0 0 2px ${theme.palette.background.paper}, 0 0 0 4px ${systemColors[p][mode]}` : 'none',
                    transition: 'all 0.2s'
                  }}
                />
                <ListItemText primary={p} sx={{ textTransform: 'capitalize' }} />
              </MenuItem>
            ))}
          </Menu>
        </Toolbar>
      </AppBar>

      {/* --- Sidebar Navigation --- */}
      <Box
        component="nav"
        sx={{
          width: { md: isCollapsed ? COLLAPSED_DRAWER_WIDTH : DRAWER_WIDTH },
          flexShrink: { md: 0 },
          transition: theme.transitions.create('width', {
             easing: theme.transitions.easing.sharp,
             duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              border: 'none',
              bgcolor: 'background.paper',
            },
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: isCollapsed ? COLLAPSED_DRAWER_WIDTH : DRAWER_WIDTH,
              borderRight: '1px solid',
              borderColor: 'divider',
              bgcolor: alpha(theme.palette.background.paper, 0.5), // Subtle transparent background
              backdropFilter: 'blur(20px)',
              overflowX: 'hidden',
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
              }),
            },
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* --- Main Content Area --- */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${isCollapsed ? COLLAPSED_DRAWER_WIDTH : DRAWER_WIDTH}px)` },
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden',
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar sx={{ height: 64 }} /> {/* Spacer for AppBar */}
        
        <Suspense
          fallback={
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, height: '100%' }}>
              <CircularProgress size={40} thickness={4} />
            </Box>
          }
        >
          <Box
            component={motion.div}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              overflow: 'auto',
              p: { xs: 2, sm: 3, md: 4 }, // 响应式内边距
              position: 'relative'
            }}
          >
            <AnimatePresence mode="wait">
              <Outlet />
            </AnimatePresence>
          </Box>
        </Suspense>
      </Box>
    </Box>
  )
}