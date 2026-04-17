'use client'

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match" });
      return;
    }

    if (!token) {
      setMessage({ type: "error", text: "Invalid or missing token" });
      return;
    }

    setLoading(true);
    try {
      await fetchWithAuth("/auth/resetpassword", {
        method: "POST",
        body: JSON.stringify({ token, newPassword: password }),
      });

      setMessage({ type: "success", text: "Password updated! Redirecting..." });
      setTimeout(() => router.push("/login"), 3000);
    } catch (err: any) {
      setMessage({
        type: "error",
        text: "Failed to reset password. Link may be expired.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-md w-full">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-tr from-[#FF416C] to-[#FF4B2B] w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-pink-200">
            <span className="text-white text-3xl font-black">M</span>
          </div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Set New Password</h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">Secure your Matcha account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">
              New Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              className="w-full mt-2 px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-pink-500 transition-all outline-none text-gray-700"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">
              Confirm Password
            </label>
            <input
              type="password"
              required
              className="w-full mt-2 px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-pink-500 transition-all outline-none text-gray-700"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {message.text && (
            <div className={`p-4 rounded-2xl text-xs font-bold text-center animate-in fade-in zoom-in duration-200 ${
              message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
            }`}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !token}
            className="w-full bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] text-white font-black py-4 rounded-2xl shadow-xl shadow-pink-200 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              </div>
            ) : "UPDATE PASSWORD"}
          </button>
        </form>

        <button
          onClick={() => router.push("/login")}
          className="w-full mt-6 text-xs font-bold text-gray-400 hover:text-pink-500 transition-colors uppercase tracking-widest"
        >
          Cancel and Return
        </button>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
        <div className="min-h-screen bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
        </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}