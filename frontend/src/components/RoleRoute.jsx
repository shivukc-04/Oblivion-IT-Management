import { useContext } from "react";
import toast from "react-hot-toast";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../services/authContext.js";

export default function RoleRoute({ children, allowedRoles = [] }) {
	const { user, loading } = useContext(AuthContext);

	if (loading)
		return (
			<div className="flex justify-center items-center min-h-screen">
				Loading...
			</div>
		);

	if (!user) {
		toast.error("Please login first");
		return <Navigate to="/login" replace />;
	}

	if (!allowedRoles.includes(user.role)) {
		toast.error("Access denied: insufficient role");
		return <Navigate to="/" replace />;
	}

	return children;
}
