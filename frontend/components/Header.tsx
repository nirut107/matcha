"use client";

import { Flame, MessageCircle, Settings, LogOut } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const handleLogout = async () => {
    try {
      // 1. Tell the backend to clear the session/cookie
      await fetchWithAuth("http://localhost:3001/auth/logout", {
        method: "POST",
      });

      // 2. Clear any local storage if you use it (optional)
      // localStorage.removeItem('token');

      // 3. Redirect to login
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout failed:", error);
      // Even if the API fails, you usually want to kick the user to login
      router.push("/auth/login");
    }
  };
  return (
    <header className="bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center sticky top-0 z-50 hover:cursor-pointer">
      {/* Logo */}
      <div
        className="flex items-center gap-2"
        onClick={() => {
          if (pathname !== "/dashboard") {
            router.push("/dashboard");
          }
        }}
      >
        <div className="bg-gradient-to-tr from-rose-500 to-orange-400 p-1.5 rounded-lg">
          <Flame size={24} color="white" fill="white" />
        </div>
        <span className="text-xl font-black text-gray-900 uppercase">
          Matcha
        </span>
      </div>

      {/* Right icons */}
      <div className="flex gap-6">
        <button
          className="text-gray-400 hover:text-rose-500 relative transition-colors cursor-pointer"
          onClick={() => {
            if (pathname !== "/chat") {
              router.push("/chat");
            }
          }}
        >
          <MessageCircle size={24} />
          {/* Notification dot */}
          <span className="absolute -top-1 -right-1 bg-rose-500 w-2.5 h-2.5 rounded-full border-2 border-white"></span>
        </button>

        <button
          className="text-gray-400 hover:text-rose-500 transition-colors cursor-pointer"
          onClick={() => {
            if (pathname !== "/profile/setup") {
              router.push("/profile/setup");
            }
          }}
        >
          <Settings size={24} />
        </button>
        {/* --- LOGOUT BUTTON --- */}
        <button
          className="text-gray-400 hover:text-rose-500 transition-colors cursor-pointer flex items-center gap-1"
          onClick={handleLogout}
          title="Logout"
        >
          <LogOut size={24} />
        </button>
      </div>
    </header>
  );
}
