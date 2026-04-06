"use client";

import { useEffect, useState, useRef } from "react";
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
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const socketRef = useRef<any>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    socketRef.current = getSocket();
    const socket = socketRef.current;

    const onStartOutgoingCall = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { targetUserId, matchId, callType } = customEvent.detail;

      handleStartCall(targetUserId, matchId, callType);
    };

    window.addEventListener("START_OUTGOING_CALL", onStartOutgoingCall);

    socket.on("connect", () => {
      console.log("Connected:", socket.id);
    });

    socket.on("notification", async (data: any) => {
      console.log("🔔 Notification:", data);

      switch (data.type) {
        case "match":
          setMatch({ userName: data.userName, userImage: data.userImage });
          setIsOpen(true);
          break;

        case "NEW_MESSAGE":
          toast(`New message from match: ${data.text}`, { icon: "💬" });
          break;

        case "INCOMING_CALL":
          setCallData(data);
          setIsCallModalOpen(true);
          break;

        case "visit":
          toast("Someone visited your profile", { icon: "👀" });
          break;
        case "ICE_CANDIDATE":
          try {
            if (pcRef.current) {
              await pcRef.current.addIceCandidate(
                new RTCIceCandidate(data.candidate)
              );
            }
          } catch (e) {
            console.error("Error adding ice candidate", e);
          }
          break;
        default:
          toast(data.type || "New notification received!", { icon: "🔔" });
      }
    });

    socket.on("me", (data: any) => {
      console.log("Got userId from socket me", data);
    });

    socket.emit("whoami");

    return () => {
      socket.off("notification");
      socket.off("me");
      socket.off("newMessage");
      window.removeEventListener("START_OUTGOING_CALL", onStartOutgoingCall);
    };
  }, []);

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

      // Send local tracks
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // Handle remote video
      pc.ontrack = (event) => {
        if (remoteVideoRef.current)
          remoteVideoRef.current.srcObject = event.streams[0];
      };

      // Handle ICE Candidates (Crucial!)
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current.emit("iceCandidate", {
            toUserId: targetUserId,
            candidate: event.candidate,
          });
        }
      };

      // Create the Offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socketRef.current.emit("callUser", {
        toUserId: targetUserId,
        offer,
        matchId,
        callType,
      });

      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    } catch (err) {
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
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // After setting descriptions (your existing logic)...
      await pc.setRemoteDescription(
        new RTCSessionDescription(incomingData.offer)
      );
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socketRef.current.emit("answerCall", {
        toUserId: incomingData.from,
        answer: answer,
      });

      // CRITICAL: Assign local stream to your small preview window
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
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
              muted // Always mute local video to avoid feedback loops!
              className="w-full h-full object-cover -scale-x-100" // Mirror effect
            />
          </div>

          <div className="absolute bottom-8 flex gap-6">
            <button
              onClick={() => {
                localStreamRef.current?.getTracks().forEach((t) => t.stop());
                pcRef.current?.close();
                setIsCallActive(false);
              }}
              className="bg-red-500 p-4 rounded-full text-white hover:bg-red-600 transition-all"
            >
              End Call
            </button>
          </div>
        </div>
      )}
    </>
  );
}
