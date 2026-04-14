"use client";

import { useEffect, useState, useRef } from "react";
import { getSocket } from "@/lib/socket";
import MatchModal from "@/components/MatchModal";
import toast, { Toaster } from "react-hot-toast";
import IncomingCallModal from "./IncomingCallModal";

export default function SocketHandler() {
  const [match, setMatch] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  const [callData, setCallData] = useState<any>(null);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);

  const [peerId, setPeerId] = useState<number | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const socketRef = useRef<any>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const iceQueue = useRef<RTCIceCandidate[]>([]);

  // 🔥 attach remote stream properly
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    socketRef.current = getSocket();
    const socket = socketRef.current;

    socket.on("notification", async (data: any) => {
      switch (data.type) {
        case "CALL_ANSWERED":
          if (pcRef.current) {
            await pcRef.current.setRemoteDescription(
              new RTCSessionDescription(data.answer)
            );

            iceQueue.current.forEach((c) =>
              pcRef.current?.addIceCandidate(c)
            );
            iceQueue.current = [];
          }
          break;

        case "INCOMING_CALL":
          setCallData(data);
          setPeerId(data.from);
          setIsCallModalOpen(true);
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
          handleEndCall();
          break;
      }
    });

    return () => {
      socket.off("notification");
    };
  }, []);

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.ontrack = (event) => {
      console.log("REMOTE STREAM RECEIVED");

      // 🔥 IMPORTANT: use state
      setRemoteStream(event.streams[0]);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit("iceCandidate", {
          toUserId: peerId,
          candidate: event.candidate,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("Connection:", pc.connectionState);
    };

    return pc;
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
      setPeerId(targetUserId);

      const pc = createPeerConnection();
      pcRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socketRef.current.emit("callUser", {
        toUserId: targetUserId,
        offer,
        matchId,
        callType,
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartWebRTC = async (incomingData: any) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: incomingData.callType === "video",
        audio: true,
      });

      localStreamRef.current = stream;
      setIsCallActive(true);

      const pc = createPeerConnection();
      pcRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(
        new RTCSessionDescription(incomingData.offer)
      );

      iceQueue.current.forEach((c) => pc.addIceCandidate(c));
      iceQueue.current = [];

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socketRef.current.emit("answerCall", {
        toUserId: incomingData.from,
        answer,
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEndCall = () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();

    setRemoteStream(null);
    setIsCallActive(false);
    setPeerId(null);
  };

  return (
    <>
      <Toaster />

      <IncomingCallModal
        isOpen={isCallModalOpen}
        callerName={callData?.senderName}
        onAccept={() => {
          setIsCallModalOpen(false);
          handleStartWebRTC(callData);
        }}
        onDecline={() => {
          setIsCallModalOpen(false);
          socketRef.current.emit("rejectCall", {
            toUserId: callData.from,
          });
        }}
      />

      {isCallActive && (
        <div className="fixed inset-0 bg-black z-50">
          {/* 🔥 REMOTE */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            onLoadedMetadata={(e) => e.currentTarget.play()}
            className="w-full h-full object-cover"
          />

          {/* 🔥 LOCAL */}
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="absolute bottom-4 right-4 w-32 h-40 object-cover border"
          />

          <button
            onClick={() => {
              socketRef.current.emit("endCall", {
                toUserId: peerId,
              });
              handleEndCall();
            }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-red-500 px-6 py-3 text-white rounded"
          >
            End Call
          </button>
        </div>
      )}
    </>
  );
}