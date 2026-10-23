import { useContext } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { AuthContext } from "../services/authContext.js";

const navLinkClass = ({ isActive }) =>
	`whitespace-nowrap rounded px-3 py-2 text-sm font-medium ${
		isActive ? "bg-primary text-primary-content" : "hover:bg-base-300"
	}`;

export default function Navbar() {
	const auth = useContext(AuthContext);
	const navigate = useNavigate();

	if (!auth?.user) {
		return null;
	}

	const { user, logout } = auth;
	const isAdmin = user.role === "admin";
	const canManageOperations = isAdmin || user.role === "operator";

	function handleLogout() {
		logout();
		navigate("/login", { replace: true });
	}

	return (
		<nav
			aria-label="Main navigation"
			className="navbar sticky top-0 z-50 flex flex-wrap gap-2 border-b border-base-300 bg-base-100 px-4 shadow-sm"
		>
			<div className="flex flex-wrap items-center gap-1">
				<NavLink to="/dashboard" className={navLinkClass}>
					📊 Dashboard
				</NavLink>
				{canManageOperations && (
					<NavLink to="/servers" className={navLinkClass}>
						🖥️ Servers
					</NavLink>
				)}
				{canManageOperations && (
					<NavLink to="/incidents" className={navLinkClass}>
						🚨 Incidents
					</NavLink>
				)}
				{canManageOperations && (
					<NavLink to="/trend" className={navLinkClass}>
						📈 Trends
					</NavLink>
				)}
				{isAdmin && (
					<NavLink to="/audit-logs" className={navLinkClass}>
						🔒 Audit Logs
					</NavLink>
				)}
				{isAdmin && (
					<NavLink to="/users" className={navLinkClass}>
						👥 User Management
					</NavLink>
				)}
			</div>
			<div className="ml-auto flex flex-wrap items-center gap-3">
				<output className="text-sm">
					Logged in as: {user.userId || user._id || user.email} ({user.role})
				</output>
				<button
					type="button"
					className="btn btn-sm btn-outline"
					onClick={handleLogout}
				>
					Logout
				</button>
			</div>
		</nav>
	);
}
