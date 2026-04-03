"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Flame, Lock, User, Loader2 } from 'lucide-react';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetchWithAuth('http://localhost:3001/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        router.push('/dashboard');
      } else {
        setError(data.message || "Invalid credentials. Try again!");
      }
    } catch (err) {
      setError("Something went wrong. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-500 via-pink-500 to-orange-400 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden p-8">

        {/* Logo Section */}
        <div className="flex flex-col items-center mb-10">
          <div className="bg-gradient-to-r from-rose-500 to-orange-400 p-3 rounded-2xl mb-4 shadow-lg">
            <Flame size={40} color="white" fill="white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Welcome Back</h1>
          <p className="text-gray-500 mt-2">Ready to find your match?</p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-6 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username Input */}
          <div className="relative">
            <User className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Username"
              required
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 transition-all text-gray-900 placeholder:text-gray-400"
              onChange={(e) => setFormData({...formData, username: e.target.value})}
            />
          </div>

          {/* Password Input */}
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="password"
              placeholder="Password"
              required
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 transition-all text-gray-900 placeholder:text-gray-400"
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-rose-500 to-orange-400 text-white font-bold py-3 rounded-full hover:opacity-90 transition-opacity shadow-lg flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : "LOG IN"}
          </button>
        </form>

        {/* Divider */}
    <div className="flex items-center my-6">
    <div className="flex-grow border-t border-gray-200"></div>
    <span className="flex-shrink mx-4 text-gray-400 text-sm uppercase tracking-wider">or</span>
    <div className="flex-grow border-t border-gray-200"></div>
    </div>

    {/* Google Button */}
    <button
    type="button"
    onClick={() => window.location.href = 'http://localhost:3001/auth/google'}
    className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 font-semibold py-3 rounded-full hover:bg-gray-50 transition-all shadow-sm"
    >
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
    Continue with Google
    </button>

        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm">
            Don't have an account?{' '}
            <Link href="/auth/register" className="text-rose-500 font-bold hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
