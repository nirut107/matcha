"use client";

import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket";
import MatchModal from "@/components/MatchModal";
import toast, { Toaster } from "react-hot-toast";
export default function SocketHandler() {
  const [match, setMatch] = useState<{
    userName: string;
    userImage?: string;
  } | null>(null);

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const socket = getSocket();

    socket.on("connect", () => {
      console.log("Connected:", socket.id);
    });

    socket.on("notification", (data) => {
      console.log("🔔 Notification:", data);

      if (data.type === "match") {
        setMatch({
          userName: data.userName,
          userImage: data.userImage,
        });
        setIsOpen(true);
      } else if (data.type === "visit") {
        console.log("got noti visit")
        toast("Somone visited your profile", {
          icon: "👀",
        });
      } else {
        console.log("got some noti")
        toast(data.type || "New notification received!", {
          icon: "🔔",
        });
      }
    });
    socket.on("me", (data) => {
      console.log("Got userId from socket me", data);
    });

    socket.emit("whoami");

    return () => {
      socket.off("notification");
      socket.off("me");
      socket.off("newMessage");
    };
  }, []);

  return (
    <>
      <Toaster />
      <MatchModal
        isOpen={isOpen}
        match={match}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
