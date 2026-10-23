import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import { AuthContext } from "../services/authContext.js";

export default function AuthenticatedLayout() {
	const { user, loading } = useContext(AuthContext);

	if (loading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				Loading...
			</div>
		);
	}

	if (!user) {
		return <Navigate to="/login" replace />;
	}

	return (
		<>
			<Navbar />
			<Outlet />
		</>
	);
}
