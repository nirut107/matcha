"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { getSocket } from "@/lib/socket";
import MatchModal from "@/components/MatchModal";
import toast, { Toaster } from "react-hot-toast";
import IncomingCallModal from "./IncomingCallModal";

export default function SocketHandler() {
  const [match, setMatch] = useState<{ userName: string; userImage?: string; } | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [callData, setCallData] = useState<any>(null);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [peerId, setPeerId] = useState<number | null>(null);
  
  const socketRef = useRef<any>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const iceQueue = useRef<RTCIceCandidate[]>([]);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  // 📺 [VIDEO DOM] Logs: Check when React actually puts the video on screen
  useEffect(() => {
    console.log("📺 [VIDEO DOM] Local Stream State Changed:", !!localStream, "DOM Node:", !!localVideoRef.current);
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      console.log("📺 [VIDEO DOM] 👉 Local video attached successfully!");
    }
  }, [localStream]);

  useEffect(() => {
    console.log("📺 [VIDEO DOM] Remote Stream State Changed:", !!remoteStream, "DOM Node:", !!remoteVideoRef.current);
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      console.log("📺 [VIDEO DOM] 👉 Remote video attached successfully!");
    }
  }, [remoteStream]);

  useEffect(() => {
    console.log("🟢 [LIFECYCLE] SocketHandler Mounted");
    socketRef.current = getSocket();
    const socket = socketRef.current;

    const onStartOutgoingCall = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { targetUserId, matchId, callType } = customEvent.detail;
      console.log("🟢 [LIFECYCLE] Custom Event Fired: START_OUTGOING_CALL to user:", targetUserId);
      handleStartCall(targetUserId, matchId, callType);
      setPeerId(targetUserId);
    };

    window.addEventListener("START_OUTGOING_CALL", onStartOutgoingCall);

    socket.on("connect", () => console.log("🔌 [SOCKET] Connected with ID:", socket.id));

    socket.on("CALL_REJECTED", () => {
      console.log("🔌 [SOCKET] Received CALL_REJECTED");
      toast.error("Call was rejected");
      setIsCallActive(false);
      setTimeout(() => handleEndCall(), 1500);
    });

    socket.on("notification", async (data: any) => {
      console.log(`🔌 [SOCKET] Notification Received: ${data.type}`, data);

      switch (data.type) {
        case "CALL_ANSWERED":
          console.log("🌐 [WEBRTC] Processing CALL_ANSWERED. Signaling State:", pcRef.current?.signalingState);
          if (pcRef.current && pcRef.current.signalingState !== "closed") {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
            console.log("🌐 [WEBRTC] Remote description set (Answer). Processing", iceQueue.current.length, "queued ICE candidates.");
            iceQueue.current.forEach((c) => pcRef.current?.addIceCandidate(c).catch(e => console.error("🌐 [WEBRTC] ICE Add Error:", e)));
            iceQueue.current = [];
          }
          break;

        case "match":
          setMatch({ userName: data.userName, userImage: data.userImage });
          setIsOpen(true);
          break;

        case "INCOMING_CALL":
          console.log("🔌 [SOCKET] INCOMING_CALL from:", data.from);
          setCallData(data);
          setPeerId(data.from);
          setIsCallModalOpen(true);
          break;

        case "ICE_CANDIDATE":
          if (pcRef.current && pcRef.current.remoteDescription) {
            console.log("🌐 [WEBRTC] Adding ICE Candidate immediately.");
            await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(e => console.error("🌐 [WEBRTC] ICE Error", e));
          } else {
            console.log("🌐 [WEBRTC] Queueing ICE Candidate (Remote description not set yet).");
            iceQueue.current.push(new RTCIceCandidate(data.candidate));
          }
          break;

        case "CALL_ENDED":
          console.log("🔌 [SOCKET] Received CALL_ENDED");
          handleEndCall();
          break;

        default:
          if (data.type !== "visit" && data.type !== "NEW_MESSAGE") {
             console.log("🔌 [SOCKET] Unhandled Notification:", data);
          }
      }
    });

    socket.emit("whoami");

    return () => {
      console.log("🔴 [LIFECYCLE] SocketHandler Unmounting");
      socket.off("notification");
      socket.off("me");
      socket.off("CALL_REJECTED");
      window.removeEventListener("START_OUTGOING_CALL", onStartOutgoingCall);
    };
  }, []);

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
  };

  // ==========================================
  // CALLER LOGIC
  // ==========================================
  const handleStartCall = async (targetUserId: number, matchId: number, callType: "audio" | "video") => {
    try {
      console.log("🎥 [MEDIA] Requesting user media (Caller)...");
      const stream = await navigator.mediaDevices.getUserMedia({ video: callType === "video", audio: true });
      console.log("🎥 [MEDIA] Got local stream! Tracks:", stream.getTracks().length);
      
      setLocalStream(stream);
      setIsCallActive(true);

      const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
      pcRef.current = pc;
      
      pc.ontrack = (event) => {
        console.log("🎥 [MEDIA] REMOTE STREAM RECEIVED (Caller)! Tracks:", event.streams[0].getTracks().length);
        setRemoteStream(event.streams[0]);
      };

      pc.onconnectionstatechange = () => console.log("🌐 [WEBRTC] Peer Connection State (Caller):", pc.connectionState);
      pc.oniceconnectionstatechange = () => console.log("🌐 [WEBRTC] ICE Connection State (Caller):", pc.iceConnectionState);

      stream.getTracks().forEach((track) => {
        console.log("🌐 [WEBRTC] Adding local track to peer connection:", track.kind);
        pc.addTrack(track, stream);
      });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("🔌 [SOCKET] Emitting ICE Candidate (Caller)");
          socketRef.current.emit("iceCandidate", { toUserId: targetUserId, candidate: event.candidate });
        }
      };

      console.log("🌐 [WEBRTC] Creating Offer...");
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log("🌐 [WEBRTC] Local Description set (Offer)");

      console.log("🔌 [SOCKET] Emitting callUser to:", targetUserId);
      socketRef.current.emit("callUser", { toUserId: targetUserId, offer, matchId, callType });
    } catch (err) {
      console.error("❌ [ERROR] START CALL ERROR:", err);
      toast.error("Could not start call");
    }
  };

  // ==========================================
  // RECEIVER LOGIC
  // ==========================================
  const handleStartWebRTC = async (incomingData: any) => {
    try {
      console.log("🎥 [MEDIA] Requesting user media (Receiver)...");
      const isVideo = incomingData.callType === "video";
      const stream = await navigator.mediaDevices.getUserMedia({ video: isVideo, audio: true });
      console.log("🎥 [MEDIA] Got local stream! Tracks:", stream.getTracks().length);
      
      setLocalStream(stream);
      setIsCallActive(true);

      const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
      pcRef.current = pc;
      
      pc.ontrack = (event) => {
        console.log("🎥 [MEDIA] REMOTE STREAM RECEIVED (Receiver)! Tracks:", event.streams[0].getTracks().length);
        setRemoteStream(event.streams[0]);
      };

      pc.onconnectionstatechange = () => console.log("🌐 [WEBRTC] Peer Connection State (Receiver):", pc.connectionState);
      pc.oniceconnectionstatechange = () => console.log("🌐 [WEBRTC] ICE Connection State (Receiver):", pc.iceConnectionState);

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("🔌 [SOCKET] Emitting ICE Candidate (Receiver)");
          socketRef.current.emit("iceCandidate", { toUserId: incomingData.from, candidate: event.candidate });
        }
      };

      stream.getTracks().forEach((track) => {
        console.log("🌐 [WEBRTC] Adding local track to peer connection:", track.kind);
        pc.addTrack(track, stream);
      });

      console.log("🌐 [WEBRTC] Setting Remote Description (Offer)");
      await pc.setRemoteDescription(new RTCSessionDescription(incomingData.offer));
      
      console.log("🌐 [WEBRTC] Processing", iceQueue.current.length, "queued ICE candidates.");
      iceQueue.current.forEach((c) => pcRef.current?.addIceCandidate(c).catch(e => console.error("🌐 [WEBRTC] ICE Add Error:", e)));
      iceQueue.current = [];
      
      console.log("🌐 [WEBRTC] Creating Answer...");
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log("🌐 [WEBRTC] Local Description set (Answer)");

      console.log("🔌 [SOCKET] Emitting answerCall to:", incomingData.from);
      socketRef.current.emit("answerCall", { toUserId: incomingData.from, answer: answer });
    } catch (err) {
      console.error("❌ [ERROR] WebRTC Error:", err);
    }
  };

  return (
    <>
      <Toaster />
      <MatchModal isOpen={isOpen} match={match} onClose={() => setIsOpen(false)} />

      <IncomingCallModal
        isOpen={isCallModalOpen}
        callerName={callData?.senderName || "Unknown Match"}
        onDecline={() => {
          setIsCallModalOpen(false);
          socketRef.current.emit("rejectCall", { toUserId: callData.from });
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
                socketRef.current.emit("endCall", { toUserId: peerId });
                handleEndCall();
              }}
              className="bg-red-500 px-6 py-3 rounded-full text-white font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/30"
            >
              End Call
            </button>
          </div>
        </div>
      )}
    </>
  );
}