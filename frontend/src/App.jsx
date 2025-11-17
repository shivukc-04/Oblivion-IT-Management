import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";
import api from "../src/services/axiosConfig.js";

export default function App() {
	const [users, setUsers] = useState([]);
	const navigate = useNavigate();
	async function fetchUsers() {
		try {
			const response = await api.get("/users");
			setUsers(response.data);
		} catch (error) {
			if (error.response.status === 401) {
				toast.error("You are not logged in");
				navigate("/login");
				return;
			}
			if (error.response.status === 403) {
				toast.error("Token Expired. Login Again");
				navigate("/login");
				return;
			}
			console.error("Error:", error);
		}
	}

	return (
		<div data-theme="corporate" className="min-h-screen bg-base-200 p-8">
			     {" "}
			<button className="btn btn-primary mb-4" onClick={fetchUsers}>
				        Show All Users      {" "}
			</button>
			     {" "}
			<ul className="space-y-2">
				       {" "}
				{users.map((user, index) => (
					<li key={index} className="bg-white p-3 rounded shadow">
						            {user.userId}         {" "}
					</li>
				))}
				     {" "}
			</ul>
			   {" "}
		</div>
	);
}
