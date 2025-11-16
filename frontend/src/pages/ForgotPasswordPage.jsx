import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../services/axiosConfig";

const ForgotPasswordPage = () => {
	const [userId, setUserId] = useState("");
	const [email, setEmail] = useState("");
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isRedirecting, setIsRedirecting] = useState(false);
	const navigate = useNavigate();

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (isSubmitting || isRedirecting) return; // Prevent multiple submissions

		setIsSubmitting(true);
		try {
			const response = await axios.post("/auth/forgot-password", {
				userId,
				email,
			});
			setMessage(response.data.message);
			setError("");
			// Clear form
			setUserId("");
			setEmail("");
			// Set redirecting state
			setIsRedirecting(true);
			// After 3 seconds, redirect to login
			setTimeout(() => {
				navigate("/login");
			}, 3000);
		} catch (err) {
			setError(
				err.response?.data?.message ||
					"An error occurred while processing your request",
			);
			setMessage("");
			setIsSubmitting(false);
		}
	};

	return (
		<div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
			<div className="sm:mx-auto sm:w-full sm:max-w-md">
				<h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
					Forgot Password
				</h2>
				<p className="mt-2 text-center text-sm text-gray-600">
					Enter your User ID and Email. We'll notify administrators to help you
					reset your password.
				</p>
			</div>

			<div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
				<div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
					<form className="space-y-6" onSubmit={handleSubmit}>
						<div>
							<label
								htmlFor="userId"
								className="block text-sm font-medium text-gray-700"
							>
								User ID
							</label>
							<div className="mt-1">
								<input
									id="userId"
									name="userId"
									type="text"
									required
									value={userId}
									onChange={(e) => setUserId(e.target.value)}
									className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
								/>
							</div>
						</div>

						<div>
							<label
								htmlFor="email"
								className="block text-sm font-medium text-gray-700"
							>
								Email
							</label>
							<div className="mt-1">
								<input
									id="email"
									name="email"
									type="email"
									required
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
								/>
							</div>
						</div>

						{message && (
							<div className="rounded-md bg-green-50 p-4">
								<div className="flex">
									<div className="flex-shrink-0">
										<svg
											className="h-5 w-5 text-green-400"
											viewBox="0 0 20 20"
											fill="currentColor"
										>
											<path
												fillRule="evenodd"
												d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
												clipRule="evenodd"
											/>
										</svg>
									</div>
									<div className="ml-3">
										<p className="text-sm font-medium text-green-800">
											{message}
										</p>
									</div>
								</div>
							</div>
						)}

						{error && (
							<div className="rounded-md bg-red-50 p-4">
								<div className="flex">
									<div className="flex-shrink-0">
										<svg
											className="h-5 w-5 text-red-400"
											viewBox="0 0 20 20"
											fill="currentColor"
										>
											<path
												fillRule="evenodd"
												d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
												clipRule="evenodd"
											/>
										</svg>
									</div>
									<div className="ml-3">
										<p className="text-sm font-medium text-red-800">{error}</p>
									</div>
								</div>
							</div>
						)}

						<div>
							<button
								type="submit"
								disabled={isSubmitting || isRedirecting}
								className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
									isSubmitting || isRedirecting
										? "bg-indigo-400 cursor-not-allowed"
										: "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
								}`}
							>
								{isSubmitting
									? "Submitting..."
									: isRedirecting
										? "Redirecting..."
										: "Submit Request"}
							</button>
						</div>

						<div className="text-sm text-center">
							<button
								type="button"
								onClick={() => !isRedirecting && navigate("/login")}
								disabled={isRedirecting}
								className={`font-medium ${
									isRedirecting
										? "text-indigo-400 cursor-not-allowed"
										: "text-indigo-600 hover:text-indigo-500"
								}`}
							>
								Back to Login
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
};

export default ForgotPasswordPage;
