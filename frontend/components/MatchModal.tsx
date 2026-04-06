"use client";
import { useRouter } from "next/navigation";

type MatchModalProps = {
  isOpen: boolean;
  onClose: () => void;
  match: {
    userName: string;
    userImage?: string;
  } | null;
};

export default function MatchModal({
  isOpen,
  onClose,
  match,
}: MatchModalProps) {
  const router = useRouter();
  if (!isOpen || !match) return null;

  return (
    <div className="fixed inset-0 z-[999] bg-black/70 flex items-center justify-center">
      <div className="bg-white rounded-3xl p-8 text-center shadow-2xl max-w-sm w-full">
        <h1 className="text-3xl font-black text-rose-500 mb-2">
          🎉 It's a Match!
        </h1>

        <p className="text-gray-600 mb-6">
          You and <span className="font-bold">{match.userName}</span> liked each
          other 💖
        </p>

        {match.userImage && (
          <img
            src={match.userImage}
            className="w-24 h-24 rounded-full mx-auto mb-6 object-cover"
          />
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 py-2 rounded-xl font-bold text-white"
          >
            Keep Swiping
          </button>

          <button
            onClick={() => {
              // later → route to chat
              //   console.log("Go to chat");
              onClose();
              router.push(`/chat`);
            }}
            className="flex-1 bg-rose-500 text-white py-2 rounded-xl font-bold"
          >
            Send Message
          </button>
        </div>
      </div>
    </div>
  );
}
