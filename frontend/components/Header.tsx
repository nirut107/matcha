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
      await fetchWithAuth("/auth/logout", { method: "POST" });
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout failed:", error);
      router.push("/auth/login");
    }
  };

  // Helper to highlight active icons
  const getIconClass = (path: string) =>
    `transition-colors cursor-pointer p-1 rounded-md ${
      pathname === path ? "text-rose-500 bg-rose-50" : "text-gray-400 hover:text-rose-500"
    }`;

  return (
    <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center sticky top-0 z-50">
      {/* Logo - Text hides on very small screens to save space */}
      <div
        className="flex items-center gap-2 cursor-pointer group"
        onClick={() => pathname !== "/dashboard" && router.push("/dashboard")}
      >
        <div className="bg-gradient-to-tr from-rose-500 to-orange-400 p-1.5 rounded-lg shadow-sm group-hover:scale-105 transition-transform">
          <Flame size={20} className="sm:w-6 sm:h-6" color="white" fill="white" />
        </div>
        <span className="text-lg sm:text-xl font-black text-gray-900 uppercase tracking-tight">
          Matcha
        </span>
      </div>

      {/* Right Navigation */}
      <div className="flex items-center gap-3 sm:gap-6">
        {/* CHAT */}
        <button
          className={`${getIconClass("/chat")} relative`}
          onClick={() => pathname !== "/chat" && router.push("/chat")}
        >
          <MessageCircle size={22} className="sm:w-6 sm:h-6" />
          <span className="absolute top-1 right-1 bg-rose-500 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full border-2 border-white"></span>
        </button>

        {/* MAP */}
        <button
          className={getIconClass("/map")}
          onClick={() => pathname !== "/map" && router.push("/map")}
        >
          <Map size={22} className="sm:w-6 sm:h-6" />
        </button>

        {/* CALENDAR */}
        <button
          className={getIconClass("/calendar")}
          onClick={() => pathname !== "/calendar" && router.push("/calendar")}
        >
          <Calendar size={22} className="sm:w-6 sm:h-6" />
        </button>

        {/* SETTINGS */}
        <button
          className={getIconClass("/profile/setup")}
          onClick={() => pathname !== "/profile/setup" && router.push("/profile/setup")}
        >
          <Settings size={22} className="sm:w-6 sm:h-6" />
        </button>

        {/* Divider - Hidden on mobile */}
        <div className="hidden sm:block h-6 w-[1px] bg-gray-200 mx-1"></div>

        {/* LOGOUT */}
        <button
          className="text-gray-400 hover:text-rose-600 transition-colors cursor-pointer p-1"
          onClick={() => setIsLogoutModalOpen(true)}
          title="Logout"
        >
          <LogOut size={22} className="sm:w-6 sm:h-6" />
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
