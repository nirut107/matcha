"use client";

import React, { useState, useEffect } from "react";
import {
  Send,
  MoreVertical,
  Phone,
  Video,
  ChevronLeft,
  Search,
  Circle,
  ArrowLeft,
  Ban, // <-- Imported Ban icon
  HeartOff,
} from "lucide-react";
import Link from "next/link";
import Header from "@/components/Header";
import { getSocket } from "@/lib/socket";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useRef } from "react";
import Loading from "../loading";
import { useRouter } from "next/navigation";
import ConfirmModal from "@/components/ConfirmModal";
import { UserRespone, MatchResponse } from "@/lib/interface";

const USE_MOCK = false; // switch this ON/OFF

function formatTime(dateString: string, type: "chat" | "list" = "chat") {
  let date = new Date(dateString);

  // 🚨 HOTFIX: backend already applied +7 → revert it
  date = new Date(date.getTime() + 7 * 60 * 60 * 1000);

  const now = new Date();

  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);

  if (type === "list") {
    if (diffMin < 1) return "now";
    if (diffMin < 60) return `${diffMin}m`;
    if (diffHr < 24) return `${diffHr}h`;
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatPage() {
  const [activeChat, setActiveChat] = useState<MatchResponse | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false); // Track if we are viewing a conversation on mobile
  const [message, setMessage] = useState("");
  const [matches, setMatches] = useState<MatchResponse[]>([]);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [socket, setSocket] = useState<any>(null); // Keep socket in state
  const [userId, setUserId] = useState<number | null>(null);
  const activeMatchRef = useRef<number | null>(null);
  const router = useRouter();
  const userIdRef = useRef<number | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  useEffect(() => {
    const handleLeave = () => {
      if (activeMatchRef.current) {
        socket?.emit("leaveMatch", { matchId: activeMatchRef.current });
      }
    };

    window.addEventListener("beforeunload", handleLeave);

    return () => {
      window.removeEventListener("beforeunload", handleLeave);
    };
  }, [socket]);

  useEffect(() => {
    activeMatchRef.current = activeChat?.id ?? null;
  }, [activeChat]);

  useEffect(() => {
    const s = getSocket();
    setSocket(s);
    fetchWithAuth("/user/me")
      .then((res) => res.json())
      .then((data: UserRespone) => {
        if (data) {
          if (!data.hasProfile) {
            router.push("profile/setup");
          }
          console.log(data.id, "this should be my Id");
          setUserId(data.id);
          userIdRef.current = data.id;
        } else {
        }
      });

    fetchWithAuth("/matches")
      .then((res) => res.json())
      .then((data) => {
        if (data.length > 0) {
          setMatches(data);
          setActiveChat(data[0]);
          handleSelectChat(data[0]);
          s.emit("joinMatch", { matchId: Number(data[0]?.id) });
        }
      })
      .catch(console.error);

    s.on("newMessage", (msg: any) => {
      const myId = userIdRef.current;
      console.log(myId, "myId");
      if (Number(msg.sender_id) != Number(myId)) {
        const formattedMsg = {
          id: msg.id || Date.now(),
          sender: "them",
          text: msg.content,
          time: formatTime(msg.created_at || new Date().toISOString()),
        };
        setChatHistory((prev) => [...prev, formattedMsg]);
      }

      setMatches((prevMatches) => {
        return prevMatches
          .map((match) => {
            if (match.id === msg.match_id) {
              const isCurrentChat = activeMatchRef.current === msg.match_id;
              const isMine = Number(msg.sender_id) === Number(myId);

              return {
                ...match,
                last_message: msg.content,
                last_message_time: formatTime(msg.created_at, "list"),

                // ✅ FIXED LOGIC
                unread_count: isMine
                  ? match.unread_count // don't change
                  : isCurrentChat
                  ? 0
                  : (match.unread_count ?? 0) + 1,
              };
            }
            return match;
          })
          .sort((a, b) => {
            if (a.id === msg.match_id) return -1;
            if (b.id === msg.match_id) return 1;
            return 0;
          });
      });
    });
    const run = async () => {
      await new Promise((r) => setTimeout(r, 1000));
      setIsFadingOut(true);
      await new Promise((r) => setTimeout(r, 1000));
      setLoading(false);
    };

    run();
    return () => {
      // leave current match room when leaving page
      if (activeMatchRef.current) {
        s.emit("leaveMatch", { matchId: activeMatchRef.current });
      }

      s.off("newMessage");
    };
  }, []);

  const handleSelectChat = async (match: MatchResponse) => {
    if (socket && activeChat?.id) {
      socket.emit("leaveMatch", { matchId: activeChat.id });
    }

    //  update ref immediately (IMPORTANT)
    activeMatchRef.current = match.id;

    setActiveChat(match);
    setIsChatOpen(true);

    if (socket) {
      socket.emit("joinMatch", { matchId: match.id });
    }

    // reset unread
    setMatches((prev) =>
      prev.map((m) => (m.id === match.id ? { ...m, unread_count: 0 } : m))
    );

    const res = await fetchWithAuth(`/messages/${match.id}`);
    const data = await res.json();
    console.log(data, "message");
    const formatted = data.result.map((msg: any) => ({
      id: msg.id,
      sender: msg.sender_id === data.userId ? "me" : "them",
      text: msg.content,
      time: formatTime(msg.created_at),
    }));

    setChatHistory(formatted);
    return data.userId;
  };

  const executeUnlike = async () => {
    if (!activeChat) return;
    try {
      const res = await fetchWithAuth("/swipe/unlike", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId: activeChat.user_id }),
      });

      if (!res.ok) throw new Error("Failed to unlike user");

      setMatches((prev) => prev.filter((m) => m.id !== activeChat.id));
      const remainingMatches = matches.filter((m) => m.id !== activeChat.id);
      if (remainingMatches.length > 0) handleSelectChat(remainingMatches[0]);
    } catch (err) {
      console.error("Error unliking user:", err);
      // Optional: Show a toast error
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: "me",
      text: message,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    // optimistic UI
    setChatHistory((prev) => [...prev, newMsg]);

    console.log("before sent");
    if (activeChat) {
      console.log("sent socket");
      socket.emit("sendMessage", {
        matchId: activeChat.id,
        content: message,
      });
    }
    setMessage("");
  };

  const handleCallClick = (type: "audio" | "video") => {
    if (!activeChat) return;

    window.dispatchEvent(
      new CustomEvent("START_OUTGOING_CALL", {
        detail: {
          targetUserId: activeChat.user_id,
          matchId: activeChat.id,
          callType: type, // Tell the SocketHandler which one we clicked
        },
      })
    );
  };

  //  Handle Block/Unblock
  const handleToggleBlock = async () => {
    if (!activeChat) return;

    const isCurrentlyBlocked = activeChat.i_blocked_them;
    const method = isCurrentlyBlocked ? "DELETE" : "POST";

    try {
      const res = await fetchWithAuth(`/blocks/${activeChat.user_id}`, {
        method,
      });

      if (res.ok) {
        // Optimistically update the UI
        const updatedChat = {
          ...activeChat,
          i_blocked_them: !isCurrentlyBlocked,
        };
        setActiveChat(updatedChat);

        // Update the matches list so the state persists as you switch chats
        setMatches((prev) =>
          prev.map((m) => (m.id === activeChat.id ? updatedChat : m))
        );
        console.log("Successfully block");
      } else {
        console.error("Failed to toggle block status");
      }
    } catch (error) {
      console.error("Error blocking/unblocking user", error);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {loading && (
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
      <Header />
      <div className="flex flex-grow bg-white overflow-hidden font-sans relative">
        {/* 1. MATCHES SIDEBAR */}
        <aside
          className={`w-full md:w-80 border-r border-gray-100 flex flex-col bg-gray-50/50
          ${isChatOpen ? "hidden md:flex" : "flex"}`}
        >
          <div className="p-6 bg-white border-b border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <Link
                href="/dashboard"
                className="text-gray-400 hover:text-rose-500 transition-colors"
              >
                <ChevronLeft size={28} />
              </Link>
              <h1 className="text-xl font-black tracking-tight text-gray-900">
                MESSAGES
              </h1>
              <div className="w-7 h-7" />
            </div>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search matches..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-rose-400/20 transition-all"
              />
            </div>
          </div>

          <div className="flex-grow overflow-y-auto">
            {matches &&
              matches.map((match) => (
                <div
                  key={match.id}
                  onClick={() => handleSelectChat(match)}
                  className={`p-4 flex items-center gap-4 cursor-pointer transition-all border-l-4 ${
                    activeChat?.id === match.id
                      ? "bg-white border-rose-500 shadow-sm"
                      : "border-transparent hover:bg-gray-100"
                  } ${match.i_blocked_them ? "opacity-50" : ""}`} // Slightly fade blocked chats in sidebar
                >
                  <div className="relative">
                    <img
                      src={match.profile_picture || ""}
                      className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
                      alt=""
                    />
                    {match.is_online && !match.i_blocked_them && (
                      <Circle
                        size={12}
                        fill="#22c55e"
                        className="text-green-500 absolute bottom-0 right-0 border-2 border-white rounded-full"
                      />
                    )}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-bold text-gray-900 truncate">
                        {match.first_name} {match.i_blocked_them && "(Blocked)"}
                      </h3>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">
                        {match.last_message_time}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate mt-0.5">
                      {match.last_message}
                    </p>

                    {/* UNREAD COUNTER BADGE */}
                    {match.unread_count > 0 && activeChat?.id !== match.id && (
                      <span className="ml-2 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center shadow-sm">
                        {match.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </aside>

        {/* 2. CHAT WINDOW */}
        {activeChat && (
          <main
            className={`flex-grow flex-col bg-white
          ${isChatOpen ? "flex" : "hidden md:flex"}`}
          >
            {/* Chat Header */}
            <header className="p-4 border-b border-gray-100 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-3">
                {/* Back button for mobile */}
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="md:hidden p-1 -ml-2 text-gray-500 hover:text-rose-500"
                >
                  <ArrowLeft size={24} />
                </button>

                <img
                  src={activeChat?.profile_picture || ""}
                  className="w-10 h-10 rounded-full object-cover"
                  alt=""
                />
                <div>
                  <h2 className="font-bold text-gray-900 leading-tight">
                    {activeChat?.first_name}
                  </h2>
                  <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest">
                    {activeChat?.i_blocked_them
                      ? "Blocked"
                      : activeChat?.is_online
                      ? "Online"
                      : "Away"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-gray-400">
                <button
                  onClick={() => handleCallClick("audio")}
                  className="hover:text-rose-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={activeChat?.i_blocked_them}
                >
                  <Phone size={20} />
                </button>
                <button
                  onClick={() => handleCallClick("video")}
                  className="hover:text-rose-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={activeChat?.i_blocked_them}
                >
                  <Video size={20} />
                </button>
                <button
                  onClick={() => setIsConfirmOpen(true)}
                  title="Unmatch / Unlike"
                  className="hover:text-rose-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={activeChat?.i_blocked_them}
                >
                  <HeartOff size={20} />
                </button>

                {/*  Block/Unblock Toggle Button */}
                <button
                  onClick={() => setIsBlockModalOpen(true)}
                  title={
                    activeChat?.i_blocked_them ? "Unblock user" : "Block user"
                  }
                  className={`transition-colors ${
                    activeChat?.i_blocked_them
                      ? "text-rose-500"
                      : "hover:text-rose-500"
                  }`}
                >
                  <Ban size={20} />
                </button>

                <button className="hover:text-rose-500 transition-colors">
                  <MoreVertical size={20} />
                </button>
              </div>
            </header>

            {/* Message Area */}
            <div className="flex-grow overflow-y-auto p-6 space-y-4 bg-gray-50/30">
              {chatHistory.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.sender === "me" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] md:max-w-[70%] px-4 py-3 rounded-2xl shadow-sm text-sm ${
                      msg.sender === "me"
                        ? "bg-gradient-to-tr from-rose-500 to-orange-400 text-white rounded-tr-none"
                        : "bg-white text-gray-800 border border-gray-100 rounded-tl-none"
                    }`}
                  >
                    <p className="leading-relaxed">{msg.text}</p>
                    <p
                      className={`text-[10px] mt-1 opacity-70 ${
                        msg.sender === "me" ? "text-right" : "text-left"
                      }`}
                    >
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area - Hidden if user is blocked */}
            {activeChat.i_blocked_them ? (
              <div className="p-4 bg-gray-100 border-t border-gray-200 text-center text-sm text-gray-500">
                You have blocked this user. Unblock them to send a message.
              </div>
            ) : (
              <form
                onSubmit={handleSendMessage}
                className="p-4 bg-white border-t border-gray-100"
              >
                <div className="relative flex items-center gap-2 max-w-4xl mx-auto">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-grow py-4 pl-6 pr-14 bg-gray-100 rounded-full outline-none focus:ring-2 focus:ring-rose-400/20 text-gray-900 text-sm transition-all"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 bg-gradient-to-r from-rose-500 to-orange-400 p-2.5 rounded-full text-white shadow-lg hover:scale-105 active:scale-95 transition-all"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </form>
            )}
          </main>
        )}
      </div>
      <ConfirmModal
        isOpen={isConfirmOpen}
        title="UnLike User"
        message={`Are you sure you want to unlike with ${activeChat?.first_name}? They will be removed from your messages.`}
        confirmText="Yes, UnLike"
        cancelText="Cancel"
        onConfirm={executeUnlike}
        onCancel={() => setIsConfirmOpen(false)}
        isDestructive={true}
      />
      <ConfirmModal
        isOpen={isBlockModalOpen}
        title="Block User"
        message="Are you sure you want to block this user? They will not be able to view your profile or send you messages."
        confirmText="Block"
        cancelText="Cancel"
        onConfirm={handleToggleBlock}
        onCancel={() => setIsBlockModalOpen(false)}
        isDestructive={true}
      />
    </div>
  );
}
