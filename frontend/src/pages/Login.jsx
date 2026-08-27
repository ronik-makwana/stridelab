import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";

import { loginUser } from "../services/authApi.js";
import useAuthStore from "../store/authStore.js";
import { loginSchema } from "../validations/loginSchema.js";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, setUser } = useAuthStore();
  const [formValues, setFormValues] = useState({ email: "", password: "" });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      // Redirect based on user role
      if (user.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        // Redirect to the page they came from, or home
        const from = location.state?.from || "/";
        navigate(from);
      }
    }
  }, [loading, navigate, user, location.state]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormErrors({});

    const parsed = loginSchema.safeParse(formValues);
    if (!parsed.success) {
      setFormErrors(parsed.error.flatten().fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await loginUser(parsed.data);
      setUser(data.user);
      toast.success("Welcome back!");
      // Redirect admins to admin dashboard, regular users to where they came from
      if (data.user?.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        // Redirect to the page they came from, or home
        const from = location.state?.from || "/";
        navigate(from);
      }
    } catch (error) {
      toast.error(error.message || "Unable to sign in");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-9rem)] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Log in to access your account and continue shopping.
          </p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700"
            >
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={formValues.email}
              onChange={handleChange}
              className={`w-full rounded-xl border px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                formErrors.email ? "border-red-400" : "border-slate-200"
              }`}
              autoComplete="email"
            />
            {formErrors.email && (
              <p className="text-xs text-red-500">{formErrors.email[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <label htmlFor="password" className="font-medium text-slate-700">
                Password
              </label>
              <a href="#" className="text-blue-600 hover:text-blue-700">
                Forgot password?
              </a>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formValues.password}
              onChange={handleChange}
              className={`w-full rounded-xl border px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                formErrors.password ? "border-red-400" : "border-slate-200"
              }`}
              autoComplete="current-password"
            />
            {formErrors.password && (
              <p className="text-xs text-red-500">{formErrors.password[0]}</p>
            )}
          </div>
          <button
            type="submit"
            className="w-full rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <p className="mt-8 text-center text-sm text-slate-500">
          Don&apos;t have an account?{" "}
          <Link
            to="/register"
            className="font-medium text-blue-600 hover:text-blue-700"
          >
            Create one now
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
