import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import Dashboard from './pages/dashboard.jsx'
import IncidentsList from './pages/IncidentsList.jsx'
import IncidentForm from './pages/IncidentForm.jsx'
import IncidentDetails from './pages/IncidentDetails.jsx'
import AuditLogsPage from './pages/auditLogsPage.jsx'  // ADD THIS
import ServersPage from './pages/ServersPage.jsx'
import TrendAnalysis from './pages/trendPage.jsx'
import { AuthProvider } from './services/authProvider.jsx'
import RoleRoute from './components/RoleRoute.jsx'
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx'
// import AdminRoute from './components/AdminRoute.jsx'

const router = createBrowserRouter([
  {
    path: "/",
    element: <App/>,
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
    element: <IncidentDetails/>,
  },
  {
    path: "/admin/register",
    element: (
      <RoleRoute allowedRoles={"admin"}>
        <RegisterPage/>
      </RoleRoute>
    ),
  },
  {
    path: "/admin/audit-logs",  // ADD THIS ROUTE
    element: (
      <RoleRoute allowedRoles={"admin"}>
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
  {
    path: "/login",
    element: <LoginPage/>,
  },
  {
    path: "/forgot-password",
    element: <ForgotPasswordPage/>,
  },
  {
    path: "/dashboard",
    element: (
      <RoleRoute allowedRoles={["admin","operator","viewer"]}>
        <Dashboard/>
      </RoleRoute>
    )
  },
  {
    path: "/trends",
    element: (
      <RoleRoute allowedRoles={["admin","operator"]}>
        <TrendAnalysis/>
      </RoleRoute>
    )
  }
])

root.render(
	<StrictMode>
		<AuthProvider>
			<RouterProvider router={router} />
			<Toaster />
		</AuthProvider>
	</StrictMode>
);
