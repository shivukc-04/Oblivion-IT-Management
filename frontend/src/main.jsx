import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import IncidentsList from './pages/IncidentsList.jsx'
import IncidentForm from './pages/IncidentForm.jsx'
import IncidentDetails from './pages/IncidentDetails.jsx'
import AuditLogsPage from './pages/AuditLogsPage.jsx'  // ADD THIS
import { AuthProvider } from './services/authProvider.jsx'
import AdminRoute from './components/AdminRoute.jsx'
import RoleRoute from './components/RoleRoute.jsx'

const router = createBrowserRouter([
  {
    path: "/",
    element: <App/>,
  },
  {
    path: "/incidents",
    element: <IncidentsList/>,
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
      <AdminRoute>
        <RegisterPage/>
      </AdminRoute>
    ),
  },
  {
    path: "/admin/audit-logs",  // ADD THIS ROUTE
    element: (
      <AdminRoute>
        <AuditLogsPage/>
      </AdminRoute>
    ),
  },
  {
    path: "/login",
    element: <LoginPage/>,
  }
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router}/>
      <Toaster/>
    </AuthProvider>
  </StrictMode>,
)
