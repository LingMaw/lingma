import { Navigate, createHashRouter } from 'react-router-dom'
import MainLayout from '@/frontend/shared/layouts/MainLayout'
import LoginPage from '@/features/user/frontend/pages/login'
import RegisterPage from '@/features/user/frontend/pages/register'
import DashboardPage from '@/features/dashboard/frontend/pages/dashboard'
import NovelGeneratorPage from '@/features/novel_generator/frontend/pages/NovelGeneratorPage'
import NovelProjectListPage from '@/features/novel_project/frontend/pages/ProjectListPage'
import NovelProjectDetailPage from '@/features/novel_project/frontend/pages/ProjectDetailPage'
import NovelProjectViewPage from '@/features/novel_project/frontend/pages/ProjectViewPage'
import ProjectEditorPage from '@/features/novel_project/frontend/pages/ProjectEditorPage'
import ProfilePage from '@/features/user/frontend/pages/ProfilePage'

// 大纲和章节系统
import OutlinePage from '@/features/novel_outline/frontend/pages/OutlinePage'
import ChapterListPage from '@/features/chapter/frontend/pages/ChapterListPage'
import ChapterEditorPage from '@/features/chapter/frontend/pages/ChapterEditorPage'

// 人物设定系统
import { ProjectCharacterListPage, CharacterDetailPage, AllCharactersPage, CharacterGraphPage } from '@/features/character/frontend/pages'

// Token统计系统
import { TokenStatisticsPage } from '@/features/token_statistics/frontend'

import ProtectedRoute from './ProtectedRoute'

const router = createHashRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    errorElement: <Navigate to="/" />,
    children: [
      { path: '/', element: <Navigate to="/dashboard" replace /> },
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/profile', element: <ProfilePage /> },
      { path: '/token-statistics', element: <TokenStatisticsPage /> },
      { path: '/novel_generator', element: <NovelGeneratorPage /> },
      { path: '/novel_project', element: <NovelProjectListPage /> },
      { path: '/novel_projects/create', element: <NovelProjectDetailPage /> },
      { path: '/novel_projects/:id/edit', element: <NovelProjectDetailPage /> },
      { path: '/novel_projects/:id/content-editor', element: <ProjectEditorPage /> },
      { path: '/novel_projects/:id', element: <NovelProjectViewPage /> },
      // 大纲和章节路由
      { path: '/novel_projects/:projectId/outline', element: <OutlinePage /> },
      { path: '/novel_projects/:projectId/chapters', element: <ChapterListPage /> },
      { path: '/novel_projects/:projectId/chapters/:chapterId', element: <ChapterEditorPage /> },
      // 人物设定路由
      { path: '/characters', element: <AllCharactersPage /> },
      { path: '/characters/graph', element: <CharacterGraphPage /> },
      { path: '/novel_projects/:projectId/characters', element: <ProjectCharacterListPage /> },
      { path: '/novel_projects/:projectId/characters/graph', element: <CharacterGraphPage /> },
      { path: '/characters/:characterId', element: <CharacterDetailPage /> },
    ],
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
])

export default router
