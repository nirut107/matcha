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
  const [peerId, setPeerId] = useState<number | null>(null);
  const socketRef = useRef<any>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const iceQueue = useRef<RTCIceCandidate[]>([]);

  useEffect(() => {
    if (remoteVideoRef.current && pcRef.current) {
      const receivers = pcRef.current.getReceivers();
      const stream = new MediaStream(
        receivers
          .map((r) => r.track)
          .filter((track): track is MediaStreamTrack => !!track)
      );

      if (stream.getTracks().length > 0) {
        console.log("Re-attach remote stream");
        remoteVideoRef.current.srcObject = stream;
      }
    }
  }, [isCallActive]);
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
      console.log("🔔 Notification:", data);

      switch (data.type) {
        case "CALL_ANSWERED":
          console.log("📞 Call Answered:", data);

          if (pcRef.current && pcRef.current.signalingState !== "closed") {
            await pcRef.current.setRemoteDescription(
              new RTCSessionDescription(data.answer)
            );

            iceQueue.current.forEach((c) => pcRef.current?.addIceCandidate(c));
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

        case "visit":
          toast("Someone visited your profile", { icon: "👀" });
          break;
        case "ICE_CANDIDATE":
          const pc = pcRef.current;

          if (!pc) return;

          if (pc.remoteDescription) {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          } else {
            iceQueue.current.push(new RTCIceCandidate(data.candidate));
          }
          break;
        case "CALL_ENDED":
          console.log("end call");
          handleEndCall();
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

  const handleEndCall = () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;

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
        console.log("REMOTE STREAM RECEIVED", event.streams);

        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      pc.onconnectionstatechange = () => {
        console.log("Connection state:", pc.connectionState);
      };

      pc.oniceconnectionstatechange = () => {
        console.log("ICE state:", pc.iceConnectionState);
      };
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("Sending ICE candidate");

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
      console.error("START CALL ERROR:", err);
      toast.error("Could not start call");
    }
  };

  const handleStartWebRTC = async (incomingData: any) => {
    try {
      console.log("incoming", incomingData);
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
        console.log("REMOTE STREAM RECEIVED", event.streams);

        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      pc.onconnectionstatechange = () => {
        console.log("Connection state:", pc.connectionState);
      };

      pc.oniceconnectionstatechange = () => {
        console.log("ICE state:", pc.iceConnectionState);
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("Sending ICE candidate");

          socketRef.current.emit("iceCandidate", {
            toUserId: incomingData.from,
            candidate: event.candidate,
          });
        }
      };

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // After setting descriptions (your existing logic)...
      await pc.setRemoteDescription(
        new RTCSessionDescription(incomingData.offer)
      );
      iceQueue.current.forEach((c) => pcRef.current?.addIceCandidate(c));
      iceQueue.current = [];
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
            onLoadedMetadata={(e) => {
              const video = e.currentTarget;
              video.play().catch(() => {});
            }}
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
                console.log(peerId);
                socketRef.current.emit("endCall", {
                  toUserId: peerId,
                });

                handleEndCall();
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
