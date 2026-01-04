import { Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Breadcrumbs, 
  Link, 
  Typography, 
  Box,
  useMediaQuery,
  useTheme,
  alpha,
  Menu,
  MenuItem,
  IconButton,
} from '@mui/material'
import { 
  NavigateNext as NavigateNextIcon,
  MoreHoriz as MoreHorizIcon,
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import { useState } from 'react'

export interface BreadcrumbItem {
  /**
   * 显示文本
   */
  label: string
  /**
   * 跳转路径（可选，最后一项通常不需要）
   */
  path?: string
  /**
   * 是否高亮（当前页）
   */
  isCurrent?: boolean
}

export interface BreadcrumbProps {
  /**
   * 面包屑路径项
   */
  items: BreadcrumbItem[]
  /**
   * 最大显示项数（移动端折叠用）
   */
  maxItems?: number
}

/**
 * 面包屑导航组件
 * 
 * @example
 * <Breadcrumb items={[
 *   { label: '项目列表', path: '/novel_project' },
 *   { label: '《西游记》', path: '/novel_projects/1' },
 *   { label: '第一章', path: '/novel_projects/1/chapters/1' },
 *   { label: '编辑', isCurrent: true }
 * ]} />
 */
export default function Breadcrumb({ items, maxItems }: BreadcrumbProps) {
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)

  const handleClick = (item: BreadcrumbItem) => {
    if (item.path && !item.isCurrent) {
      navigate(item.path)
    }
  }

  // 移动端折叠逻辑
  const effectiveMaxItems = maxItems ?? (isMobile ? 3 : undefined)
  const shouldCollapse = effectiveMaxItems && items.length > effectiveMaxItems
  
  let displayItems = items
  let collapsedItems: BreadcrumbItem[] = []

  if (shouldCollapse) {
    // 保留首尾，中间折叠
    const firstItem = items[0]
    const lastItems = items.slice(-(effectiveMaxItems - 1))
    collapsedItems = items.slice(1, items.length - (effectiveMaxItems - 1))
    displayItems = [firstItem, ...lastItems]
  }

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        sx={{
          '& .MuiBreadcrumbs-separator': {
            color: 'text.disabled',
          },
        }}
      >
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1
          const isCurrent = item.isCurrent || isLast

          // 折叠菜单按钮
          if (shouldCollapse && index === 1 && collapsedItems.length > 0) {
            return (
              <Fragment key="collapsed">
                <IconButton
                  size="small"
                  onClick={(e) => setMenuAnchor(e.currentTarget)}
                  sx={{
                    p: 0.5,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.text.primary, 0.04),
                    },
                  }}
                >
                  <MoreHorizIcon fontSize="small" />
                </IconButton>
                <Menu
                  anchorEl={menuAnchor}
                  open={Boolean(menuAnchor)}
                  onClose={() => setMenuAnchor(null)}
                  PaperProps={{
                    sx: { mt: 1 },
                  }}
                >
                  {collapsedItems.map((collapsedItem, i) => (
                    <MenuItem
                      key={i}
                      onClick={() => {
                        handleClick(collapsedItem)
                        setMenuAnchor(null)
                      }}
                      disabled={!collapsedItem.path}
                    >
                      {collapsedItem.label}
                    </MenuItem>
                  ))}
                </Menu>
              </Fragment>
            )
          }

          return (
            <Fragment key={index}>
              {isCurrent ? (
                <Typography
                  color="text.primary"
                  fontWeight={600}
                  fontSize="0.875rem"
                  sx={{
                    color: 'primary.main',
                  }}
                >
                  {item.label}
                </Typography>
              ) : (
                <Link
                  component="button"
                  onClick={() => handleClick(item)}
                  underline="hover"
                  color="text.secondary"
                  fontSize="0.875rem"
                  sx={{
                    cursor: 'pointer',
                    border: 'none',
                    background: 'none',
                    padding: 0,
                    fontFamily: 'inherit',
                    transition: 'color 0.2s',
                    '&:hover': {
                      color: 'primary.main',
                    },
                  }}
                >
                  {item.label}
                </Link>
              )}
            </Fragment>
          )
        })}
      </Breadcrumbs>
    </Box>
  )
}
