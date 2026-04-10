"use client";

import {
  Flame,
  MessageCircle,
  Settings,
  LogOut,
  Map,
  Calendar,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import ConfirmModal from "./ConfirmModal";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false);
  const handleLogout = async () => {
    try {
      // 1. Tell the backend to clear the session/cookie
      await fetchWithAuth("/auth/logout", {
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

        {/* --- MAP BUTTON --- */}
        <button
          className="text-gray-400 hover:text-rose-500 transition-colors cursor-pointer"
          onClick={() => {
            if (pathname !== "/map") {
              router.push("/map");
            }
          }}
        >
          <Map size={24} />
        </button>

        {/* --- CALENDAR BUTTON --- */}
        <button
          className="text-gray-400 hover:text-rose-500 transition-colors cursor-pointer"
          onClick={() => {
            if (pathname !== "/calendar") {
              router.push("/calendar");
            }
          }}
        >
          <Calendar size={24} />
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
          onClick={() => setIsLogoutModalOpen(true)}
          title="Logout"
        >
          <LogOut size={24} />
        </button>
      </div>
      <ConfirmModal
        isOpen={isLogoutModalOpen}
        title="Log Out"
        message="Are you sure you want to log out of Matcha?"
        confirmText="Yes, Log Out"
        cancelText="Stay"
        onConfirm={handleLogout}
        onCancel={() => setIsLogoutModalOpen(false)}
        isDestructive={true}
      />
    </header>
  );
}
