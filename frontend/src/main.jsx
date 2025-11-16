import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";

// Pages & Components
import App from "./App.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import Dashboard from "./pages/dashboard.jsx";
import IncidentsList from "./pages/IncidentsList.jsx";
import IncidentForm from "./pages/IncidentForm.jsx";
import IncidentDetails from "./pages/IncidentDetails.jsx";
import AuditLogsPage from "./pages/auditLogsPage.jsx";
import ServersPage from "./pages/ServersPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";

import AdminRoute from "./components/AdminRoute.jsx";
import RoleRoute from "./components/RoleRoute.jsx";
import { AuthProvider } from "./services/authProvider.jsx";

const router = createBrowserRouter([
	{
		path: "/",
		element: <App />,
	},
	{
		path: "/incidents",
		element: <IncidentsList />,
	},
	{
		path: "/incidents/new",
		element: (
			<RoleRoute allowedRoles={["admin", "operator"]}>
				<IncidentForm />
			</RoleRoute>
		),
	},
	{
		path: "/incidents/:id",
		element: <IncidentDetails />,
	},
	{
		path: "/admin/register",
		element: (
			<AdminRoute>
				<RegisterPage />
			</AdminRoute>
		),
	},
	{
		path: "/admin/audit-logs",
		element: (
			<AdminRoute>
				<AuditLogsPage />
			</AdminRoute>
		),
	},
	{
		path: "/admin/servers",
		element: (
			<AdminRoute>
				<ServersPage />
			</AdminRoute>
		),
	},
	{
		path: "/dashboard",
		element: (
			<AdminRoute>
				<Dashboard />
			</AdminRoute>
		),
	},
	{
		path: "/login",
		element: <LoginPage />,
	},
	{
		path: "/forgot-password",
		element: <ForgotPasswordPage />,
	},
]);

const root = createRoot(document.getElementById("root"));

root.render(
	<StrictMode>
		<AuthProvider>
			<RouterProvider router={router} />
			<Toaster />
		</AuthProvider>
	</StrictMode>
);
