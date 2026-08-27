import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { registerUser } from "../services/authApi.js";
import { registerSchema } from "../validations/registerSchema.js";

const Register = () => {
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormErrors({});

    const parsed = registerSchema.safeParse(formValues);
    if (!parsed.success) {
      setFormErrors(parsed.error.flatten().fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const { confirmPassword: _CONFIRM, ...payload } = parsed.data;
      await registerUser(payload);
      toast.success("Account created. Please log in.");
      navigate("/login");
    } catch (error) {
      toast.error(error.message || "Unable to create account");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-9rem)] items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <h1 className="text-2xl font-semibold text-slate-900">
          Create an account
        </h1>
        <p className="mt-3 text-sm text-slate-500">
          Join StrideLab to manage orders, save your favorites, and unlock
          member-only drops.
        </p>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-slate-700"
              >
                First name
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                placeholder="Alex"
                value={formValues.firstName}
                onChange={handleChange}
                className={`w-full rounded-xl border px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                  formErrors.firstName ? "border-red-400" : "border-slate-200"
                }`}
                autoComplete="given-name"
              />
              {formErrors.firstName && (
                <p className="text-xs text-red-500">
                  {formErrors.firstName[0]}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-slate-700"
              >
                Last name
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Morgan"
                value={formValues.lastName}
                onChange={handleChange}
                className={`w-full rounded-xl border px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                  formErrors.lastName ? "border-red-400" : "border-slate-200"
                }`}
                autoComplete="family-name"
              />
              {formErrors.lastName && (
                <p className="text-xs text-red-500">{formErrors.lastName[0]}</p>
              )}
            </div>
          </div>
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
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700"
            >
              Password
            </label>
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
              autoComplete="new-password"
            />
            {formErrors.password && (
              <p className="text-xs text-red-500">{formErrors.password[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-slate-700"
            >
              Confirm password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={formValues.confirmPassword}
              onChange={handleChange}
              className={`w-full rounded-xl border px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                formErrors.confirmPassword
                  ? "border-red-400"
                  : "border-slate-200"
              }`}
              autoComplete="new-password"
            />
            {formErrors.confirmPassword && (
              <p className="text-xs text-red-500">
                {formErrors.confirmPassword[0]}
              </p>
            )}
          </div>
          <button
            type="submit"
            className="w-full rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating account..." : "Create Account"}
          </button>
        </form>
        <p className="mt-8 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-blue-600 hover:text-blue-700"
          >
            Log in instead
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
