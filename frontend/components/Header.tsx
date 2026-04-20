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
import { formatDistanceToNow, set } from "date-fns";
import toast from "react-hot-toast";
import MatchModal from "./MatchModal";
import ProfileModal, { UserProfile } from "./ProfileModal";
import IncomingCallModal from "./IncomingCallModal";

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
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const iceQueue = useRef<RTCIceCandidate[]>([]);
  const [callData, setCallData] = useState<any>(null);
  const [peerId, setPeerId] = useState<number | null>(null);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const [match, setMatch] = useState<{
    userName: string;
    userImage?: string;
  } | null>(null);

  const socketRef = useRef<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // New state for mobile menu
  const menuRef = useRef<HTMLDivElement>(null);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(
    null
  );
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    console.log(
      "📺 [VIDEO DOM] Local Stream State Changed:",
      !!localStream,
      "DOM Node:",
      !!localVideoRef.current
    );
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      console.log("📺 [VIDEO DOM] 👉 Local video attached successfully!");
    }
  }, [localStream]);
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isCallActive) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }

    // Cleanup the interval when the component unmounts or call ends
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCallActive]);

  useEffect(() => {
    console.log(
      "📺 [VIDEO DOM] Remote Stream State Changed:",
      !!remoteStream,
      "DOM Node:",
      !!remoteVideoRef.current
    );
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      console.log("📺 [VIDEO DOM] 👉 Remote video attached successfully!");
    }
  }, [remoteStream]);

  useEffect(() => {
    setIsFirefox(navigator.userAgent.toLowerCase().includes("firefox"));
  }, []);

  const fetchCounts = async () => {
    try {
      const res = await fetchWithAuth("/notifications/unreadcount");
      const data = await res.json();
      console.log(
        "Fetching unread counts...",
        data.notificationsCount,
        data.messagesCount
      );
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
    const onStartOutgoingCall = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { targetUserId, matchId, callType } = customEvent.detail;
      console.log(
        "🟢 [LIFECYCLE] Custom Event Fired: START_OUTGOING_CALL to user:",
        targetUserId
      );
      setCallData({
        from: socketRef.current.id, 
        matchId,
        callType,
      });
      handleStartCall(targetUserId, matchId, callType);
      setPeerId(targetUserId);
    };
    window.addEventListener("START_OUTGOING_CALL", onStartOutgoingCall);
    socket.on("connect", () => {
      console.log("user connect");
      fetchCounts();
    });

    socket.on("notification", async (data: any) => {
      console.log(`🔌 [SOCKET] Received Head: ${data.type}`, data);
      switch (data.type) {
        case "NEW_MESSAGE":
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
          break;
        case "match":
          console.log(
            "🔌 [SOCKET] MATCH Notification from:",
            data.data.senderName
          );
          setMatch({
            userName: data.data.senderName,
            userImage: data.data.senderImage,
          });
          setIsOpen(true);
          fetchCounts();
          break;
        case "CALL_ANSWERED":
          console.log(
            "🌐 [WEBRTC] Processing CALL_ANSWERED. Signaling State:",
            pcRef.current?.signalingState
          );
          if (pcRef.current && pcRef.current.signalingState !== "closed") {
            await pcRef.current.setRemoteDescription(
              new RTCSessionDescription(data.answer)
            );
            console.log(
              "🌐 [WEBRTC] Remote description set (Answer). Processing",
              iceQueue.current.length,
              "queued ICE candidates."
            );
            iceQueue.current.forEach((c) =>
              pcRef.current
                ?.addIceCandidate(c)
                .catch((e) => console.error("🌐 [WEBRTC] ICE Add Error:", e))
            );
            iceQueue.current = [];
          }
          break;
        case "INCOMING_CALL":
          console.log("🔌 [SOCKET] INCOMING_CALL from:", data.from);
          console.log("🔌 [SOCKET] Call type:", data);
          setCallData(data);
          setPeerId(data.from);
          setIsCallModalOpen(true);
          break;
        case "ICE_CANDIDATE":
          if (pcRef.current && pcRef.current.remoteDescription) {
            console.log("🌐 [WEBRTC] Adding ICE Candidate immediately.");
            await pcRef.current
              .addIceCandidate(new RTCIceCandidate(data.candidate))
              .catch((e) => console.error("🌐 [WEBRTC] ICE Error", e));
          } else {
            console.log(
              "🌐 [WEBRTC] Queueing ICE Candidate (Remote description not set yet)."
            );
            iceQueue.current.push(new RTCIceCandidate(data.candidate));
          }
          break;
        case "CALL_ENDED":
          console.log("🔌 [SOCKET] Received CALL_ENDED");
          handleEndCall();
          break;
        case "CALL_REJECTED":
          console.log("🔌 [SOCKET] Received CALL_REJECTED");
          toast.error("Call was rejected");
          setIsCallActive(false);
          setTimeout(() => handleEndCall(), 1500);
          break;
        default:
          fetchCounts();
          console.log("🔌 [SOCKET] Unhandled Notification:", data);
      }
    });

    return () => {
      socket.off("notification");
      socket.off("connect");
    };
  }, [pathname]);

  const handleEndCall = () => {
    console.log("🔴 [LIFECYCLE] handleEndCall Triggered");
    localStream?.getTracks().forEach((t) => t.stop());
    setLocalStream(null);
    setRemoteStream(null);
    pcRef.current?.close();
    pcRef.current = null;
    setPeerId(null);
    setIsCallActive(false);
    setIsCallModalOpen(false);
    if (pathname !== "/chat") {
      fetchCounts();
    } else {
      router.push(`/chat?reload=${Date.now()}`);
    }
  };

  const handleStartCall = async (
    targetUserId: number,
    matchId: number,
    callType: "audio" | "video"
  ) => {
    try {
      console.log("🎥 [MEDIA] Requesting user media (Caller)...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === "video",
        audio: true,
      });
      console.log(
        "🎥 [MEDIA] Got local stream! Tracks:",
        stream.getTracks().length
      );

      setLocalStream(stream);
      setIsCallActive(true);

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      pcRef.current = pc;

      pc.ontrack = (event) => {
        console.log(
          "🎥 [MEDIA] REMOTE STREAM RECEIVED (Caller)! Tracks:",
          event.streams[0].getTracks().length
        );
        setRemoteStream(event.streams[0]);
      };

      pc.onconnectionstatechange = () =>
        console.log(
          "🌐 [WEBRTC] Peer Connection State (Caller):",
          pc.connectionState
        );
      pc.oniceconnectionstatechange = () =>
        console.log(
          "🌐 [WEBRTC] ICE Connection State (Caller):",
          pc.iceConnectionState
        );

      stream.getTracks().forEach((track) => {
        console.log(
          "🌐 [WEBRTC] Adding local track to peer connection:",
          track.kind
        );
        pc.addTrack(track, stream);
      });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("🔌 [SOCKET] Emitting ICE Candidate (Caller)");
          socketRef.current.emit("iceCandidate", {
            toUserId: targetUserId,
            candidate: event.candidate,
          });
        }
      };

      console.log("🌐 [WEBRTC] Creating Offer...");
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log("🌐 [WEBRTC] Local Description set (Offer)");

      console.log("🔌 [SOCKET] Emitting callUser to:", targetUserId);
      socketRef.current.emit("callUser", {
        toUserId: targetUserId,
        offer,
        matchId,
        callType,
      });
    } catch (err) {
      console.error("❌ [ERROR] START CALL ERROR:", err);
      toast.error("Could not start call");
    }
  };

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

  const handleViewProfile = async (userId: number) => {
    setIsNotiOpen(false);
    setIsProfileLoading(true);
    setIsProfileModalOpen(true);

    try {
      const res = await fetchWithAuth(`/profile/data/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      console.log("Header Profile Fetch Result:", data);
      setSelectedProfile(data);
    } catch (err) {
      console.error("Failed to fetch profile in Header:", err);
      toast.error("Could not load profile information");
      setIsProfileModalOpen(false);
    } finally {
      setIsProfileLoading(false);
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

  const handleStartWebRTC = async (incomingData: any) => {
    try {
      console.log("🎥 [MEDIA] Requesting user media (Receiver)...");
      const isVideo = incomingData.callType === "video";
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideo,
        audio: true,
      });
      console.log(
        "🎥 [MEDIA] Got local stream! Tracks:",
        stream.getTracks().length
      );

      setLocalStream(stream);
      setIsCallActive(true);

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      pcRef.current = pc;

      pc.ontrack = (event) => {
        console.log(
          "🎥 [MEDIA] REMOTE STREAM RECEIVED (Receiver)! Tracks:",
          event.streams[0].getTracks().length
        );
        setRemoteStream(event.streams[0]);
      };

      pc.onconnectionstatechange = () =>
        console.log(
          "🌐 [WEBRTC] Peer Connection State (Receiver):",
          pc.connectionState
        );
      pc.oniceconnectionstatechange = () =>
        console.log(
          "🌐 [WEBRTC] ICE Connection State (Receiver):",
          pc.iceConnectionState
        );

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("🔌 [SOCKET] Emitting ICE Candidate (Receiver)");
          socketRef.current.emit("iceCandidate", {
            toUserId: incomingData.from,
            candidate: event.candidate,
          });
        }
      };

      stream.getTracks().forEach((track) => {
        console.log(
          "🌐 [WEBRTC] Adding local track to peer connection:",
          track.kind
        );
        pc.addTrack(track, stream);
      });

      console.log("🌐 [WEBRTC] Setting Remote Description (Offer)");
      await pc.setRemoteDescription(
        new RTCSessionDescription(incomingData.offer)
      );

      console.log(
        "🌐 [WEBRTC] Processing",
        iceQueue.current.length,
        "queued ICE candidates."
      );
      iceQueue.current.forEach((c) =>
        pcRef.current
          ?.addIceCandidate(c)
          .catch((e) => console.error("🌐 [WEBRTC] ICE Add Error:", e))
      );
      iceQueue.current = [];

      console.log("🌐 [WEBRTC] Creating Answer...");
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log("🌐 [WEBRTC] Local Description set (Answer)");

      console.log("🔌 [SOCKET] Emitting answerCall to:", incomingData.from);
      socketRef.current.emit("answerCall", {
        toUserId: incomingData.from,
        answer: answer,
      });
    } catch (err) {
      console.error("❌ [ERROR] WebRTC Error:", err);
    }
  };

  return (
    <>
      <IncomingCallModal
        isOpen={isCallModalOpen}
        callerName={callData?.senderName || "Unknown Match"}
        onDecline={() => {
          setIsCallModalOpen(false);
          socketRef.current.emit("rejectCall", {
            toUserId: callData.from,
            matchId: callData.matchId,
          });
        }}
        onAccept={() => {
          setIsCallModalOpen(false);
          handleStartWebRTC(callData);
        }}
      />
      {isCallActive && (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />

          <div className="absolute bottom-24 right-6 w-32 h-48 bg-gray-800 rounded-xl overflow-hidden border-2 border-white shadow-lg">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover -scale-x-100"
            />
          </div>

          <div className="absolute bottom-8 flex gap-6">
            <button
              onClick={() => {
                socketRef.current.emit("endCall", {
                  toUserId: peerId,
                  matchId: callData.matchId || undefined,
                  duration: callDuration,
                });
                handleEndCall();
              }}
              className="bg-red-500 px-6 py-3 rounded-full text-white font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/30"
            >
              End Call
            </button>
          </div>
        </div>
      )}
      <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center sticky top-0 z-50">
        <div
          className="flex items-center gap-2 cursor-pointer group shrink-0"
          onClick={() => pathname !== "/dashboard" && router.push("/dashboard")}
        >
          <div className="bg-gradient-to-tr from-rose-500 to-orange-400 p-1.5 rounded-lg shadow-sm group-hover:scale-105 transition-transform">
            <Flame
              size={18}
              className="sm:w-6 sm:h-6"
              color="white"
              fill="white"
            />
          </div>
          <span className="text-lg sm:text-xl font-black text-gray-900 uppercase tracking-tighter sm:tracking-tight">
            Matcha
          </span>
        </div>

        <div className="flex items-center gap-1 sm:gap-4">
          {/* CHAT WITH UNREAD COUNT */}
          <button
            className={`${getIconClass("/chat")} relative p-2`}
            onClick={() => {
              router.push("/chat");
            }}
          >
            <MessageCircle size={20} className="sm:w-6 sm:h-6" />
            <Badge count={unreadMessages} />
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
              <Bell size={20} className="sm:w-6 sm:h-6" />
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
                          handleViewProfile(noti.data.senderId);
                          // Optional: Navigate to user profile or specific action
                          // setIsNotiOpen(false);
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
                                <span>invited you to meet up! ☕</span>
                              </>
                            )}
                            {noti.data.type == "DATE_ACCEPT" && (
                              <>
                                <span className="font-bold">
                                  {noti.data.senderName}
                                </span>{" "}
                                <span>is down to meet up! Let's go! ✨</span>
                              </>
                            )}
                            {noti.data.type == "DATE_REJECT" && (
                              <>
                                <span className="font-bold">
                                  {noti.data.senderName}
                                </span>{" "}
                                <span>declined your date request. 🥀</span>
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

          <div className="hidden md:flex items-center gap-2">
            {!isFirefox && (
              <button
                className={getIconClass("/map")}
                onClick={() => router.push("/map")}
              >
                <Map size={22} />
              </button>
            )}
            <button
              className={getIconClass("/calendar")}
              onClick={() => router.push("/calendar")}
            >
              <Calendar size={22} />
            </button>
            <button
              className={getIconClass("/profile/setup")}
              onClick={() => router.push("/profile/setup")}
            >
              <Settings size={22} />
            </button>
            <div className="h-6 w-[1px] bg-gray-200 mx-1"></div>
            <button
              className="text-gray-400 hover:text-rose-600 p-1"
              onClick={() => setIsLogoutModalOpen(true)}
            >
              <LogOut size={22} />
            </button>
          </div>

          {/* MOBILE ONLY MENU: (Visible only on small screens) */}
          <div className="md:hidden relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`p-2 rounded-md ${
                isMenuOpen ? "text-rose-500 bg-rose-50" : "text-gray-400"
              }`}
            >
              <Settings size={20} />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden py-2 z-[60] animate-in fade-in slide-in-from-top-2">
                {!isFirefox && (
                  <button
                    onClick={() => {
                      router.push("/map");
                      setIsMenuOpen(false);
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 text-sm text-gray-600 hover:bg-rose-50"
                  >
                    <Map size={18} /> Explore Map
                  </button>
                )}
                <button
                  onClick={() => {
                    router.push("/calendar");
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 text-sm text-gray-600 hover:bg-rose-50"
                >
                  <Calendar size={18} /> Dates
                </button>
                <button
                  onClick={() => {
                    router.push("/profile/setup");
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 text-sm text-gray-600 hover:bg-rose-50"
                >
                  <Settings size={18} /> My Profile
                </button>
                <div className="h-[1px] bg-gray-100 my-1 mx-2" />
                <button
                  onClick={() => {
                    setIsLogoutModalOpen(true);
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 text-sm text-rose-500 font-bold hover:bg-rose-50"
                >
                  <LogOut size={18} /> Log Out
                </button>
              </div>
            )}
          </div>
        </div>
        {isProfileModalOpen && (
          <ProfileModal
            showModal={isProfileModalOpen}
            setShowModal={setIsProfileModalOpen}
            isModalLoading={isProfileLoading}
            profile={selectedProfile as UserProfile}
          />
        )}
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
    </>
  );
}
