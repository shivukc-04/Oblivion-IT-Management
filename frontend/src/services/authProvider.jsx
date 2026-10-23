import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import { AuthContext } from "./authContext";

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	const login = (authenticatedUser) => {
		setUser(authenticatedUser);
	};

	const logout = () => {
		localStorage.removeItem("authToken");
		localStorage.removeItem("userRole");
		setUser(null);
	};

	useEffect(() => {
		const token = localStorage.getItem("authToken");
		if (token) {
			try {
				const decoded = jwtDecode(token);
				console.log({ ...decoded });
				setUser({ ...decoded });
			} catch (err) {
				console.error("Invalid token", err);
				localStorage.removeItem("authToken");
			}
		}
		setLoading(false);
	}, []);
	// useEffect(()=>{
	//   console.log(`inside useEffect user = ${user.role}`)
	// },[user])

	// const login = (token) => {
	//   localStorage.setItem('token', token);
	//   const decoded = jwtDecode(token);
	//   setUser({ ...decoded });
	// };

	// // ✅ Add logout function
	// const logout = () => {
	//   localStorage.removeItem('token');
	//   setUser(null);
	// };

	return (
		<AuthContext.Provider value={{ user, loading, login, logout }}>
			{children}
		</AuthContext.Provider>
	);
};
