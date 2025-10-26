// app/reset-password/page.jsx
"use client";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Car, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";

function ResetPasswordForm() {
    // Correct App Router hook for reading URL params
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const accountType = searchParams.get('type');
    
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isValidTokenUrl, setIsValidTokenUrl] = useState(false); // Only checks URL validity

    useEffect(() => {
        // Simple check to ensure required URL params are present
        if (token && accountType) {
            setIsValidTokenUrl(true);
            setMessage("");
        } else {
            setIsValidTokenUrl(false);
            setMessage("Invalid or missing reset token in the URL. Please use the link provided in your email.");
            setMessageType("error");
        }
    }, [token, accountType]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage("");
        setMessageType("");

        if (!isValidTokenUrl) {
            setMessage("Cannot proceed. Invalid token URL.");
            setMessageType("error");
            setIsSubmitting(false);
            return;
        }

        if (password.length < 6) {
            setMessage("Password must be at least 6 characters long.");
            setMessageType("error");
            setIsSubmitting(false);
            return;
        }

        if (password !== confirmPassword) {
            setMessage("Passwords do not match.");
            setMessageType("error");
            setIsSubmitting(false);
            return;
        }

        try {
            // Call the dedicated reset password API
            const response = await fetch("/api/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token, // Send the token retrieved from the URL
                    accountType,
                    newPassword: password,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                // This catches errors like 'Token expired' sent by the API
                throw new Error(result.message || "Password reset failed.");
            }

            setMessage(result.message || "Password updated successfully!");
            setMessageType("success");
            
        } catch (error) {
            console.error("Reset Password API Error:", error);
            setMessage(error.message || "Reset failed. Please try again or request a new link.");
            setMessageType("error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-black text-white p-4 shadow-lg">
                <div className="container mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 hover:bg-gray-800 p-2 rounded transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                        <span className="sr-only">Home</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <Car className="h-6 w-6 text-yellow-400" />
                        <span className="font-bold text-xl">Ryda</span>
                    </div>
                    <div className="w-9" />
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
                    <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
                        Set New Password
                    </h1>

                    {/* Message Display */}
                    {message && (
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
                    )}

                    {/* Show form only if URL token looks valid and we haven't succeeded yet */}
                    {isValidTokenUrl && messageType !== "success" ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* New Password */}
                            <div className="space-y-2 relative">
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    New Password *
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter new password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-9 text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2">
                                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                                    Confirm New Password *
                                </label>
                                <input
                                    id="confirm-password"
                                    name="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Confirm new password"
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
                                        Resetting...
                                    </>
                                ) : (
                                    "Reset Password"
                                )}
                            </button>
                        </form>
                    ) : (
                        // Display link to login/retry if token is invalid or success occurred
                        <div className="mt-4 text-center">
                            {messageType === "success" ? (
                                <Link href="/login" className="text-blue-600 font-medium hover:underline">
                                    Go to Login
                                </Link>
                            ) : (
                                <Link href="/login" className="text-blue-600 font-medium hover:underline">
                                    Go back to Login and request a new link
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ResetPasswordForm />
        </Suspense>
    );
}
