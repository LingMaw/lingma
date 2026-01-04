import { useMemo } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import type { BreadcrumbItem } from '@/frontend/shared'

interface UseBreadcrumbOptions {
  /**
   * 自定义面包屑项（覆盖自动生成）
   */
  items?: BreadcrumbItem[]
}

/**
 * 面包屑导航 Hook
 * 根据当前路由自动生成或使用自定义面包屑
 * 
 * @example
 * // 自动生成
 * const breadcrumbs = useBreadcrumb()
 * 
 * @example
 * // 自定义
 * const breadcrumbs = useBreadcrumb({
 *   items: [
 *     { label: '项目列表', path: '/novel_project' },
 *     { label: project?.title || '加载中...', path: `/novel_projects/${id}` },
 *     { label: '编辑', isCurrent: true }
 *   ]
 * })
 */
export function useBreadcrumb(options?: UseBreadcrumbOptions): BreadcrumbItem[] | null {
  const location = useLocation()
  const params = useParams()

  return useMemo(() => {
    // 如果提供了自定义面包屑，直接返回
    if (options?.items) {
      return options.items
    }

    // 根据路由自动生成面包屑
    const pathname = location.pathname
    const items: BreadcrumbItem[] = []

    // Dashboard
    if (pathname === '/dashboard') {
      return null // Dashboard 不需要面包屑
    }

    // 小说项目列表
    if (pathname === '/novel_project') {
      items.push({ label: '小说项目', isCurrent: true })
    }

    // 小说项目详情/编辑
    if (pathname.match(/^\/novel_projects\/\d+$/)) {
      items.push({ label: '小说项目', path: '/novel_project' })
      items.push({ label: '项目详情', isCurrent: true })
    }

    if (pathname.match(/^\/novel_projects\/\d+\/edit$/)) {
      items.push({ label: '小说项目', path: '/novel_project' })
      items.push({ label: '编辑项目', isCurrent: true })
    }

    // 章节列表
    if (pathname.match(/^\/novel_projects\/\d+\/chapters$/)) {
      items.push({ label: '小说项目', path: '/novel_project' })
      if (params.projectId) {
        items.push({ 
          label: '项目详情', 
          path: `/novel_projects/${params.projectId}` 
        })
      }
      items.push({ label: '章节列表', isCurrent: true })
    }

    // 章节编辑
    if (pathname.match(/^\/novel_projects\/\d+\/chapters\/\d+$/)) {
      items.push({ label: '小说项目', path: '/novel_project' })
      if (params.projectId) {
        items.push({ 
          label: '项目详情', 
          path: `/novel_projects/${params.projectId}` 
        })
        items.push({ 
          label: '章节列表', 
          path: `/novel_projects/${params.projectId}/chapters` 
        })
      }
      items.push({ label: '编辑章节', isCurrent: true })
    }

    // 大纲页面
    if (pathname.match(/^\/novel_projects\/\d+\/outline$/)) {
      items.push({ label: '小说项目', path: '/novel_project' })
      if (params.projectId) {
        items.push({ 
          label: '项目详情', 
          path: `/novel_projects/${params.projectId}` 
        })
      }
      items.push({ label: '大纲', isCurrent: true })
    }

    // 角色管理
    if (pathname === '/characters') {
      items.push({ label: '角色管理', isCurrent: true })
    }

    if (pathname.match(/^\/novel_projects\/\d+\/characters$/)) {
      items.push({ label: '小说项目', path: '/novel_project' })
      if (params.projectId) {
        items.push({ 
          label: '项目详情', 
          path: `/novel_projects/${params.projectId}` 
        })
      }
      items.push({ label: '角色管理', isCurrent: true })
    }

    if (pathname.match(/^\/characters\/\d+$/)) {
      items.push({ label: '角色管理', path: '/characters' })
      items.push({ label: '角色详情', isCurrent: true })
    }

    // 如果没有匹配到任何路由，返回null（不显示面包屑）
    return items.length > 0 ? items : null
  }, [location.pathname, params, options?.items])
}
