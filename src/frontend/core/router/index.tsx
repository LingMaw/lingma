import { Navigate, createHashRouter } from 'react-router-dom'
import MainLayout from '@/frontend/shared/layouts/MainLayout'
import LoginPage from '@/features/user/frontend/pages/login'
import RegisterPage from '@/features/user/frontend/pages/register'
import DashboardPage from '@/features/dashboard/frontend/pages/dashboard'
import LiveLogsPage from '@/features/monitor/frontend/pages/LiveLogs'
import NovelGeneratorPage from '@/features/novel_generator/frontend/pages/NovelGeneratorPage'
import NovelProjectListPage from '@/features/novel_project/frontend/pages/ProjectListPage'
import NovelProjectDetailPage from '@/features/novel_project/frontend/pages/ProjectDetailPage'
import NovelProjectViewPage from '@/features/novel_project/frontend/pages/ProjectViewPage'
import SettingsPage from '@/features/user/frontend/pages/SettingsPage'

import ProtectedRoute from './ProtectedRoute'

const router = createHashRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    errorElement: <Navigate to="/login" />,
    children: [
      { path: '/', element: <Navigate to="/dashboard" replace /> },
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/settings', element: <SettingsPage /> },
      { path: '/novel_generator', element: <NovelGeneratorPage /> },
      { path: '/monitor/logs', element: <LiveLogsPage /> },
      { path: '/novel_project', element: <NovelProjectListPage /> },
      { path: '/novel_projects/create', element: <NovelProjectDetailPage /> },
      { path: '/novel_projects/:id/edit', element: <NovelProjectDetailPage /> },
      { path: '/novel_projects/:id', element: <NovelProjectViewPage /> },
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
