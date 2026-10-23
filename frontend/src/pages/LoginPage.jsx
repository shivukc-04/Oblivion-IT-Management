import axios from "axios";
import { ArrowLeftIcon, LogIn } from "lucide-react";
import { useContext, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../services/authContext.js";

const LoginPage = () => {
	const [userId, setUserId] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate("/");
	const auth = useContext(AuthContext);

	async function handleSubmit(e) {
		e.preventDefault();
		if (!userId.trim() || !password.trim()) {
			toast.error("Required fields are empty");
			return;
		}
		setLoading(true);
		try {
			const res = await axios.post("http://localhost:5000/api/auth/login", {
				userId,
				password,
			});
			const { token, user } = res.data;
			localStorage.setItem("authToken", token);
			localStorage.setItem("userRole", user.role);
			auth?.login(user);
			toast.success("You are logged in");
			navigate("/dashboard");
		} catch (error) {
			if (error.response?.status === 401) {
				toast.error("User ID or password is incorrect");
			} else if (error.response?.status === 404) {
				toast.error("Unable to login. Please try again later.");
			} else {
				toast.error("Something went wrong");
			}
			console.error(error);
		} finally {
			setLoading(false);
		}
	}

	return (
		<div
			data-theme="fantasy"
			className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary/20 to-base-200"
		>
			<div className="w-full max-w-md p-6">
				{/* Back Button */}
				<Link
					to="/"
					className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-secondary transition mb-6"
				>
					<ArrowLeftIcon className="size-4" />
					Back to Home
				</Link>

				{/* Login Card */}
				<div className="card bg-base-100 shadow-2xl border border-base-300">
					<div className="card-body">
						{/* Header */}
						<div className="flex flex-col items-center mb-6">
							<div className="bg-secondary/10 p-3 rounded-full">
								<LogIn className="size-6 text-secondary" />
							</div>
							<h2 className="card-title text-3xl font-bold mt-3">
								Welcome Back
							</h2>
							<p className="text-gray-500 text-sm">
								Please sign in to continue
							</p>
						</div>

						{/* Form */}
						<form onSubmit={handleSubmit}>
							<div className="form-control mb-4">
								<label className="label" htmlFor="userId">
									<span className="label-text font-semibold">User ID</span>
								</label>
								<input
									id="userId"
									type="text"
									placeholder="Type your user ID"
									className="input input-bordered focus:input-secondary transition"
									value={userId}
									onChange={(e) => setUserId(e.target.value)}
								/>
							</div>

							<div className="form-control mb-6">
								<label className="label" htmlFor="password">
									<span className="label-text font-semibold">Password</span>
								</label>
								<input
									id="password"
									type="password"
									placeholder="Type your password"
									className="input input-bordered focus:input-secondary transition"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
								/>
							</div>

							<div className="flex justify-between items-center mb-4">
								<Link
									to="/forgot-password"
									className="text-sm text-secondary hover:underline"
								>
									Forgot Password?
								</Link>
								<Link
									to="/register"
									className="text-sm text-secondary hover:underline"
								>
									Create an account
								</Link>
							</div>

							<div className="card-actions justify-center">
								<button
									type="submit"
									className="btn btn-secondary w-full"
									disabled={loading}
								>
									{loading ? "Logging in..." : "Login"}
								</button>
							</div>
						</form>
					</div>
				</div>
			</div>
		</div>
	);
};

export default LoginPage;
