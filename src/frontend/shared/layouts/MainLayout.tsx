import { Suspense, useState } from 'react'
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
} from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'

import { env } from '@/config/env'
import { useUserStore } from '@/frontend/shared/stores/user'
import { useThemeStore, type ColorPalette } from '@/frontend/shared/stores/theme'
import { pageVariants } from '@/frontend/core/animation'
import { systemColors } from '@/frontend/core/theme/macOS'

const drawerWidth = 260
const collapsedDrawerWidth = 72

const menuItems = [
  { path: '/dashboard', text: '仪表盘', icon: <DashboardIcon /> },
  { path: '/novel_generator', text: 'AI小说生成器', icon: <BorderColorIcon /> },
  { path: '/novel_project', text: '小说项目管理', icon: <BorderColorIcon /> },
  { path: '/profile', text: '个人资料', icon: <PersonIcon /> },
]

export default function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(true)

  // Stores
  const { user, logout } = useUserStore()
  const { mode, toggleMode, setPalette, palette } = useThemeStore()

  // Menu state
  const [anchorElPalette, setAnchorElPalette] = useState<null | HTMLElement>(null)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo Area */}
      <Toolbar sx={{ px: 3, mb: 1, justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
        <Box
          component="img"
          src="/vite.png"
          sx={{
            height: 32,
            width: 32,
            objectFit: 'contain',
            mr: isCollapsed ? 0 : 1.5
          }}
        />
        {!isCollapsed && (
          <Typography variant="h6" fontWeight={700} noWrap>
            {env.APP_NAME}
          </Typography>
        )}
      </Toolbar>

      <Divider />

      {/* Navigation Items */}
      <List sx={{ px: isCollapsed ? 1 : 2, flexGrow: 1, pt: 2 }}>
        {menuItems.map(item => {
          const isSelected = location.pathname === item.path
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={isSelected}
                onClick={() => {
                  navigate(item.path)
                  if (isMobile) handleDrawerToggle()
                }}
                sx={{
                  borderRadius: '8px',
                  minHeight: 44,
                  justifyContent: isCollapsed ? 'center' : 'initial',
                  px: isCollapsed ? 1.5 : 2.5,
                  '&.Mui-selected': {
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: 'primary.main',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.15),
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'primary.main',
                    },
                  },
                  '&:hover': {
                    bgcolor: alpha(theme.palette.text.primary, 0.04),
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: isCollapsed ? 0 : 1.5,
                    justifyContent: 'center',
                    color: isSelected ? 'primary.main' : 'text.secondary',
                    '& .MuiSvgIcon-root': {
                      fontSize: isCollapsed ? '1.75rem' : '1.5rem',
                    },
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {!isCollapsed && (
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontWeight: isSelected ? 600 : 500,
                      fontSize: '0.95rem',
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>

      {/* Collapse Button */}
      <Box sx={{ px: isCollapsed ? 1 : 2, pb: 1 }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={toggleCollapse}
            sx={{
              borderRadius: '8px',
              minHeight: 44,
              justifyContent: isCollapsed ? 'center' : 'initial',
              px: isCollapsed ? 1.5 : 2.5,
              color: 'text.secondary',
              '&:hover': {
                bgcolor: alpha(theme.palette.text.primary, 0.04),
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: isCollapsed ? 0 : 1.5,
                justifyContent: 'center',
                '& .MuiSvgIcon-root': {
                  fontSize: isCollapsed ? '1.75rem' : '1.5rem',
                },
              }}
            >
              {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </ListItemIcon>
            {!isCollapsed && (
              <ListItemText
                primary={isCollapsed ? '' : '收起菜单'}
                primaryTypographyProps={{
                  fontWeight: 500,
                  fontSize: '0.95rem',
                }}
              />
            )}
          </ListItemButton>
        </ListItem>
      </Box>

      {/* Bottom Actions */}
      <Box sx={{ p: isCollapsed ? 1 : 2, pt: 0 }}>
        <Box
          sx={{
            p: isCollapsed ? 1 : 2,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.background.default, 0.5),
            display: 'flex',
            alignItems: 'center',
            gap: isCollapsed ? 0 : 1.5,
          }}
        >
          {user?.avatar ? (
            <Avatar
              src={user.avatar}
              sx={{
                width: isCollapsed ? 32 : 40,
                height: isCollapsed ? 32 : 40,
                fontSize: isCollapsed ? '0.75rem' : '1rem',
                fontWeight: 600,
                minWidth: isCollapsed ? 32 : 40,
              }}
            />
          ) : (
            <Avatar
              sx={{
                width: isCollapsed ? 32 : 40,
                height: isCollapsed ? 32 : 40,
                bgcolor: 'primary.main',
                fontSize: isCollapsed ? '0.75rem' : '1rem',
                fontWeight: 600,
                minWidth: isCollapsed ? 32 : 40,
              }}
            >
              {user?.username?.slice(0, 2).toUpperCase() || 'USER'}
            </Avatar>
          )}
          {!isCollapsed && (
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" noWrap fontWeight={600}>
                {user?.nickname || user?.username}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap display="block">
                {user?.role === 'admin' ? 'Administrator' : 'User'}
              </Typography>
            </Box>
          )}
          {!isCollapsed && (
            <IconButton 
              size="small" 
              onClick={handleLogout}
              sx={{
                '& .MuiSvgIcon-root': {
                  fontSize: '1.25rem',
                },
              }}
            >
              <LogoutIcon />
            </IconButton>
          )}
        </Box>
        {isCollapsed && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
            <IconButton 
              size="small" 
              onClick={handleLogout}
              sx={{
                '& .MuiSvgIcon-root': {
                  fontSize: '1.5rem',
                },
              }}
            >
              <LogoutIcon />
            </IconButton>
          </Box>
        )}
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${isCollapsed ? collapsedDrawerWidth : drawerWidth}px)` },
          ml: { md: `${isCollapsed ? collapsedDrawerWidth : drawerWidth}px` },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div" fontWeight={600}>
              {menuItems.find(i => i.path === location.pathname)?.text || '控制台'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Theme Toggle */}
            <Tooltip title={`切换至${mode === 'light' ? '深色' : '浅色'}模式`}>
              <IconButton onClick={toggleMode} color="inherit">
                {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
              </IconButton>
            </Tooltip>

            {/* Palette Selector */}
            <Tooltip title="主题色">
              <IconButton onClick={e => setAnchorElPalette(e.currentTarget)} color="inherit">
                <PaletteIcon />
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={anchorElPalette}
              open={Boolean(anchorElPalette)}
              onClose={() => setAnchorElPalette(null)}
              PaperProps={{
                sx: { mt: 1.5, minWidth: 180 },
              }}
            >
              <Typography variant="subtitle2" sx={{ px: 2, py: 1, color: 'text.secondary' }}>
                选择强调色
              </Typography>
              {(
                Object.keys(systemColors).filter(k =>
                  ['blue', 'purple', 'green', 'orange'].includes(k)
                ) as ColorPalette[]
              ).map(p => (
                <MenuItem
                  key={p}
                  onClick={() => {
                    setPalette(p)
                    setAnchorElPalette(null)
                  }}
                  selected={palette === p}
                  sx={{ gap: 2 }}
                >
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      bgcolor: systemColors[p as keyof typeof systemColors].light,
                    }}
                  />
                  <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                    {p}
                  </Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{
          width: { md: isCollapsed ? collapsedDrawerWidth : drawerWidth },
          flexShrink: { md: 0 },
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: isCollapsed ? collapsedDrawerWidth : drawerWidth,
              border: 'none',
            },
          }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: isCollapsed ? collapsedDrawerWidth : drawerWidth,
              borderRight: `1px solid ${theme.palette.divider}`,
              backgroundColor: alpha(theme.palette.background.paper, 0.8),
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
              }),
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${isCollapsed ? collapsedDrawerWidth : drawerWidth}px)` },
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden',
          bgcolor: 'background.default',
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar />
        <Suspense
          fallback={
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
              <CircularProgress />
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
              p: { xs: 2, sm: 4 },
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
