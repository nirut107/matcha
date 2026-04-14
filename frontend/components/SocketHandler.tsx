"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { getSocket } from "@/lib/socket";
import MatchModal from "@/components/MatchModal";
import toast, { Toaster } from "react-hot-toast";
import IncomingCallModal from "./IncomingCallModal";

export default function SocketHandler() {
  const [match, setMatch] = useState<{
    userName: string;
    userImage?: string;
  } | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [callData, setCallData] = useState<any>(null);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  
  const [peerId, setPeerId] = useState<number | null>(null);
  
  const socketRef = useRef<any>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const iceQueue = useRef<RTCIceCandidate[]>([]);

  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  // 🔥 ใช้ useCallback ล็อกไว้ เพื่อไม่ให้ React ถอด/ใส่วิดีโอใหม่รัวๆ ทุกครั้งที่ Render
  const setLocalVideoNode = useCallback((node: HTMLVideoElement | null) => {
    localVideoRef.current = node;
    if (node && localStreamRef.current) {
      if (node.srcObject !== localStreamRef.current) {
        node.srcObject = localStreamRef.current;
      }
    }
  }, []);

  const setRemoteVideoNode = useCallback((node: HTMLVideoElement | null) => {
    remoteVideoRef.current = node;
    if (node && remoteStreamRef.current) {
      if (node.srcObject !== remoteStreamRef.current) {
        node.srcObject = remoteStreamRef.current;
      }
    }
  }, []);

  useEffect(() => {
    socketRef.current = getSocket();
    const socket = socketRef.current;

    const onStartOutgoingCall = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { targetUserId, matchId, callType } = customEvent.detail;

      handleStartCall(targetUserId, matchId, callType);
      setPeerId(targetUserId);
    };

    window.addEventListener("START_OUTGOING_CALL", onStartOutgoingCall);

    socket.on("connect", () => {
      console.log("Connected:", socket.id);
    });

    socket.on("CALL_REJECTED", () => {
      toast.error("Call was rejected");
      setIsCallActive(false);

      setTimeout(() => {
        handleEndCall();
      }, 1500);
    });

    socket.on("notification", async (data: any) => {
      console.log("🔔 Notification:", data.type);

      switch (data.type) {
        case "CALL_ANSWERED":
          if (pcRef.current && pcRef.current.signalingState !== "closed") {
            await pcRef.current.setRemoteDescription(
              new RTCSessionDescription(data.answer)
            );

            // เอา ICE ที่แอบเก็บไว้มาเชื่อมต่อ
            iceQueue.current.forEach((c) => pcRef.current?.addIceCandidate(c).catch(console.error));
            iceQueue.current = [];
          }
          break;

        case "match":
          setMatch({ userName: data.userName, userImage: data.userImage });
          setIsOpen(true);
          break;

        case "NEW_MESSAGE":
          toast(`New message from match: ${data.text}`, { icon: "💬" });
          break;

        case "INCOMING_CALL":
          setCallData(data);
          setPeerId(data.from);
          setIsCallModalOpen(true);
          break;

        case "ICE_CANDIDATE":
          if (pcRef.current && pcRef.current.remoteDescription) {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(e => console.error("ICE Error", e));
          } else {
            iceQueue.current.push(new RTCIceCandidate(data.candidate));
          }
          break;

        case "CALL_ENDED":
          handleEndCall();
          break;

        default:
          if (data.type !== "visit") {
             toast(data.type || "New notification received!", { icon: "🔔" });
          }
      }
    });

    socket.emit("whoami");

    return () => {
      socket.off("notification");
      socket.off("me");
      socket.off("CALL_REJECTED");
      window.removeEventListener("START_OUTGOING_CALL", onStartOutgoingCall);
    };
  }, []);

  const handleEndCall = () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    
    remoteStreamRef.current = null;

    pcRef.current?.close();
    pcRef.current = null;

    setPeerId(null);
    setIsCallActive(false);
    setIsCallModalOpen(false);
  };

  const handleStartCall = async (
    targetUserId: number,
    matchId: number,
    callType: "audio" | "video"
  ) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === "video",
        audio: true,
      });
      localStreamRef.current = stream;
      setIsCallActive(true);

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      pcRef.current = pc;
      
      pc.ontrack = (event) => {
        console.log("REMOTE STREAM RECEIVED (Caller)", event.streams);
        remoteStreamRef.current = event.streams[0];
        if (remoteVideoRef.current) {
          if (remoteVideoRef.current.srcObject !== event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
          // บังคับให้วิดีโอเล่นทันทีที่ Stream มาถึง
          remoteVideoRef.current.play().catch(e => console.log("Play err", e));
        }
      };

      // เพิ่ม Log ไว้เช็คสถานะ
      pc.onconnectionstatechange = () => console.log("Connection (Caller):", pc.connectionState);

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current.emit("iceCandidate", {
            toUserId: targetUserId,
            candidate: event.candidate,
          });
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socketRef.current.emit("callUser", {
        toUserId: targetUserId,
        offer,
        matchId,
        callType,
      });
    } catch (err) {
      console.error("START CALL ERROR:", err);
      toast.error("Could not start call");
    }
  };

  const handleStartWebRTC = async (incomingData: any) => {
    try {
      const isVideo = incomingData.callType === "video";
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideo,
        audio: true,
      });
      localStreamRef.current = stream;
      setIsCallActive(true);

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      pcRef.current = pc;
      
      pc.ontrack = (event) => {
        console.log("REMOTE STREAM RECEIVED (Receiver)", event.streams);
        remoteStreamRef.current = event.streams[0];
        if (remoteVideoRef.current) {
          if (remoteVideoRef.current.srcObject !== event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
          // บังคับให้วิดีโอเล่นทันทีที่ Stream มาถึง
          remoteVideoRef.current.play().catch(e => console.log("Play err", e));
        }
      };

      // เพิ่ม Log ไว้เช็คสถานะ
      pc.onconnectionstatechange = () => console.log("Connection (Receiver):", pc.connectionState);

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current.emit("iceCandidate", {
            toUserId: incomingData.from,
            candidate: event.candidate,
          });
        }
      };

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(
        new RTCSessionDescription(incomingData.offer)
      );
      
      iceQueue.current.forEach((c) => pcRef.current?.addIceCandidate(c).catch(console.error));
      iceQueue.current = [];
      
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socketRef.current.emit("answerCall", {
        toUserId: incomingData.from,
        answer: answer,
      });
    } catch (err) {
      console.error("WebRTC Error:", err);
    }
  };

  return (
    <>
      <Toaster />
      <MatchModal
        isOpen={isOpen}
        match={match}
        onClose={() => setIsOpen(false)}
      />

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
            ref={setRemoteVideoNode}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />

          <div className="absolute bottom-24 right-6 w-32 h-48 bg-gray-800 rounded-xl overflow-hidden border-2 border-white shadow-lg">
            <video
              ref={setLocalVideoNode}
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
    </>
  );
}