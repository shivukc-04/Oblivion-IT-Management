import { Link, useNavigate } from "react-router";
import { ArrowLeftIcon, LogIn } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";

const LoginPage = () => {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate("/");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!userId.trim() || !password.trim()) {
      toast.error("Required fields are empty");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5250/api/auth/login", {
        userId,
        password,
      });
      const { token, user } = res.data;
      localStorage.setItem("authToken", token);
      localStorage.setItem("userRole", user.role);
      toast.success("You are logged in");
      navigate("/");
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
    <div data-theme="fantasy" className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary/20 to-base-200">
      <div className="w-full max-w-md p-6">
        {/* Back Button */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-secondary transition mb-6"
        >
          <ArrowLeftIcon className="size-4" />
          Back to Home
        </Link>

        {/* Card */}
        <div className="card bg-base-100 shadow-2xl border border-base-300">
          <div className="card-body">
            <div className="flex flex-col items-center mb-6">
              <div className="bg-secondary/10 p-3 rounded-full">
                <LogIn className="size-6 text-secondary" />
              </div>
              <h2 className="card-title text-3xl font-bold mt-3">Welcome Back</h2>
              <p className="text-gray-500 text-sm">
                Please sign in to continue
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text font-semibold">User ID</span>
                </label>
                <input
                  type="text"
                  placeholder="Type your user ID"
                  className="input input-bordered focus:input-secondary transition"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                />
              </div>

              <div className="form-control mb-6">
                <label className="label">
                  <span className="label-text font-semibold">Password</span>
                </label>
                <input
                  type="password"
                  placeholder="Type your password"
                  className="input input-bordered focus:input-secondary transition"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
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
