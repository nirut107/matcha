"use client";

import {
  Flame,
  MessageCircle,
  Settings,
  LogOut,
  Map,
  Calendar,
  Bell, // 🔥 Added Bell Icon
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import ConfirmModal from "./ConfirmModal";
import { getSocket } from "@/lib/socket";
import { formatDistanceToNow } from "date-fns";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false);

  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [unreadMessages, setUnreadMessages] = useState<number>(0);
  const notiRef = useRef<HTMLDivElement>(null);
  const [isNotiOpen, setIsNotiOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const socketRef = useRef<any>(null);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await fetchWithAuth("/notifications/unreadcount");
        const data = await res.json();
        console.log(data);
        setUnreadNotifications(Number(data.notificationsCount) || 0);
        setUnreadMessages(Number(data.messagesCount) || 0);
      } catch (err) {
        console.error("Failed to fetch unread counts", err);
      }
    };
    fetchCounts();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notiRef.current && !notiRef.current.contains(event.target as Node)) {
        setIsNotiOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    socketRef.current = getSocket();
    const socket = socketRef.current;

    socket.on("notification", (data: any) => {
      console.log(`🔌 [SOCKET] Received: ${data.type}`, data);

      if (data.type === "NEW_MESSAGE") {
        if (pathname !== "/chat") {
          if (pathname !== "/chat") {
            setUnreadMessages((prev) => (Number(prev) || 0) + 1);
          }
        }
      } else {
        setUnreadNotifications((prev) => (Number(prev) || 0) + 1);
      }
    });

    return () => {
      socket.off("notification");
    };
  }, [pathname]);

  const handleNotiClick = async () => {
    if (!isNotiOpen) {
      try {
        const res = await fetchWithAuth("/notifications"); // Your Plural/Singular endpoint
        const data = await res.json();
        setNotifications(data);
        setUnreadNotifications(0); // Reset UI count immediately
      } catch (err) {
        console.error("Failed to load notifications", err);
      }
    }
    setIsNotiOpen(!isNotiOpen);
  };

  const handleLogout = async () => {
    try {
      await fetchWithAuth("/auth/logout", { method: "POST" });
      router.push("/auth/login");
    } catch (error) {
      router.push("/auth/login");
    }
  };

  const getIconClass = (path: string) =>
    `transition-colors cursor-pointer p-1 rounded-md ${
      pathname === path
        ? "text-rose-500 bg-rose-50"
        : "text-gray-400 hover:text-rose-500"
    }`;

  const Badge = ({ count }: { count: number }) => {
    if (count <= 0) return null;
    return (
      <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center rounded-full border-2 border-white animate-in zoom-in">
        {count > 9 ? "9+" : count}
      </span>
    );
  };

  return (
    <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center sticky top-0 z-50">
      <div
        className="flex items-center gap-2 cursor-pointer group"
        onClick={() => pathname !== "/dashboard" && router.push("/dashboard")}
      >
        <div className="bg-gradient-to-tr from-rose-500 to-orange-400 p-1.5 rounded-lg shadow-sm group-hover:scale-105 transition-transform">
          <Flame
            size={20}
            className="sm:w-6 sm:h-6"
            color="white"
            fill="white"
          />
        </div>
        <span className="text-lg sm:text-xl font-black text-gray-900 uppercase tracking-tight">
          Matcha
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* CHAT WITH UNREAD COUNT */}
        <button
          className={`${getIconClass("/chat")} relative`}
          onClick={() => router.push("/chat")}
        >
          <MessageCircle size={22} className="sm:w-6 sm:h-6" />
          <Badge count={unreadMessages} />
        </button>
        {/* MAP & OTHER NAVS */}
        <button
          className={getIconClass("/map")}
          onClick={() => router.push("/map")}
        >
          <Map size={22} className="sm:w-6 sm:h-6" />
        </button>

        <button
          className={getIconClass("/calendar")}
          onClick={() => router.push("/calendar")}
        >
          <Calendar size={22} className="sm:w-6 sm:h-6" />
        </button>

        {/* NOTIFICATIONS WITH UNREAD COUNT */}
        <div className="relative" ref={notiRef}>
          <button
            className={`relative p-2 transition-colors rounded-md ${
              isNotiOpen
                ? "text-rose-500 bg-rose-50"
                : "text-gray-400 hover:text-rose-500"
            }`}
            onClick={handleNotiClick}
          >
            <Bell size={22} />
            {unreadNotifications > 0 && <Badge count={unreadNotifications} />}
          </button>

          {/* THE DROPDOWN PANEL */}
          {isNotiOpen && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right">
              <div className="p-5 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                <span className="font-black text-gray-800 uppercase tracking-widest text-xs">
                  Notifications
                </span>
                <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded-full">
                  LATEST
                </span>
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((noti) => (
                    <div
                      key={noti.id}
                      className="p-4 flex gap-4 hover:bg-rose-50/30 transition-colors border-b border-gray-50 last:border-0 cursor-pointer"
                    >
                      <img
                        src={noti.data.senderImage || "/default-avatar.png"}
                        className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-sm"
                        alt=""
                      />
                      <div className="flex-1">
                        <p className="text-sm text-gray-800 leading-snug">
                          <span className="font-bold">
                            {noti.data.senderName}
                          </span>{" "}
                          {noti.data.text.split(noti.data.senderName)[1] ||
                            noti.data.text}
                        </p>
                        <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">
                          {formatDistanceToNow(new Date(noti.created_at))} ago
                        </p>
                      </div>
                      {noti.type === "MATCH" && (
                        <div className="text-xs">❤️</div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-10 text-center">
                    <div className="text-4xl mb-2 opacity-20">🍃</div>
                    <p className="text-gray-400 text-sm font-medium">
                      No notifications yet
                    </p>
                  </div>
                )}
              </div>

              <div className="p-4 bg-gray-50/50 text-center">
                <button className="text-[10px] font-black text-gray-400 hover:text-rose-500 transition-colors tracking-widest uppercase">
                  View All History
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          className={getIconClass("/profile/setup")}
          onClick={() => router.push("/profile/setup")}
        >
          <Settings size={22} className="sm:w-6 sm:h-6" />
        </button>

        <div className="hidden sm:block h-6 w-[1px] bg-gray-200 mx-1"></div>

        <button
          className="text-gray-400 hover:text-rose-600 p-1"
          onClick={() => setIsLogoutModalOpen(true)}
        >
          <LogOut size={22} className="sm:w-6 sm:h-6" />
        </button>
      </div>

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        title="Log Out"
        message="Are you sure you want to log out?"
        confirmText="Yes, Log Out"
        cancelText="Stay"
        onConfirm={handleLogout}
        onCancel={() => setIsLogoutModalOpen(false)}
        isDestructive={true}
      />
    </header>
  );
}
