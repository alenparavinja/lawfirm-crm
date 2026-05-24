import { createBrowserRouter, Navigate } from 'react-router-dom';
import Shell from '@/components/layout/Shell';
import ProtectedRoute from './ProtectedRoute';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import ClientsPage from '@/pages/ClientsPage';
import CasesPage from '@/pages/CasesPage';
import StaffPage from '@/pages/StaffPage';
import NotFoundPage from '@/pages/NotFoundPage';
import CaseDetailPage from '@/pages/CaseDetailPage';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Shell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'clients', element: <ClientsPage /> },
      { path: 'cases', element: <CasesPage /> },
      { path: 'staff', element: <StaffPage /> },
      { path: 'cases/:id', element: <CaseDetailPage /> },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export default router;