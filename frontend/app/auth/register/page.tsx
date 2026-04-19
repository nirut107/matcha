"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Flame, Mail, Lock, User, Loader2, Eye, EyeOff } from "lucide-react";
import Loading from "@/app/loading";
import ConfirmModal from "@/components/ConfirmModal";

export default function RegisterPage() {
  const router = useRouter();
  const [loadingpage, setLoadingpage] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const run = async () => {
      await new Promise((r) => setTimeout(r, 500));
      setIsFadingOut(true);
      await new Promise((r) => setTimeout(r, 500));
      setLoadingpage(false);
    };
    run();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${baseUrl}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowVerifyModal(true);
      } else {
        const data = await response.json();
        setError(
          data.message || "Registration failed. Try a different username/email."
        );
      }
    } catch (err) {
      setError("Cannot connect to server. Check port 3001.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-500 via-pink-500 to-orange-400 p-4">
      {loadingpage && (
        <div
          className={`
                    fixed inset-0 z-50
                      transition-opacity duration-1000 ease-in-out
                      ${isFadingOut ? "opacity-0" : "opacity-100"}
                    `}
        >
          <Loading />
        </div>
      )}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-gradient-to-r from-rose-500 to-orange-400 p-3 rounded-2xl mb-4">
            <Flame size={40} color="white" fill="white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Create Account</h1>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 mb-4 rounded-xl text-sm border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative text-gray-900">
            <User className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Username"
              required
              value={formData.username}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-400 outline-none placeholder:text-gray-400"
              onChange={(e) => {
                if (e.target.value.length > 20) {
                  setError("Username must be 20 characters or fewer.");
                } else {
                  setError("");
                  setFormData({ ...formData, username: e.target.value });
                }
              }}
            />
          </div>

          <div className="relative text-gray-900">
            <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="email"
              placeholder="Email address"
              required
              value={formData.email}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-400 outline-none placeholder:text-gray-400"
              onChange={(e) => {
                if (e.target.value.length > 100) {
                  setError("email must be 100 characters or fewer.");
                } else {
                  setFormData({ ...formData, email: e.target.value });
                }
              }}
            />
          </div>

          <div className="relative text-gray-900">
            <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              required
              value={formData.password}
              className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-400 outline-none placeholder:text-gray-400"
              onChange={(e) => {
                if (e.target.value.length > 20) {
                  setError("Password must be between 8 and 20 characters.");
                } else {
                  setError("");
                  setFormData({ ...formData, password: e.target.value });
                }
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-rose-500 to-orange-400 text-white font-bold py-3 rounded-full hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : "JOIN NOW"}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600 text-sm">
          Already a member?{" "}
          <Link href="/auth/login" className="text-rose-500 font-bold">
            Log In
          </Link>
        </p>
      </div>
      <ConfirmModal
        isOpen={showVerifyModal}
        title="Verify your email"
        message="We've sent a verification link to your email. Please verify your email before logging in."
        confirmText="Go to Login"
        onConfirm={() => {
          setShowVerifyModal(false);
          router.push("/auth/login");
        }}
      />
    </div>
  );
}
