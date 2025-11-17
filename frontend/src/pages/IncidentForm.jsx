import { useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import RoleRoute from "../components/RoleRoute.jsx";
import { AuthContext } from "../services/authContext.js";
import incidentsService from "../services/incidentsService.js";

export default function IncidentForm() {
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [priority, setPriority] = useState("medium");
	const [assignedTo, setAssignedTo] = useState("");
	const [loading, setLoading] = useState(false);
	const [users, setUsers] = useState([]);
	const [loadingUsers, setLoadingUsers] = useState(true);
	const { user } = useContext(AuthContext);
	const navigate = useNavigate();

	// Fetch available users
	useEffect(() => {
		async function fetchUsers() {
			try {
				const response = await fetch("http://localhost:5250/api/users", {
					headers: {
						Authorization: `Bearer ${localStorage.getItem("authToken")}`,
					},
				});
				if (!response.ok) throw new Error("Failed to fetch users");
				const data = await response.json();
				setUsers(data);
			} catch (err) {
				console.error(err);
				toast.error("Failed to load users list");
			} finally {
				setLoadingUsers(false);
			}
		}
		fetchUsers();
	}, []);

	async function handleSubmit(e) {
		e.preventDefault();
		if (!title.trim() || !description.trim() || !assignedTo.trim()) {
			toast.error("Please fill required fields");
			return;
		}
		setLoading(true);
		try {
			const payload = { title, description, priority, assignedTo };
			await incidentsService.createIncident(payload);
			toast.success("Incident created");
			navigate("/incidents");
		} catch (err) {
			console.error(err);
			toast.error("Failed to create incident");
		} finally {
			setLoading(false);
		}
	}

	// protect this page with RoleRoute wrapper in router
	return (
		<div className="p-6">
			<div className="flex items-center gap-4 mb-4">
				<Link to="/incidents" className="btn btn-ghost">
					Back
				</Link>
				<h1 className="text-2xl font-bold">Create Incident</h1>
			</div>
			<form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
				<div>
					<label className="label">Title</label>
					<input
						className="input input-bordered w-full"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
					/>
				</div>
				<div>
					<label className="label">Description</label>
					<textarea
						className="textarea textarea-bordered w-full"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
					/>
				</div>
				<div>
					<label className="label">Priority</label>
					<select
						className="select select-bordered"
						value={priority}
						onChange={(e) => setPriority(e.target.value)}
					>
						<option value="lowest">lowest</option>
						<option value="low">low</option>
						<option value="medium">medium</option>
						<option value="high">high</option>
						<option value="highest">highest</option>
					</select>
				</div>
				<div>
					<label className="label">Assigned To</label>
					{loadingUsers ? (
						<div className="animate-pulse bg-base-300 h-12 rounded-lg"></div>
					) : (
						<select
							className="select select-bordered w-full"
							value={assignedTo}
							onChange={(e) => setAssignedTo(e.target.value)}
							required
						>
							<option value="">Select a user</option>
							{users.map((user) => (
								<option key={user._id} value={user._id}>
									{user.username} ({user.role})
								</option>
							))}
						</select>
					)}
				</div>
				<div className="pt-2">
					<button className="btn btn-primary" disabled={loading}>
						{loading ? "Creating..." : "Create Incident"}
					</button>
				</div>
			</form>
		</div>
	);
}
