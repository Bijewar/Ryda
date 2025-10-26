"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import {
  ArrowLeft,
  Car,
  Eye,
  EyeOff,
  User,
  Truck,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

const VIEWS = {
  LOGIN: "login",
  FORGOT_PASSWORD: "forgotPassword",
};

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [accountType, setAccountType] = useState("user");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState(VIEWS.LOGIN);

  // Updated Login Handler using NextAuth
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    setIsSubmitting(true);
    setMessage("");
    setMessageType("");

    try {
      const email = e.target.email.value;
      const password = e.target.password.value;

      if (!email || !password) {
        throw new Error("Please fill in all fields");
      }

      // Use NextAuth's signIn instead of custom fetch
      const result = await signIn("credentials", {
        email,
        password,
        accountType,
        redirect: false, // Don't redirect automatically
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      if (result?.ok) {
        setMessage("Login successful!");
        setMessageType("success");

        // Get the session to access user data
        const session = await getSession();

        // Redirect based on account type
        let redirectUrl = "/";
        if (accountType === "driver") {
          // Get driver ID from the session - should always be available
          const driverId = session?.user?.id;
          if (!driverId) {
            throw new Error("Driver ID not found in session");
          }
          redirectUrl = `/drivers/${driverId}`;
        }

        // Small delay to show success message
        setTimeout(() => {
          router.push(redirectUrl);
          router.refresh(); // Refresh to update session
        }, 500);
      }

    } catch (error) {
      console.error("Login error:", error);
      setMessage(error.message || "Login failed. Please try again.");
      setMessageType("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    setIsSubmitting(true);
    setMessage("");
    setMessageType("");

    try {
      const email = e.target.email.value;

      if (!email) {
        throw new Error("Please enter your email address.");
      }

      const response = await fetch("/api/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          accountType,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to initiate password reset.");
      }

      setMessage(
        result.message ||
          "Password reset link sent! Check your email (including spam folder)."
      );
      setMessageType("success");

    } catch (error) {
      console.error("Forgot password error:", error);
      setMessage(
        error.message ||
          "Could not process request. Please check your email and try again."
      );
      setMessageType("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const AccountTypeToggle = (
    <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
      <button
        type="button"
        onClick={() => {
          setAccountType("user");
          setMessage("");
        }}
        className={`flex-1 py-3 px-4 rounded-md transition-all duration-200 font-medium ${
          accountType === "user"
            ? "bg-white text-blue-600 shadow-sm"
            : "text-gray-600 hover:text-gray-800"
        }`}
      >
        <div className="flex items-center justify-center gap-2">
          <User className="h-4 w-4" />
          Passenger
        </div>
      </button>
      <button
        type="button"
        onClick={() => {
          setAccountType("driver");
          setMessage("");
        }}
        className={`flex-1 py-3 px-4 rounded-md transition-all duration-200 font-medium ${
          accountType === "driver"
            ? "bg-white text-blue-600 shadow-sm"
            : "text-gray-600 hover:text-gray-800"
        }`}
      >
        <div className="flex items-center justify-center gap-2">
          <Truck className="h-4 w-4" />
          Driver
        </div>
      </button>
    </div>
  );

  const MessageDisplay = (
    message && (
      <div
        className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
          messageType === "success"
            ? "bg-green-50 text-green-800 border border-green-200"
            : "bg-red-50 text-red-800 border border-red-200"
        }`}
      >
        {messageType === "success" ? (
          <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
        ) : (
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
        )}
        <span className="text-sm">{message}</span>
      </div>
    )
  );

  const LoginForm = (
    <>
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
        Log in to your account
      </h1>

      {MessageDisplay}
      {AccountTypeToggle}

      <form onSubmit={handleLoginSubmit} className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="login-email"
            className="block text-sm font-medium text-gray-700"
          >
            Email *
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your email"
          />
        </div>

        <div className="space-y-2 relative">
          <label
            htmlFor="login-password"
            className="block text-sm font-medium text-gray-700"
          >
            Password *
          </label>
          <input
            id="login-password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={6}
            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-9 text-gray-500 hover:text-gray-700 transition-colors"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              setViewMode(VIEWS.FORGOT_PASSWORD);
              setMessage("");
            }}
            className="text-sm text-blue-600 hover:underline"
          >
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              Logging in...
            </>
          ) : (
            "Log In"
          )}
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="text-blue-600 font-medium hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </>
  );

  const ForgotPasswordForm = (
    <>
      <h1 className="text-2xl font-bold mb-4 text-center text-gray-800">
        Reset Your Password
      </h1>
      <p className="text-center text-gray-600 mb-6 text-sm">
        Enter the email associated with your account to receive a reset link.
      </p>

      {MessageDisplay}
      {AccountTypeToggle}

      <form onSubmit={handleForgotPasswordSubmit} className="space-y-6">
        <div className="space-y-2">
          <label
            htmlFor="forgot-email"
            className="block text-sm font-medium text-gray-700"
          >
            Email Address *
          </label>
          <input
            id="forgot-email"
            name="email"
            type="email"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your email"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              Sending Link...
            </>
          ) : (
            "Send Reset Link"
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={() => {
            setViewMode(VIEWS.LOGIN);
            setMessage("");
          }}
          className="text-sm text-blue-600 hover:underline flex items-center justify-center gap-1 mx-auto"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </button>
      </div>
    </>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-black text-white p-4 shadow-lg">
        <div className="container mx-auto flex items-center">
          <Link
            href="/"
            className="flex items-center gap-2 hover:bg-gray-800 p-2 rounded transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back</span>
          </Link>
          <div className="mx-auto flex items-center gap-2">
            <Car className="h-6 w-6 text-yellow-400" />
            <span className="font-bold text-xl">Ryda</span>
          </div>
          <div className="w-9" />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 min-h-[450px]">
          {viewMode === VIEWS.LOGIN && LoginForm}
          {viewMode === VIEWS.FORGOT_PASSWORD && ForgotPasswordForm}
        </div>
      </main>
    </div>
  );
}
