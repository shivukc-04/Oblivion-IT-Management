import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import Dashboard from './components/dashboard/Dashboard.jsx'
import IncidentsList from './pages/IncidentsList.jsx'
import IncidentForm from './pages/IncidentForm.jsx'
import IncidentDetails from './pages/IncidentDetails.jsx'
import AuditLogsPage from './pages/auditLogsPage.jsx'
import ServersPage from './pages/ServersPage.jsx'
import TrendAnalysis from './pages/trendPage.jsx'
import { AuthProvider } from './services/authProvider.jsx'
import RoleRoute from './components/RoleRoute.jsx'
import AuthenticatedLayout from './components/AuthenticatedLayout.jsx'
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx'

const router = createBrowserRouter([
  {
    path: "/",
    element: <App/>,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/login",
    element: <LoginPage/>,
  },
  {
    path: "/forgot-password",
    element: <ForgotPasswordPage/>,
  },
  {
    element: <AuthenticatedLayout />,
    children: [
      {
        path: "/dashboard",
        element: (
          <RoleRoute allowedRoles={["admin","operator","viewer"]}>
            <Dashboard/>
          </RoleRoute>
        )
      },
      {
        path: "/servers",
        element: (
          <RoleRoute allowedRoles={["admin","operator"]}>
            <ServersPage />
          </RoleRoute>
        )
      },
      {
        path: "/incidents",
        element: (
          <RoleRoute allowedRoles={["admin","operator"]}>
            <IncidentsList/>
          </RoleRoute>
        ),
      },
      {
        path: "/incidents/new",
        element: (
          <RoleRoute allowedRoles={["admin","operator"]}>
            <IncidentForm/>
          </RoleRoute>
        ),
      },
      {
        path: "/incidents/:id",
        element: (
          <RoleRoute allowedRoles={["admin","operator"]}>
            <IncidentDetails/>
          </RoleRoute>
        ),
      },
      {
        path: "/trend",
        element: (
          <RoleRoute allowedRoles={["admin","operator"]}>
            <TrendAnalysis/>
          </RoleRoute>
        )
      },
      {
        path: "/audit-logs",
        element: (
          <RoleRoute allowedRoles={["admin"]}>
            <AuditLogsPage/>
          </RoleRoute>
        ),
      },
      {
        path: "/users",
        element: (
          <RoleRoute allowedRoles={["admin"]}>
            <RegisterPage adminRegistration />
          </RoleRoute>
        ),
      },
      {
        path: "/admin/register",
        element: (
          <RoleRoute allowedRoles={["admin"]}>
            <RegisterPage adminRegistration />
          </RoleRoute>
        ),
      },
      {
        path: "/admin/audit-logs",
        element: (
          <RoleRoute allowedRoles={["admin"]}>
            <AuditLogsPage/>
          </RoleRoute>
        ),
      },
      {
        path: "/admin/servers",
        element: (
          <RoleRoute allowedRoles={["admin","operator"]}>
            <ServersPage />
          </RoleRoute>
        )
      },
    ],
  },
])

const container = document.getElementById('root')
const root = createRoot(container)

root.render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster />
    </AuthProvider>
  </StrictMode>
)
