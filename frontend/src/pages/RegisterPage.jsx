import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/axiosConfig.js";

export default function RegisterPage({ adminRegistration = false }) {
	const [userId, setUserId] = useState("");
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [email, setEmail] = useState("");
	const [role, setRole] = useState("viewer");
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	async function handleSubmit(event) {
		event.preventDefault();
		if (
			!userId.trim() ||
			!username.trim() ||
			!password.trim() ||
			!email.trim()
		) {
			toast.error("Required fields are empty");
			return;
		}

		setLoading(true);
		try {
			const endpoint = adminRegistration
				? "/auth/admin/register"
				: "/auth/register";
			const payload = { userId, username, password, email };
			if (adminRegistration) {
				payload.role = role;
			}
			await api.post(endpoint, payload);
			toast.success("New user created");
			navigate("/login");
		} catch (error) {
			if (error.response?.status === 409) {
				toast.error("User already exists");
			} else if (error.response?.status === 403) {
				toast.error("Access denied. Insufficient role");
				navigate("/");
			} else if (error.response?.status === 400) {
				toast.error("Sign up failed");
			} else {
				toast.error("Unable to create user");
				console.error(error);
			}
		} finally {
			setLoading(false);
		}
	}

	return (
		<div data-theme="fantasy" className="min-h-screen bg-base-200">
			<div className="container mx-auto px-4 py-8">
				<div className="max-w-2xl mx-auto">
					<Link to="/" className="btn btn-ghost mb-6">
						<ArrowLeftIcon className="size-5" />
						Back to Home
					</Link>
					<div className="card bg-base-100">
						<div className="card-body">
							<h1 className="card-title text-4xl mx-auto my-auto">
								{adminRegistration ? "Create User" : "Sign Up"}
							</h1>
							<form onSubmit={handleSubmit}>
								<div className="form-control mb-4">
									<label className="label" htmlFor="userId">
										<span className="label-text">User ID</span>
									</label>
									<input
										id="userId"
										type="text"
										placeholder="Type your user ID"
										className="input input-bordered"
										value={userId}
										onChange={(event) => setUserId(event.target.value)}
										required
									/>
								</div>
								<div className="form-control mb-4">
									<label className="label" htmlFor="username">
										<span className="label-text">Username</span>
									</label>
									<input
										id="username"
										type="text"
										placeholder="Type your username"
										className="input input-bordered"
										value={username}
										onChange={(event) => setUsername(event.target.value)}
										required
									/>
								</div>
								<div className="form-control mb-4">
									<label className="label" htmlFor="password">
										<span className="label-text">Password</span>
									</label>
									<input
										id="password"
										type="password"
										placeholder="Type your password"
										className="input input-bordered"
										value={password}
										onChange={(event) => setPassword(event.target.value)}
										required
									/>
								</div>
								{adminRegistration && (
									<div className="form-control mb-4">
										<label className="label" htmlFor="role">
											<span className="label-text">Role</span>
										</label>
										<select
											id="role"
											className="select select-bordered"
											value={role}
											onChange={(event) => setRole(event.target.value)}
										>
											<option value="viewer">Viewer</option>
											<option value="operator">Operator</option>
											<option value="admin">Admin</option>
										</select>
									</div>
								)}
								<div className="form-control mb-4">
									<label className="label" htmlFor="email">
										<span className="label-text">Email</span>
									</label>
									<input
										id="email"
										type="email"
										placeholder="Type your email"
										className="input input-bordered"
										value={email}
										onChange={(event) => setEmail(event.target.value)}
										required
									/>
								</div>
								<div className="card-actions justify-end">
									<button
										type="submit"
										className="btn btn-secondary"
										disabled={loading}
									>
										{loading ? "Signing up..." : "Sign Up"}
									</button>
								</div>
							</form>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
