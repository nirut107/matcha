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
import toast from "react-hot-toast";
import MatchModal from "./MatchModal";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false);

  const [isFirefox, setIsFirefox] = useState<boolean>(false);

  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [unreadMessages, setUnreadMessages] = useState<number>(0);
  const notiRef = useRef<HTMLDivElement>(null);
  const [isNotiOpen, setIsNotiOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showAllNotis, setShowAllNotis] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [match, setMatch] = useState<{
    userName: string;
    userImage?: string;
  } | null>(null);

  const socketRef = useRef<any>(null);

  useEffect(() => {
    setIsFirefox(navigator.userAgent.toLowerCase().includes("firefox"));
  }, []);

  const fetchCounts = async () => {
    try {
      
      const res = await fetchWithAuth("/notifications/unreadcount");
      const data = await res.json();
      console.log("Fetching unread counts...", data.notificationsCount, data.messagesCount);
      setUnreadNotifications(Number(data.notificationsCount) || 0);
      if (pathname == "/chat") {
        setUnreadMessages(0);
      } else {
        setUnreadMessages(Number(data.messagesCount) || 0);
      }
    } catch (err) {
      console.error("Failed to fetch unread counts", err);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, [router]);

  useEffect(() => {
    if (!isNotiOpen) setShowAllNotis(false);
  }, [isNotiOpen]);

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
    socket.on("connect", () => {
      console.log("user connect");
      fetchCounts();
    });

    socket.on("notification", (data: any) => {
      console.log(`🔌 [SOCKET] Received Head: ${data.type}`, data);

      if (data.type === "NEW_MESSAGE") {
        if (pathname !== "/chat") {
          setUnreadMessages((prev) => (Number(prev) || 0) + 1);
          try {
            toast.custom(
              (t) => (
                <div
                  className={`${
                    t.visible ? "animate-enter" : "animate-leave"
                  } max-w-md w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black/5 overflow-hidden border border-white/20`}
                >
                  <div className="flex-1 w-0 p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 pt-0.5">
                        <div className="relative">
                          <img
                            className="h-12 w-12 rounded-full border-2 border-white object-cover shadow-sm"
                            src={
                              data.senderImage ||
                              "https://via.placeholder.com/150"
                            }
                            alt="sender"
                          />
                          <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {data.senderName || "Someone"}
                        </p>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-2 italic">
                          "{data.text}"
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex bg-white/40 dark:bg-black/20 backdrop-blur-md">
                    <button
                      onClick={() => {
                        toast.dismiss(t.id);
                        router.push("/chat");
                      }}
                      className="w-full px-6 flex items-center justify-center text-sm font-bold text-pink-600 hover:text-pink-700 transition-colors uppercase tracking-wider"
                    >
                      View
                    </button>
                  </div>
                </div>
              ),
              { duration: 4000, position: "bottom-left" }
            );
          } catch (error) {
            console.error("Failed to fetch sender profile", error);
            toast(`💬 New message: ${data.text}`);
          }
        }
      } else {
        fetchCounts();
      }
      if (data.type === "match") {
        console.log(
          "🔌 [SOCKET] MATCH Notification from:",
          data.data.senderName
        );
        setMatch({
          userName: data.data.senderName,
          userImage: data.data.senderImage,
        });
        setIsOpen(true);
      }
    });

    return () => {
      socket.off("notification");
    };
  }, [pathname]);

  const handleNotiClick = async () => {
    if (!isNotiOpen) {
      try {
        const res = await fetchWithAuth("/notifications");
        const data = await res.json();
        console.log(data);
        setNotifications(data);
        setUnreadNotifications(0);
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
          onClick={() => {
            router.push("/chat");
          }}
        >
          <MessageCircle size={22} className="sm:w-6 sm:h-6" />
          <Badge count={unreadMessages} />
        </button>

        {!isFirefox && (
          <button
            className={getIconClass("/map")}
            onClick={() => router.push("/map")}
          >
            <Map size={22} className="sm:w-6 sm:h-6" />
          </button>
        )}
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
                {notifications.length > 0 && (
                  <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded-full">
                    {showAllNotis ? "ALL" : "LATEST"}
                  </span>
                )}
              </div>

              {/* Dynamic height: fixed if collapsed, scrollable if expanded */}
              <div
                className={`${
                  showAllNotis ? "max-h-[400px]" : "max-h-none"
                } overflow-y-auto no-scrollbar`}
              >
                {notifications.length > 0 ? (
                  (showAllNotis
                    ? notifications
                    : notifications.slice(0, 5)
                  ).map((noti) => (
                    <div
                      key={noti.id}
                      onClick={() => {
                        // Optional: Navigate to user profile or specific action
                        setIsNotiOpen(false);
                      }}
                      className="p-4 flex gap-4 hover:bg-rose-50/30 transition-colors border-b border-gray-50 last:border-0 cursor-pointer group"
                    >
                      <img
                        src={noti.data.senderImage || "/default-avatar.png"}
                        className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-sm group-hover:scale-105 transition-transform"
                        alt=""
                      />
                      <div className="flex-1">
                        <p className="text-sm text-gray-800 leading-snug">
                          {noti.data.type == "LIKE" && (
                            <>
                              <span className="font-bold">
                                {noti.data.senderName}
                              </span>{" "}
                              <span>liked your profile! ✨</span>
                            </>
                          )}
                          {noti.data.type == "VISIT" && (
                            <>
                              <span className="font-bold">
                                {noti.data.senderName}
                              </span>{" "}
                              <span>viewed your profile! 👀</span>
                            </>
                          )}
                          {noti.data.type == "MATCH" && (
                            <>
                              <span>You matched with</span>{" "}
                              <span className="font-bold">
                                {noti.data.senderName}
                              </span>
                              {" ❤️"}
                            </>
                          )}
                          
                          {noti.data.type == "UNLIKE" && (
                            <>
                              <span className="font-bold">
                                {noti.data.senderName}
                              </span>{" "}
                              <span>unliked your 💔</span>
                            </>
                          )}
                          {noti.data.type == "DATE_REQ" && (
                            <>
                              <span className="font-bold">
                                {noti.data.senderName}
                              </span>{" "}
                              <span> DATE_REQ💔</span>
                            </>
                          )}
                          {noti.data.type == "DATE_ACCEPT" && (
                            <>
                              <span className="font-bold">
                                {noti.data.senderName}
                              </span>{" "}
                              <span> DATE_ACCEPT💔</span>
                            </>
                          )}
                          {noti.data.type == "DATE_REJECT" && (
                            <>
                              <span className="font-bold">
                                {noti.data.senderName}
                              </span>{" "}
                              <span> DATE_REJECT💔</span>
                            </>
                          )}
                        </p>
                        <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">
                          {formatDistanceToNow(noti.created_at)}{" "}
                        </p>
                      </div>
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

              {/* Footer: Show only if there are more than 5 notifications */}
              {notifications.length > 5 && !showAllNotis && (
                <div className="p-4 bg-gray-50/50 text-center border-t border-gray-50">
                  <button
                    onClick={() => setShowAllNotis(true)}
                    className="text-[10px] font-black text-rose-500 hover:text-rose-600 transition-colors tracking-widest uppercase flex items-center justify-center w-full gap-2"
                  >
                    View All History ({notifications.length})
                  </button>
                </div>
              )}

              {showAllNotis && (
                <div className="p-4 bg-gray-50/50 text-center border-t border-gray-50">
                  <button
                    onClick={() => setShowAllNotis(false)}
                    className="text-[10px] font-black text-gray-400 hover:text-gray-600 transition-colors tracking-widest uppercase"
                  >
                    Show Less
                  </button>
                </div>
              )}
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
      <MatchModal
        isOpen={isOpen}
        match={match}
        onClose={() => setIsOpen(false)}
      />

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
